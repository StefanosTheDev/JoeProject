import { useState, useEffect, useCallback } from "react";
import { fetchContacts, fetchMessages, sendMessage } from "./api";
import type { Contact, Message } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function contactDisplayName(c: Contact): string {
  if (c.first_name || c.last_name) {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  }
  return c.email || c.phone || c.id.slice(0, 8);
}

function channelBadge(channel: string): string {
  if (channel === "imessage") return "iMessage";
  if (channel === "sms") return "SMS";
  return "Email";
}

export default function ConversationsInbox() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyChannel, setReplyChannel] = useState<"imessage" | "sms" | "email">("sms");
  const [replyText, setReplyText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContacts();
      setContacts(data.contacts);
      if (data.contacts.length > 0 && !selectedContact) {
        setSelectedContact(data.contacts[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [selectedContact]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMessages(selectedContact.id);
        if (!cancelled) setMessages(data.messages);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedContact]);

  const handleSend = async () => {
    if (!selectedContact || !replyText.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await sendMessage(selectedContact.id, replyChannel, replyText.trim());
      if (res.ok && res.message_id) {
        setReplyText("");
        setMessages((prev) => [
          ...prev,
          {
            id: res.message_id!,
            firm_id: selectedContact.firm_id,
            contact_id: selectedContact.id,
            channel: replyChannel,
            direction: "outbound",
            content: replyText.trim(),
            media_url: null,
            sendblue_handle: null,
            resend_email_id: null,
            status: "sent",
            read_at: null,
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setSendError(res.error ?? "Send failed");
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const canReplySms = selectedContact?.phone;
  const canReplyEmail = selectedContact?.email;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar: contact list */}
      <aside className="w-72 border-r flex flex-col bg-muted/30">
        <div className="p-3 border-b">
          <h1 className="font-semibold text-lg">Conversations</h1>
          <p className="text-muted-foreground text-sm">Inbox</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-3 text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="p-3 text-sm text-destructive">{error}</p>}
          {!loading && !error && contacts.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No contacts yet.</p>
          )}
          {!loading &&
            contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedContact(c)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50",
                  selectedContact?.id === c.id && "bg-muted"
                )}
              >
                <div className="font-medium truncate">{contactDisplayName(c)}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.email || c.phone || "—"}
                </div>
              </button>
            ))}
        </div>
      </aside>

      {/* Main: thread + compose */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedContact ? (
          <>
            <div className="p-3 border-b">
              <h2 className="font-semibold">{contactDisplayName(selectedContact)}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedContact.email && selectedContact.phone
                  ? `${selectedContact.email} · ${selectedContact.phone}`
                  : selectedContact.email || selectedContact.phone || "—"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.direction === "outbound" ? "justify-end" : "justify-start"
                  )}
                >
                  <Card
                    className={cn(
                      "max-w-[85%] px-3 py-2",
                      m.direction === "outbound"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="text-xs opacity-80 mb-0.5">
                      {channelBadge(m.channel)} · {m.direction}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </Card>
                </div>
              ))}
            </div>
            <div className="p-3 border-t space-y-2">
              {(canReplySms || canReplyEmail) && (
                <div className="flex gap-2 flex-wrap">
                  {canReplySms && (
                    <Button
                      type="button"
                      variant={replyChannel === "sms" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReplyChannel("sms")}
                    >
                      SMS
                    </Button>
                  )}
                  {canReplySms && (
                    <Button
                      type="button"
                      variant={replyChannel === "imessage" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReplyChannel("imessage")}
                    >
                      iMessage
                    </Button>
                  )}
                  {canReplyEmail && (
                    <Button
                      type="button"
                      variant={replyChannel === "email" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReplyChannel("email")}
                    >
                      Email
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !replyText.trim()}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
              {sendError && (
                <p className="text-sm text-destructive">{sendError}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a contact or add contacts via funnel/API.
          </div>
        )}
      </main>
    </div>
  );
}
