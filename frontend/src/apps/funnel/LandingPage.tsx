/**
 * Mock landing page for custom-domain root (e.g. go.stefanosthedev.com).
 * Hero + CTA that sends users to the register page.
 */
import { useTenantFirmCampaign } from "@/apps/tenant/TenantContext";
import { Button } from "@/components/ui/button";

const defaultFirmId = import.meta.env.VITE_DEFAULT_FIRM_ID ?? "default";
const defaultCampaignId = import.meta.env.VITE_DEFAULT_CAMPAIGN_ID ?? "default";

export default function LandingPage() {
  const { firmId, campaignId, baseUrl } = useTenantFirmCampaign(defaultFirmId, defaultCampaignId);
  const registerUrl = `${baseUrl}/funnel/register?firm_id=${encodeURIComponent(firmId)}&campaign_id=${encodeURIComponent(campaignId)}`;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background px-4">
      <main className="max-w-xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Reserve your spot
        </h1>
        <p className="text-lg text-muted-foreground">
          Join our free session. Get started in minutes — no commitment required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-base">
            <a href={registerUrl}>Register now</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          By registering you’ll get access to the full experience and next steps.
        </p>
      </main>
    </div>
  );
}
