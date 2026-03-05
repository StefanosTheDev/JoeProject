"use client";

import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import Textarea from "@/app/amplify-os/components/ui/Textarea";
import Button from "@/app/amplify-os/components/ui/Button";

const CHAR_LIMIT = 300;

export default function DescriptionStep() {
  const { state, dispatch } = useWizard();
  const { firmDescription } = state.firmProfile;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Firm Description</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Review and refine the description we generated from your website. This
          is the only free-text field in the entire flow.
        </p>
      </div>

      <Textarea
        label="Tell us about your firm and what makes you different"
        value={firmDescription}
        onChange={(e) =>
          dispatch({
            type: "SET_FIRM_DESCRIPTION",
            description: e.target.value.slice(0, CHAR_LIMIT),
          })
        }
        charLimit={CHAR_LIMIT}
        charCount={firmDescription.length}
        rows={4}
        placeholder="Describe your firm's unique value proposition..."
      />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 0 })}
        >
          Back
        </Button>
        <Button
          onClick={() => dispatch({ type: "SET_FIRM_SUBSTEP", subStep: 2 })}
          disabled={!firmDescription.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
