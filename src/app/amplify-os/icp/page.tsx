"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import { MOCK_ICP } from "@/app/amplify-os/lib/mock-data";
import IcpCard from "@/app/amplify-os/components/phases/icp/IcpCard";
import IcpRefinement from "@/app/amplify-os/components/phases/icp/IcpRefinement";
import Button from "@/app/amplify-os/components/ui/Button";
import LoadingAnalysis from "@/app/amplify-os/components/ui/LoadingAnalysis";

export default function IcpPage() {
  const router = useRouter();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const { profile, isGenerating, isLocked } = state.icp;

  useEffect(() => {
    if (!profile && !isGenerating) {
      dispatch({ type: "START_ICP_GENERATION" });
    }
  }, [profile, isGenerating, dispatch]);

  const handleGenerationComplete = useCallback(() => {
    dispatch({ type: "SET_ICP", profile: { ...MOCK_ICP } });
  }, [dispatch]);

  if (isGenerating) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          ICP Discovery
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Generating your Ideal Client Profile from your firm data.
        </p>
        <div className="mt-8 flex flex-col items-center">
          <LoadingAnalysis
            steps={[
              "Analyzing your firm profile...",
              "Identifying ideal client patterns...",
              "Mapping emotional triggers...",
              "Calibrating tone and messaging...",
              "Building your ICP recommendation...",
            ]}
            onComplete={handleGenerationComplete}
            stepDuration={600}
          />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          ICP Discovery
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          {isLocked
            ? "Your ICP is locked for this campaign."
            : "Review your AI-generated Ideal Client Profile. Adjust the attributes below to refine it."}
        </p>
      </div>

      <div className="space-y-6">
        <IcpCard profile={profile} />

        {!isLocked && (
          <>
            <IcpRefinement />
            <div className="flex gap-3">
              <Button onClick={() => {
                dispatch({ type: "LOCK_ICP" });
                const next = nextStep();
                if (next) router.push(stepRoutes[next]);
              }}>
                Lock ICP & Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
