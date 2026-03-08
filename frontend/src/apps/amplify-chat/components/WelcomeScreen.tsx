import type { ChangeEvent } from "react";
import ChatInput from "./ChatInput";

interface WelcomeScreenProps {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onPrefill: (text: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "What is the Theory of Threes?",
  "Help me craft an ICP offer",
  "How do I build trust assets?",
];

export default function WelcomeScreen({
  inputValue,
  onInputChange,
  onSubmit,
  onPrefill,
  isLoading,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-10 text-2xl font-normal tracking-tight text-foreground">
        What can I help with?
      </h1>
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        centered
      />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPrefill(s)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-fill-subtle hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
