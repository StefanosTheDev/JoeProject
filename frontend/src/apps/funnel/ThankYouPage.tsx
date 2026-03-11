import { useState, useEffect } from "react";
import { useTenantFirmCampaign } from "@/apps/tenant/TenantContext";
import { fetchFunnelContent } from "./api";
import type { FunnelContent } from "./api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const defaultFirmId = import.meta.env.VITE_DEFAULT_FIRM_ID ?? "default";
const defaultCampaignId = import.meta.env.VITE_DEFAULT_CAMPAIGN_ID ?? "default";

export default function ThankYouPage() {
  const { firmId, campaignId, baseUrl } = useTenantFirmCampaign(defaultFirmId, defaultCampaignId);

  const [content, setContent] = useState<FunnelContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchFunnelContent(firmId, campaignId, "vsl")
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [firmId, campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <h1 className="text-2xl font-semibold">
            {content?.headline ?? "Thank you"}
          </h1>
          {content?.subheadline && (
            <p className="text-muted-foreground">{content.subheadline}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your next step is to book a call. Choose a time that works for you.
          </p>
          <Button asChild className="w-full">
            <a href={`${baseUrl}/funnel/book?firm_id=${firmId}&campaign_id=${campaignId}`}>
              {content?.cta_text ?? "Book your call"}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
