"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import { MOCK_OFFER_ARCHETYPES, EXCLUSION_OPTIONS } from "@/app/amplify-os/lib/mock-data";
import Card from "@/app/amplify-os/components/ui/Card";
import Button from "@/app/amplify-os/components/ui/Button";
import Input from "@/app/amplify-os/components/ui/Input";
import RadioCards from "@/app/amplify-os/components/ui/RadioCards";
import ChipSelect from "@/app/amplify-os/components/ui/ChipSelect";

export default function OfferPage() {
  const router = useRouter();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const { archetypes, selectedArchetypeId, config } = state.offer;

  const [meetingType, setMeetingType] = useState<"in_person" | "virtual" | "phone">("virtual");
  const [meetingLength, setMeetingLength] = useState<30 | 45 | 60>(45);
  const [customName, setCustomName] = useState("");
  const [exclusions, setExclusions] = useState<string[]>([]);

  useEffect(() => {
    if (archetypes.length === 0) {
      dispatch({
        type: "SET_OFFER_ARCHETYPES",
        archetypes: MOCK_OFFER_ARCHETYPES,
      });
    }
  }, [archetypes.length, dispatch]);

  const selectedArchetype = archetypes.find(
    (a) => a.id === selectedArchetypeId
  );

  useEffect(() => {
    if (selectedArchetype && !customName) {
      setCustomName(selectedArchetype.name);
    }
  }, [selectedArchetype, customName]);

  function handleConfirm() {
    dispatch({
      type: "CONFIGURE_OFFER",
      config: { meetingType, meetingLength, customName, exclusions },
    });
    const next = nextStep();
    if (next) router.push(stepRoutes[next]);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Offer Configuration
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          We&apos;ve ranked these offer types by fit with your ICP. Select one
          and configure it.
        </p>
      </div>

      <div className="space-y-4">
        {archetypes.map((archetype, i) => (
          <Card
            key={archetype.id}
            variant={
              selectedArchetypeId === archetype.id ? "selected" : "interactive"
            }
            onClick={() => {
              dispatch({ type: "SELECT_OFFER", archetypeId: archetype.id });
              setCustomName(archetype.name);
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{archetype.name}</h3>
                  {i === 0 && (
                    <span className="rounded-full bg-[var(--foreground)] px-2 py-0.5 text-[10px] font-medium text-[var(--background)]">
                      Best Fit
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {archetype.description}
                </p>
                {archetype.whyItFits && (
                  <p className="mt-2 text-xs text-[var(--foreground-muted)] italic">
                    Why it fits: {archetype.whyItFits}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                  <span>{archetype.meetingFormat}</span>
                </div>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedArchetypeId === archetype.id
                    ? "border-[var(--foreground)] bg-[var(--foreground)]"
                    : "border-[var(--border)]"
                }`}
              >
                {selectedArchetypeId === archetype.id && (
                  <span className="text-[10px] text-[var(--background)]">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedArchetype && (
        <div className="mt-8 space-y-6">
          <div className="border-t border-[var(--border)] pt-8">
            <h2 className="text-lg font-semibold">Customize Your Offer</h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Tailor the offer to your practice.
            </p>
          </div>

          <RadioCards
            label="Meeting Type"
            options={[
              { value: "in_person", label: "In-Person" },
              { value: "virtual", label: "Virtual" },
              { value: "phone", label: "Phone" },
            ]}
            value={meetingType}
            onChange={(v) => setMeetingType(v as "in_person" | "virtual" | "phone")}
          />

          <RadioCards
            label="Meeting Length"
            options={[
              { value: "30", label: "30 min" },
              { value: "45", label: "45 min" },
              { value: "60", label: "60 min" },
            ]}
            value={String(meetingLength)}
            onChange={(v) => setMeetingLength(Number(v) as 30 | 45 | 60)}
          />

          <Input
            label="Offer Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value.slice(0, 40))}
            hint="Optional override. 40 characters max."
            maxLength={40}
          />

          <ChipSelect
            label="Exclusions"
            options={EXCLUSION_OPTIONS}
            selected={exclusions}
            onToggle={(opt) =>
              setExclusions((prev) =>
                prev.includes(opt)
                  ? prev.filter((e) => e !== opt)
                  : [...prev, opt]
              )
            }
          />

          <Button onClick={handleConfirm}>Confirm Offer</Button>
        </div>
      )}
    </div>
  );
}
