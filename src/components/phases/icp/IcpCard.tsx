"use client";

import type { IcpProfile } from "@/lib/types";
import Card from "@/components/ui/Card";

interface IcpCardProps {
  profile: IcpProfile;
}

export default function IcpCard({ profile }: IcpCardProps) {
  return (
    <Card padding="lg">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{profile.personaLabel}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile.status === "locked"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--fill-subtle)] text-[var(--foreground-muted)]"
              }`}
            >
              {profile.status === "locked" ? "Locked" : "Draft"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {profile.lifeStage}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              Age Range
            </h4>
            <p className="mt-1 text-sm font-medium">
              {profile.ageRange[0]}–{profile.ageRange[1]} years
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              Asset Band
            </h4>
            <p className="mt-1 text-sm font-medium">{profile.assetBand}</p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Primary Concern
          </h4>
          <p className="mt-1 text-sm font-medium">{profile.primaryConcern}</p>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Secondary Concerns
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.secondaryConcerns.map((c) => (
              <span
                key={c}
                className="rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-xs"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Emotional Triggers
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.emotionalTriggers.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Common Objections
          </h4>
          <ul className="mt-1.5 space-y-1">
            {profile.objections.map((o) => (
              <li key={o} className="text-sm text-[var(--foreground-muted)]">
                &ldquo;{o}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Recommended Tone
          </h4>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-[var(--foreground-muted)]">
              Conservative
            </span>
            <div className="relative h-1.5 flex-1 rounded-full bg-[var(--border)]">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[var(--foreground)]"
                style={{ width: `${profile.toneSetting}%` }}
              />
            </div>
            <span className="text-xs text-[var(--foreground-muted)]">
              Conversational
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
