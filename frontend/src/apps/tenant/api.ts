const API = "/api";

export interface TenantResolveResponse {
  firm_id: string;
  default_campaign_id: string | null;
  source: "custom_domain" | "subdomain";
}

export async function resolveTenant(host: string): Promise<TenantResolveResponse> {
  const r = await fetch(`${API}/tenant/resolve?host=${encodeURIComponent(host)}`);
  if (!r.ok) {
    if (r.status === 404) throw new Error("Unknown host");
    throw new Error(await r.text().catch(() => "Failed to resolve tenant"));
  }
  return r.json();
}
