# HeyGen + ElevenLabs API — curl smoke tests

Run the backend first: `cd backend && uvicorn app.main:app --reload --port 8000`

Base URL: `http://localhost:8000/api`

---

## 1. GET /heygen/verify (no body, no DB)

Verifies HeyGen API key is set and valid.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/verify"
```

**Expect:** 200, JSON with `ok` (true if key valid, false if missing/invalid).

---

## 2. GET /heygen/avatars (HeyGen API, no DB)

Lists avatars from HeyGen account.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/avatars"
```

**Expect:** 200, `{"ok": true, "avatars": [...]}` or `{"ok": false, "error": "..."}`.

---

## 3. GET /heygen/avatars/firm?firm_id=X (DB)

Lists advisor avatars stored for a firm. Requires DB.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/avatars/firm?firm_id=test_firm_1"
```

**Expect:** 200 and `{"ok": true, "avatars": [...]}` or 503 if DB unavailable.

---

## 4. POST /heygen/avatars/link (DB)

Links a HeyGen avatar to a firm. Requires DB and a real `heygen_avatar_id` from step 2.

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/heygen/avatars/link?firm_id=test_firm_1&heygen_avatar_id=AVATAR_ID_FROM_STEP_2&avatar_type=photo"
```

**Expect:** 200 and `{"ok": true, "id": "..."}` or 503 if DB unavailable.

---

## 5. GET /heygen/voices/elevenlabs (ElevenLabs API)

Lists all voices from ElevenLabs account.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/voices/elevenlabs"
```

**Expect:** 200, `{"ok": true, "voices": [...]}` or `{"ok": false, "error": "..."}`.

---

## 6. GET /heygen/voices?firm_id=X (DB)

Lists advisor voices stored for a firm. Requires DB.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/voices?firm_id=test_firm_1"
```

**Expect:** 200 and `{"ok": true, "voices": [...]}` or 503 if DB unavailable.

---

## 7. GET /heygen/voices/preview (ElevenLabs TTS)

TTS preview for a voice. Use a `voice_id` from step 5.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/voices/preview?voice_id=VOICE_ID&text=Hello%2C%20this%20is%20a%20preview."
```

**Expect:** 200, `{"ok": true, "audio_url": "data:audio/mpeg;base64,..."}` or error.

---

## 8. POST /heygen/voices (multipart — voice clone, DB)

Creates voice clone and stores in DB. Requires DB and an audio file.

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/heygen/voices" \
  -F "firm_id=test_firm_1" \
  -F "name=Test Voice" \
  -F "file=@/path/to/voice_sample.mp3"
```

**Expect:** 200 and `{"ok": true, "voice_id": "..."}` or 400/503.

---

## 9. GET /heygen/templates (HeyGen API)

Lists available templates.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/templates"
```

**Expect:** 200, `{"ok": true, "templates": [...]}` or `{"ok": false, "error": "..."}`.

---

## 10. GET /heygen/templates/{template_id}/schema

Variable schema for a template. Use a `template_id` from step 9.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/templates/TEMPLATE_ID/schema"
```

**Expect:** 200, `{"ok": true, "variables": {...}, "scenes": [...]}` or 200 with `ok: false` if template not found.

---

## 11. POST /heygen/video/generate (direct, DB)

Direct avatar video. Requires DB with linked avatar + voice for `firm_id`.

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/heygen/video/generate" \
  -H "Content-Type: application/json" \
  -d '{"firm_id": "test_firm_1", "script_text": "Hello, this is a test.", "test": true}'
```

**Expect:** 200 and `{"ok": true, "video_id": "...", "status": "pending"}` or 400 if no avatar/voice, 503 if no DB.

---

## 12. POST /heygen/video/generate/template (DB)

Template-based video. Requires valid `template_id` and `variables` matching schema.

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/heygen/video/generate/template" \
  -H "Content-Type: application/json" \
  -d '{"firm_id": "test_firm_1", "template_id": "TEMPLATE_ID", "variables": {}, "test": true}'
```

**Expect:** 200 with `video_id` or 400/503.

---

## 13. GET /heygen/video/status?video_id=X

Poll video status. Use `video_id` from step 11 or 12.

```bash
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/heygen/video/status?video_id=VIDEO_ID"
```

**Expect:** 200, `{"ok": true, "video_id": "...", "status": "pending"|"processing"|"completed"|"failed", "video_url": null|"..."}`.

---

## Quick run-all (no POST /voices file)

```bash
BASE="http://localhost:8000/api"
echo "=== 1. verify ===" && curl -s "$BASE/heygen/verify" | head -c 200 && echo ""
echo "=== 2. avatars ===" && curl -s "$BASE/heygen/avatars" | head -c 200 && echo ""
echo "=== 3. avatars/firm ===" && curl -s "$BASE/heygen/avatars/firm?firm_id=f1" | head -c 200 && echo ""
echo "=== 5. voices/elevenlabs ===" && curl -s "$BASE/heygen/voices/elevenlabs" | head -c 200 && echo ""
echo "=== 6. voices?firm_id ===" && curl -s "$BASE/heygen/voices?firm_id=f1" | head -c 200 && echo ""
echo "=== 9. templates ===" && curl -s "$BASE/heygen/templates" | head -c 200 && echo ""
```
