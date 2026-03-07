
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/pages/amplify-os/lib/wizard-context";
import { SERVICE_RADIUS_OPTIONS, CREDENTIAL_OPTIONS } from "@/pages/amplify-os/lib/mock-data";
import Input from "@/pages/amplify-os/components/ui/Input";
import RadioCards from "@/pages/amplify-os/components/ui/RadioCards";
import ChipSelect from "@/pages/amplify-os/components/ui/ChipSelect";
import Button from "@/pages/amplify-os/components/ui/Button";

export default function GeographyStep() {
  const navigate = useNavigate();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const { geography, serviceRadius, credentials } = state.firmProfile;

  function toggleCredential(cred: string) {
    const updated = credentials.includes(cred)
      ? credentials.filter((c) => c !== cred)
      : [...credentials, cred];
    dispatch({
      type: "SET_GEOGRAPHY",
      geography,
      serviceRadius,
      credentials: updated,
    });
  }

  function handleComplete() {
    const next = nextStep();
    if (next) navigate(stepRoutes[next]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Geography & Credentials</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Where you operate and your professional designations.
        </p>
      </div>

      <Input
        label="Primary Market"
        placeholder="e.g., Phoenix, AZ"
        value={geography}
        onChange={(e) =>
          dispatch({
            type: "SET_GEOGRAPHY",
            geography: e.target.value,
            serviceRadius,
            credentials,
          })
        }
        hint="City or metro area where you primarily serve clients."
      />

      <RadioCards
        label="Service Radius"
        options={SERVICE_RADIUS_OPTIONS.map((r) => ({ value: r, label: r }))}
        value={serviceRadius}
        onChange={(val) =>
          dispatch({
            type: "SET_GEOGRAPHY",
            geography,
            serviceRadius: val,
            credentials,
          })
        }
      />

      <ChipSelect
        label="Credentials & Designations"
        options={CREDENTIAL_OPTIONS}
        selected={credentials}
        onToggle={toggleCredential}
      />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 3 })}
        >
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!geography.trim() || !serviceRadius}
        >
          Complete Firm Profile
        </Button>
      </div>
    </div>
  );
}
