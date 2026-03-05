"use client";

import Link from "next/link";
import { WizardProvider, useWizard } from "@/lib/wizard-context";
import StepProgress from "@/components/ui/StepProgress";
import type { WizardStep } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const STEP_TO_ROUTE: Record<WizardStep, string> = {
  "firm-profile": "/onboarding/firm-profile",
  icp: "/onboarding/icp",
  offer: "/onboarding/offer",
  campaign: "/onboarding/campaign",
  assets: "/onboarding/assets",
  review: "/onboarding/review",
  deploy: "/onboarding/deploy",
};

const ROUTE_TO_STEP: Record<string, WizardStep> = Object.fromEntries(
  Object.entries(STEP_TO_ROUTE).map(([k, v]) => [v, k as WizardStep])
);

function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, canNavigateTo } = useWizard();
  const hasGuarded = useRef(false);

  // Guard only: if the user manually navigates to a step they haven't unlocked,
  // redirect them back to their current step. Runs once per pathname change.
  useEffect(() => {
    const step = ROUTE_TO_STEP[pathname];
    if (!step) return;

    if (step !== state.currentStep && !canNavigateTo(step)) {
      if (!hasGuarded.current) {
        hasGuarded.current = true;
        router.replace(STEP_TO_ROUTE[state.currentStep]);
      }
    } else {
      hasGuarded.current = false;
    }
  }, [pathname, state.currentStep, canNavigateTo, router]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 px-6 py-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
              App Hub
            </Link>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
              Amplify Growth OS
            </span>
          </div>
          <StepProgress />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </div>
  );
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <OnboardingShell>{children}</OnboardingShell>
    </WizardProvider>
  );
}
