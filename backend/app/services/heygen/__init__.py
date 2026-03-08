"""HeyGen + ElevenLabs service — verify, avatars, voices, templates, video generate, DB."""
from app.services.heygen.elevenlabs_voice import create_voice, list_voices, tts_preview
from app.services.heygen.heygen_client import (
    generate_direct_video,
    generate_from_template,
    get_template_schema,
    get_video_status,
    list_avatars,
    list_templates,
    verify_connection,
)
from app.services.heygen.heygen_db import (
    create_generated_video,
    get_advisor_avatar,
    get_advisor_voice,
    get_generated_video_by_heygen_id,
    list_advisor_avatars,
    list_advisor_voices,
    update_generated_video_status,
    upsert_advisor_avatar,
    upsert_advisor_voice,
)

__all__ = [
    "verify_connection",
    "list_avatars",
    "list_templates",
    "get_template_schema",
    "generate_direct_video",
    "generate_from_template",
    "get_video_status",
    "create_voice",
    "tts_preview",
    "list_voices",
    "get_advisor_voice",
    "list_advisor_voices",
    "upsert_advisor_voice",
    "get_advisor_avatar",
    "list_advisor_avatars",
    "upsert_advisor_avatar",
    "create_generated_video",
    "update_generated_video_status",
    "get_generated_video_by_heygen_id",
]
