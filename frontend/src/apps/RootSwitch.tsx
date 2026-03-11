/**
 * At path "/": show LandingPage when host is a funnel domain (custom domain or platform subdomain);
 * otherwise show AppHub.
 */
import { useTenant } from "@/apps/tenant/TenantContext";
import AppHub from "@/apps/AppHub";
import LandingPage from "@/apps/funnel/LandingPage";

export default function RootSwitch() {
  const tenant = useTenant();
  const isFunnelDomain =
    (tenant.source === "custom_domain" || tenant.source === "subdomain") && tenant.firmId;

  if (tenant.isLoading) {
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
