import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getApiBase } from "@/lib/utils";
import Sidebar, { type Conversation } from "./components/Sidebar";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";

export interface StreamPhase {
  phase: string;
  label: string;
}

function isStatusDataPart(
  part: unknown
): part is { type: "data-status"; data: StreamPhase } {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    part.type === "data-status" &&
    "data" in part &&
    typeof part.data === "object" &&
    part.data !== null &&
    "phase" in part.data &&
    "label" in part.data
  );
}

export default function AmplifyChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamPhase, setStreamPhase] = useState<StreamPhase | null>(null);
  const { dark, toggleTheme } = useTheme();

  const chatApiUrl = useMemo(() => {
    const base = getApiBase();
    return base ? `${base}/api/chat` : "/api/chat";
  }, []);
  const transport = useMemo(() => new DefaultChatTransport({ api: chatApiUrl }), [chatApiUrl]);
  const { messages, setMessages, sendMessage, status } = useChat({
    transport,
    onData: (part) => {
      if (isStatusDataPart(part)) {
        setStreamPhase(part.data);
      }
    },
    onFinish: () => {
      setStreamPhase(null);
    },
    onError: () => {
      setStreamPhase(null);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const ensureConversation = useCallback(
    (title: string) => {
      if (!activeConversationId) {
        const id = crypto.randomUUID();
        setActiveConversationId(id);
        setConversations((prev) => [
          { id, title: title.slice(0, 40), createdAt: new Date() },
          ...prev,
        ]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId && c.title === "New chat"
              ? { ...c, title: title.slice(0, 40) }
              : c
          )
        );
      }
    },
    [activeConversationId]
  );

  const startNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    setActiveConversationId(id);
    setMessages([]);
    setInput("");
    setStreamPhase(null);
    setConversations((prev) => [
      { id, title: "New chat", createdAt: new Date() },
      ...prev,
    ]);
  }, [setMessages]);

  const selectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      setMessages([]);
      setInput("");
      setStreamPhase(null);
    },
    [setMessages]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
        setInput("");
        setStreamPhase(null);
      }
    },
    [activeConversationId, setMessages]
  );

  const onSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    ensureConversation(text);
    setInput("");
    setStreamPhase(null);
    sendMessage({ text });
  }, [input, isLoading, ensureConversation, sendMessage]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        onNewChat={startNewChat}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />

      {sidebarCollapsed && (
        <div className="absolute left-3 top-3 z-10 flex gap-1">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex size-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-fill-subtle hover:text-foreground"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          <button
            onClick={startNewChat}
            className="flex size-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-fill-subtle hover:text-foreground"
            aria-label="New chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-fill-subtle hover:text-foreground"
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>

      <main className="flex min-w-0 flex-1 flex-col">
        {hasMessages ? (
          <>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              streamPhase={streamPhase}
            />
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <WelcomeScreen
            inputValue={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSubmit={onSubmit}
            onPrefill={setInput}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
