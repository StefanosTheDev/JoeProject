const API = "/api";

export async function fetchCampaignIdBySlug(firmId: string, slug: string): Promise<string> {
  const r = await fetch(
    `${API}/funnel/campaign-by-slug?firm_id=${encodeURIComponent(firmId)}&slug=${encodeURIComponent(slug)}`
  );
  if (!r.ok) throw new Error("Campaign not found for this slug");
  const data = await r.json();
  return data.campaign_id;
}

export interface FunnelContent {
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  body: string | null;
  hero_image_url?: string | null;
  logo_url?: string | null;
  bullets?: string[];
  video_embed_url?: string | null;
  secondary_cta_text?: string | null;
  content: Record<string, unknown>;
}

export async function fetchFunnelContent(
  firmId: string,
  campaignId: string,
  pageType: string = "registration"
): Promise<FunnelContent> {
  const r = await fetch(
    `${API}/funnel/content?firm_id=${encodeURIComponent(firmId)}&campaign_id=${encodeURIComponent(campaignId)}&page_type=${encodeURIComponent(pageType)}`
  );
  if (!r.ok) throw new Error("Failed to fetch funnel content");
  return r.json();
}

export interface FunnelSubmitPayload {
  firm_id: string;
  campaign_id?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  page_type?: string;
}

export interface FunnelSubmitResponse {
  ok: boolean;
  contact_id?: string;
  error?: string;
  session_id?: string;
  webinar_scheduled_at?: string;
  webinar_join_url?: string;
}

export async function submitFunnelForm(
  payload: FunnelSubmitPayload
): Promise<FunnelSubmitResponse> {
  const r = await fetch(`${API}/funnel/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}
