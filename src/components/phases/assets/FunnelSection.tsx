"use client";

import { useState } from "react";
import type { Asset, FunnelSectionContent } from "@/lib/types";
import Card from "@/components/ui/Card";
import AssetActions from "./AssetActions";
import RevisionModal from "./RevisionModal";

interface FunnelSectionProps {
  asset: Asset;
  onStatusChange: (status: Asset["status"]) => void;
}

export default function FunnelSection({
  asset,
  onStatusChange,
}: FunnelSectionProps) {
  const [showRevision, setShowRevision] = useState(false);
  const content = asset.content as FunnelSectionContent;

  function handleRevisionSubmit() {
    setShowRevision(false);
    onStatusChange("revising");
    setTimeout(() => onStatusChange("draft"), 2000);
  }

  return (
    <Card
      className={
        asset.status === "removed"
          ? "opacity-40"
          : asset.status === "approved"
            ? "ring-1 ring-[var(--foreground)]"
            : ""
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{content.title}</h3>
            {content.required && (
              <span className="rounded bg-[var(--fill-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                Required
              </span>
            )}
          </div>
          <AssetActions
            status={asset.status}
            onApprove={() => onStatusChange("approved")}
            onRevise={() => setShowRevision(true)}
            onRemove={() => onStatusChange("removed")}
          />
        </div>

        <div className="rounded-[var(--radius)] bg-[var(--fill-subtle)] p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {content.body}
          </p>
        </div>

        {showRevision && (
          <RevisionModal
            onSubmit={handleRevisionSubmit}
            onCancel={() => setShowRevision(false)}
          />
        )}
      </div>
    </Card>
  );
}
