import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/apps/amplify-os/lib/wizard-context";
import { BUDGET_RANGES } from "@/apps/amplify-os/lib/mock-data";
import Input from "@/apps/amplify-os/components/ui/Input";
import RadioCards from "@/apps/amplify-os/components/ui/RadioCards";
import Button from "@/apps/amplify-os/components/ui/Button";
import type { Campaign } from "@/apps/amplify-os/lib/types";

export default function CampaignPage() {
  const navigate = useNavigate();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const icp = state.icp.profile;

  const defaultName = icp
    ? `${state.firmProfile.geography || "Market"} ${icp.personaLabel} — ${state.offer.config?.customName || "Campaign"} — Q2 2026`
    : "New Campaign — Q2 2026";

  const [name, setName] = useState(defaultName);
  const [channel, setChannel] = useState<Campaign["channel"]>("paid_social");
  const [budgetRange, setBudgetRange] = useState("");
  const [launchDate, setLaunchDate] = useState("");

  function handleCreate() {
    const campaign: Campaign = {
      id: "camp-1",
      firmId: "firm-1",
      icpId: icp?.id || "",
      offerId: "offer-1",
      name,
      channel,
      budgetRange,
      launchDate,
      status: "in_progress",
    };
    dispatch({ type: "SET_CAMPAIGN", campaign });
    const next = nextStep();
    if (next) navigate(stepRoutes[next]);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Campaign Setup
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Name your campaign and set the basic parameters.
        </p>
      </div>

      <div className="space-y-8">
        <Input
          label="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Auto-generated from your market, ICP, and offer. Feel free to edit."
        />

        <RadioCards
          label="Primary Channel"
          options={[
            {
              value: "paid_social",
              label: "Paid Social (Meta)",
              description: "Facebook & Instagram ads",
            },
            {
              value: "email",
              label: "Email / Cold Outreach",
              description: "Targeted email campaigns",
            },
            {
              value: "organic",
              label: "Organic / Content",
              description: "Coming soon",
              disabled: true,
            },
          ]}
          value={channel}
          onChange={(v) => setChannel(v as Campaign["channel"])}
        />

        <div className="space-y-2">
          <span className="block text-sm font-medium">
            Monthly Ad Budget{" "}
            <span className="font-normal text-[var(--foreground-muted)]">
              (optional)
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {BUDGET_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() =>
                  setBudgetRange(budgetRange === range ? "" : range)
                }
                className={`
                  rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200
                  ${
                    budgetRange === range
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }
                `}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Target Launch Date"
          type="date"
          value={launchDate}
          onChange={(e) => setLaunchDate(e.target.value)}
          hint="Optional. Helps with deployment planning."
        />

        <Button onClick={handleCreate} disabled={!name.trim()}>
          Create Campaign
        </Button>
      </div>
    </div>
  );
}
