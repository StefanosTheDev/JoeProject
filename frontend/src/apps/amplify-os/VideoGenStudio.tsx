import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeProvider";

// ── Types ──

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

type WizardStep = "avatar" | "voice" | "generate";

interface WizardStepData {
  id: WizardStep;
  label: string;
  description: string;
}

// ── Data ──

const WIZARD_STEPS: WizardStepData[] = [
  { id: "avatar", label: "Create Avatar", description: "Upload photos or video to build your AI avatar" },
  { id: "voice", label: "Clone Voice", description: "Record 30 seconds of your voice for AI cloning" },
  { id: "generate", label: "Generate Videos", description: "Preview and generate your first AI videos" },
];

// ── Component ──

export default function VideoGenStudio(): React.JSX.Element {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const [activeStep, setActiveStep] = useState<WizardStep>("avatar");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

  // Avatar state
  const [avatarFiles, setAvatarFiles] = useState<File[]>([]);
  const [avatarDragging, setAvatarDragging] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Welcome to the Video Generation Studio. I'll help you set up your AI avatar and voice clone. Start by uploading photos or a short video of yourself." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What kind of photos work best?",
    "How long should my voice recording be?",
    "Can I re-record my voice later?",
    "What video formats do you support?",
    "How long does generation take?",
  ];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiThinking]);

  // Clean up recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, []);

  function handleChatSend(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setChatInput("");
    setAiThinking(true);

    setTimeout(() => {
      setAiThinking(false);
      const lower = msg.toLowerCase();
      let reply = "Great question. Let me think about that based on your setup and get back to you with a detailed answer.";
      if (lower.includes("photo")) {
        reply = "For best results, upload 5-10 clear, well-lit photos of yourself from different angles. Avoid sunglasses, hats, or heavy filters. A short 15-second video of you talking naturally works even better than photos alone.";
      } else if (lower.includes("voice") || lower.includes("record")) {
        reply = "You'll need about 30 seconds of clear speech. Read the provided script naturally — don't rush. Speak in a quiet room without background noise. You can re-record as many times as you need before finalizing.";
      } else if (lower.includes("format")) {
        reply = "We support MP4, MOV, and WebM for video, and JPG, PNG, and HEIC for photos. Files should be under 100MB each. For best quality, use 1080p or higher resolution.";
      } else if (lower.includes("long") || lower.includes("time") || lower.includes("generat")) {
        reply = "Initial avatar generation takes about 5-10 minutes. After that, each video you generate typically takes 2-3 minutes. The first batch of videos will be ready for review in your Content Studio.";
      }
      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 1500);
  }

  function handleAvatarDrop(e: React.DragEvent) {
    e.preventDefault();
    setAvatarDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setAvatarFiles((prev) => [...prev, ...files]);
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAvatarFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function completeAvatarStep() {
    setCompletedSteps((prev) => new Set(prev).add("avatar"));
    setActiveStep("voice");
    setChatMessages((prev) => [...prev, {
      sender: "ai",
      text: `Great — ${avatarFiles.length} file${avatarFiles.length === 1 ? "" : "s"} uploaded for your avatar. Now let's clone your voice. Click "Start Recording" and read the script for about 30 seconds.`,
    }]);
  }

  function startRecording() {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 30) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    setVoiceRecorded(true);
  }

  function completeVoiceStep() {
    setCompletedSteps((prev) => new Set(prev).add("voice"));
    setActiveStep("generate");
    setChatMessages((prev) => [...prev, {
      sender: "ai",
      text: "Voice clone captured. Your AI avatar and voice are ready. Hit \"Generate Videos\" to create your first batch of AI-powered content.",
    }]);
  }

  function handleGenerate() {
    setCompletedSteps((prev) => new Set(prev).add("generate"));
    setChatMessages((prev) => [...prev, {
      sender: "ai",
      text: "Your videos are being generated. This typically takes 5-10 minutes for the first batch. You'll be able to review and approve them in the Content Studio.",
    }]);
    setTimeout(() => navigate("/amplify-os/content-studio"), 3000);
  }

  const activeStepIdx = WIZARD_STEPS.findIndex((s) => s.id === activeStep);
  const totalComplete = completedSteps.size;

  return (
    <div className="vs-root">
      <style>{`
        .vs-root {
          min-height: 100vh;
          background: var(--app-bg);
          color: var(--app-text);
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .vs-header {
          border-bottom: 1px solid var(--app-border);
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--app-bg);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .vs-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vs-logo {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--app-text);
          color: var(--app-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .vs-header-title {
          font-size: 14px;
          font-weight: 600;
        }
        .vs-header-sub {
          font-size: 12px;
          color: var(--app-text-muted);
        }
        .vs-back-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--app-border-hover);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vs-back-btn:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
        }

        /* ── Layout ── */
        .vs-layout {
          display: flex;
          height: calc(100vh - 61px);
          overflow: hidden;
        }

        /* ── Left Sidebar (Wizard) ── */
        .vs-wizard {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid var(--app-border);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          background: var(--app-bg);
          overflow-y: auto;
        }
        .vs-wizard-title {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .vs-wizard-heading {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        .vs-wizard-progress {
          margin-bottom: 24px;
        }
        .vs-wizard-progress-bar {
          width: 100%;
          height: 3px;
          background: var(--app-border);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .vs-wizard-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa, #50e3c2);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .vs-wizard-progress-label {
          font-size: 11px;
          color: var(--app-text-dim);
        }

        /* ── Wizard Steps ── */
        .vs-wizard-steps {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .vs-wizard-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .vs-wizard-step:hover {
          background: rgba(237,237,237,0.02);
        }
        .vs-wizard-step--active {
          background: rgba(96,165,250,0.04);
          border-color: rgba(96,165,250,0.12);
        }
        .vs-wizard-step--completed {
          opacity: 0.7;
        }
        .vs-wizard-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--app-border-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.2s;
          font-size: 11px;
          font-weight: 600;
          color: var(--app-text-dim);
        }
        .vs-wizard-step-dot--active {
          border-color: #60a5fa;
          background: rgba(96,165,250,0.1);
          color: #60a5fa;
        }
        .vs-wizard-step-dot--completed {
          border-color: #50e3c2;
          background: #50e3c2;
          color: var(--app-bg);
        }
        .vs-wizard-step-label {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .vs-wizard-step-desc {
          font-size: 11px;
          color: var(--app-text-dim);
          line-height: 1.4;
        }

        /* ── Why This Matters ── */
        .vs-wizard-context {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid var(--app-border);
        }
        .vs-wizard-context-title {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .vs-wizard-context-text {
          font-size: 12px;
          color: var(--app-text-muted);
          line-height: 1.6;
        }

        /* ── Main Content ── */
        .vs-content {
          flex: 1;
          overflow-y: auto;
          padding: 40px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .vs-content-inner {
          max-width: 580px;
          width: 100%;
        }
        .vs-step-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #60a5fa;
          background: rgba(96,165,250,0.1);
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 14px;
        }
        .vs-step-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .vs-step-subtitle {
          font-size: 13px;
          color: var(--app-text-muted);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        /* ── Upload Zone ── */
        .vs-upload-zone {
          border: 2px dashed var(--app-border-hover);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .vs-upload-zone:hover {
          border-color: var(--app-border-hover);
          background: rgba(237,237,237,0.02);
        }
        .vs-upload-zone--dragging {
          border-color: #60a5fa;
          background: rgba(96,165,250,0.04);
        }
        .vs-upload-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(96,165,250,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #60a5fa;
        }
        .vs-upload-text {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .vs-upload-sub {
          font-size: 12px;
          color: var(--app-text-dim);
        }

        /* ── File List ── */
        .vs-files {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 24px;
        }
        .vs-file {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          font-size: 13px;
        }
        .vs-file-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(80,227,194,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #50e3c2;
        }
        .vs-file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vs-file-size {
          font-size: 11px;
          color: var(--app-text-dim);
          flex-shrink: 0;
        }
        .vs-file-remove {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--app-text-dim);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .vs-file-remove:hover {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }

        /* ── Recording ── */
        .vs-record-zone {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 16px;
          padding: 40px 32px;
          text-align: center;
          margin-bottom: 20px;
        }
        .vs-record-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vs-record-icon--idle {
          background: rgba(239,68,68,0.08);
          border: 2px solid rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .vs-record-icon--active {
          background: rgba(239,68,68,0.15);
          border: 2px solid #ef4444;
          color: #ef4444;
          animation: vs-pulse 1.5s ease infinite;
        }
        .vs-record-icon--done {
          background: rgba(80,227,194,0.1);
          border: 2px solid rgba(80,227,194,0.3);
          color: #50e3c2;
        }
        @keyframes vs-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
        .vs-record-timer {
          font-size: 32px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .vs-record-label {
          font-size: 13px;
          color: var(--app-text-muted);
          margin-bottom: 20px;
        }
        .vs-record-script {
          background: var(--app-bg);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          padding: 16px 20px;
          margin-top: 20px;
          text-align: left;
        }
        .vs-record-script-title {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .vs-record-script-text {
          font-size: 13px;
          color: var(--app-text-secondary);
          line-height: 1.7;
          font-style: italic;
        }

        /* ── Generate ── */
        .vs-generate-zone {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
        }
        .vs-generate-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(96,165,250,0.1), rgba(80,227,194,0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .vs-generate-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .vs-generate-sub {
          font-size: 13px;
          color: var(--app-text-muted);
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .vs-generate-checklist {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          max-width: 320px;
          margin: 0 auto 28px;
        }
        .vs-generate-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .vs-generate-check-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #50e3c2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Buttons ── */
        .vs-btn-primary {
          padding: 12px 28px;
          border-radius: 10px;
          border: none;
          background: var(--app-text);
          color: var(--app-bg);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .vs-btn-primary:hover {
          background: #d4d4d4;
        }
        .vs-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .vs-btn-secondary {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--app-border-hover);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .vs-btn-secondary:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
        }
        .vs-btn-record {
          padding: 12px 28px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
        }
        .vs-btn-record--start {
          background: #ef4444;
          color: white;
        }
        .vs-btn-record--start:hover {
          background: #dc2626;
        }
        .vs-btn-record--stop {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
        }
        .vs-btn-record--stop:hover {
          background: rgba(239,68,68,0.15);
        }

        /* ── Chat Sidebar ── */
        .vs-chat {
          width: 380px;
          flex-shrink: 0;
          border-left: 1px solid var(--app-border);
          display: flex;
          flex-direction: column;
          background: var(--app-bg);
        }
        .vs-chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--app-border);
          flex-shrink: 0;
        }
        .vs-chat-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vs-chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--app-text);
          color: var(--app-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .vs-chat-title {
          font-size: 13px;
          font-weight: 600;
        }
        .vs-chat-status {
          font-size: 11px;
          color: #50e3c2;
        }
        .vs-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vs-chat-messages::-webkit-scrollbar { width: 4px; }
        .vs-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .vs-chat-messages::-webkit-scrollbar-thumb { background: var(--app-border-subtle); border-radius: 2px; }
        .vs-chat-msg {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          animation: vs-fade-in 0.3s ease;
        }
        .vs-chat-msg--user { justify-content: flex-end; }
        .vs-chat-msg--ai { justify-content: flex-start; }
        .vs-chat-msg-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--app-text);
          color: var(--app-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .vs-chat-bubble {
          max-width: 85%;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .vs-chat-bubble--ai {
          background: var(--app-border-subtle);
          color: var(--app-text);
          border: 1px solid var(--app-border);
          border-radius: 14px 14px 14px 4px;
        }
        .vs-chat-bubble--user {
          background: var(--app-text);
          color: var(--app-bg);
          border-radius: 14px 14px 4px 14px;
        }
        .vs-chat-prompts {
          padding: 4px 0;
        }
        .vs-chat-prompts-label {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
          margin-bottom: 10px;
          padding-left: 2px;
        }
        .vs-chat-prompt {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 8px;
          border: 1px solid var(--app-border);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .vs-chat-prompt:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
          background: var(--app-surface);
        }
        .vs-chat-input-wrap {
          padding: 14px 16px;
          border-top: 1px solid var(--app-border);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .vs-chat-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--app-border-hover);
          background: var(--app-surface);
          color: var(--app-text);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }
        .vs-chat-input:focus { border-color: var(--app-border-hover); }
        .vs-chat-input::placeholder { color: var(--app-text-dim); }
        .vs-chat-send {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--app-text-dim);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .vs-chat-send--active {
          background: var(--app-text);
          color: var(--app-bg);
        }
        .vs-chat-send--active:hover { background: #d4d4d4; }

        /* ── Thinking dots ── */
        .vs-chat-thinking { padding: 12px 18px !important; }
        .vs-thinking-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .vs-thinking-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--app-text-dim);
          animation: vs-dot-bounce 1.2s infinite;
        }
        .vs-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .vs-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes vs-dot-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }

        @keyframes vs-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Page entrance ── */
        .vs-page-enter .vs-header {
          animation: vs-appear 1.4s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.3s;
        }
        .vs-page-enter .vs-layout {
          animation: vs-appear 1.6s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.6s;
        }
        @keyframes vs-appear {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .vs-content-appear {
          animation: vs-fade-in 0.4s ease both;
        }
      `}</style>

      <div className="vs-page-enter">

      {/* Header */}
      <header className="vs-header">
        <div className="vs-header-left">
          <div className="vs-logo">A</div>
          <div>
            <div className="vs-header-title">Video Generation Studio</div>
            <div className="vs-header-sub">Set Up Your AI Video Profile</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme} style={{ background: "transparent", border: "1px solid var(--app-border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "var(--app-text-secondary)", display: "flex", alignItems: "center" }}>
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button className="vs-back-btn" onClick={() => navigate("/amplify-os/webinar-builder")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back to Webinar Builder
          </button>
          <button onClick={() => navigate("/")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px dashed var(--app-text-dim)", background: "transparent", color: "var(--app-text-secondary)", fontSize: 11, cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }} title="Skip to App Hub">Skip &rsaquo;</button>
        </div>
      </header>

      <div className="vs-layout">

      {/* ── Left Sidebar: Wizard ── */}
      <aside className="vs-wizard">
        <div className="vs-wizard-title">Video Setup</div>
        <div className="vs-wizard-heading">AI Video Profile</div>

        <div className="vs-wizard-progress">
          <div className="vs-wizard-progress-bar">
            <div className="vs-wizard-progress-fill" style={{ width: `${(totalComplete / 3) * 100}%` }} />
          </div>
          <div className="vs-wizard-progress-label">{totalComplete} of 3 steps complete</div>
        </div>

        <div className="vs-wizard-steps">
          {WIZARD_STEPS.map((step, i) => {
            const isCompleted = completedSteps.has(step.id);
            const isActive = activeStep === step.id;
            return (
              <div
                key={step.id}
                className={`vs-wizard-step ${isActive ? "vs-wizard-step--active" : ""} ${isCompleted && !isActive ? "vs-wizard-step--completed" : ""}`}
                onClick={() => {
                  if (isCompleted || isActive) setActiveStep(step.id);
                }}
              >
                <div className={`vs-wizard-step-dot ${isActive ? "vs-wizard-step-dot--active" : ""} ${isCompleted ? "vs-wizard-step-dot--completed" : ""}`}>
                  {isCompleted ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div>
                  <div className="vs-wizard-step-label">{step.label}</div>
                  <div className="vs-wizard-step-desc">
                    {isCompleted ? "Completed" : isActive ? "In progress" : "Up next"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="vs-wizard-context">
          <div className="vs-wizard-context-title">Why This Matters</div>
          <div className="vs-wizard-context-text">
            {activeStep === "avatar"
              ? "Your AI avatar will represent you in all generated video content — ads, webinar intros, and appointment confirmation videos. The more reference material you provide, the more natural it looks."
              : activeStep === "voice"
              ? "Voice cloning captures your unique speaking style, tone, and cadence. This means every video sounds like you — not a generic AI voice. Clients hear you before they ever meet you."
              : "Once your avatar and voice are set up, we generate your first batch of videos based on your approved Marketing Blueprint — ad scripts, webinar clips, and confirmation videos."
            }
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="vs-content">
        <div className="vs-content-inner vs-content-appear" key={activeStep}>

          {/* STEP: AVATAR */}
          {activeStep === "avatar" && (
            <>
              <div className="vs-step-badge">Step 1 of 3</div>
              <div className="vs-step-title">Create Your Avatar</div>
              <div className="vs-step-subtitle">
                Upload clear photos or a short video of yourself. We'll use these to build your AI avatar for all video content.
              </div>

              <div
                className={`vs-upload-zone ${avatarDragging ? "vs-upload-zone--dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setAvatarDragging(true); }}
                onDragLeave={() => setAvatarDragging(false)}
                onDrop={handleAvatarDrop}
                onClick={() => document.getElementById("vs-file-input")?.click()}
              >
                <input
                  id="vs-file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarSelect}
                />
                <div className="vs-upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div className="vs-upload-text">
                  {avatarDragging ? "Drop files here" : "Drag & drop photos or video"}
                </div>
                <div className="vs-upload-sub">or click to browse · JPG, PNG, HEIC, MP4, MOV</div>
              </div>

              {avatarFiles.length > 0 && (
                <div className="vs-files">
                  {avatarFiles.map((f, i) => (
                    <div key={i} className="vs-file">
                      <div className="vs-file-icon">
                        {f.type.startsWith("video/") ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        )}
                      </div>
                      <span className="vs-file-name">{f.name}</span>
                      <span className="vs-file-size">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button className="vs-file-remove" onClick={() => setAvatarFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="vs-btn-primary"
                  disabled={avatarFiles.length === 0}
                  onClick={completeAvatarStep}
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </>
          )}

          {/* STEP: VOICE */}
          {activeStep === "voice" && (
            <>
              <div className="vs-step-badge">Step 2 of 3</div>
              <div className="vs-step-title">Clone Your Voice</div>
              <div className="vs-step-subtitle">
                Record at least 30 seconds of your natural speaking voice. Read the script below clearly and at your normal pace.
              </div>

              <div className="vs-record-zone">
                <div className={`vs-record-icon ${isRecording ? "vs-record-icon--active" : voiceRecorded ? "vs-record-icon--done" : "vs-record-icon--idle"}`}>
                  {voiceRecorded && !isRecording ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  )}
                </div>

                <div className="vs-record-timer" style={{ color: isRecording ? "#ef4444" : voiceRecorded ? "#50e3c2" : "var(--app-text)" }}>
                  0:{recordingTime.toString().padStart(2, "0")}
                </div>
                <div className="vs-record-label">
                  {isRecording ? "Recording... speak naturally" : voiceRecorded ? "Recording captured" : "Ready to record"}
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  {!isRecording && !voiceRecorded && (
                    <button className="vs-btn-record vs-btn-record--start" onClick={startRecording}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
                      Start Recording
                    </button>
                  )}
                  {isRecording && (
                    <button className="vs-btn-record vs-btn-record--stop" onClick={stopRecording}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                      Stop Recording
                    </button>
                  )}
                  {voiceRecorded && !isRecording && (
                    <>
                      <button className="vs-btn-secondary" onClick={() => { setVoiceRecorded(false); setRecordingTime(0); }}>
                        Re-record
                      </button>
                      <button className="vs-btn-primary" onClick={completeVoiceStep}>
                        Continue
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </button>
                    </>
                  )}
                </div>

                <div className="vs-record-script">
                  <div className="vs-record-script-title">Read This Script</div>
                  <div className="vs-record-script-text">
                    "Hi, I'm a financial advisor and I help people navigate some of the most important financial decisions of their lives. Whether it's planning for retirement, managing taxes, or making sure your family is protected — I believe everyone deserves a clear, confident plan for their future. I'm here to help you get there."
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP: GENERATE */}
          {activeStep === "generate" && (
            <>
              <div className="vs-step-badge">Step 3 of 3</div>
              <div className="vs-step-title">Generate Your Videos</div>
              <div className="vs-step-subtitle">
                Your AI avatar and voice clone are ready. Generate your first batch of videos based on your approved Marketing Blueprint.
              </div>

              <div className="vs-generate-zone">
                <div className="vs-generate-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#vs-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs><linearGradient id="vs-grad" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#50e3c2"/></linearGradient></defs>
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div className="vs-generate-title">Ready to Generate</div>
                <div className="vs-generate-sub">
                  We'll create your initial video batch — ad scripts, webinar intro, and appointment confirmation video — all using your avatar and voice.
                </div>

                <div className="vs-generate-checklist">
                  <div className="vs-generate-check">
                    <div className="vs-generate-check-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--app-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    Avatar created from {avatarFiles.length} file{avatarFiles.length === 1 ? "" : "s"}
                  </div>
                  <div className="vs-generate-check">
                    <div className="vs-generate-check-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--app-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    Voice clone captured ({recordingTime}s recording)
                  </div>
                  <div className="vs-generate-check">
                    <div className="vs-generate-check-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--app-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    Marketing Blueprint approved
                  </div>
                </div>

                <button className="vs-btn-primary" onClick={handleGenerate} disabled={completedSteps.has("generate")}>
                  {completedSteps.has("generate") ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Videos
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </main>

      {/* ── Chat Sidebar ── */}
      <aside className="vs-chat">
        <div className="vs-chat-header">
          <div className="vs-chat-header-left">
            <div className="vs-chat-avatar">A</div>
            <div>
              <div className="vs-chat-title">Content Assistant</div>
              <div className="vs-chat-status">Online</div>
            </div>
          </div>
        </div>
        <div ref={chatScrollRef} className="vs-chat-messages">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`vs-chat-msg vs-chat-msg--${msg.sender}`}>
              {msg.sender === "ai" && <div className="vs-chat-msg-avatar">A</div>}
              <div className={`vs-chat-bubble vs-chat-bubble--${msg.sender}`}>{msg.text}</div>
            </div>
          ))}
          {aiThinking && (
            <div className="vs-chat-msg vs-chat-msg--ai">
              <div className="vs-chat-msg-avatar">A</div>
              <div className="vs-chat-bubble vs-chat-bubble--ai vs-chat-thinking">
                <div className="vs-thinking-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}
          {chatMessages.length <= 2 && !aiThinking && (
            <div className="vs-chat-prompts">
              <div className="vs-chat-prompts-label">Suggested questions</div>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => handleChatSend(p)} className="vs-chat-prompt">{p}</button>
              ))}
            </div>
          )}
        </div>
        <div className="vs-chat-input-wrap">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && chatInput.trim() && handleChatSend()}
            placeholder="Ask about video setup..."
            className="vs-chat-input"
          />
          <button onClick={() => chatInput.trim() && handleChatSend()} className={`vs-chat-send ${chatInput.trim() ? "vs-chat-send--active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </aside>

      </div>{/* close layout */}
      </div>{/* close page-enter */}
    </div>
  );
}
