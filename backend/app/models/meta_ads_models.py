"""Request/response models for Meta Ads API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


# ---------- Request bodies ----------


class LaunchPayloadBody(BaseModel):
    """Body for launching a Meta ad campaign."""

    firm_id: str
    campaign_name: str
    daily_budget_cents: int
    age_min: int = 55
    age_max: int = 67
    geography_description: str = ""
    page_id: str | None = None
    primary_text: str = ""
    headline: str = ""
    description: str = ""
    cta: str = "LEARN_MORE"
    link_url: str = ""
    image_url: str | None = None
    campaign_id: str | None = None
    asset_id: str | None = None


class CAPIEventBody(BaseModel):
    """Body for sending a conversion event to Meta CAPI."""

    firm_id: str
    event_name: str
    event_id: str
    event_time: str | None = None
    email: str | None = None
    phone: str | None = None
    fbp: str | None = None
    fbc: str | None = None
    action_source: str = "website"
    custom_data: dict | None = None


# ---------- Response models ----------


class MetaOAuthUrlResponse(BaseModel):
    url: str


class MetaConnectionStatus(BaseModel):
    connected: bool
    firm_id: str
    connection_id: str | None = None
    ad_account_id: str | None = None
    page_id: str | None = None
    status: str | None = None
    token_expires_at: str | None = None
    connected_at: str | None = None


class MetaDisconnectResponse(BaseModel):
    ok: bool = True
    firm_id: str


class MetaInsightsSyncResponse(BaseModel):
    run_id: str | None = None
    connection_id: str | None = None
    total_objects: int = 0
    synced_objects: int = 0
    failed_objects: int = 0
    error_text: str | None = None
    errors: list = []


class MetaInsightsLatestResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    connected: bool
    summary: dict | None = None


class MetaLaunchPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
    connected: bool
    campaigns: list = []


class MetaLaunchResponse(BaseModel):
    success: bool = True
    meta_campaign_id: str | None = None
    meta_adset_id: str | None = None
    meta_creative_id: str | None = None
    meta_ad_id: str | None = None
    meta_campaigns_row_id: str | None = None
    meta_ads_row_id: str | None = None


class MetaCapiEventResponse(BaseModel):
    success: bool = True


class MetaCapiLogResponse(BaseModel):
    events: list


class MetaRulesListResponse(BaseModel):
    rules: list
