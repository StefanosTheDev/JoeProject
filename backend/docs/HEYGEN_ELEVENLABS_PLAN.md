# HeyGen + ElevenLabs Integration — Lockstep Plan & Testing

**Source of truth:** `HeyGen_ElevenLabs_Technical_Integration_Guide.docx.md`  
**Goal:** Build in lockstep with the guide; every deliverable has a clear testing requirement.

---

## Status legend

| Status | Meaning |
|--------|--------|
| ✅ Done | Implemented and tests passing (or manual test steps verified) |
| 🔄 In progress | Implemented; tests or manual verification pending |
| ⬜ Not started | Not yet implemented |

---

## 1. Architecture Overview (Guide §1)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| HeyGen base URL `https://api.heygen.com` | ✅ Done | `heygen_client.HEYGEN_API_BASE` | N/A (constant) |
| ElevenLabs base URL `https://api.elevenlabs.io` | ✅ Done | `elevenlabs_voice.ELEVENLABS_API_BASE` | N/A (constant) |
| Request flow: OS retrieves avatar_id + voice_id from DB | ✅ Done | Router resolves via `get_advisor_avatar`, `get_advisor_voice` before generate | **Test:** Unit or integration test that generate endpoint returns 400 when firm has no avatar/voice |
| Request flow: Template schema → map script → generate | ✅ Done | `get_template_schema` + `generate_from_template` with variables | **Test:** E2E or manual: get schema for a template_id, then POST generate with matching variables |
| Request flow: Poll status until completed | ✅ Done | `get_video_status` + optional DB update | **Test:** Manual or integration: poll until status=completed; verify DB row updated |
| Request flow: Download and store video (our storage) | ⬜ Not started | Not implemented | **Test:** When implemented: assert file in blob/storage after completion |

---

## 2. Authentication (Guide §2)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| HeyGen: API Key in header `X-Api-Key` | ✅ Done | `heygen_client._headers()` | **Test:** `GET /api/heygen/verify` returns 200 and `ok: true` when key set; `ok: false` when key missing |
| HeyGen: Key from env, not in code | ✅ Done | `config.heygen_api_key` from `HEYGEN_API_KEY` | **Test:** Verify no key in repo; .env.example documents HEYGEN_API_KEY |
| ElevenLabs: API Key in header `xi-api-key` | ✅ Done | `elevenlabs_voice._headers()` | **Test:** `POST /api/heygen/voices` with invalid/missing key returns error; with valid key + file returns voice_id or 4xx from API |
| ElevenLabs: Key from env | ✅ Done | `config.elevenlabs_api_key` from `ELEVENLABS_API_KEY` | **Test:** Same as above; env documented |

**Automated test (required):**  
- `tests/test_heygen_auth.py`: TestClient GET `/api/heygen/verify` with mocked or real key; assert response shape and ok/error behavior.

---

## 3. ElevenLabs — Voice Cloning (Guide §3)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| Step 1: Record voice sample (30–60 s) | ⬜ Frontend | Browser MediaRecorder; OS provides paragraph | **Test:** Manual: record in Growth OS, obtain MP3/WAV |
| Step 2: POST /v1/voices/add (multipart) | ✅ Done | `elevenlabs_voice.create_voice()` | **Test:** Unit: mock httpx; assert POST to correct URL, headers include xi-api-key, form has name + files. Integration: real POST with small audio file (or VCR cassette) |
| Step 2: Params name, files, description, labels, remove_background_noise | ✅ Done | All passed in `create_voice()` | **Test:** Unit test payload shape |
| Step 2: Store voice_id in advisor_voices by firm_id | ✅ Done | Router calls `upsert_advisor_voice` after create | **Test:** Integration: create voice → GET /api/heygen/voices?firm_id=X → assert voice present |
| Step 3: TTS preview POST /v1/text-to-speech/{voice_id} | ✅ Done | `elevenlabs_voice.tts_preview()` | **Test:** Unit: mock response returns 200 + bytes; assert response has audio_url (base64). Manual: call /heygen/voices/preview, play audio |
| Step 3: Params text, model_id, voice_settings (stability, similarity_boost) | ✅ Done | In `tts_preview()` | **Test:** Unit test request body shape |
| Step 4: GET /v1/voices to list/filter | ✅ Done | `list_voices()` + GET /api/heygen/voices/elevenlabs | **Test:** Manual or integration: list returns non-empty when account has voices |

**Automated tests (required):**  
- `tests/test_elevenlabs_voice.py`: Mock httpx for create_voice and tts_preview; assert URLs, headers, and response parsing (voice_id, audio_url).

---

## 4. HeyGen — Avatar Creation (Guide §4)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| Path A — Photo Avatar: POST /v1/asset (upload photo) | ⬜ Not started | Not implemented | **Test:** When built: POST with image file → asset_id in response |
| Path A: POST /v1/photo_avatar/generate | ⬜ Not started | Not implemented | **Test:** When built: generate from asset_id → avatar_id |
| Path A: POST /v1/photo_avatar/train (optional) | ⬜ Not started | Not implemented | **Test:** Optional; manual if built |
| Path B — Digital Twin: POST /v2/video_avatar | ⬜ Not started | Not implemented | **Test:** When built: submit training + consent URLs → avatar_id; poll GET /v2/video_avatar/{id} |
| Path B: Poll GET /v2/video_avatar/{avatar_id} | ⬜ Not started | Not implemented | **Test:** When built: assert status in_progress → complete/failed |
| List avatars: GET /v2/avatars | ✅ Done | `list_avatars()` + GET /api/heygen/avatars | **Test:** GET /api/heygen/avatars returns ok and list (possibly empty) |
| Store avatar_id in advisor_avatars | ✅ Done | POST /api/heygen/avatars/link + `upsert_advisor_avatar` | **Test:** Link avatar → GET /api/heygen/avatars/firm?firm_id=X → assert row |

**Automated tests (required):**  
- `tests/test_heygen_avatars.py`: Mock list_avatars response; test GET /api/heygen/avatars and GET /api/heygen/avatars/firm (with DB fixture or mock).

---

## 5. Video Generation — Two Methods (Guide §5)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| Method 1 — Direct: POST /v2/video/generate | ✅ Done | `generate_direct_video()` | **Test:** Unit: mock HeyGen 200 with video_id; assert request body has video_inputs, dimension, voice.voice_id. Integration: test mode, real call, then poll status |
| Method 1: Params avatar_id, voice_id, input_text, dimension, caption, title, test, elevenlabs_settings, background | ✅ Done | All in `generate_direct_video()` | **Test:** Unit test body shape; 5,000 char limit on script |
| Method 1 (optional): POST /v2/video/av4/generate | ⬜ Not started | Use av4 when available | **Test:** When added: same as Method 1, different path |
| Method 2 — Template: GET /v2/templates | ✅ Done | `list_templates()` + GET /api/heygen/templates | **Test:** GET /api/heygen/templates returns ok and list |
| Method 2: GET /v3/template/{id} (schema) | ✅ Done | `get_template_schema()` + GET /api/heygen/templates/{id}/schema | **Test:** GET schema for valid template_id returns variables + scenes |
| Method 2: POST /v2/template/{id}/generate with variables | ✅ Done | `generate_from_template()` + POST /api/heygen/video/generate/template | **Test:** Unit: mock 200 with video_id; assert variables in body. Manual: real template_id + variables |
| Create generated_videos row on submit | ✅ Done | `create_generated_video()` in router | **Test:** After generate, query DB for row with heygen_video_id |
| Update generated_videos on status=completed | ✅ Done | `update_generated_video_status()` when polling with update_db=true | **Test:** Integration: poll until completed, then assert row has video_url and completed_at |

**Automated tests (required):**  
- `tests/test_heygen_video.py`: Mock generate_direct_video and get_video_status; test POST /api/heygen/video/generate returns video_id and 400 when firm has no avatar/voice. Mock generate_from_template and test POST /api/heygen/video/generate/template.

---

## 6. Video Status, Retrieval & Webhooks (Guide §6)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| Poll GET /v1/video_status.get?video_id= | ✅ Done | `get_video_status()` + GET /api/heygen/video/status | **Test:** Unit: mock pending then completed with video_url; assert response status and video_url. Manual: real video_id, poll until completed |
| Handle statuses: pending, waiting, processing, completed, failed | ✅ Done | Response includes status and video_url when completed | **Test:** Unit test parsing for each status |
| Download and store on completion (7-day expiry) | ⬜ Not started | Not implemented | **Test:** When implemented: on completed, download from video_url and PUT to blob/storage; assert stored URL in generated_videos |
| Webhooks: avatar_video.success / .fail / .progress | ⬜ Not started | Not implemented | **Test:** When implemented: POST to webhook URL, assert DB update and idempotency |

**Automated tests (required):**  
- `tests/test_heygen_status.py`: Mock get_video_status returning pending, then completed with video_url; test GET /api/heygen/video/status and optional DB update.

---

## 7. Video Agent (Guide §7)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| POST /v1/video_agent/generate (one-prompt) | ⬜ Not started | Future feature | **Test:** When built: POST with prompt → video_id; optional |

---

## 8. MCP Server (Guide §8)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| HeyGen MCP / OAuth | ⬜ Not started | Future | N/A for current scope |

---

## 9. Database Tables (Guide §9)

| Table | Status | Implementation | Testing requirement |
|-------|--------|----------------|----------------------|
| advisor_avatars | ✅ Done | schema.sql + heygen_db | **Test:** Migration runs; insert/select via service; unique active per firm |
| advisor_voices | ✅ Done | schema.sql + heygen_db | **Test:** Migration runs; insert/select; unique active per firm |
| video_templates | ✅ Done | schema.sql | **Test:** Migration runs; seed or admin fill later |
| generated_videos | ✅ Done | schema.sql + heygen_db | **Test:** Migration runs; create_generated_video, update_generated_video_status |
| video_generation_log | ✅ Done | schema.sql only | **Test:** Migration runs; logging calls TBD |

**Automated tests (required):**  
- `tests/test_heygen_db.py`: With test DB or in-memory SQLite (if possible) or asyncpg fixture: test upsert_advisor_voice, get_advisor_voice, list_advisor_voices; upsert_advisor_avatar, list_advisor_avatars; create_generated_video, update_generated_video_status. If full DB not in CI, document manual migration test.

---

## 10. Rate Limits, Costs & Gotchas (Guide §10)

| Deliverable | Status | Implementation | Testing requirement |
|-------------|--------|----------------|----------------------|
| Script text max 5,000 chars | ✅ Done | Pydantic max_length on GenerateDirectVideoBody.script_text | **Test:** POST with script length 5001 returns 422 |
| test: true for dev (no credits) | ✅ Done | Body.test default True in models | **Test:** Default in schema; manual verification |
| 429 / exponential backoff | ⬜ Not started | Not implemented | **Test:** When implemented: mock 429, assert retry with backoff |
| Video URL 7-day expiry note | ✅ Doc | In plan and guide | N/A |

---

## Test execution summary

| Test type | Where | When to run |
|-----------|--------|-------------|
| Unit (mocked HTTP) | `tests/test_heygen_*.py`, `tests/test_elevenlabs_*.py` | Every commit / CI |
| Integration (real DB, optional real API) | Same or `tests/integration/` | Pre-merge or nightly; env with test keys |
| Manual / E2E | Checklist in this doc | Before release; verify with real HeyGen/ElevenLabs accounts |

**Minimum to consider “in lockstep”:**  
- All “Automated tests (required)” bullets implemented and passing for the sections marked ✅ Done.  
- When adding a new section (e.g. Photo Avatar API), add the corresponding tests to this plan and implement them in the same PR.

---

## How to run tests

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest tests/ -v
```

HeyGen-only: `pytest tests/test_heygen_auth.py tests/test_heygen_*.py -v`

---

## Changelog

- **2026-03:** Initial plan; sections 1–6 and 9–10 mapped; testing requirements added. Photo Avatar, Digital Twin, download-on-complete, webhooks, Video Agent, MCP left as Not started.
- **2026-03:** Automated tests added per plan: `test_heygen_auth.py` (§2), `test_heygen_video.py` (§5, §10 — 400 no avatar/voice, 422 script 5k, mock success), `test_heygen_avatars.py` (§4), `test_heygen_status.py` (§6), `test_elevenlabs_voice.py` (§3). Run from `backend/`: `pip install -r requirements-dev.txt && pytest tests/ -v`.
