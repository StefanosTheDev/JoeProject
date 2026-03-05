"use client";

import { useState } from "react";
import { REVISION_FEEDBACK_OPTIONS } from "@/app/amplify-os/lib/mock-data";
import Button from "@/app/amplify-os/components/ui/Button";

interface RevisionModalProps {
  onSubmit: (feedback: { types: string[]; note: string }) => void;
  onCancel: () => void;
}

export default function RevisionModal({ onSubmit, onCancel }: RevisionModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [note, setNote] = useState("");

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)]">
      <h4 className="text-sm font-semibold">What should change?</h4>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
        Select what to adjust and optionally add a note.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {REVISION_FEEDBACK_OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`
              rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200
              ${
                selectedTypes.includes(type)
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "border border-[var(--border)] hover:border-[var(--foreground-muted)]"
              }
            `}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <input
          type="text"
          placeholder="Optional note (100 chars max)"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          maxLength={100}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs placeholder:text-[var(--foreground-muted)] focus:border-[var(--foreground)] focus:outline-none"
        />
        <span className="mt-1 block text-right text-[10px] text-[var(--foreground-muted)]">
          {note.length}/100
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => onSubmit({ types: selectedTypes, note })}
          disabled={selectedTypes.length === 0}
        >
          Regenerate
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
