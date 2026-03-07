
import { useState } from "react";
import type { CallPrepItem, AssetStatus } from "@/pages/amplify-os/lib/types";
import Card from "@/pages/amplify-os/components/ui/Card";
import AssetActions from "./AssetActions";
import RevisionModal from "./RevisionModal";

interface CallPrepListProps {
  items: CallPrepItem[];
  onStatusChange: (itemId: string, status: AssetStatus) => void;
}

const TYPE_LABELS: Record<string, string> = {
  question: "Discovery Question",
  agenda: "Meeting Agenda",
  rebuttal: "Objection Rebuttal",
  script: "Closing Script",
};

export default function CallPrepList({
  items,
  onStatusChange,
}: CallPrepListProps) {
  const [revisingId, setRevisingId] = useState<string | null>(null);

  function handleRevisionSubmit(itemId: string) {
    setRevisingId(null);
    onStatusChange(itemId, "revising");
    setTimeout(() => onStatusChange(itemId, "draft"), 2000);
  }

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, CallPrepItem[]>
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([type, typeItems]) => (
        <div key={type}>
          <h3 className="mb-3 text-sm font-semibold">
            {TYPE_LABELS[type] || type}s
          </h3>
          <div className="space-y-3">
            {typeItems.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                className={
                  item.status === "approved"
                    ? "ring-1 ring-[var(--foreground)]"
                    : item.status === "removed"
                      ? "opacity-40"
                      : ""
                }
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--fill-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                          {TYPE_LABELS[item.type]}
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-medium">
                        {item.title}
                      </h4>
                    </div>
                    <AssetActions
                      status={item.status}
                      onApprove={() => onStatusChange(item.id, "approved")}
                      onRevise={() => setRevisingId(item.id)}
                      onRemove={() => onStatusChange(item.id, "removed")}
                    />
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--foreground-muted)]">
                    {item.content}
                  </p>
                  {revisingId === item.id && (
                    <RevisionModal
                      onSubmit={() => handleRevisionSubmit(item.id)}
                      onCancel={() => setRevisingId(null)}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
