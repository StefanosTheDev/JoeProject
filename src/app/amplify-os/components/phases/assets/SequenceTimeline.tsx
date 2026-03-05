"use client";

import { useState } from "react";
import type { Sequence, AssetStatus } from "@/app/amplify-os/lib/types";
import AssetActions from "./AssetActions";
import RevisionModal from "./RevisionModal";

interface SequenceTimelineProps {
  sequence: Sequence;
  onMessageStatusChange: (messageId: string, status: AssetStatus) => void;
}

export default function SequenceTimeline({
  sequence,
  onMessageStatusChange,
}: SequenceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revisingId, setRevisingId] = useState<string | null>(null);

  function handleRevisionSubmit(messageId: string) {
    setRevisingId(null);
    onMessageStatusChange(messageId, "revising");
    setTimeout(() => onMessageStatusChange(messageId, "draft"), 2000);
  }

  return (
    <div className="space-y-1">
      <h3 className="mb-3 text-sm font-semibold">{sequence.name}</h3>
      <p className="mb-4 text-xs text-[var(--foreground-muted)]">
        {sequence.description}
      </p>

      <div className="relative pl-6">
        <div className="absolute left-[9px] top-0 bottom-0 w-px bg-[var(--border)]" />

        {sequence.messages.map((msg) => {
          const isExpanded = expandedId === msg.id;

          return (
            <div key={msg.id} className="relative mb-4 last:mb-0">
              <div
                className={`absolute left-[-18px] top-1.5 h-3 w-3 rounded-full border-2 transition-colors ${
                  msg.status === "approved"
                    ? "border-[var(--foreground)] bg-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--background)]"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : msg.id)
                }
                className="w-full text-left"
              >
                <div
                  className={`rounded-[var(--radius)] border p-3 transition-all duration-200 ${
                    msg.status === "approved"
                      ? "border-[var(--foreground)] bg-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--foreground-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[var(--foreground-muted)]">
                      {msg.timing}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        msg.type === "email"
                          ? "bg-[var(--fill-subtle)]"
                          : "bg-[var(--foreground)] text-[var(--background)]"
                      }`}
                    >
                      {msg.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {msg.subject || msg.body.slice(0, 60) + "..."}
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--fill-subtle)] p-4">
                  <p className="whitespace-pre-line text-xs leading-relaxed">
                    {msg.body}
                  </p>
                  <div className="flex justify-end">
                    <AssetActions
                      status={msg.status}
                      onApprove={() =>
                        onMessageStatusChange(msg.id, "approved")
                      }
                      onRevise={() => setRevisingId(msg.id)}
                      onRemove={() =>
                        onMessageStatusChange(msg.id, "removed")
                      }
                    />
                  </div>
                  {revisingId === msg.id && (
                    <RevisionModal
                      onSubmit={() => handleRevisionSubmit(msg.id)}
                      onCancel={() => setRevisingId(null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
