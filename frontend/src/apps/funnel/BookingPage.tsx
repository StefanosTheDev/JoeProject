import { useState, useEffect } from "react";
import { useTenantFirmCampaign } from "@/apps/tenant/TenantContext";
import { fetchFunnelContent } from "./api";
import type { FunnelContent } from "./api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const defaultFirmId = import.meta.env.VITE_DEFAULT_FIRM_ID ?? "default";
const defaultCampaignId = import.meta.env.VITE_DEFAULT_CAMPAIGN_ID ?? "default";

interface CalendlyEventType {
  uri: string;
  name?: string;
  slug?: string;
  scheduling_url?: string;
  updated_at?: string;
  active?: boolean;
}

export default function BookingPage() {
  const { firmId, campaignId } = useTenantFirmCampaign(defaultFirmId, defaultCampaignId);

  const [content, setContent] = useState<FunnelContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFunnelContent(firmId, campaignId, "booking")
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [firmId, campaignId]);

  // Reset embed when firm changes so we don't show a stale Calendly from a previous visit (e.g. after client-side nav)
  useEffect(() => {
    setCalendlyUrl(null);
  }, [firmId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendly/event-types?firm_id=${encodeURIComponent(firmId)}`)
      .then((r) => (r.ok ? r.json() : { event_types: [] }))
      .then((data: { event_types?: (CalendlyEventType | { resource?: CalendlyEventType })[] }) => {
        if (cancelled) return;
        const raw = data.event_types ?? [];
        const types = raw.map((t) => {
          const r = t && typeof t === "object" && "resource" in t
            ? (t as { resource?: CalendlyEventType }).resource
            : (t as CalendlyEventType | undefined);
          return r;
        }).filter((r): r is CalendlyEventType => r != null && typeof r === "object" && "scheduling_url" in r);
        // Only use active event types (avoid "calendar is currently unavailable")
        const activeOnly = types.filter((t) => t.active !== false);
        const list = activeOnly.length > 0 ? activeOnly : types;
        // Prefer most recently updated so we don't show an old event type when Calendly returns multiple
        const sorted = [...list].sort((a, b) => {
          const au = a.updated_at ?? "";
          const bu = b.updated_at ?? "";
          return bu.localeCompare(au);
        });
        const chosen = sorted[0];
        setCalendlyUrl(chosen?.scheduling_url ?? null);
      })
      .catch(() => {
        if (!cancelled) setCalendlyUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [firmId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold">
              {content?.headline ?? "Book your call"}
            </h1>
            {content?.subheadline && (
              <p className="text-muted-foreground">{content.subheadline}</p>
            )}
          </CardHeader>
          <CardContent>
            {calendlyUrl ? (
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                <iframe
                  key={calendlyUrl}
                  title="Calendly"
                  src={calendlyUrl}
                  className="w-full min-h-[700px] border-0"
                />
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  No active booking calendar is available. Connect Calendly for this firm, or in Calendly make sure you have at least one <strong>active</strong> event type (deactivated or paused calendars won’t appear here).
                </p>
                <div className="border rounded-lg bg-muted/50 p-8 text-center">
                  <a
                    href="https://calendly.com/event_types"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Open Calendly event types →
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
