"""Meta Ads Insights — pull performance data from Marketing API and store in DB."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timezone, timedelta

import asyncpg
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

META_GRAPH_BASE = "https://graph.facebook.com"

# Minimum set for MVP dashboard (doc §5)
INSIGHTS_FIELDS = [
    "spend", "impressions", "reach", "clicks", "cpm", "cpc", "ctr",
    "frequency",
    "actions", "cost_per_action_type",
]
# For lead gen we want actions with action_type=lead
BREAKDOWN_FIELDS_OPTIONAL = ["age", "gender", "placement", "publisher_platform"]


@dataclass
class InsightsSyncResult:
    run_id: str | None = None
    connection_id: str = ""
    total_objects: int = 0
    synced_objects: int = 0
    failed_objects: int = 0
    error_text: str | None = None
    errors: list[str] = field(default_factory=list)


def _ensure_utc(d: datetime | None) -> datetime | None:
    if d is None:
        return None
    if d.tzinfo is None:
        return d.replace(tzinfo=timezone.utc)
    return d


async def _create_meta_sync_run(
    pool: asyncpg.Pool, connection_id: str, trigger: str, dry_run: bool
) -> str:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """
            INSERT INTO meta_sync_run (connection_id, trigger_type, dry_run, status)
            VALUES ($1, $2, $3, 'running')
            RETURNING id
            """,
            connection_id,
            trigger,
            dry_run,
        )


async def _log_meta_sync_item(
    pool: asyncpg.Pool,
    *,
    sync_run_id: str,
    object_id: str | None,
    object_type: str | None,
    action: str,
    error_text: str | None = None,
    details: dict | None = None,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO meta_sync_run_item
              (sync_run_id, object_id, object_type, action, error_text, details)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            """,
            sync_run_id,
            object_id,
            object_type,
            action,
            error_text,
            json.dumps(details or {}),
        )


async def _finish_meta_sync_run(
    pool: asyncpg.Pool,
    run_id: str,
    result: InsightsSyncResult,
    *,
    status: str = "completed",
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE meta_sync_run
            SET status = $1, total_objects = $2, synced_objects = $3,
                failed_objects = $4, error_text = $5, completed_at = now()
            WHERE id = $6
            """,
            status,
            result.total_objects,
            result.synced_objects,
            result.failed_objects,
            result.error_text,
            run_id,
        )


async def _get_connection(pool: asyncpg.Pool, firm_id: str) -> asyncpg.Record | None:
    async with pool.acquire() as conn:
        return await conn.fetchrow(
            """
            SELECT id, access_token, token_expires_at, ad_account_id
            FROM meta_connections
            WHERE firm_id = $1 AND status = 'active'
            """,
            firm_id,
        )


async def _upsert_insights(
    pool: asyncpg.Pool,
    *,
    connection_id: str,
    ad_account_id: str,
    object_id: str,
    object_type: str,
    date_start: date,
    date_stop: date,
    spend: float,
    impressions: int,
    reach: int,
    clicks: int,
    cpm: float | None,
    cpc: float | None,
    ctr: float | None,
    leads: int,
    cost_per_lead: float | None,
    frequency: float | None,
) -> None:
    """Insert or replace one row of aggregated insights for the date range."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO meta_insights (
                connection_id, ad_account_id, object_id, object_type,
                date_start, date_stop, spend, impressions, reach, clicks,
                cpm, cpc, ctr, leads, cost_per_lead, frequency
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
            ON CONFLICT (connection_id, object_id, date_start)
            DO UPDATE SET
                date_stop = EXCLUDED.date_stop, spend = EXCLUDED.spend,
                impressions = EXCLUDED.impressions, reach = EXCLUDED.reach,
                clicks = EXCLUDED.clicks, cpm = EXCLUDED.cpm, cpc = EXCLUDED.cpc,
                ctr = EXCLUDED.ctr, leads = EXCLUDED.leads,
                cost_per_lead = EXCLUDED.cost_per_lead, frequency = EXCLUDED.frequency,
                fetched_at = now()
            """,
            connection_id,
            ad_account_id,
            object_id,
            object_type,
            date_start,
            date_stop,
            spend,
            impressions,
            reach,
            clicks,
            cpm,
            cpc,
            ctr,
            leads,
            cost_per_lead,
            frequency,
        )


def _parse_actions_for_leads(actions: list[dict] | None) -> int:
    if not actions:
        return 0
    for a in actions:
        if a.get("action_type") == "lead":
            return int(a.get("value", "0"))
    return 0


def _parse_cost_per_action_for_leads(cost_per_action_type: list[dict] | None) -> float | None:
    if not cost_per_action_type:
        return None
    for c in cost_per_action_type:
        if c.get("action_type") == "lead":
            try:
                return float(c.get("value", 0))
            except (TypeError, ValueError):
                return None
    return None


async def fetch_insights_from_meta(
    access_token: str,
    ad_account_id: str,
    date_preset: str = "last_7d",
) -> list[dict]:
    """
    GET /act_{id}/insights. Returns list of insight rows (one per day if daily breakdown).
    ad_account_id should be the numeric part; we prepend act_.
    """
    account_id = ad_account_id if str(ad_account_id).startswith("act_") else f"act_{ad_account_id}"
    version = settings.meta_api_version
    fields = ",".join(INSIGHTS_FIELDS)
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(
            f"{META_GRAPH_BASE}/{version}/{account_id}/insights",
            params={
                "access_token": access_token,
                "fields": fields,
                "date_preset": date_preset,
                "time_increment": 1,
            },
        )
        r.raise_for_status()
        data = r.json()
        return data.get("data", [])


async def sync_insights_for_connection(
    pool: asyncpg.Pool,
    firm_id: str,
    *,
    trigger: str = "manual",
    dry_run: bool = False,
    date_preset: str = "last_7d",
) -> InsightsSyncResult:
    """
    For the given firm, load Meta connection, pull account-level insights, store in meta_insights.
    Creates a meta_sync_run and items for audit.
    """
    result = InsightsSyncResult()
    conn_row = await _get_connection(pool, firm_id)
    if not conn_row:
        result.error_text = "No active Meta connection for this firm"
        return result

    connection_id = conn_row["id"]
    access_token = conn_row["access_token"]
    ad_account_id = conn_row["ad_account_id"]
    result.connection_id = connection_id

    if not ad_account_id:
        result.error_text = "Meta connection has no ad_account_id"
        return result

    run_id = await _create_meta_sync_run(pool, connection_id, trigger, dry_run)
    result.run_id = run_id
    result.total_objects = 1

    if dry_run:
        await _log_meta_sync_item(
            pool,
            sync_run_id=run_id,
            object_id=ad_account_id,
            object_type="account",
            action="dry_run_skip",
        )
        await _finish_meta_sync_run(pool, run_id, result)
        return result

    try:
        rows = await fetch_insights_from_meta(access_token, ad_account_id, date_preset=date_preset)
    except httpx.HTTPStatusError as e:
        err_msg = f"Meta API error: {e.response.status_code} {e.response.text}"
        result.failed_objects = 1
        result.error_text = err_msg
        result.errors.append(err_msg)
        await _log_meta_sync_item(
            pool,
            sync_run_id=run_id,
            object_id=ad_account_id,
            object_type="account",
            action="error",
            error_text=err_msg,
        )
        await _finish_meta_sync_run(pool, run_id, result, status="failed")
        return result
    except Exception as e:
        err_msg = str(e)
        result.failed_objects = 1
        result.error_text = err_msg
        result.errors.append(err_msg)
        await _log_meta_sync_item(
            pool,
            sync_run_id=run_id,
            object_id=ad_account_id,
            object_type="account",
            action="error",
            error_text=err_msg,
        )
        await _finish_meta_sync_run(pool, run_id, result, status="failed")
        return result

    # Parse and store each day (time_increment=1 gives daily rows)
    synced = 0
    for row in rows:
        date_start_str = row.get("date_start")
        date_stop_str = row.get("date_stop")
        if not date_start_str or not date_stop_str:
            continue
        try:
            date_start = date.fromisoformat(date_start_str.replace("Z", "").split("T")[0])
            date_stop = date.fromisoformat(date_stop_str.replace("Z", "").split("T")[0])
        except (ValueError, TypeError):
            continue

        spend = float(row.get("spend", 0) or 0)
        impressions = int(row.get("impressions", 0) or 0)
        reach = int(row.get("reach", 0) or 0)
        clicks = int(row.get("clicks", 0) or 0)
        cpm = float(row["cpm"]) if row.get("cpm") is not None else None
        cpc = float(row["cpc"]) if row.get("cpc") is not None else None
        ctr = float(row["ctr"]) if row.get("ctr") is not None else None
        frequency = float(row["frequency"]) if row.get("frequency") is not None else None
        actions = row.get("actions")
        cost_per_action_type = row.get("cost_per_action_type")
        leads = _parse_actions_for_leads(actions) if isinstance(actions, list) else 0
        cost_per_lead = _parse_cost_per_action_for_leads(
            cost_per_action_type if isinstance(cost_per_action_type, list) else None
        )

        try:
            await _upsert_insights(
                pool,
                connection_id=connection_id,
                ad_account_id=ad_account_id.replace("act_", ""),
                object_id=ad_account_id,
                object_type="account",
                date_start=date_start,
                date_stop=date_stop,
                spend=spend,
                impressions=impressions,
                reach=reach,
                clicks=clicks,
                cpm=cpm,
                cpc=cpc,
                ctr=ctr,
                leads=leads,
                cost_per_lead=cost_per_lead,
                frequency=frequency,
            )
            synced += 1
        except Exception as e:
            result.errors.append(f"Upsert error {date_start}: {e}")

    result.synced_objects = synced
    if result.errors:
        result.failed_objects = len(rows) - synced
        result.error_text = "; ".join(result.errors[:3])

    await _log_meta_sync_item(
        pool,
        sync_run_id=run_id,
        object_id=ad_account_id,
        object_type="account",
        action="synced",
        details={"rows": len(rows), "stored": synced},
    )
    await _finish_meta_sync_run(pool, run_id, result)
    return result


async def get_latest_insights(pool: asyncpg.Pool, firm_id: str) -> dict | None:
    """
    Return the latest aggregated metrics for the firm's Meta connection (from DB).
    Used by dashboard to show spend, impressions, ctr, leads, cpl without calling Meta on every load.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT mc.id, mc.ad_account_id, mc.status,
                   (SELECT json_build_object(
                       'spend', COALESCE(SUM(mi.spend), 0),
                       'impressions', COALESCE(SUM(mi.impressions), 0),
                       'reach', COALESCE(SUM(mi.reach), 0),
                       'clicks', COALESCE(SUM(mi.clicks), 0),
                       'ctr', (SELECT AVG(mi2.ctr) FROM meta_insights mi2 WHERE mi2.connection_id = mc.id AND mi2.ctr IS NOT NULL),
                       'leads', COALESCE(SUM(mi.leads), 0),
                       'cost_per_lead', (SELECT AVG(mi3.cost_per_lead) FROM meta_insights mi3 WHERE mi3.connection_id = mc.id AND mi3.cost_per_lead IS NOT NULL),
                       'date_start', MIN(mi.date_start),
                       'date_stop', MAX(mi.date_stop),
                       'fetched_at', MAX(mi.fetched_at)
                   )
                    FROM meta_insights mi
                    WHERE mi.connection_id = mc.id)
                   AS summary
            FROM meta_connections mc
            WHERE mc.firm_id = $1 AND mc.status = 'active'
            """,
            firm_id,
        )
    if not row or not row["summary"]:
        return None
    summary = row["summary"]
    if summary.get("date_start"):
        summary["date_start"] = summary["date_start"].isoformat() if hasattr(summary["date_start"], "isoformat") else str(summary["date_start"])
    if summary.get("date_stop"):
        summary["date_stop"] = summary["date_stop"].isoformat() if hasattr(summary["date_stop"], "isoformat") else str(summary["date_stop"])
    if summary.get("fetched_at"):
        summary["fetched_at"] = _ensure_utc(summary["fetched_at"]).isoformat() if summary["fetched_at"] else None
    return {
        "connection_id": row["id"],
        "ad_account_id": row["ad_account_id"],
        "status": row["status"],
        "summary": summary,
    }
