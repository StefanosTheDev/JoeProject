
import { useWizard } from "@/apps/amplify-os/lib/wizard-context";
import {
  FEE_MODELS,
  FIRM_AUM_RANGES,
  PRIMARY_FOCUS_OPTIONS,
} from "@/apps/amplify-os/lib/mock-data";
import ToggleCard from "@/apps/amplify-os/components/ui/ToggleCard";
import RadioCards from "@/apps/amplify-os/components/ui/RadioCards";
import Button from "@/apps/amplify-os/components/ui/Button";

export default function ServiceModelStep() {
  const { state, dispatch } = useWizard();
  const { serviceModel } = state.firmProfile;

  function toggleFeeModel(model: string) {
    const current = serviceModel.feeModels;
    const updated = current.includes(model)
      ? current.filter((m) => m !== model)
      : [...current, model];
    dispatch({
      type: "SET_SERVICE_MODEL",
      model: { ...serviceModel, feeModels: updated },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Service Model</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Select your fee structure and primary service focus.
        </p>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Fee Model</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {FEE_MODELS.map((model) => (
            <ToggleCard
              key={model}
              label={model}
              selected={serviceModel.feeModels.includes(model)}
              onToggle={() => toggleFeeModel(model)}
            />
          ))}
        </div>
      </div>

      <RadioCards
        label="AUM Range"
        options={FIRM_AUM_RANGES.map((r) => ({ value: r, label: r }))}
        value={serviceModel.aumRange}
        onChange={(val) =>
          dispatch({
            type: "SET_SERVICE_MODEL",
            model: { ...serviceModel, aumRange: val },
          })
        }
      />

      <RadioCards
        label="Primary Service Focus"
        options={PRIMARY_FOCUS_OPTIONS.map((o) => ({ value: o, label: o }))}
        value={serviceModel.primaryFocus}
        onChange={(val) =>
          dispatch({
            type: "SET_SERVICE_MODEL",
            model: { ...serviceModel, primaryFocus: val },
          })
        }
      />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 1 })}
        >
          Back
        </Button>
        <Button
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 3 })}
          disabled={
            serviceModel.feeModels.length === 0 ||
            !serviceModel.aumRange ||
            !serviceModel.primaryFocus
          }
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
