"use client";

import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import { ASSET_BAND_OPTIONS } from "@/app/amplify-os/lib/mock-data";
import RangeSlider from "@/app/amplify-os/components/ui/RangeSlider";
import ChipSelect from "@/app/amplify-os/components/ui/ChipSelect";
import Card from "@/app/amplify-os/components/ui/Card";

const ALL_TRIGGERS = [
  "Fear of running out of money",
  "Desire for certainty and a clear plan",
  "Distrust of Wall Street and big brokerages",
  "Anxiety about tax burden in retirement",
  "Frustration with current advisor",
  "Overwhelmed by financial complexity",
  "Concern about leaving a legacy",
  "Healthcare cost anxiety",
];

const PRIMARY_CONCERNS = [
  "Minimizing taxes on retirement income",
  "Social Security optimization",
  "Portfolio longevity",
  "Healthcare costs in retirement",
  "Estate and legacy planning",
  "Market volatility protection",
];

export default function IcpRefinement() {
  const { state, dispatch } = useWizard();
  const profile = state.icp.profile;
  if (!profile) return null;

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold">Refine Your ICP</h3>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Adjust these attributes to better match your ideal client.
          </p>
        </div>

        <RangeSlider
          label="Age Range"
          min={25}
          max={85}
          value={profile.ageRange as number[]}
          onValueChange={(val) =>
            dispatch({
              type: "UPDATE_ICP",
              updates: { ageRange: val as [number, number] },
            })
          }
        />

        <div className="space-y-2">
          <span className="block text-sm font-medium">Asset Band</span>
          <div className="flex flex-wrap gap-2">
            {ASSET_BAND_OPTIONS.map((band) => (
              <button
                key={band}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "UPDATE_ICP",
                    updates: { assetBand: band },
                  })
                }
                className={`
                  rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200
                  ${
                    profile.assetBand === band
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "border border-[var(--border)] hover:border-[var(--foreground-muted)]"
                  }
                `}
              >
                {band}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium">Primary Concern</span>
          <div className="space-y-1.5">
            {PRIMARY_CONCERNS.map((concern) => (
              <button
                key={concern}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "UPDATE_ICP",
                    updates: { primaryConcern: concern },
                  })
                }
                className={`
                  flex w-full items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-left text-sm
                  transition-all duration-200
                  ${
                    profile.primaryConcern === concern
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
                  }
                `}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                    profile.primaryConcern === concern
                      ? "border-[var(--background)] bg-[var(--background)] text-[var(--foreground)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {profile.primaryConcern === concern ? "✓" : ""}
                </span>
                {concern}
              </button>
            ))}
          </div>
        </div>

        <ChipSelect
          label="Emotional Triggers"
          options={ALL_TRIGGERS}
          selected={profile.emotionalTriggers}
          onToggle={(trigger) => {
            const current = profile.emotionalTriggers;
            const updated = current.includes(trigger)
              ? current.filter((t) => t !== trigger)
              : [...current, trigger];
            dispatch({
              type: "UPDATE_ICP",
              updates: { emotionalTriggers: updated },
            });
          }}
        />

        <RangeSlider
          label="Tone"
          min={0}
          max={100}
          value={[profile.toneSetting]}
          onValueChange={(val) =>
            dispatch({
              type: "UPDATE_ICP",
              updates: { toneSetting: val[0] },
            })
          }
          formatValue={(v) => (v < 33 ? "Conservative" : v < 66 ? "Balanced" : "Conversational")}
        />
      </div>
    </Card>
  );
}
