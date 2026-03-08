"""Resend API client for email (Phase 1)."""

from app.services.resend.client import send_email as resend_send_email

__all__ = ["resend_send_email"]
