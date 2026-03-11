"""SendBlue API client for iMessage / SMS (Phase 1)."""

from app.services.sendblue.client import send_message as sendblue_send_message

__all__ = ["sendblue_send_message"]
