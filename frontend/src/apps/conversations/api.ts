import type {
  Contact,
  ContactListResponse,
  MessageListResponse,
} from "./types";

const API = "/api";

function getDefaultFirmId(): string {
  return import.meta.env.VITE_DEFAULT_FIRM_ID ?? "default";
}

export async function fetchContacts(
  firmId?: string,
  limit = 50,
  offset = 0
): Promise<ContactListResponse> {
  const firm = firmId ?? getDefaultFirmId();
  const r = await fetch(
    `${API}/messaging/contacts?firm_id=${encodeURIComponent(firm)}&limit=${limit}&offset=${offset}`
  );
  if (!r.ok) throw new Error("Failed to fetch contacts");
  return r.json();
}

export async function fetchContact(contactId: string): Promise<Contact> {
  const r = await fetch(`${API}/messaging/contacts/${contactId}`);
  if (!r.ok) throw new Error("Failed to fetch contact");
  return r.json();
}

export async function fetchMessages(
  contactId: string,
  limit = 100,
  offset = 0
): Promise<MessageListResponse> {
  const r = await fetch(
    `${API}/messaging/contacts/${contactId}/messages?limit=${limit}&offset=${offset}`
  );
  if (!r.ok) throw new Error("Failed to fetch messages");
  return r.json();
}

export async function sendMessage(
  contactId: string,
  channel: "imessage" | "sms" | "email",
  content: string,
  options?: { from_number?: string; from_email?: string; subject?: string }
): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const r = await fetch(`${API}/messaging/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_id: contactId,
      channel,
      content,
      from_number: options?.from_number,
      from_email: options?.from_email,
      subject: options?.subject,
    }),
  });
  return r.json();
}
