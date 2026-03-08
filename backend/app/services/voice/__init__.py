"""Voice service — ElevenLabs API and advisor_voices DB."""
from app.services.voice.advisor_voices_db import (
    get_advisor_voice,
    list_advisor_voices,
    upsert_advisor_voice,
)
from app.services.voice.elevenlabs_voice import create_voice, list_voices, tts_preview

__all__ = [
    "create_voice",
    "list_voices",
    "tts_preview",
    "get_advisor_voice",
    "list_advisor_voices",
    "upsert_advisor_voice",
]
