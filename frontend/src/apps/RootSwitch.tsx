/**
 * At path "/": show LandingPage when host is a funnel domain (custom domain or platform subdomain);
 * otherwise show AppHub.
 * Known funnel hostnames always show landing even if tenant resolve fails (e.g. prod API not reached).
 */
import { useTenant } from "@/apps/tenant/TenantContext";
import AppHub from "@/apps/AppHub";
import LandingPage from "@/apps/funnel/LandingPage";

const KNOWN_FUNNEL_HOSTNAMES = ["go.stefanosthedev.com"];

export default function RootSwitch() {
  const tenant = useTenant();
  const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isKnownFunnelHost = KNOWN_FUNNEL_HOSTNAMES.includes(hostname);
  const isFunnelDomain =
    isKnownFunnelHost ||
    ((tenant.source === "custom_domain" || tenant.source === "subdomain") && tenant.firmId);

  if (tenant.isLoading && !isKnownFunnelHost) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (isFunnelDomain) {
    return <LandingPage />;
  }
  return <AppHub />;
}
