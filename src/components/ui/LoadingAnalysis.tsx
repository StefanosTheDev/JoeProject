"use client";

import { useState, useEffect } from "react";

interface LoadingAnalysisProps {
  steps: string[];
  onComplete: () => void;
  stepDuration?: number;
}

export default function LoadingAnalysis({
  steps,
  onComplete,
  stepDuration = 800,
}: LoadingAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, stepDuration, onComplete]);

  return (
    <div className="space-y-4 py-8">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`
              flex items-center gap-2 text-sm transition-all duration-300
              ${
                i < currentStep
                  ? "text-[var(--foreground)]"
                  : i === currentStep
                    ? "text-[var(--foreground)] font-medium"
                    : "text-[var(--foreground-muted)] opacity-40"
              }
            `}
          >
            {i < currentStep ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--foreground)] text-[10px] text-[var(--background)]">
                ✓
              </span>
            ) : i === currentStep ? (
              <span className="h-4 w-4 animate-pulse rounded-full bg-[var(--foreground-muted)]" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-[var(--border)]" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
