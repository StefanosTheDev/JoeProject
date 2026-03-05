"use client";

import type { ChangeEvent } from "react";
import ChatInput from "./ChatInput";

interface WelcomeScreenProps {
  inputValue: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function WelcomeScreen({
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-3xl font-medium tracking-tight text-foreground">
        Ready when you are.
      </h1>
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        centered
      />
    </div>
  );
}
