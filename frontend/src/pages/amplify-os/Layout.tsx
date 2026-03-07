import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { WizardProvider, useWizard } from "@/pages/amplify-os/lib/wizard-context";
import StepProgress from "@/pages/amplify-os/components/ui/StepProgress";
import type { WizardStep } from "@/pages/amplify-os/lib/types";
import { useEffect, useRef } from "react";

const STEP_TO_ROUTE: Record<WizardStep, string> = {
  "firm-profile": "/amplify-os/firm-profile",
  icp: "/amplify-os/icp",
  offer: "/amplify-os/offer",
  campaign: "/amplify-os/campaign",
  assets: "/amplify-os/assets",
  review: "/amplify-os/review",
  deploy: "/amplify-os/deploy",
};

const ROUTE_TO_STEP: Record<string, WizardStep> = Object.fromEntries(
  Object.entries(STEP_TO_ROUTE).map(([k, v]) => [v, k as WizardStep])
);

function OnboardingShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, canNavigateTo } = useWizard();
  const hasGuarded = useRef(false);

  useEffect(() => {
    const step = ROUTE_TO_STEP[location.pathname];
    if (!step) return;

    if (step !== state.currentStep && !canNavigateTo(step)) {
      if (!hasGuarded.current) {
        hasGuarded.current = true;
        navigate(STEP_TO_ROUTE[state.currentStep], { replace: true });
      }
    } else {
      hasGuarded.current = false;
    }
  }, [location.pathname, state.currentStep, canNavigateTo, navigate]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 px-6 py-3">
            <Link
              to="/"
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

export default function AmplifyOsLayout() {
  return (
    <WizardProvider>
      <OnboardingShell />
    </WizardProvider>
  );
}
