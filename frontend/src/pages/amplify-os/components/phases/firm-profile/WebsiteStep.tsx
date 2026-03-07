
import { useState, useCallback } from "react";
import { useWizard } from "@/pages/amplify-os/lib/wizard-context";
import { MOCK_WEBSITE_ANALYSIS, MOCK_FIRM_DESCRIPTION } from "@/pages/amplify-os/lib/mock-data";
import Input from "@/pages/amplify-os/components/ui/Input";
import Button from "@/pages/amplify-os/components/ui/Button";
import LoadingAnalysis from "@/pages/amplify-os/components/ui/LoadingAnalysis";
import Card from "@/pages/amplify-os/components/ui/Card";

export default function WebsiteStep() {
  const { state, dispatch } = useWizard();
  const { websiteUrl, isAnalyzing, analysisComplete, websiteAnalysis } =
    state.firmProfile;
  const [url, setUrl] = useState(websiteUrl);

  function handleAnalyze() {
    dispatch({ type: "SET_WEBSITE_URL", url });
    dispatch({ type: "START_ANALYSIS" });
  }

  const handleAnalysisComplete = useCallback(() => {
    dispatch({
      type: "COMPLETE_ANALYSIS",
      analysis: MOCK_WEBSITE_ANALYSIS,
      description: MOCK_FIRM_DESCRIPTION,
      credentials: MOCK_WEBSITE_ANALYSIS.credentials,
    });
  }, [dispatch]);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center py-12">
        <h2 className="mb-2 text-xl font-semibold">Analyzing Your Website</h2>
        <p className="mb-6 text-sm text-[var(--foreground-muted)]">
          We&apos;re extracting key information about your practice.
        </p>
        <LoadingAnalysis
          steps={[
            "Scanning your website...",
            "Analyzing your services...",
            "Identifying client segments...",
            "Extracting credentials...",
            "Assessing your positioning...",
          ]}
          onComplete={handleAnalysisComplete}
        />
      </div>
    );
  }

  if (analysisComplete && websiteAnalysis) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Website Analysis Complete</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Here&apos;s what we found. This data will shape your campaign.
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-muted)]">
                Services Detected
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {websiteAnalysis.services.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-muted)]">
                Client Types
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {websiteAnalysis.clientTypes.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-muted)]">
                Credentials
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {websiteAnalysis.credentials.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[var(--foreground)] px-2.5 py-1 text-xs font-medium text-[var(--background)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-muted)]">
                Tone
              </h3>
              <p className="mt-1 text-sm">{websiteAnalysis.tone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-muted)]">
                Differentiators
              </h3>
              <ul className="mt-1 space-y-1">
                {websiteAnalysis.differentiators.map((d) => (
                  <li key={d} className="text-sm">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 1 })}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Your Website</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Paste your website URL and we&apos;ll analyze your practice
          automatically.
        </p>
      </div>

      <Input
        label="Website URL"
        type="url"
        placeholder="https://yourfirm.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        hint="We'll scan your site to extract services, credentials, and positioning."
      />

      <Button onClick={handleAnalyze} disabled={!url.trim()}>
        Analyze Website
      </Button>
    </div>
  );
}
