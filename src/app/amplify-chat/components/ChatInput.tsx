"use client";

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  centered?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  centered = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSubmit();
    }
  }

  return (
    <div className={centered ? "w-full px-4" : "w-full bg-background px-4 pb-6 pt-2"}>
      <div className="mx-auto flex max-w-[680px] items-end gap-2 rounded-full border border-border bg-surface px-5 py-3 shadow-sm transition-shadow focus-within:shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="mb-0.5 size-5 shrink-0 text-foreground-muted">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          className="max-h-[200px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-foreground-muted"
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-20"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {!centered && (
        <p className="mx-auto mt-2 max-w-[680px] text-center text-[11px] text-foreground-muted">
          Amplify Chat can make mistakes. Verify important information.
        </p>
      )}
    </div>
  );
}
