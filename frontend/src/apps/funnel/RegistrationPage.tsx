import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchFunnelContent, submitFunnelForm } from "./api";
import type { FunnelContent } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const defaultFirmId = import.meta.env.VITE_DEFAULT_FIRM_ID ?? "default";
const defaultCampaignId = import.meta.env.VITE_DEFAULT_CAMPAIGN_ID ?? "default";

export default function RegistrationPage() {
  const [searchParams] = useSearchParams();
  const firmId = searchParams.get("firm_id") ?? defaultFirmId;
  const campaignId = searchParams.get("campaign_id") ?? defaultCampaignId;

  const [content, setContent] = useState<FunnelContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitResponse, setSubmitResponse] = useState<{
    session_id?: string;
    webinar_scheduled_at?: string;
    webinar_join_url?: string;
  } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchFunnelContent(firmId, campaignId, "registration")
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firmId, campaignId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitLoading(true);
    setError(null);
    try {
      const res = await submitFunnelForm({
        firm_id: firmId,
        campaign_id: campaignId,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        utm_source: searchParams.get("utm_source") ?? undefined,
        utm_medium: searchParams.get("utm_medium") ?? undefined,
        utm_campaign: searchParams.get("utm_campaign") ?? undefined,
        referrer: document.referrer || undefined,
        page_type: "registration",
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setSubmitResponse({
          session_id: res.session_id,
          webinar_scheduled_at: res.webinar_scheduled_at,
          webinar_join_url: res.webinar_join_url,
        });
      } else {
        setError(res.error ?? "Submit failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (submitSuccess) {
    const scheduledLabel = submitResponse?.webinar_scheduled_at
      ? new Date(submitResponse.webinar_scheduled_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h1 className="text-xl font-semibold">Thank you</h1>
            <p className="text-muted-foreground">
              You’re registered. We’ll be in touch soon.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitResponse?.webinar_join_url && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium">Your webinar</p>
                {scheduledLabel && (
                  <p className="text-muted-foreground text-sm">
                    {scheduledLabel}
                  </p>
                )}
                <p className="text-sm">
                  <a
                    href={submitResponse.webinar_join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Join here when it starts
                  </a>
                </p>
              </div>
            )}
            <Button asChild className="w-full">
              <a href={`/funnel/thank-you?firm_id=${firmId}&campaign_id=${campaignId}`}>
                Continue to next step
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h1 className="text-2xl font-semibold">
            {content?.headline ?? "Register for your free session"}
          </h1>
          {content?.subheadline && (
            <p className="text-muted-foreground">{content.subheadline}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitLoading || !email.trim()}
            >
              {submitLoading ? "Submitting…" : (content?.cta_text ?? "Register")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
