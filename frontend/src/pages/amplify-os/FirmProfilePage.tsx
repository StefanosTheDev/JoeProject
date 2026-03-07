import { useWizard } from "@/pages/amplify-os/lib/wizard-context";
import WebsiteStep from "@/pages/amplify-os/components/phases/firm-profile/WebsiteStep";
import DescriptionStep from "@/pages/amplify-os/components/phases/firm-profile/DescriptionStep";
import ServiceModelStep from "@/pages/amplify-os/components/phases/firm-profile/ServiceModelStep";
import ClientProfileStep from "@/pages/amplify-os/components/phases/firm-profile/ClientProfileStep";
import GeographyStep from "@/pages/amplify-os/components/phases/firm-profile/GeographyStep";

const SUB_STEP_LABELS = [
  "Website",
  "Description",
  "Service Model",
  "Client Profile",
  "Geography",
];

export default function FirmProfilePage() {
  const { state } = useWizard();
  const { subStep } = state.firmProfile;

  const steps = [
    <WebsiteStep key="website" />,
    <DescriptionStep key="description" />,
    <ServiceModelStep key="service" />,
    <ClientProfileStep key="client" />,
    <GeographyStep key="geography" />,
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Firm Profile</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Tell us about your practice so we can build your growth strategy.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-2">
        {SUB_STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`
                flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                transition-all duration-200
                ${
                  i === subStep
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : i < subStep
                      ? "bg-[var(--fill-subtle)] text-[var(--foreground)]"
                      : "text-[var(--foreground-muted)] opacity-40"
                }
              `}
            >
              <span
                className={`
                  flex h-4 w-4 items-center justify-center rounded-full text-[10px]
                  ${
                    i < subStep
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : i === subStep
                        ? "bg-[var(--background)] text-[var(--foreground)]"
                        : "bg-[var(--border)]"
                  }
                `}
              >
                {i < subStep ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < SUB_STEP_LABELS.length - 1 && (
              <div className="mx-1 h-px w-4 bg-[var(--border)]" />
            )}
          </div>
        ))}
      </div>

      {steps[subStep]}
    </div>
  );
}
