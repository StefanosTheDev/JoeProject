
import { useWizard } from "@/apps/amplify-os/lib/wizard-context";
import { CLIENT_SITUATIONS, AUM_RANGES } from "@/apps/amplify-os/lib/mock-data";
import RangeSlider from "@/apps/amplify-os/components/ui/RangeSlider";
import ChipSelect from "@/apps/amplify-os/components/ui/ChipSelect";
import RadioCards from "@/apps/amplify-os/components/ui/RadioCards";
import Input from "@/apps/amplify-os/components/ui/Input";
import Button from "@/apps/amplify-os/components/ui/Button";

export default function ClientProfileStep() {
  const { state, dispatch } = useWizard();
  const { clientProfile } = state.firmProfile;

  function toggleSituation(situation: string) {
    const current = clientProfile.situations;
    const updated = current.includes(situation)
      ? current.filter((s) => s !== situation)
      : [...current, situation];
    dispatch({
      type: "SET_CLIENT_PROFILE",
      profile: { ...clientProfile, situations: updated },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Current Client Profile</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Describe your existing best clients. This is the strongest signal for
          your ideal client profile.
        </p>
      </div>

      <RangeSlider
        label="Typical Client Age Range"
        min={25}
        max={85}
        value={clientProfile.ageRange as number[]}
        onValueChange={(val) =>
          dispatch({
            type: "SET_CLIENT_PROFILE",
            profile: { ...clientProfile, ageRange: val as [number, number] },
          })
        }
      />

      <ChipSelect
        label="Most Common Client Situations"
        options={CLIENT_SITUATIONS}
        selected={clientProfile.situations}
        onToggle={toggleSituation}
      />

      <RadioCards
        label="Average Household AUM"
        options={AUM_RANGES.map((r) => ({ value: r, label: r }))}
        value={clientProfile.avgHouseholdAum}
        onChange={(val) =>
          dispatch({
            type: "SET_CLIENT_PROFILE",
            profile: { ...clientProfile, avgHouseholdAum: val },
          })
        }
      />

      <Input
        label="Approximate Household Count"
        type="number"
        min={0}
        placeholder="e.g., 150"
        value={clientProfile.householdCount || ""}
        onChange={(e) =>
          dispatch({
            type: "SET_CLIENT_PROFILE",
            profile: {
              ...clientProfile,
              householdCount: parseInt(e.target.value) || 0,
            },
          })
        }
        hint="How many client households do you currently serve?"
      />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 2 })}
        >
          Back
        </Button>
        <Button
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 4 })}
          disabled={
            clientProfile.situations.length === 0 ||
            !clientProfile.avgHouseholdAum
          }
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
