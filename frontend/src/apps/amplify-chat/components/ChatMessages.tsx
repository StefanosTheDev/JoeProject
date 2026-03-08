import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StreamPhase } from "../AmplifyChat";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  streamPhase: StreamPhase | null;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-1 flex size-6 items-center justify-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      aria-label="Copy message"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

interface ParsedSource {
  title: string;
  url: string;
}

function splitSources(text: string): { body: string; sources: ParsedSource[] } {
  const sourcesMatch = text.match(
    /\n*\*{0,2}Sources:?\*{0,2}\s*\n([\s\S]*?)$/i
  );
  if (!sourcesMatch) return { body: text, sources: [] };

  const body = text.slice(0, sourcesMatch.index).trimEnd();
  const sourcesBlock = sourcesMatch[1];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sources: ParsedSource[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(sourcesBlock)) !== null) {
    sources.push({ title: match[1], url: match[2] });
  }
  return { body, sources };
}

function SourcePills({ sources }: { sources: ParsedSource[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-foreground-muted">
        Sources
      </span>
      {sources.map((src) => (
        <a
          key={src.url}
          href={src.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-fill-subtle px-3 py-1.5 text-xs font-medium text-foreground no-underline transition-colors hover:bg-fill-subtle/80"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M10 13v4" />
            <path d="M14 13v4" />
            <path d="M10 17h4" />
          </svg>
          {src.title}
        </a>
      ))}
    </div>
  );
}

function StreamingText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const displayedTextRef = useRef("");
  const latestTextRef = useRef(text);
  const isStreamingRef = useRef(isStreaming);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    latestTextRef.current = text;
    isStreamingRef.current = isStreaming;

    if (!isStreaming || text.length < displayedTextRef.current.length) {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      displayedTextRef.current = text;
      setDisplayedText(text);
      return;
    }

    if (animationFrameRef.current !== null) {
      return;
    }

    const tick = () => {
      const targetText = latestTextRef.current;
      const currentText = displayedTextRef.current;

      if (currentText.length < targetText.length) {
        const remaining = targetText.length - currentText.length;
        const stepSize =
          remaining > 160 ? 20 : remaining > 80 ? 12 : remaining > 24 ? 6 : 3;
        const nextText = targetText.slice(0, currentText.length + stepSize);

        displayedTextRef.current = nextText;
        setDisplayedText(nextText);
      }

      if (
        displayedTextRef.current.length < latestTextRef.current.length ||
        isStreamingRef.current
      ) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, [isStreaming, text]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {displayedText}
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-current align-[-2px] opacity-50" />
      )}
    </p>
  );
}

function StreamStatus({ phase }: { phase: StreamPhase }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-fill-subtle px-3 py-1.5 text-xs font-medium text-foreground-muted">
      <span className="flex items-center gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-70" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-50 [animation-delay:120ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-current opacity-40 [animation-delay:240ms]" />
      </span>
      <span>{phase.label}</span>
    </div>
  );
}

export default function ChatMessages({
  messages,
  isLoading,
  streamPhase,
}: ChatMessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const end = endRef.current;
    if (!container || !end) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 160;

    if (!isNearBottom && isLoading) {
      return;
    }

    end.scrollIntoView({ behavior: isLoading ? "auto" : "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {messages.map((msg) => {
          const text = getTextContent(msg);
          const parsed =
            msg.role === "assistant" ? splitSources(text) : null;
          const isStreamingMessage =
            msg.role === "assistant" &&
            isLoading &&
            messages[messages.length - 1]?.id === msg.id;

          return (
            <div
              key={msg.id}
              className={`group mb-8 flex ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[75%] rounded-xl bg-fill-subtle px-3.5 py-2.5"
                    : "max-w-[85%]"
                }
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {text}
                  </p>
                ) : (
                  <>
                    {isStreamingMessage && streamPhase && (
                      <StreamStatus phase={streamPhase} />
                    )}
                    {isStreamingMessage ? (
                      <StreamingText text={parsed!.body} isStreaming={isStreamingMessage} />
                    ) : (
                      <div className="prose-sm prose-neutral max-w-none text-foreground [&_code]:rounded [&_code]:bg-fill-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-fill-subtle [&_pre]:p-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 transition-colors hover:text-foreground-muted"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {parsed!.body}
                        </ReactMarkdown>
                      </div>
                    )}
                    {!isStreamingMessage && parsed!.sources.length > 0 && (
                      <SourcePills sources={parsed!.sources} />
                    )}
                  </>
                )}
                {msg.role === "assistant" && <CopyButton text={text} />}
              </div>
            </div>
          );
        })}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="mb-8">
              {streamPhase ? (
                <StreamStatus phase={streamPhase} />
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-fill-subtle px-3 py-1.5 text-xs font-medium text-foreground-muted">
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  <span>Thinking</span>
                </div>
              )}
            </div>
          )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
