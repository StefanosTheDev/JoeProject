"use client";

import type { AssetStatus } from "@/lib/types";

interface AssetActionsProps {
  status: AssetStatus;
  onApprove: () => void;
  onRevise: () => void;
  onRemove: () => void;
}

export default function AssetActions({
  status,
  onApprove,
  onRevise,
  onRemove,
}: AssetActionsProps) {
  if (status === "approved") {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-xs font-medium text-[var(--background)]">
          <span>✓</span> Approved
        </span>
        <button
          onClick={onRevise}
          className="text-xs text-[var(--foreground-muted)] underline hover:text-[var(--foreground)]"
        >
          Undo
        </button>
      </div>
    );
  }

  if (status === "removed") {
    return (
      <span className="rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)] line-through">
        Removed
      </span>
    );
  }

  if (status === "revising") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[var(--fill-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)]">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--foreground-muted)]" />
        Revising...
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onApprove}
        className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      >
        <span>✓</span> Approve
      </button>
      <button
        onClick={onRevise}
        className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium transition-colors hover:border-[var(--foreground-muted)] hover:bg-[var(--fill-subtle)]"
      >
        <span>✎</span> Revise
      </button>
      <button
        onClick={onRemove}
        className="flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  );
}
