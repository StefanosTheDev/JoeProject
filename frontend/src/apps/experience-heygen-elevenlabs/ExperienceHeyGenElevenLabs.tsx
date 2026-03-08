import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";

const API_BASE = "/api/heygen";

// --- API response types ---
interface VerifyRes {
  ok: boolean;
  message?: string;
  error?: string;
  detail?: string;
  avatars_count?: number;
}
interface VoiceItem {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}
interface VoiceListRes {
  ok: boolean;
  voices: VoiceItem[];
  error?: string;
}
interface AvatarItem {
  avatar_id: string;
  avatar_name?: string;
  avatar_type?: string;
}
interface AvatarListRes {
  ok: boolean;
  avatars: AvatarItem[];
  error?: string;
}
interface TemplateItem {
  template_id: string;
  name?: string;
}
interface TemplateListRes {
  ok: boolean;
  templates: TemplateItem[];
  error?: string;
}
interface TemplateSchemaRes {
  ok: boolean;
  variables?: Record<string, unknown>;
  scenes?: unknown[];
  error?: string;
}
interface GenerateVideoRes {
  ok: boolean;
  video_id?: string;
  generated_video_id?: string;
  status?: string;
  error?: string;
}
interface VideoStatusRes {
  ok: boolean;
  video_id: string;
  status: string;
  video_url?: string;
  error?: string;
  detail?: string;
}

export default function ExperienceHeyGenElevenLabs() {
  const { dark, toggleTheme } = useTheme();
  const [firmId, setFirmId] = useState("");

  // Verify
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyRes | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // ElevenLabs voices
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [firmVoicesLoading, setFirmVoicesLoading] = useState(false);
  const [firmVoices, setFirmVoices] = useState<unknown[]>([]);
  const [createVoiceName, setCreateVoiceName] = useState("");
  const [createVoiceFile, setCreateVoiceFile] = useState<File | null>(null);
  const [createVoiceLoading, setCreateVoiceLoading] = useState(false);
  const [createVoiceResult, setCreateVoiceResult] = useState<{ ok: boolean; voice_id?: string; error?: string } | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState("");
  const [previewText, setPreviewText] = useState("Hello, this is a preview.");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Avatars
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [avatarsError, setAvatarsError] = useState<string | null>(null);
  const [firmAvatarsLoading, setFirmAvatarsLoading] = useState(false);
  const [firmAvatars, setFirmAvatars] = useState<unknown[]>([]);
  const [linkAvatarId, setLinkAvatarId] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResult, setLinkResult] = useState<{ ok: boolean; id?: string; detail?: string } | null>(null);

  // Templates
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [schemaTemplateId, setSchemaTemplateId] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaResult, setSchemaResult] = useState<TemplateSchemaRes | null>(null);

  // Video
  const [directScript, setDirectScript] = useState("");
  const [directTitle, setDirectTitle] = useState("");
  const [directLoading, setDirectLoading] = useState(false);
  const [directResult, setDirectResult] = useState<GenerateVideoRes | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState("{}");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateGenLoading, setTemplateGenLoading] = useState(false);
  const [templateGenResult, setTemplateGenResult] = useState<GenerateVideoRes | null>(null);
  const [pollVideoId, setPollVideoId] = useState("");
  const [pollLoading, setPollLoading] = useState(false);
  const [pollResult, setPollResult] = useState<VideoStatusRes | null>(null);

  const verifyConnection = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const r = await fetch(`${API_BASE}/verify`);
      const data: VerifyRes = await r.json();
      setVerifyResult(data);
      if (!r.ok) setVerifyError(data.error || data.detail || "Request failed");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Network error");
    } finally {
      setVerifyLoading(false);
    }
  };

  const listElevenLabsVoices = async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const r = await fetch(`${API_BASE}/voices/elevenlabs`);
      const data: VoiceListRes = await r.json();
      if (data.ok) setVoices(data.voices);
      else setVoicesError(data.error || "Failed");
    } catch (e) {
      setVoicesError(e instanceof Error ? e.message : "Network error");
    } finally {
      setVoicesLoading(false);
    }
  };

  const listFirmVoices = async () => {
    if (!firmId.trim()) return;
    setFirmVoicesLoading(true);
    try {
      const r = await fetch(`${API_BASE}/voices?firm_id=${encodeURIComponent(firmId.trim())}`);
      const data = await r.json();
      if (data.ok && Array.isArray(data.voices)) setFirmVoices(data.voices);
      else setFirmVoices([]);
    } catch {
      setFirmVoices([]);
    } finally {
      setFirmVoicesLoading(false);
    }
  };

  const createVoiceClone = async () => {
    if (!firmId.trim() || !createVoiceName.trim() || !createVoiceFile) return;
    setCreateVoiceLoading(true);
    setCreateVoiceResult(null);
    try {
      const form = new FormData();
      form.append("firm_id", firmId.trim());
      form.append("name", createVoiceName.trim());
      form.append("file", createVoiceFile);
      const r = await fetch(`${API_BASE}/voices`, { method: "POST", body: form });
      const data = await r.json();
      setCreateVoiceResult(data);
    } catch (e) {
      setCreateVoiceResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setCreateVoiceLoading(false);
    }
  };

  const previewTts = async () => {
    if (!previewVoiceId.trim() || !previewText.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewAudioUrl(null);
    try {
      const r = await fetch(
        `${API_BASE}/voices/preview?voice_id=${encodeURIComponent(previewVoiceId.trim())}&text=${encodeURIComponent(previewText.trim())}`
      );
      const data = await r.json();
      if (data.ok && data.audio_url) setPreviewAudioUrl(data.audio_url);
      else setPreviewError(data.error || "No audio");
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const listAvatars = async () => {
    setAvatarsLoading(true);
    setAvatarsError(null);
    try {
      const r = await fetch(`${API_BASE}/avatars`);
      const data: AvatarListRes = await r.json();
      if (data.ok) setAvatars(data.avatars);
      else setAvatarsError(data.error || "Failed");
    } catch (e) {
      setAvatarsError(e instanceof Error ? e.message : "Network error");
    } finally {
      setAvatarsLoading(false);
    }
  };

  const listFirmAvatars = async () => {
    if (!firmId.trim()) return;
    setFirmAvatarsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/avatars/firm?firm_id=${encodeURIComponent(firmId.trim())}`);
      const data = await r.json();
      if (data.ok && Array.isArray(data.avatars)) setFirmAvatars(data.avatars);
      else setFirmAvatars([]);
    } catch {
      setFirmAvatars([]);
    } finally {
      setFirmAvatarsLoading(false);
    }
  };

  const linkAvatar = async () => {
    if (!firmId.trim() || !linkAvatarId.trim()) return;
    setLinkLoading(true);
    setLinkResult(null);
    try {
      const r = await fetch(
        `${API_BASE}/avatars/link?firm_id=${encodeURIComponent(firmId.trim())}&heygen_avatar_id=${encodeURIComponent(linkAvatarId.trim())}&avatar_type=photo`,
        { method: "POST" }
      );
      const data = await r.json();
      if (r.ok && data.ok) setLinkResult(data);
      else setLinkResult({ ok: false, detail: data.detail || data.error || "Failed" });
    } catch (e) {
      setLinkResult({ ok: false, detail: e instanceof Error ? e.message : "Network error" });
    } finally {
      setLinkLoading(false);
    }
  };

  const listTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const r = await fetch(`${API_BASE}/templates`);
      const data: TemplateListRes = await r.json();
      if (data.ok) setTemplates(data.templates);
      else setTemplatesError(data.error || "Failed");
    } catch (e) {
      setTemplatesError(e instanceof Error ? e.message : "Network error");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const getSchema = async () => {
    if (!schemaTemplateId.trim()) return;
    setSchemaLoading(true);
    setSchemaResult(null);
    try {
      const r = await fetch(`${API_BASE}/templates/${encodeURIComponent(schemaTemplateId.trim())}/schema`);
      const data: TemplateSchemaRes = await r.json();
      setSchemaResult(data);
    } catch (e) {
      setSchemaResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setSchemaLoading(false);
    }
  };

  const generateDirectVideo = async () => {
    if (!firmId.trim() || !directScript.trim()) return;
    setDirectLoading(true);
    setDirectResult(null);
    try {
      const r = await fetch(`${API_BASE}/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm_id: firmId.trim(),
          script_text: directScript.trim(),
          test: true,
          caption: true,
          title: directTitle.trim() || undefined,
        }),
      });
      const data: GenerateVideoRes = await r.json();
      setDirectResult(data);
      if (data.video_id) setPollVideoId(data.video_id);
    } catch (e) {
      setDirectResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setDirectLoading(false);
    }
  };

  const generateTemplateVideo = async () => {
    if (!firmId.trim() || !templateId.trim()) return;
    setTemplateGenLoading(true);
    setTemplateGenResult(null);
    try {
      let variables: Record<string, unknown> = {};
      try {
        variables = JSON.parse(templateVariables || "{}");
      } catch {
        setTemplateGenResult({ ok: false, error: "Invalid JSON in variables" });
        setTemplateGenLoading(false);
        return;
      }
      const r = await fetch(`${API_BASE}/video/generate/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firm_id: firmId.trim(),
          template_id: templateId.trim(),
          variables,
          test: true,
          caption: true,
          title: templateTitle.trim() || undefined,
        }),
      });
      const data: GenerateVideoRes = await r.json();
      setTemplateGenResult(data);
      if (data.video_id) setPollVideoId(data.video_id);
    } catch (e) {
      setTemplateGenResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setTemplateGenLoading(false);
    }
  };

  const pollStatus = async () => {
    const vid = pollVideoId.trim();
    if (!vid) return;
    setPollLoading(true);
    setPollResult(null);
    try {
      const r = await fetch(`${API_BASE}/video/status?video_id=${encodeURIComponent(vid)}`);
      const data: VideoStatusRes = await r.json();
      setPollResult(data);
    } catch (e) {
      setPollResult({ ok: false, video_id: vid, status: "error", error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setPollLoading(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-6 top-6 flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-sm transition-colors hover:text-foreground"
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>

      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-foreground-muted underline hover:text-foreground">Back to App Hub</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Experience HeyGen & ElevenLabs</h1>
        <p className="mt-1 text-sm text-foreground-muted">Test video and voice integration. Backend must be running (e.g. port 8000).</p>

        <label className="mt-6 block">
          <span className="text-sm font-medium">Firm ID (for testing)</span>
          <input
            type="text"
            value={firmId}
            onChange={(e) => setFirmId(e.target.value)}
            placeholder="e.g. test_firm_1 or a real firm id from DB"
            className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-8 space-y-6">
          <Section title="1. Connection status (Verify HeyGen)">
            <button onClick={verifyConnection} disabled={verifyLoading} className="rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
              {verifyLoading ? "Loading…" : "Verify HeyGen connection"}
            </button>
            {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
            {verifyResult && (
              <div className="mt-2">
                <p className={`text-sm font-medium ${verifyResult.ok ? "text-green-600" : "text-red-600"}`}>
                  {verifyResult.ok ? "OK" : "Failed"}
                </p>
                {verifyResult.message && <p className="text-sm text-foreground-muted">{verifyResult.message}</p>}
                {verifyResult.error && <p className="text-sm text-foreground-muted">{verifyResult.error}</p>}
                {verifyResult.avatars_count != null && <p className="text-sm text-foreground-muted">Avatars count: {verifyResult.avatars_count}</p>}
              </div>
            )}
          </Section>

          <Section title="2. ElevenLabs — Voices">
            <div className="space-y-3">
              <div>
                <button onClick={listElevenLabsVoices} disabled={voicesLoading} className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">List ElevenLabs voices</button>
                <button onClick={listFirmVoices} disabled={!firmId.trim() || firmVoicesLoading} className="ml-2 rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">List firm voices</button>
              </div>
              {voicesError && <p className="text-sm text-red-600">{voicesError}</p>}
              {voices.length > 0 && (
                <ul className="max-h-40 overflow-auto rounded border border-border bg-surface p-2 text-sm">
                  {voices.map((v) => (
                    <li key={v.voice_id} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-xs">{v.voice_id}</span>
                      <span>{v.name}</span>
                      <button type="button" onClick={() => setPreviewVoiceId(v.voice_id)} className="text-xs underline">Use for preview</button>
                    </li>
                  ))}
                </ul>
              )}
              {firmVoices.length > 0 && (
                <p className="text-sm text-foreground-muted">Firm voices: {firmVoices.length} stored</p>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium">Create voice clone</p>
                <input type="text" value={createVoiceName} onChange={(e) => setCreateVoiceName(e.target.value)} placeholder="Voice name" className="mt-1 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <input type="file" accept="audio/mpeg,audio/wav,audio/mp4" onChange={(e) => setCreateVoiceFile(e.target.files?.[0] ?? null)} className="mt-2 block text-sm" />
                <button onClick={createVoiceClone} disabled={!firmId.trim() || !createVoiceName.trim() || !createVoiceFile || createVoiceLoading} className="mt-2 rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
                  {createVoiceLoading ? "Creating…" : "Create voice clone"}
                </button>
                {createVoiceResult && <p className={`mt-2 text-sm ${createVoiceResult.ok ? "text-green-600" : "text-red-600"}`}>{createVoiceResult.ok ? `Created: ${createVoiceResult.voice_id}` : createVoiceResult.error}</p>}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium">TTS preview</p>
                <input type="text" value={previewVoiceId} onChange={(e) => setPreviewVoiceId(e.target.value)} placeholder="Voice ID" className="mt-1 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <input type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Preview sentence" className="mt-2 block w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={previewTts} disabled={!previewVoiceId.trim() || !previewText.trim() || previewLoading} className="mt-2 rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">
                  {previewLoading ? "Loading…" : "Preview TTS"}
                </button>
                {previewError && <p className="mt-2 text-sm text-red-600">{previewError}</p>}
                {previewAudioUrl && <audio src={previewAudioUrl} controls className="mt-2 max-w-full" />}
              </div>
            </div>
          </Section>

          <Section title="3. HeyGen — Avatars">
            <div className="space-y-3">
              <div>
                <button onClick={listAvatars} disabled={avatarsLoading} className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">List HeyGen avatars</button>
                <button onClick={listFirmAvatars} disabled={!firmId.trim() || firmAvatarsLoading} className="ml-2 rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">List firm avatars</button>
              </div>
              {avatarsError && <p className="text-sm text-red-600">{avatarsError}</p>}
              {avatars.length > 0 && (
                <ul className="max-h-40 overflow-auto rounded border border-border bg-surface p-2 text-sm">
                  {avatars.map((a) => (
                    <li key={a.avatar_id} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-xs">{a.avatar_id}</span>
                      <span>{a.avatar_name ?? "—"}</span>
                      <button type="button" onClick={() => setLinkAvatarId(a.avatar_id)} className="text-xs underline">Link this</button>
                    </li>
                  ))}
                </ul>
              )}
              {firmAvatars.length > 0 && (
                <p className="text-sm text-foreground-muted">Firm avatars: {firmAvatars.length} linked</p>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium">Link avatar to firm</p>
                <input type="text" value={linkAvatarId} onChange={(e) => setLinkAvatarId(e.target.value)} placeholder="HeyGen avatar ID" className="mt-1 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={linkAvatar} disabled={!firmId.trim() || !linkAvatarId.trim() || linkLoading} className="mt-2 rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
                  {linkLoading ? "Linking…" : "Link avatar to firm"}
                </button>
                {linkResult && <p className={`mt-2 text-sm ${linkResult.ok ? "text-green-600" : "text-red-600"}`}>{linkResult.ok ? `Linked: ${linkResult.id}` : linkResult.detail}</p>}
              </div>
            </div>
          </Section>

          <Section title="4. HeyGen — Templates">
            <div className="space-y-3">
              <button onClick={listTemplates} disabled={templatesLoading} className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">List templates</button>
              {templatesError && <p className="text-sm text-red-600">{templatesError}</p>}
              {templates.length > 0 && (
                <ul className="max-h-40 overflow-auto rounded border border-border bg-surface p-2 text-sm">
                  {templates.map((t) => (
                    <li key={t.template_id} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-xs">{t.template_id}</span>
                      <span>{t.name ?? "—"}</span>
                      <button type="button" onClick={() => setSchemaTemplateId(t.template_id)} className="text-xs underline">Get schema</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-border pt-3">
                <input type="text" value={schemaTemplateId} onChange={(e) => setSchemaTemplateId(e.target.value)} placeholder="Template ID" className="rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={getSchema} disabled={!schemaTemplateId.trim() || schemaLoading} className="ml-2 rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">
                  {schemaLoading ? "Loading…" : "Get schema"}
                </button>
                {schemaResult && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded border border-border bg-surface p-2 text-xs">
                    {JSON.stringify({ variables: schemaResult.variables, scenes: schemaResult.scenes, error: schemaResult.error }, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </Section>

          <Section title="5. Video generation">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Direct video (Method 1)</p>
                <textarea value={directScript} onChange={(e) => setDirectScript(e.target.value)} placeholder="Script (max 5000 chars)" maxLength={5000} rows={3} className="mt-1 w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
                <p className="text-xs text-foreground-muted">{directScript.length} / 5000</p>
                <input type="text" value={directTitle} onChange={(e) => setDirectTitle(e.target.value)} placeholder="Title (optional)" className="mt-2 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={generateDirectVideo} disabled={!firmId.trim() || !directScript.trim() || directLoading} className="mt-2 rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
                  {directLoading ? "Submitting…" : "Generate direct video"}
                </button>
                {directResult && <p className={`mt-2 text-sm ${directResult.ok ? "text-green-600" : "text-red-600"}`}>{directResult.ok ? `Video ID: ${directResult.video_id}` : directResult.error}</p>}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium">Template video (Method 2)</p>
                <input type="text" value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="Template ID" className="mt-1 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <textarea value={templateVariables} onChange={(e) => setTemplateVariables(e.target.value)} placeholder='{"hook_script": {"name":"hook_script","type":"text","properties":{"content":"..."}}}' rows={4} className="mt-2 w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm" />
                <input type="text" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} placeholder="Title (optional)" className="mt-2 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={generateTemplateVideo} disabled={!firmId.trim() || !templateId.trim() || templateGenLoading} className="mt-2 rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
                  {templateGenLoading ? "Submitting…" : "Generate template video"}
                </button>
                {templateGenResult && <p className={`mt-2 text-sm ${templateGenResult.ok ? "text-green-600" : "text-red-600"}`}>{templateGenResult.ok ? `Video ID: ${templateGenResult.video_id}` : templateGenResult.error}</p>}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium">Poll video status</p>
                <input type="text" value={pollVideoId} onChange={(e) => setPollVideoId(e.target.value)} placeholder="Video ID" className="mt-1 rounded border border-border bg-surface px-3 py-2 text-sm" />
                <button onClick={pollStatus} disabled={!pollVideoId.trim() || pollLoading} className="mt-2 rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">
                  {pollLoading ? "Polling…" : "Poll status"}
                </button>
                {pollResult && (
                  <div className="mt-2">
                    <p className="text-sm">Status: <span className={pollResult.ok ? "text-green-600" : "text-red-600"}>{pollResult.status}</span></p>
                    {pollResult.video_url && (
                      <video src={pollResult.video_url} controls className="mt-2 max-w-full rounded border border-border" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
