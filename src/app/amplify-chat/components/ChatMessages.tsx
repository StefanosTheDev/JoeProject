"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
      <span className="text-xs font-bold">A</span>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fill-subtle text-foreground-muted">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      aria-label="Copy message"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      Copy
    </button>
  );
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {messages.map((msg) => {
          const text = getTextContent(msg);
          return (
            <div
              key={msg.id}
              className={`group mb-6 flex gap-4 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && <AssistantAvatar />}
              <div
                className={`max-w-[85%] ${
                  msg.role === "user"
                    ? "rounded-2xl bg-fill-subtle px-4 py-3"
                    : "min-w-0 flex-1"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {text}
                  </p>
                ) : (
                  <div className="prose-sm prose-neutral max-w-none text-foreground [&_code]:rounded [&_code]:bg-fill-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-fill-subtle [&_pre]:p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                  </div>
                )}
                {msg.role === "assistant" && <CopyButton text={text} />}
              </div>
              {msg.role === "user" && <UserAvatar />}
            </div>
          );
        })}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="mb-6 flex gap-4">
              <AssistantAvatar />
              <div className="flex items-center gap-1 pt-2">
                <span className="size-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:0ms]" />
                <span className="size-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:150ms]" />
                <span className="size-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:300ms]" />
              </div>
            </div>
          )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
