"use client";

import { useState } from "react";
import type { Asset, AdCreativeContent } from "@/lib/types";
import Card from "@/components/ui/Card";
import AssetActions from "./AssetActions";
import RevisionModal from "./RevisionModal";

interface AdCreativeCardProps {
  asset: Asset;
  onStatusChange: (status: Asset["status"]) => void;
  onRevisionContent: (content: AdCreativeContent) => void;
  altContent?: AdCreativeContent;
}

export default function AdCreativeCard({
  asset,
  onStatusChange,
  onRevisionContent,
  altContent,
}: AdCreativeCardProps) {
  const [showRevision, setShowRevision] = useState(false);
  const content = asset.content as AdCreativeContent;

  function handleRevise() {
    setShowRevision(true);
  }

  function handleRevisionSubmit() {
    setShowRevision(false);
    onStatusChange("revising");

    setTimeout(() => {
      if (altContent) {
        onRevisionContent(altContent);
      }
      onStatusChange("draft");
    }, 2000);
  }

  return (
    <Card
      className={
        asset.status === "removed" ? "opacity-40" : asset.status === "approved" ? "ring-1 ring-[var(--foreground)]" : ""
      }
    >
      <div className="space-y-3">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--fill-subtle)] p-4">
          <p className="text-sm font-semibold leading-snug">{content.hook}</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--foreground-muted)]">
            {content.primaryText}
          </p>
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <p className="text-xs font-semibold">{content.headline}</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">
              {content.description}
            </p>
            <div className="mt-2">
              <span className="inline-block rounded-[var(--radius)] bg-[var(--foreground)] px-3 py-1 text-[10px] font-medium text-[var(--background)]">
                {content.cta}
              </span>
            </div>
          </div>
          {content.disclaimer && (
            <p className="mt-2 text-[9px] text-[var(--foreground-muted)] italic">
              {content.disclaimer}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--foreground-muted)]">
            v{asset.version}
          </span>
          <AssetActions
            status={asset.status}
            onApprove={() => onStatusChange("approved")}
            onRevise={handleRevise}
            onRemove={() => onStatusChange("removed")}
          />
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
