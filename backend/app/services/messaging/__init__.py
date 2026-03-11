"""Messaging DB and helpers — contacts, messages (Phase 1)."""

from app.services.messaging.db import (
    create_contact,
    get_contact,
    get_contact_by_phone_any_firm,
    list_contacts_by_firm,
    create_message,
    list_messages_by_contact,
    get_or_create_contact_by_phone,
    get_or_create_contact_by_email,
)

__all__ = [
    "create_contact",
    "get_contact",
    "get_contact_by_phone_any_firm",
    "list_contacts_by_firm",
    "create_message",
    "list_messages_by_contact",
    "get_or_create_contact_by_phone",
    "get_or_create_contact_by_email",
]
