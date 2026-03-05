"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/app/amplify-os/lib/wizard-context";
import {
  MOCK_AD_CREATIVE,
  MOCK_AD_CREATIVE_ALT,
  MOCK_FUNNEL_SECTIONS,
  MOCK_SEQUENCES,
  MOCK_CALL_PREP,
} from "@/app/amplify-os/lib/mock-data";
import type { AssetCategory, Asset, AdCreativeContent, AssetStatus } from "@/app/amplify-os/lib/types";
import AdCreativeCard from "@/app/amplify-os/components/phases/assets/AdCreativeCard";
import FunnelSection from "@/app/amplify-os/components/phases/assets/FunnelSection";
import SequenceTimeline from "@/app/amplify-os/components/phases/assets/SequenceTimeline";
import CallPrepList from "@/app/amplify-os/components/phases/assets/CallPrepList";
import Button from "@/app/amplify-os/components/ui/Button";
import LoadingAnalysis from "@/app/amplify-os/components/ui/LoadingAnalysis";

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: "ad_creative", label: "Ad Creative" },
  { key: "funnel_copy", label: "Funnel Copy" },
  { key: "sequences", label: "Sequences" },
  { key: "call_prep", label: "Call Prep" },
];

export default function AssetsPage() {
  const router = useRouter();
  const { state, dispatch, nextStep, stepRoutes } = useWizard();
  const { activeCategory, adCreative, funnelCopy, sequences, callPrep, categoryStatus } =
    state.assets;
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (categoryStatus.ad_creative === "locked" && adCreative.length === 0) {
      setIsGenerating(true);
      dispatch({ type: "SET_CATEGORY_STATUS", category: "ad_creative", status: "generating" });
    }
  }, [categoryStatus.ad_creative, adCreative.length, dispatch]);

  const handleGenerationComplete = useCallback(() => {
    setIsGenerating(false);
    dispatch({ type: "SET_AD_CREATIVE", assets: [...MOCK_AD_CREATIVE] });
    dispatch({ type: "SET_FUNNEL_COPY", assets: [...MOCK_FUNNEL_SECTIONS] });
    dispatch({ type: "SET_SEQUENCES", sequences: MOCK_SEQUENCES.map(s => ({ ...s, messages: s.messages.map(m => ({ ...m })) })) });
    dispatch({ type: "SET_CALL_PREP", items: [...MOCK_CALL_PREP] });
    dispatch({ type: "SET_CATEGORY_STATUS", category: "ad_creative", status: "in_review" });
    dispatch({ type: "SET_CATEGORY_STATUS", category: "funnel_copy", status: "in_review" });
    dispatch({ type: "SET_CATEGORY_STATUS", category: "sequences", status: "in_review" });
    dispatch({ type: "SET_CATEGORY_STATUS", category: "call_prep", status: "in_review" });
  }, [dispatch]);

  function getApprovedCount(category: AssetCategory) {
    switch (category) {
      case "ad_creative":
        return adCreative.filter((a) => a.status === "approved").length;
      case "funnel_copy":
        return funnelCopy.filter((a) => a.status === "approved").length;
      case "sequences":
        return sequences.reduce(
          (count, seq) =>
            count + seq.messages.filter((m) => m.status === "approved").length,
          0
        );
      case "call_prep":
        return callPrep.filter((i) => i.status === "approved").length;
    }
  }

  function getTotalCount(category: AssetCategory) {
    switch (category) {
      case "ad_creative":
        return adCreative.length;
      case "funnel_copy":
        return funnelCopy.length;
      case "sequences":
        return sequences.reduce((count, seq) => count + seq.messages.length, 0);
      case "call_prep":
        return callPrep.length;
    }
  }

  function isCategoryComplete(category: AssetCategory) {
    const approved = getApprovedCount(category);
    switch (category) {
      case "ad_creative":
        return approved >= 2;
      case "funnel_copy": {
        const requiredApproved = funnelCopy
          .filter((a) => (a.content as { required: boolean }).required)
          .every((a) => a.status === "approved");
        return requiredApproved;
      }
      case "sequences":
        return sequences.every((seq) =>
          seq.messages.every(
            (m) => m.status === "approved" || m.status === "removed"
          )
        );
      case "call_prep":
        return callPrep.every(
          (i) => i.status === "approved" || i.status === "removed"
        );
    }
  }

  const allCategoriesComplete = CATEGORIES.every((c) =>
    isCategoryComplete(c.key)
  );

  function handleAdStatusChange(assetId: string, status: AssetStatus) {
    dispatch({ type: "UPDATE_ASSET_STATUS", category: "ad_creative", assetId, status });
  }

  function handleAdRevisionContent(assetId: string, content: AdCreativeContent) {
    const updated = adCreative.map((a) =>
      a.id === assetId
        ? { ...a, content, version: a.version + 1 }
        : a
    );
    dispatch({ type: "SET_AD_CREATIVE", assets: updated });
  }

  function handleFunnelStatusChange(assetId: string, status: AssetStatus) {
    dispatch({ type: "UPDATE_ASSET_STATUS", category: "funnel_copy", assetId, status });
  }

  if (isGenerating) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Asset Generation
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Generating your campaign assets from your firm profile, ICP, and offer.
        </p>
        <div className="mt-8 flex flex-col items-center">
          <LoadingAnalysis
            steps={[
              "Building ad creative variations...",
              "Writing funnel copy sections...",
              "Composing email & SMS sequences...",
              "Preparing call preparation kit...",
              "Running compliance checks...",
            ]}
            onComplete={handleGenerationComplete}
            stepDuration={700}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Asset Generation
        </h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          Review and refine your AI-generated campaign assets category by
          category.
        </p>
      </div>

      <div className="mb-8 flex gap-1 rounded-[var(--radius)] bg-[var(--fill-subtle)] p-1">
        {CATEGORIES.map((cat) => {
          const approved = getApprovedCount(cat.key);
          const total = getTotalCount(cat.key);
          const isActive = activeCategory === cat.key;
          const complete = isCategoryComplete(cat.key);

          return (
            <button
              key={cat.key}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_CATEGORY", category: cat.key })
              }
              className={`
                flex-1 rounded-[calc(var(--radius)-4px)] px-3 py-2 text-xs font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-[var(--surface)] shadow-[var(--shadow-sm)]"
                    : "hover:bg-[var(--surface)]/50"
                }
              `}
            >
              <span className={isActive ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}>
                {cat.label}
              </span>
              <span className="ml-1.5 text-[10px] text-[var(--foreground-muted)]">
                {complete ? "✓" : `${approved}/${total}`}
              </span>
            </button>
          );
        })}
      </div>

      {activeCategory === "ad_creative" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--foreground-muted)]">
              {getApprovedCount("ad_creative")}/{adCreative.length} approved
              {getApprovedCount("ad_creative") < 2 && (
                <span className="ml-1 text-xs">(need at least 2)</span>
              )}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {adCreative.map((asset) => (
              <AdCreativeCard
                key={asset.id}
                asset={asset}
                onStatusChange={(status) =>
                  handleAdStatusChange(asset.id, status)
                }
                onRevisionContent={(content) =>
                  handleAdRevisionContent(asset.id, content)
                }
                altContent={
                  MOCK_AD_CREATIVE_ALT[asset.id]
                }
              />
            ))}
          </div>
        </div>
      )}

      {activeCategory === "funnel_copy" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            {getApprovedCount("funnel_copy")}/{funnelCopy.length} sections
            approved
          </p>
          {funnelCopy.map((asset) => (
            <FunnelSection
              key={asset.id}
              asset={asset}
              onStatusChange={(status) =>
                handleFunnelStatusChange(asset.id, status)
              }
            />
          ))}
        </div>
      )}

      {activeCategory === "sequences" && (
        <div className="space-y-8">
          <p className="text-sm text-[var(--foreground-muted)]">
            {getApprovedCount("sequences")}/{getTotalCount("sequences")} messages
            approved
          </p>
          {sequences.map((seq) => (
            <SequenceTimeline
              key={seq.id}
              sequence={seq}
              onMessageStatusChange={(messageId, status) =>
                dispatch({
                  type: "UPDATE_SEQUENCE_MESSAGE_STATUS",
                  sequenceId: seq.id,
                  messageId,
                  status,
                })
              }
            />
          ))}
        </div>
      )}

      {activeCategory === "call_prep" && (
        <div>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {getApprovedCount("call_prep")}/{callPrep.length} items approved
          </p>
          <CallPrepList
            items={callPrep}
            onStatusChange={(itemId, status) =>
              dispatch({
                type: "UPDATE_CALL_PREP_STATUS",
                itemId,
                status,
              })
            }
          />
        </div>
      )}

      {allCategoriesComplete && (
        <div className="mt-8 border-t border-[var(--border)] pt-8">
          <Button onClick={() => {
            const next = nextStep();
            if (next) router.push(stepRoutes[next]);
          }} size="lg">
            Continue to Review
          </Button>
        </div>
      )}
    </div>
  );
}
