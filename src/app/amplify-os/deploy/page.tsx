"use client";

import { useEffect } from "react";
import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import { MOCK_DEPLOYMENT_CHECKLIST } from "@/app/amplify-os/lib/mock-data";
import Card from "@/app/amplify-os/components/ui/Card";
import Button from "@/app/amplify-os/components/ui/Button";
import * as Tabs from "@radix-ui/react-tabs";
import * as Checkbox from "@radix-ui/react-checkbox";

export default function DeployPage() {
  const { state, dispatch } = useWizard();
  const { checklist, launched } = state.deployment;

  useEffect(() => {
    if (checklist.length === 0) {
      dispatch({
        type: "SET_DEPLOYMENT_CHECKLIST",
        checklist: [...MOCK_DEPLOYMENT_CHECKLIST],
      });
    }
  }, [checklist.length, dispatch]);

  const completedCount = checklist.filter((i) => i.completed).length;
  const canLaunch = completedCount >= 5;

  if (launched) {
    return (
      <div className="flex flex-col items-center py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--foreground)]">
          <span className="text-2xl text-[var(--background)]">✓</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Campaign Launched
        </h1>
        <p className="mt-2 text-center text-[var(--foreground-muted)]">
          Your campaign is now active. We&apos;ll send check-in reminders at 7,
          14, and 30 days.
        </p>
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--fill-subtle)] p-6 text-center">
          <p className="text-sm font-medium">
            {state.campaign?.name || "Your Campaign"}
          </p>
          <span className="mt-2 inline-block rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-medium text-[var(--background)]">
            Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Deployment Package
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Follow the deployment checklist to get your campaign live.
        </p>
      </div>

      <Tabs.Root defaultValue="checklist">
        <Tabs.List className="mb-6 flex gap-1 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-1">
          {[
            { value: "checklist", label: "Setup Checklist" },
            { value: "export", label: "Asset Export" },
            { value: "highlevel", label: "HighLevel Setup" },
            { value: "config", label: "Config Values" },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-[calc(var(--radius)-4px)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition-all duration-200 data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-[var(--shadow-sm)]"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="checklist">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Setup Checklist
              </h3>
              <span className="text-xs text-[var(--foreground-muted)]">
                {completedCount}/{checklist.length} completed
              </span>
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] p-3 transition-colors hover:bg-[var(--fill-subtle)]"
                >
                  <Checkbox.Root
                    checked={item.completed}
                    onCheckedChange={() =>
                      dispatch({ type: "TOGGLE_CHECKLIST_ITEM", index: i })
                    }
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border)] transition-colors data-[state=checked]:border-[var(--foreground)] data-[state=checked]:bg-[var(--foreground)]"
                  >
                    <Checkbox.Indicator>
                      <span className="text-[10px] text-[var(--background)]">
                        ✓
                      </span>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span
                    className={`text-sm ${
                      item.completed
                        ? "text-[var(--foreground-muted)] line-through"
                        : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="export">
          <Card>
            <h3 className="text-sm font-semibold">Download Assets</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Export all approved assets organized by placement.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Ad Copy (Meta Ads Manager format)",
                "Funnel Copy (section by section)",
                "Email/SMS Sequences (import-ready)",
                "Call Preparation Kit (PDF)",
                "UTM Configuration Sheet",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] p-3"
                >
                  <span className="text-sm">{item}</span>
                  <button className="text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]">
                    Download
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm">
                Download All (ZIP)
              </Button>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="highlevel">
          <Card>
            <h3 className="text-sm font-semibold">HighLevel Snapshot</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Deploy the Amplified snapshot for your campaign type.
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-4">
                <p className="text-xs font-medium text-[var(--foreground-muted)]">
                  Recommended Snapshot
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Amplified — Retirement Readiness Review (Paid Social)
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Pre-built funnel, calendar integration, lead capture form,
                  and automation workflows.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Installation Steps
                </h4>
                <ol className="space-y-1.5 text-sm">
                  <li>1. Log into your HighLevel sub-account</li>
                  <li>2. Navigate to Settings → Snapshots</li>
                  <li>3. Request the snapshot from your Amplified admin</li>
                  <li>4. Apply the snapshot to your sub-account</li>
                  <li>5. Replace placeholder copy with your approved assets</li>
                </ol>
              </div>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="config">
          <Card>
            <h3 className="text-sm font-semibold">Configuration Values</h3>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              Copy-paste these values into your tools.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  UTM Parameters
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>utm_source=meta</p>
                  <p>utm_medium=paid_social</p>
                  <p>
                    utm_campaign=
                    {state.campaign?.name
                      ?.toLowerCase()
                      .replace(/[^a-z0-9]+/g, "_") || "campaign"}
                  </p>
                  <p>utm_content=ad_variation_1</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Tracking Pixel
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>&lt;!-- Meta Pixel Code --&gt;</p>
                  <p>Pixel ID: [Your Meta Pixel ID]</p>
                  <p>Events: Lead, Schedule, CompleteRegistration</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--foreground-muted)]">
                  Calendar Integration
                </h4>
                <div className="mt-2 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-3 font-mono text-xs">
                  <p>Calendar Type: Calendly or GHL Calendar</p>
                  <p>
                    Meeting Duration:{" "}
                    {state.offer.config?.meetingLength || 45} min
                  </p>
                  <p>
                    Meeting Type:{" "}
                    {state.offer.config?.meetingType || "virtual"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <Button
          onClick={() => dispatch({ type: "MARK_LAUNCHED" })}
          disabled={!canLaunch}
          size="lg"
        >
          Mark as Launched
        </Button>
        {!canLaunch && (
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            Complete at least 5 checklist items to launch.
          </p>
        )}
      </div>
    </div>
  );
}
