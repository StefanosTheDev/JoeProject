export interface Contact {
  id: string;
  firm_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  imessage_capable: boolean | null;
  source: string | null;
  utm_data: Record<string, unknown>;
  tags: string[];
  pipeline_stage: string;
  calendly_invitee_uri: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  firm_id: string;
  contact_id: string;
  channel: "imessage" | "sms" | "email";
  direction: "inbound" | "outbound";
  content: string;
  media_url: string | null;
  sendblue_handle: string | null;
  resend_email_id: string | null;
  status: string;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
}
