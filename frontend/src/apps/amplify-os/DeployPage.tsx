import { useEffect, useState, useCallback } from "react";
import { useWizard } from "@/apps/amplify-os/lib/wizard-context";
import { MOCK_DEPLOYMENT_CHECKLIST } from "@/apps/amplify-os/lib/mock-data";
import Card from "@/apps/amplify-os/components/ui/Card";
import Button from "@/apps/amplify-os/components/ui/Button";
import * as Tabs from "@radix-ui/react-tabs";
import * as Checkbox from "@radix-ui/react-checkbox";

const META_FIRM_ID = "firm-1";
const GHL_FIRM_ID = "firm-1";

function getApiBase() {
  const base = import.meta.env.VITE_API_URL;
  return base ? `${String(base).replace(/\/$/, "")}/api` : "/api";
}

export default function DeployPage() {
  const { state, dispatch } = useWizard();
  const { checklist, launched } = state.deployment;
  const [metaConnection, setMetaConnection] = useState<{
    connected: boolean;
    ad_account_id?: string;
    token_expires_at?: string;
  } | null>(null);
  const [metaInsights, setMetaInsights] = useState<{
    connected: boolean;
    summary?: {
      spend?: number;
      impressions?: number;
      reach?: number;
      clicks?: number;
      ctr?: number;
      leads?: number;
      cost_per_lead?: number;
      date_start?: string;
      date_stop?: string;
      fetched_at?: string;
    };
  } | null>(null);
  const [metaSyncLoading, setMetaSyncLoading] = useState(false);
  const [metaConnectLoading, setMetaConnectLoading] = useState(false);
  const [launchPreview, setLaunchPreview] = useState<{
    connected: boolean;
    campaigns?: { id: string; name: string; meta_campaign_id: string; status: string }[];
  } | null>(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchSuccess, setLaunchSuccess] = useState<{
    meta_campaign_id: string;
    meta_ad_id: string;
  } | null>(null);
  const [capiLog, setCapiLog] = useState<{ events: { event_name: string; event_id: string; sent_at: string }[] } | null>(null);
  const [metaRules, setMetaRules] = useState<{ rules: { id: string; rule_type: string; action_type: string; is_active: boolean }[] } | null>(null);
  const [ghlConnection, setGhlConnection] = useState<{
    connected: boolean;
    location_id?: string;
  } | null>(null);
  const [ghlConnectLoading, setGhlConnectLoading] = useState(false);

  useEffect(() => {
    if (checklist.length === 0) {
      dispatch({
        type: "SET_DEPLOYMENT_CHECKLIST",
        checklist: [...MOCK_DEPLOYMENT_CHECKLIST],
      });
    }
  }, [checklist.length, dispatch]);

  const fetchMetaConnection = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/meta/connection?firm_id=${encodeURIComponent(META_FIRM_ID)}`
      );
      const data = await r.json();
      setMetaConnection(data);
    } catch {
      setMetaConnection({ connected: false });
    }
  }, []);

  const fetchMetaInsights = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/meta/insights?firm_id=${encodeURIComponent(META_FIRM_ID)}`
      );
      const data = await r.json();
      setMetaInsights(data);
    } catch {
      setMetaInsights(null);
    }
  }, []);

  useEffect(() => {
    fetchMetaConnection();
  }, [fetchMetaConnection]);

  const fetchGhlConnection = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/connect/connection?firm_id=${encodeURIComponent(GHL_FIRM_ID)}`
      );
      const data = await r.json();
      setGhlConnection({ connected: data.connected, location_id: data.location_id });
    } catch {
      setGhlConnection({ connected: false });
    }
  }, []);

  useEffect(() => {
    fetchGhlConnection();
  }, [fetchGhlConnection]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaConnect = params.get("meta_connect");
    if (metaConnect === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      fetchMetaConnection();
      fetchMetaInsights();
    }
  }, [fetchMetaConnection, fetchMetaInsights]);

  const handleConnectMeta = async () => {
    setMetaConnectLoading(true);
    try {
      const r = await fetch(
        `${getApiBase()}/meta/oauth/url?firm_id=${encodeURIComponent(META_FIRM_ID)}`
      );
      const data = await r.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setMetaConnectLoading(false);
    }
  };

  const handleConnectGhl = async () => {
    setGhlConnectLoading(true);
    try {
      const r = await fetch(
        `${getApiBase()}/connect/oauth/url?firm_id=${encodeURIComponent(GHL_FIRM_ID)}`
      );
      const data = await r.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setGhlConnectLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setMetaSyncLoading(true);
    try {
      await fetch(
        `${getApiBase()}/meta/insights/sync?firm_id=${encodeURIComponent(META_FIRM_ID)}`,
        { method: "POST" }
      );
      await fetchMetaInsights();
    } finally {
      setMetaSyncLoading(false);
    }
  };

  useEffect(() => {
    if (metaConnection?.connected) fetchMetaInsights();
  }, [metaConnection?.connected, fetchMetaInsights]);

  const fetchLaunchPreview = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/meta/launch/preview?firm_id=${encodeURIComponent(META_FIRM_ID)}`
      );
      const data = await r.json();
      setLaunchPreview(data);
    } catch {
      setLaunchPreview({ connected: false });
    }
  }, []);

  useEffect(() => {
    if (metaConnection?.connected) fetchLaunchPreview();
  }, [metaConnection?.connected, fetchLaunchPreview]);

  const fetchCapiLog = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/meta/capi/log?firm_id=${encodeURIComponent(META_FIRM_ID)}&limit=10`
      );
      const data = await r.json();
      setCapiLog(data);
    } catch {
      setCapiLog(null);
    }
  }, []);

  const fetchMetaRules = useCallback(async () => {
    try {
      const r = await fetch(
        `${getApiBase()}/meta/rules?firm_id=${encodeURIComponent(META_FIRM_ID)}`
      );
      const data = await r.json();
      setMetaRules(data);
    } catch {
      setMetaRules(null);
    }
  }, []);

  useEffect(() => {
    if (metaConnection?.connected) {
      fetchCapiLog();
      fetchMetaRules();
    }
  }, [metaConnection?.connected, fetchCapiLog, fetchMetaRules]);

  const handleLaunchToMeta = async () => {
    setLaunchError(null);
    setLaunchSuccess(null);
    setLaunchLoading(true);
    const campaign = state.campaign;
    const approvedAds = state.assets.adCreative.filter((a) => a.status === "approved");
    const firstAd = approvedAds[0];
    const content = firstAd?.content as { primaryText?: string; headline?: string; description?: string; cta?: string } | undefined;
    try {
      const r = await fetch(`${getApiBase()}/meta/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm_id: META_FIRM_ID,
          campaign_name: campaign?.name || "Growth OS Campaign",
          daily_budget_cents: 5000,
          age_min: state.icp.profile?.ageRange?.[0] ?? 55,
          age_max: state.icp.profile?.ageRange?.[1] ?? 67,
          geography_description: state.firmProfile.geography || "",
          primary_text: content?.primaryText || "",
          headline: content?.headline || "",
          description: content?.description || "",
          cta: "LEARN_MORE",
          link_url: "",
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setLaunchError(data.detail || data.error || "Launch failed");
        return;
      }
      setLaunchSuccess({ meta_campaign_id: data.meta_campaign_id, meta_ad_id: data.meta_ad_id });
      fetchLaunchPreview();
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setLaunchLoading(false);
    }
  };

  const completedCount = checklist.filter((i) => i.completed).length;
  const canLaunch = completedCount >= 5;

  if (launched) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--foreground)]">
          <span className="text-2xl text-[var(--background)]">✓</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Campaign Launched
        </h1>
        <p className="mt-2 text-center text-[var(--foreground-muted)]">
          Your campaign is now active. We&apos;ll send check-in reminders at 7,
          14, and 30 days.
        </p>
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--fill-subtle)] p-6 text-center">
          <p className="text-sm font-medium">
            {state.campaign?.name || "Your Campaign"}
          </p>
          <span className="mt-2 inline-block rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-medium text-[var(--background)]">
            Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Deployment Package
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Follow the deployment checklist to get your campaign live.
        </p>
      </div>

      <Card className="mb-6">
        <h3 className="text-sm font-semibold">Meta (Facebook & Instagram) Ads</h3>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Connect your Meta ad account to see performance in the OS and sync insights.
        </p>
        {metaConnection?.connected ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--fill-subtle)] px-3 py-1 text-xs font-medium">
              <span className="size-2 rounded-full bg-green-500" aria-hidden />
              Connected
            </span>
            {metaConnection.ad_account_id && (
              <span className="text-xs text-[var(--foreground-muted)]">
                Ad account: {metaConnection.ad_account_id}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConnectMeta}
              disabled={metaConnectLoading}
            >
              {metaConnectLoading ? "Redirecting…" : "Connect Meta Account"}
            </Button>
          </div>
        )}
      </Card>

      <Tabs.Root defaultValue="checklist">
        <Tabs.List className="mb-6 flex gap-1 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-1">
          {[
            { value: "checklist", label: "Setup Checklist" },
            { value: "performance", label: "Performance" },
            { value: "export", label: "Asset Export" },
            { value: "highlevel", label: "HighLevel Setup" },
            { value: "config", label: "Config Values" },
            { value: "tracking", label: "Tracking" },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-[calc(var(--radius)-4px)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition-all duration-200 data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-[var(--shadow-sm)]"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="checklist">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Setup Checklist</h3>
              <span className="text-xs text-[var(--foreground-muted)]">
                {completedCount}/{checklist.length} completed
              </span>
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] p-3 transition-colors hover:bg-[var(--fill-subtle)]"
                >
                  <Checkbox.Root
                    checked={item.completed}
                    onCheckedChange={() =>
                      dispatch({ type: "TOGGLE_CHECKLIST_ITEM", index: i })
                    }
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border)] transition-colors data-[state=checked]:border-[var(--foreground)] data-[state=checked]:bg-[var(--foreground)]"
                  >
                    <Checkbox.Indicator>
                      <span className="text-[10px] text-[var(--background)]">
                        ✓
                      </span>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span
                    className={`text-sm ${
                      item.completed
                        ? "text-[var(--foreground-muted)] line-through"
                        : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="performance">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Meta Ads Performance</h3>
              {metaConnection?.connected && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={metaSyncLoading}
                >
                  {metaSyncLoading ? "Syncing…" : "Sync Now"}
                </Button>
              )}
            </div>
            {!metaConnection?.connected ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                Connect your Meta account above to see performance data.
              </p>
            ) : metaInsights?.summary ? (
              <div className="space-y-4">
                {metaInsights.summary.fetched_at && (
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Last synced: {new Date(metaInsights.summary.fetched_at).toLocaleString()}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">Spend</p>
                    <p className="mt-1 text-lg font-semibold">
                      ${Number(metaInsights.summary.spend ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">Impressions</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(metaInsights.summary.impressions ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">Clicks</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(metaInsights.summary.clicks ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">CTR</p>
                    <p className="mt-1 text-lg font-semibold">
                      {metaInsights.summary.ctr != null
                        ? `${Number(metaInsights.summary.ctr).toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">Leads</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(metaInsights.summary.leads ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3">
                    <p className="text-xs font-medium text-[var(--foreground-muted)]">Cost per Lead</p>
                    <p className="mt-1 text-lg font-semibold">
                      {metaInsights.summary.cost_per_lead != null
                        ? `$${Number(metaInsights.summary.cost_per_lead).toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                </div>
                {(metaInsights.summary.date_start || metaInsights.summary.date_stop) && (
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Period: {metaInsights.summary.date_start} – {metaInsights.summary.date_stop}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">
                No performance data yet. Click &quot;Sync Now&quot; to pull the latest from Meta.
              </p>
            )}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="export">
          <Card>
            <h3 className="text-sm font-semibold">Download Assets</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Export all approved assets organized by placement.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Ad Copy (Meta Ads Manager format)",
                "Funnel Copy (section by section)",
                "Email/SMS Sequences (import-ready)",
                "Call Preparation Kit (PDF)",
                "UTM Configuration Sheet",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] p-3"
                >
                  <span className="text-sm">{item}</span>
                  <button className="text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]">
                    Download
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm">
                Download All (ZIP)
              </Button>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="highlevel">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">HighLevel (GHL) connection</h3>
              {ghlConnection?.connected ? (
                <span className="text-xs text-[var(--foreground-muted)]">
                  Connected · location_id: {ghlConnection.location_id || "—"}
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectGhl}
                  disabled={ghlConnectLoading}
                >
                  {ghlConnectLoading ? "Redirecting…" : "Connect to HighLevel"}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Connect your GHL sub-account so the app can deploy snapshots and update Custom Values.
              After connecting you’ll be redirected back here; refresh or reopen the tab to see status.
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-4">
                <p className="text-xs font-medium text-[var(--foreground-muted)]">
                  Recommended Snapshot
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Amplified — Retirement Readiness Review (Paid Social)
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Pre-built funnel, calendar integration, lead capture form,
                  and automation workflows.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Installation Steps
                </h4>
                <ol className="space-y-1.5 text-sm">
                  <li>1. Connect to HighLevel above (OAuth).</li>
                  <li>2. Log into your HighLevel sub-account if needed.</li>
                  <li>3. Navigate to Settings → Snapshots.</li>
                  <li>4. Request the snapshot from your Amplified admin and apply it.</li>
                  <li>5. Replace placeholder copy with your approved assets.</li>
                </ol>
              </div>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="config">
          <Card>
            <h3 className="text-sm font-semibold">Configuration Values</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Copy-paste these values into your tools.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  UTM Parameters
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>utm_source=meta</p>
                  <p>utm_medium=paid_social</p>
                  <p>
                    utm_campaign=
                    {state.campaign?.name
                      ?.toLowerCase()
                      .replace(/[^a-z0-9]+/g, "_") || "campaign"}
                  </p>
                  <p>utm_content=ad_variation_1</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Tracking Pixel
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>&lt;!-- Meta Pixel Code --&gt;</p>
                  <p>Pixel ID: [Your Meta Pixel ID]</p>
                  <p>Events: Lead, Schedule, CompleteRegistration</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Calendar Integration
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>Calendar Type: Calendly or GHL Calendar</p>
                  <p>
                    Meeting Duration:{" "}
                    {state.offer.config?.meetingLength || 45} min
                  </p>
                  <p>
                    Meeting Type:{" "}
                    {state.offer.config?.meetingType || "virtual"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="tracking">
          <Card>
            <h3 className="text-sm font-semibold">Conversions API (CAPI) — Recent events</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Server-side events sent to Meta for attribution. Lead, Schedule, Contact, etc.
            </p>
            {!metaConnection?.connected ? (
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                Connect Meta to view CAPI log.
              </p>
            ) : capiLog?.events?.length ? (
              <ul className="mt-4 space-y-2">
                {capiLog.events.map((ev) => (
                  <li
                    key={ev.event_id}
                    className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] p-2 text-xs"
                  >
                    <span className="font-medium">{ev.event_name}</span>
                    <span className="text-[var(--foreground-muted)]">
                      {ev.sent_at ? new Date(ev.sent_at).toLocaleString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                No CAPI events yet. Events are logged when you send Lead, Schedule, or Contact via the API.
              </p>
            )}
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Automated rules</h3>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Alert and automation rules (scaffolding). Configure via API.
              </p>
              {metaRules?.rules?.length ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {metaRules.rules.map((rule) => (
                    <li key={rule.id}>
                      {rule.rule_type} → {rule.action_type}{" "}
                      {rule.is_active ? "(active)" : "(inactive)"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">No rules configured.</p>
              )}
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <div className="mt-8 space-y-6 border-t border-[var(--border)] pt-8">
        {metaConnection?.connected && (
          <Card>
            <h3 className="text-sm font-semibold">Launch to Meta (Paused)</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Create your campaign in Meta Ads Manager as PAUSED. Review in Ads Manager, then activate when ready.
            </p>
            {launchSuccess ? (
              <div className="mt-4 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-4">
                <p className="text-sm font-medium">Campaign created in Meta (paused)</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Campaign ID: {launchSuccess.meta_campaign_id} · Ad ID: {launchSuccess.meta_ad_id}
                </p>
              </div>
            ) : (
              <>
                {launchError && (
                  <p className="mt-2 text-sm text-red-600">{launchError}</p>
                )}
                <div className="mt-4">
                  <Button
                    onClick={handleLaunchToMeta}
                    disabled={launchLoading}
                    variant="secondary"
                    size="sm"
                  >
                    {launchLoading ? "Creating…" : "Create Paused Campaign in Meta"}
                  </Button>
                </div>
              </>
            )}
            {launchPreview?.campaigns && launchPreview.campaigns.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-[var(--foreground-muted)]">Recently launched</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {launchPreview.campaigns.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      {c.name} — {c.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
        <div>
          <Button
            onClick={() => dispatch({ type: "MARK_LAUNCHED" })}
            disabled={!canLaunch}
            size="lg"
          >
            Mark as Launched
          </Button>
          {!canLaunch && (
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Complete at least 5 checklist items to launch.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
