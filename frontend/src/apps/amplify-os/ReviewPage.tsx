import { useNavigate } from "react-router-dom";
import { useWizard } from "@/apps/amplify-os/lib/wizard-context";
import type { AdCreativeContent, FunnelSectionContent } from "@/apps/amplify-os/lib/types";
import Card from "@/apps/amplify-os/components/ui/Card";
import Button from "@/apps/amplify-os/components/ui/Button";
import * as Checkbox from "@radix-ui/react-checkbox";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const { adCreative, funnelCopy, sequences, callPrep } = state.assets;
  const { checks, acknowledged } = state.compliance;

  const approvedAds = adCreative.filter((a) => a.status === "approved");
  const approvedFunnel = funnelCopy.filter((a) => a.status === "approved");
  const approvedMessages = sequences.flatMap((s) =>
    s.messages.filter((m) => m.status === "approved")
  );
  const approvedCallPrep = callPrep.filter((i) => i.status === "approved");

  const allChecked = checks.every(Boolean);

  const complianceStatements = [
    "I confirm these assets do not contain performance guarantees or misleading claims.",
    "I understand that my compliance team should review these materials before live deployment.",
    "I confirm the firm information used to generate these assets is accurate and current.",
  ];

  function handleApprove() {
    dispatch({ type: "ACKNOWLEDGE_COMPLIANCE" });
    const next = nextStep();
    if (next) navigate(stepRoutes[next]);
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Review & Compliance
          </h1>
          {acknowledged && (
            <span className="rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-xs font-medium text-[var(--background)]">
              Approved
            </span>
          )}
        </div>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Final review of your complete campaign package.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold">
            Ad Creative{" "}
            <span className="font-normal text-[var(--foreground-muted)]">
              ({approvedAds.length} approved)
            </span>
          </h3>
          <div className="mt-3 space-y-2">
            {approvedAds.map((ad) => {
              const content = ad.content as AdCreativeContent;
              return (
                <div
                  key={ad.id}
                  className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3"
                >
                  <p className="text-sm font-medium">{content.hook}</p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    {content.headline} — {content.cta}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold">
            Funnel Copy{" "}
            <span className="font-normal text-[var(--foreground-muted)]">
              ({approvedFunnel.length} sections approved)
            </span>
          </h3>
          <div className="mt-3 space-y-2">
            {approvedFunnel.map((section) => {
              const content = section.content as FunnelSectionContent;
              return (
                <div
                  key={section.id}
                  className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3"
                >
                  <p className="text-xs font-medium text-[var(--foreground-muted)]">
                    {content.title}
                  </p>
                  <p className="mt-1 text-sm">
                    {content.body.slice(0, 120)}
                    {content.body.length > 120 ? "..." : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold">
            Email & SMS Sequences{" "}
            <span className="font-normal text-[var(--foreground-muted)]">
              ({approvedMessages.length} messages across {sequences.length}{" "}
              sequences)
            </span>
          </h3>
          <div className="mt-3 space-y-2">
            {sequences.map((seq) => {
              const approved = seq.messages.filter(
                (m) => m.status === "approved"
              );
              return (
                <div
                  key={seq.id}
                  className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3"
                >
                  <span className="text-sm">{seq.name}</span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {approved.length}/{seq.messages.length} messages
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold">
            Call Prep Kit{" "}
            <span className="font-normal text-[var(--foreground-muted)]">
              ({approvedCallPrep.length} items approved)
            </span>
          </h3>
          <div className="mt-3 space-y-1">
            {approvedCallPrep.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3"
              >
                <span className="rounded bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                  {item.type}
                </span>
                <span className="text-sm">{item.title}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold">Compliance Acknowledgment</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Please review and confirm the following before approving your
            campaign.
          </p>

          <div className="mt-4 space-y-3">
            {complianceStatements.map((statement, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4 transition-colors hover:bg-[var(--fill-subtle)]"
              >
                <Checkbox.Root
                  checked={checks[i]}
                  onCheckedChange={(checked) =>
                    dispatch({
                      type: "SET_COMPLIANCE_CHECK",
                      index: i,
                      checked: !!checked,
                    })
                  }
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border)] transition-colors data-[state=checked]:border-[var(--foreground)] data-[state=checked]:bg-[var(--foreground)]"
                >
                  <Checkbox.Indicator>
                    <span className="text-[10px] text-[var(--background)]">
                      ✓
                    </span>
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm leading-relaxed">{statement}</span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handleApprove} disabled={!allChecked} size="lg">
          Approve Campaign
        </Button>
      </div>
    </div>
  );
}
