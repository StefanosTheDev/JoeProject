import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { getApiBase } from "@/lib/utils";

const getVoicesApiBase = () => `${getApiBase()}/api/voices`;

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

export default function VoicesPage() {
  const { dark, toggleTheme } = useTheme();
  const [firmId, setFirmId] = useState("");

  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [firmVoicesLoading, setFirmVoicesLoading] = useState(false);
  const [firmVoices, setFirmVoices] = useState<VoiceItem[]>([]);
  const [createVoiceName, setCreateVoiceName] = useState("");
  const [createVoiceFile, setCreateVoiceFile] = useState<File | null>(null);
  const [createVoiceLoading, setCreateVoiceLoading] = useState(false);
  const [createVoiceResult, setCreateVoiceResult] = useState<{ ok: boolean; voice_id?: string; error?: string } | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState("");
  const [previewText, setPreviewText] = useState("Hello, this is a preview.");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const listElevenLabsVoices = async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const r = await fetch(`${getVoicesApiBase()}/elevenlabs`);
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
      const r = await fetch(`${getVoicesApiBase()}/firm?firm_id=${encodeURIComponent(firmId.trim())}`);
      const data: VoiceListRes = await r.json();
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
      const r = await fetch(`${getVoicesApiBase()}/`, { method: "POST", body: form });
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
        `${getVoicesApiBase()}/preview?voice_id=${encodeURIComponent(previewVoiceId.trim())}&text=${encodeURIComponent(previewText.trim())}`
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Voices — Bring your own voice</h1>
        <p className="mt-1 text-sm text-foreground-muted">ElevenLabs voice clone and TTS preview. Backend must be running (e.g. port 8000).</p>

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
          <Section title="1. ElevenLabs voices">
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
            </div>
          </Section>

          <Section title="2. Create voice clone">
            <div className="space-y-3">
              <input type="text" value={createVoiceName} onChange={(e) => setCreateVoiceName(e.target.value)} placeholder="Voice name" className="rounded border border-border bg-surface px-3 py-2 text-sm" />
              <input type="file" accept="audio/mpeg,audio/wav,audio/mp4" onChange={(e) => setCreateVoiceFile(e.target.files?.[0] ?? null)} className="block text-sm" />
              <button onClick={createVoiceClone} disabled={!firmId.trim() || !createVoiceName.trim() || !createVoiceFile || createVoiceLoading} className="rounded bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">
                {createVoiceLoading ? "Creating…" : "Create voice clone"}
              </button>
              {createVoiceResult && <p className={`text-sm ${createVoiceResult.ok ? "text-green-600" : "text-red-600"}`}>{createVoiceResult.ok ? `Created: ${createVoiceResult.voice_id}` : createVoiceResult.error}</p>}
            </div>
          </Section>

          <Section title="3. TTS preview">
            <div className="space-y-3">
              <input type="text" value={previewVoiceId} onChange={(e) => setPreviewVoiceId(e.target.value)} placeholder="Voice ID" className="block w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              <input type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Preview sentence" className="block w-full rounded border border-border bg-surface px-3 py-2 text-sm" />
              <button onClick={previewTts} disabled={!previewVoiceId.trim() || !previewText.trim() || previewLoading} className="rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50">
                {previewLoading ? "Loading…" : "Preview TTS"}
              </button>
              {previewError && <p className="text-sm text-red-600">{previewError}</p>}
              {previewAudioUrl && <audio src={previewAudioUrl} controls className="mt-2 max-w-full" />}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
