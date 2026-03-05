"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import type { WizardStep } from "@/app/amplify-os/lib/types";

const STEP_LABELS: Record<WizardStep, string> = {
  "firm-profile": "Firm Profile",
  icp: "ICP Discovery",
  offer: "Offer",
  campaign: "Campaign",
  assets: "Assets",
  review: "Review",
  deploy: "Deploy",
};

const STEP_ROUTES: Record<WizardStep, string> = {
  "firm-profile": "/amplify-os/firm-profile",
  icp: "/amplify-os/icp",
  offer: "/amplify-os/offer",
  campaign: "/amplify-os/campaign",
  assets: "/amplify-os/assets",
  review: "/amplify-os/review",
  deploy: "/amplify-os/deploy",
};

export default function StepProgress() {
  const router = useRouter();
  const { state, steps, canNavigateTo, goToStep } = useWizard();

  function handleClick(step: WizardStep) {
    if (canNavigateTo(step)) {
      goToStep(step);
      router.push(STEP_ROUTES[step]);
    }
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto px-6 py-4">
      {steps.map((step, i) => {
        const isActive = state.currentStep === step;
        const isCompleted = state.completedSteps.includes(step);
        const isAccessible = canNavigateTo(step);

        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => handleClick(step)}
              disabled={!isAccessible}
              className={`
                flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : isCompleted
                    ? "bg-[var(--fill-subtle)] text-[var(--foreground)] hover:bg-[var(--border)]"
                    : "text-[var(--foreground-muted)] cursor-not-allowed opacity-40"
                }
              `}
            >
              <span
                className={`
                  flex h-5 w-5 items-center justify-center rounded-full text-xs
                  ${isActive
                    ? "bg-[var(--background)] text-[var(--foreground)]"
                    : isCompleted
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--border)] text-[var(--foreground-muted)]"
                  }
                `}
              >
                {isCompleted ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-px w-6 ${
                  isCompleted ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
