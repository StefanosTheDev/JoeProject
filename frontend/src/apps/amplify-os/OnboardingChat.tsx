import { useState, useRef, useEffect } from "react";

/* ── Web Speech API types ── */

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/* ── Types ── */

interface StepOption {
  id: string;
  label: string;
  desc?: string;
  preSelected?: boolean;
}

interface ContextInfo {
  title: string;
  body: string;
}

type StepType =
  | "auto"
  | "text"
  | "url"
  | "analysis"
  | "prefilled_text"
  | "multi_choice"
  | "single_choice"
  | "range"
  | "slider"
  | "upload"
  | "complete";

interface Step {
  id: string;
  ai: string | null;
  type: StepType;
  placeholder?: string;
  prefill?: string;
  options?: StepOption[];
  min?: number;
  max?: number;
  defaultRange?: [number, number];
  labels?: string[];
  descriptions?: string[];
  sliderSteps?: number;
  sliderTiers?: { max: number; label: string; color: string; description: string }[];
  context: ContextInfo;
}

interface Message {
  stepId: string;
  sender: "ai" | "user" | "system";
  text: string;
  done?: boolean;
}

/* ── Steps ── */

const STEPS: Step[] = [
  {
    id: "welcome",
    ai: "Welcome to Amplify. I\u2019ll learn about your firm and build a growth strategy that fits. This takes about 5 minutes.",
    type: "auto",
    context: { title: "Getting Started", body: "This onboarding captures everything the system needs to generate your Marketing Blueprint, ad scripts, and campaign assets. Every question feeds directly into the AI engine \u2014 the better your answers, the more tailored your output." },
  },
  {
    id: "name",
    ai: "What\u2019s your name and the name of your firm?",
    type: "text",
    placeholder: "e.g. David Mitchell, Cornerstone Wealth Partners",
    context: { title: "Personalization", body: "Your name and firm name appear throughout your generated assets \u2014 ad copy, funnel pages, email sequences, and call scripts." },
  },
  {
    id: "website",
    ai: "Drop your website URL below. I\u2019ll analyze your site to understand your positioning and services.",
    type: "url",
    placeholder: "https://yourfirm.com",
    context: { title: "Website Intelligence", body: "The AI extracts services offered, client signals, geographic focus, credentials, tone of voice, and differentiators from your site." },
  },
  {
    id: "website_analysis",
    ai: null,
    type: "analysis",
    context: { title: "AI Analysis", body: "The system is reading your website and building a structured profile of your firm." },
  },
  {
    id: "firm_description",
    ai: "Here\u2019s how I\u2019d describe your firm. Edit anything that doesn\u2019t feel right:",
    type: "prefilled_text",
    prefill: "Cornerstone Wealth Partners is a fee-only fiduciary advisory firm in Denver specializing in tax-efficient retirement planning for professionals approaching retirement. The firm emphasizes Roth conversion strategies, Social Security optimization, and comprehensive income planning.",
    context: { title: "Firm Identity", body: "This description feeds into every piece of content the system generates. Make sure it sounds like you." },
  },
  {
    id: "service_model",
    ai: "How do you primarily charge clients?",
    type: "multi_choice",
    options: [
      { id: "aum", label: "AUM-Based Fees", desc: "% of assets under management" },
      { id: "planning", label: "Financial Planning Fees", desc: "Flat fee or hourly" },
      { id: "insurance", label: "Insurance Products", desc: "Commissions on insurance" },
      { id: "tax", label: "Tax Preparation", desc: "Tax return prep services" },
      { id: "hybrid", label: "Hybrid Model", desc: "Combination of fee types" },
    ],
    context: { title: "Service Model", body: "Your fee structure affects compliance guardrails, offer framing, and how the system positions your value." },
  },
  {
    id: "aum_range",
    ai: "What\u2019s your approximate total AUM?",
    type: "single_choice",
    options: [
      { id: "u10", label: "Under $10M" },
      { id: "10_50", label: "$10M \u2013 $50M" },
      { id: "50_100", label: "$50M \u2013 $100M" },
      { id: "100_500", label: "$100M \u2013 $500M" },
      { id: "500p", label: "$500M+" },
    ],
    context: { title: "Firm Size", body: "AUM range helps calibrate messaging sophistication and positioning strategy." },
  },
  {
    id: "client_type",
    ai: "Who are your best current clients? Select the top 2\u20133.",
    type: "multi_choice",
    options: [
      { id: "pre_retire", label: "Pre-Retirees", desc: "5\u201310 years from retirement" },
      { id: "retired", label: "Recently Retired", desc: "Just retired, rollover candidates" },
      { id: "accum", label: "High-Income Accumulators", desc: "Peak earning years" },
      { id: "biz", label: "Business Owners", desc: "Exit planning, liquidity events" },
      { id: "federal", label: "Federal Employees", desc: "TSP/FERS specialists" },
      { id: "inherited", label: "Inherited Wealth", desc: "Wealth transfer recipients" },
    ],
    context: { title: "Client DNA", body: "Your best future clients usually look like your best current clients. This is the strongest signal for targeting." },
  },
  {
    id: "client_age",
    ai: "What age range are most of your clients?",
    type: "range",
    min: 25,
    max: 85,
    defaultRange: [55, 70],
    context: { title: "Age Targeting", body: "Age range drives Meta ad targeting, messaging tone, and life-stage concerns your content addresses." },
  },
  {
    id: "credentials",
    ai: "What credentials do you hold?",
    type: "multi_choice",
    options: [
      { id: "cfp", label: "CFP\u00AE", preSelected: true },
      { id: "cpa", label: "CPA", preSelected: true },
      { id: "cfa", label: "CFA" },
      { id: "ricp", label: "RICP" },
      { id: "chfc", label: "ChFC" },
      { id: "ea", label: "EA" },
      { id: "other", label: "Other" },
    ],
    context: { title: "Credibility Signals", body: "Credentials are trust accelerators in your ads and funnel copy. The system will emphasize these in generated content." },
  },
  {
    id: "compliance",
    ai: "How much flexibility does your compliance team give you with marketing language?",
    type: "slider",
    sliderSteps: 10,
    sliderTiers: [
      { max: 2, label: "Strict", color: "#3b82f6", description: "No performance language. No case studies or testimonials. Heavy disclaimers on every piece. All outcomes hedged with \"may\", \"aim to\", \"seek to\". No implied guarantees of any kind." },
      { max: 4, label: "Conservative", color: "#6366f1", description: "General case studies allowed (no specific returns). Soft outcome language like \"designed to\" and \"historically\". Standard disclaimers required. No superlatives or comparative claims." },
      { max: 6, label: "Moderate", color: "#a855f7", description: "Named case studies with context permitted. Directional outcomes without specific numbers. Can reference industry benchmarks. Light disclaimers. Professional but confident tone." },
      { max: 8, label: "Flexible", color: "#c084fc", description: "Case studies with general performance context. Stronger benefit-driven language. Comparative positioning allowed. Disclaimers only where legally required. Bolder calls to action." },
      { max: 10, label: "Aggressive", color: "#e879f9", description: "Maximum persuasion within legal bounds. Direct outcome claims with proper backing. Testimonials and detailed case studies. Minimal hedging. Bold, assertive copy throughout." },
    ],
    context: { title: "Content Guardrails", body: "This controls the tone, claims, and language style across all generated content — ads, emails, landing pages, and social posts. You can fine-tune per campaign later." },
  },
  {
    id: "upload",
    ai: "Have any existing marketing materials or compliance docs? Drop them here, or skip.",
    type: "upload",
    context: { title: "Documents", body: "Existing materials help the AI match your brand voice and stay within compliance boundaries." },
  },
  {
    id: "complete",
    ai: "All set. Building your Marketing Blueprint now.",
    type: "complete",
    context: { title: "Blueprint", body: "Generating your ICP profile, ad angles, education topics, targeting strategy, and rationale." },
  },
];

/* ── Step label map ── */

const STEP_LABELS: Record<string, string> = {
  name: "Basics",
  website: "Website",
  firm_description: "Description",
  service_model: "Services",
  aum_range: "Firm Size",
  client_type: "Clients",
  client_age: "Age Range",
  credentials: "Credentials",
  compliance: "Compliance",
  upload: "Documents",
  complete: "Blueprint",
};

/* ── Component ── */

export default function OnboardingChat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [inputVal, setInputVal] = useState("");
  const [rangeVal, setRangeVal] = useState<[number, number]>([55, 70]);
  const [sliderVal, setSliderVal] = useState(5);
  const [prefillVal, setPrefillVal] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rangeTrackRef = useRef<HTMLDivElement>(null);
  const draggingThumb = useRef<"min" | "max" | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const step = STEPS[currentStep];

  function toggleVoice() {
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    // Store what was in the input before voice started
    const baseText = inputVal.trim();
    let committed = ""; // finalized speech segments

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalPart = "";
      let interimPart = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += transcript;
        } else {
          interimPart += transcript;
        }
      }
      committed = finalPart;
      const prefix = baseText ? baseText + " " : "";
      setInputVal(prefix + committed + (interimPart ? interimPart : ""));
    };

    recognition.onend = () => {
      setVoiceActive(false);
      // Ensure we have the final committed text
      const prefix = baseText ? baseText + " " : "";
      if (committed) {
        setInputVal(prefix + committed.trim());
      }
    };

    recognition.onerror = () => {
      setVoiceActive(false);
    };

    recognition.start();
    setVoiceActive(true);
  }

  useEffect(() => {
    if (step && step.ai && step.type !== "analysis") {
      setMessages((prev) => {
        if (prev.some((m) => m.stepId === step.id && m.sender === "ai")) return prev;
        return [...prev, { stepId: step.id, sender: "ai", text: step.ai! }];
      });
    }
    if (step?.type === "prefilled_text") {
      setPrefillVal(step.prefill ?? "");
    }
    if (step?.type === "analysis") {
      setAnalyzing(true);
      const analysisMsgs = [
        { text: "Analyzing your website\u2026", delay: 0 },
        { text: "Extracting services and positioning\u2026", delay: 1200 },
        { text: "Identifying client signals\u2026", delay: 2400 },
        { text: "Building your firm profile\u2026", delay: 3600 },
      ];
      analysisMsgs.forEach(({ text, delay }, idx) => {
        setTimeout(() => {
          setMessages((prev) => {
            // Mark the previous analysis message as done (checkmark) before adding the new one
            const updated = prev.map((m, mi) => {
              if (m.stepId === step.id && m.sender === "system" && !m.done && mi === prev.length - 1 && idx > 0) {
                return { ...m, done: true };
              }
              return m;
            });
            return [...updated, { stepId: step.id, sender: "system", text }];
          });
        }, delay);
      });
      setTimeout(() => {
        setAnalyzing(false);
        setMessages((prev) => {
          // Mark the last spinning message as done, then add the final complete message
          const updated = prev.map((m) => {
            if (m.stepId === step.id && m.sender === "system" && !m.done) {
              return { ...m, done: true };
            }
            return m;
          });
          return [
            ...updated,
            { stepId: step.id, sender: "system", text: "Analysis complete \u2014 12 data points extracted.", done: true },
          ];
        });
        setTimeout(() => advance(), 800);
      }, 5000);
    }
    if (step?.type === "upload") setShowUploadZone(true);
    if (step?.type === "complete") {
      setGenerating(true);
      setTimeout(() => setGenerating(false), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function advance() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setSelections({});
      setInputVal("");
      setShowUploadZone(false);
    }
  }

  function handleSubmitText() {
    const cleanedInput = inputVal.trim();
    if (!cleanedInput) return;
    // Stop voice if active
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
    }
    const effectiveSelected = step.type === "multi_choice" ? getEffectiveSelections() : [];
    const hasSelections = effectiveSelected.length > 0;

    if (hasSelections) {
      // Send selections + chat message together, then advance
      const labels = step.options!.filter((o) => effectiveSelected.includes(o.id)).map((o) => o.label);
      setMessages((prev) => [
        ...prev,
        { stepId: step.id, sender: "user", text: labels.join(", ") },
        { stepId: step.id, sender: "user", text: cleanedInput },
      ]);
      setSelections({});
      setInputVal("");
      setTimeout(() => advance(), 400);
    } else if (step.type === "text" || step.type === "url") {
      // Text/URL steps: send and advance
      setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: cleanedInput }]);
      setInputVal("");
      setTimeout(() => advance(), 400);
    } else {
      // Other steps (range, slider, etc.): just add supplementary message, don't advance
      setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: cleanedInput }]);
      setInputVal("");
    }
  }

  function handleSubmitPrefill() {
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: prefillVal }]);
    setTimeout(() => advance(), 400);
  }

  function toggleSelection(id: string) {
    setSelections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getEffectiveSelections(): string[] {
    return step.options?.filter((o) => {
      if (selections[o.id] !== undefined) return selections[o.id];
      return o.preSelected ?? false;
    }).map((o) => o.id) ?? [];
  }

  function handleChoiceSubmit() {
    const selected = getEffectiveSelections();
    if (selected.length === 0) return;
    const labels = step.options!.filter((o) => selected.includes(o.id)).map((o) => o.label);
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: labels.join(", ") }]);
    setSelections({});
    setTimeout(() => advance(), 400);
  }

  function handleSingleChoice(opt: StepOption) {
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: opt.label }]);
    setTimeout(() => advance(), 400);
  }

  function handleRangeSubmit() {
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: `${rangeVal[0]} to ${rangeVal[1]} years old` }]);
    setTimeout(() => advance(), 400);
  }

  function handleSliderSubmit() {
    if (step.sliderTiers) {
      const tier = step.sliderTiers.find((t) => sliderVal <= t.max) ?? step.sliderTiers[step.sliderTiers.length - 1];
      setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: `${tier.label} (${sliderVal}/10)` }]);
    } else {
      const labels = step.labels ?? [];
      setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: labels[sliderVal] ?? String(sliderVal) }]);
    }
    setTimeout(() => advance(), 400);
  }

  function handleSkip() {
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: "Skipped" }]);
    setTimeout(() => advance(), 400);
  }

  const contextData = step?.context;
  const progress = Math.round((currentStep / (STEPS.length - 1)) * 100);

  return (
    <div className="obc-root">
      {/* ── Main chat ── */}
      <div className="obc-main">
        {/* Header */}
        <header className="obc-header">
          <div className="obc-header-left">
            <div className="obc-logo">A</div>
            <div>
              <div className="obc-title">Amplify</div>
              <div className="obc-subtitle">Setting up your profile</div>
            </div>
          </div>
          <div className="obc-progress-wrap">
            <div className="obc-progress-track">
              <div className="obc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="obc-progress-label">{progress}%</span>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="obc-messages">
          <div className="obc-messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`obc-msg obc-msg--${msg.sender}`}>
                {msg.sender === "ai" && <div className="obc-avatar">A</div>}
                {msg.sender === "system" && (
                  <div className={`obc-sys-icon ${msg.done ? "obc-sys-icon--done" : ""}`}>
                    {msg.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <div className="obc-spinner-sm" />
                    )}
                  </div>
                )}
                <div className={`obc-bubble obc-bubble--${msg.sender} ${msg.done ? "obc-bubble--done" : ""}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {step?.type === "analysis" && analyzing && (
              <div className="obc-dots">
                <span /><span /><span />
              </div>
            )}

            {step?.type === "complete" && generating && (
              <div className="obc-generating">
                <div className="obc-spinner" />
                <p>Building your Marketing Blueprint\u2026</p>
              </div>
            )}
            {step?.type === "complete" && !generating && (
              <div className="obc-complete-action">
                <button className="obc-btn obc-btn--primary obc-btn--lg">
                  View Your Blueprint
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Input area ── */}
        {step && step.type !== "analysis" && step.type !== "auto" && step.type !== "complete" && (
          <div className="obc-input-area">
            <div className="obc-input-inner">
              {/* Controls */}
              <div className="obc-controls">
                {step.type === "multi_choice" && (
                  <div>
                    <div className="obc-chips">
                      {step.options!.map((opt) => {
                        const sel = selections[opt.id] || (opt.preSelected && selections[opt.id] === undefined);
                        return (
                          <button key={opt.id} onClick={() => toggleSelection(opt.id)} className={`obc-chip ${sel ? "obc-chip--selected" : ""}`}>
                            <span className="obc-chip-label">{opt.label}</span>
                            {opt.desc && <span className="obc-chip-desc">{opt.desc}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleChoiceSubmit} className="obc-btn obc-btn--primary">Continue</button>
                  </div>
                )}

                {step.type === "single_choice" && (
                  <div className="obc-chips">
                    {step.options!.map((opt) => (
                      <button key={opt.id} onClick={() => handleSingleChoice(opt)} className="obc-chip obc-chip--single">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {step.type === "range" && (() => {
                  const min = step.min ?? 0;
                  const max = step.max ?? 100;
                  const pctLow = ((rangeVal[0] - min) / (max - min)) * 100;
                  const pctHigh = ((rangeVal[1] - min) / (max - min)) * 100;

                  function handlePointerDown(thumb: "min" | "max") {
                    return (e: React.PointerEvent) => {
                      e.preventDefault();
                      draggingThumb.current = thumb;
                      const onMove = (ev: PointerEvent) => {
                        if (!rangeTrackRef.current) return;
                        const rect = rangeTrackRef.current.getBoundingClientRect();
                        const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                        const val = Math.round(min + pct * (max - min));
                        setRangeVal((prev) => {
                          if (draggingThumb.current === "min") {
                            return [Math.min(val, prev[1] - 1), prev[1]];
                          } else {
                            return [prev[0], Math.max(val, prev[0] + 1)];
                          }
                        });
                      };
                      const onUp = () => {
                        draggingThumb.current = null;
                        window.removeEventListener("pointermove", onMove);
                        window.removeEventListener("pointerup", onUp);
                      };
                      window.addEventListener("pointermove", onMove);
                      window.addEventListener("pointerup", onUp);
                    };
                  }

                  return (
                    <div>
                      <div className="obc-range-display">
                        <span className="obc-range-value">{rangeVal[0]}</span>
                        <span className="obc-range-sep">to</span>
                        <span className="obc-range-value">{rangeVal[1]}</span>
                        <span className="obc-range-unit">years old</span>
                      </div>
                      <div className="obc-dual-track-wrap">
                        <div ref={rangeTrackRef} className="obc-dual-track">
                          <div className="obc-dual-track-fill" style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }} />
                          <div className="obc-dual-thumb" style={{ left: `${pctLow}%` }} onPointerDown={handlePointerDown("min")} />
                          <div className="obc-dual-thumb" style={{ left: `${pctHigh}%` }} onPointerDown={handlePointerDown("max")} />
                        </div>
                        <div className="obc-dual-bounds">
                          <span>{min}</span>
                          <span>{max}</span>
                        </div>
                      </div>
                      <button onClick={handleRangeSubmit} className="obc-btn obc-btn--primary">Continue</button>
                    </div>
                  );
                })()}

                {step.type === "slider" && step.sliderTiers && (
                  <div>
                    {(() => {
                      const tier = step.sliderTiers!.find((t) => sliderVal <= t.max) ?? step.sliderTiers![step.sliderTiers!.length - 1];
                      return (
                        <>
                          <div className="obc-glide-header">
                            <span className="obc-glide-tier" style={{ color: tier.color }}>{tier.label}</span>
                            <span className="obc-glide-value">{sliderVal}/10</span>
                          </div>
                          <div className="obc-glide-track-wrap">
                            <input
                              type="range"
                              min={0}
                              max={step.sliderSteps ?? 10}
                              value={sliderVal}
                              onChange={(e) => setSliderVal(+e.target.value)}
                              className="obc-slider-input obc-glide-input"
                              style={{ "--glide-color": tier.color, "--glide-pct": `${(sliderVal / (step.sliderSteps ?? 10)) * 100}%` } as React.CSSProperties}
                            />
                            <div className="obc-glide-ticks">
                              {step.sliderTiers!.map((t) => (
                                <span key={t.label} className="obc-glide-tick-label">{t.label}</span>
                              ))}
                            </div>
                          </div>
                          <div className="obc-glide-desc" style={{ borderColor: tier.color + "33" }}>
                            <div className="obc-glide-desc-title" style={{ color: tier.color }}>What this means for your content:</div>
                            {tier.description}
                          </div>
                        </>
                      );
                    })()}
                    <button onClick={handleSliderSubmit} className="obc-btn obc-btn--primary">Continue</button>
                  </div>
                )}

                {step.type === "slider" && !step.sliderTiers && step.labels && (
                  <div>
                    <div className="obc-slider-labels">
                      {step.labels!.map((l, i) => (
                        <span key={l} className={sliderVal === i ? "obc-slider-label--active" : ""}>{l}</span>
                      ))}
                    </div>
                    <input type="range" min={0} max={(step.labels!.length - 1)} value={sliderVal} onChange={(e) => setSliderVal(+e.target.value)} className="obc-slider-input" />
                    <div className="obc-slider-desc">{step.descriptions![sliderVal]}</div>
                    <button onClick={handleSliderSubmit} className="obc-btn obc-btn--primary">Continue</button>
                  </div>
                )}

                {step.type === "prefilled_text" && (
                  <div>
                    <textarea value={prefillVal} onChange={(e) => setPrefillVal(e.target.value)} className="obc-textarea" />
                    <button onClick={handleSubmitPrefill} className="obc-btn obc-btn--primary" style={{ marginTop: 10 }}>Looks Good</button>
                  </div>
                )}

                {step.type === "upload" && !showUploadZone && (
                  <div className="obc-upload-actions">
                    <button onClick={() => setShowUploadZone(true)} className="obc-btn obc-btn--secondary">Upload Files</button>
                    <button onClick={handleSkip} className="obc-btn obc-btn--primary">Skip</button>
                  </div>
                )}
              </div>

              {/* Upload zone */}
              {showUploadZone && (
                <div className="obc-dropzone-wrap">
                  <div className="obc-dropzone">
                    <button onClick={() => setShowUploadZone(false)} className="obc-dropzone-close">{"\u00D7"}</button>
                    <div className="obc-dropzone-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="obc-dropzone-title">Drop files here</p>
                    <p className="obc-dropzone-sub">or click to browse</p>
                    <p className="obc-dropzone-hint">PDF, DOCX, PPTX, images \u2014 up to 25MB</p>
                  </div>
                  {step.type === "upload" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button onClick={handleSkip} className="obc-btn obc-btn--primary">Continue Without Files</button>
                    </div>
                  )}
                </div>
              )}

              {/* Text input bar */}
              <div className="obc-inputbar">
                <button onClick={() => setShowUploadZone(!showUploadZone)} className={`obc-inputbar-icon ${showUploadZone ? "obc-inputbar-icon--active" : ""}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button onClick={toggleVoice} className={`obc-inputbar-icon ${voiceActive ? "obc-mic--active" : ""}`} title="Voice input">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && inputVal.trim() && handleSubmitText()}
                  placeholder={step.type === "text" || step.type === "url" ? step.placeholder : "Add a message\u2026"}
                  className="obc-text-input"
                />
                <button
                  onClick={() => inputVal.trim() && handleSubmitText()}
                  className={`obc-send ${inputVal.trim() ? "obc-send--active" : ""}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome CTA */}
        {step?.type === "auto" && (
          <div className="obc-welcome-cta">
            <button onClick={advance} className="obc-btn obc-btn--primary obc-btn--lg">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="obc-sidebar">
        <div className="obc-sidebar-header">
          <span>Context</span>
        </div>
        <div className="obc-sidebar-body">
          {contextData && (
            <div className="obc-context">
              <h3>{contextData.title}</h3>
              <p>{contextData.body}</p>
            </div>
          )}
          <div className="obc-steps-list">
            <div className="obc-steps-label">Progress</div>
            {STEPS.filter((s) => s.type !== "auto" && s.type !== "analysis").map((s) => {
              const stepIdx = STEPS.indexOf(s);
              const isDone = stepIdx < currentStep;
              const isCurrent = stepIdx === currentStep;
              return (
                <div key={s.id} className={`obc-step-item ${isDone ? "obc-step-item--done" : ""} ${isCurrent ? "obc-step-item--current" : ""}`}>
                  <div className="obc-step-dot">
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <span>{STEP_LABELS[s.id] ?? s.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <style>{`
        /* ── Vercel/Geist Dark Palette ──
           bg-100: #0a0a0a  bg-200: #000
           gray-100: #1a1a1a  gray-200: #1f1f1f  gray-300: #292929
           gray-400: #2e2e2e  gray-500: #454545  gray-600: #878787
           gray-700: #8f8f8f  gray-800: #7d7d7d  gray-900: #a1a1a1
           gray-1000: #ededed
           borders: #333  borders-light: #2e2e2e
           success: #50e3c2 (vercel teal)
        */

        .obc-root {
          height: 100vh;
          display: flex;
          background: #0a0a0a;
          color: #ededed;
          font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .obc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── Header ── */
        .obc-header {
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1f1f1f;
        }
        .obc-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .obc-logo {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #ededed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: #0a0a0a;
        }
        .obc-title {
          font-size: 14px;
          font-weight: 500;
          color: #ededed;
          letter-spacing: -0.01em;
        }
        .obc-subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 1px;
        }
        .obc-progress-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .obc-progress-track {
          width: 140px;
          height: 2px;
          border-radius: 1px;
          background: #1f1f1f;
          overflow: hidden;
        }
        .obc-progress-fill {
          height: 100%;
          border-radius: 1px;
          background: #ededed;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .obc-progress-label {
          font-size: 11px;
          color: #666;
          font-variant-numeric: tabular-nums;
          min-width: 28px;
          text-align: right;
        }

        /* ── Messages ── */
        .obc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 32px 20px;
        }
        .obc-messages-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .obc-msg {
          margin-bottom: 20px;
          display: flex;
          animation: fadeUp 0.3s ease;
        }
        .obc-msg--user { justify-content: flex-end; }
        .obc-msg--ai, .obc-msg--system { justify-content: flex-start; }

        .obc-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #ededed;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          margin-right: 12px;
          margin-top: 2px;
        }
        .obc-sys-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-right: 12px;
          margin-top: 2px;
          color: #666;
        }
        .obc-sys-icon--done {
          background: rgba(80, 227, 194, 0.1);
          color: #50e3c2;
        }

        .obc-bubble {
          max-width: 80%;
          font-size: 14px;
          line-height: 1.65;
          letter-spacing: -0.006em;
        }
        .obc-bubble--ai {
          padding: 14px 18px;
          background: #1a1a1a;
          border: 1px solid #2e2e2e;
          border-radius: 16px 16px 16px 4px;
        }
        .obc-bubble--user {
          padding: 14px 18px;
          background: #ededed;
          border-radius: 16px 16px 4px 16px;
          color: #0a0a0a;
        }
        .obc-bubble--system {
          padding: 6px 0;
          background: transparent;
          color: #666;
          font-size: 13px;
        }
        .obc-bubble--done {
          color: #50e3c2;
        }

        .obc-spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid #333;
          border-top-color: #888;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* ── Dots ── */
        .obc-dots {
          display: flex;
          justify-content: center;
          padding: 20px;
          gap: 6px;
        }
        .obc-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #555;
          animation: dotPulse 1.4s ease-in-out infinite;
        }
        .obc-dots span:nth-child(2) { animation-delay: 0.2s; }
        .obc-dots span:nth-child(3) { animation-delay: 0.4s; }

        /* ── Generating / Complete ── */
        .obc-generating {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          gap: 16px;
        }
        .obc-generating p {
          font-size: 14px;
          color: #666;
        }
        .obc-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #2e2e2e;
          border-top-color: #ededed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .obc-complete-action {
          display: flex;
          justify-content: center;
          padding: 40px;
        }

        /* ── Input area ── */
        .obc-input-area {
          border-top: 1px solid #1f1f1f;
          padding: 0 32px 24px;
        }
        .obc-input-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .obc-controls {
          padding: 16px 0 12px;
        }

        /* ── Chips ── */
        .obc-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .obc-chip {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #2e2e2e;
          background: transparent;
          color: #a1a1a1;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .obc-chip:hover {
          border-color: #444;
          background: #1a1a1a;
          color: #ededed;
        }
        .obc-chip--selected {
          border-color: #ededed;
          background: #1a1a1a;
          color: #ededed;
        }
        .obc-chip--single:hover {
          border-color: #ededed;
          background: #1a1a1a;
          color: #ededed;
          transform: translateY(-1px);
        }
        .obc-chip-label {
          font-size: 14px;
          font-weight: 500;
        }
        .obc-chip-desc {
          font-size: 12px;
          color: #666;
        }
        .obc-chip--selected .obc-chip-desc {
          color: #888;
        }

        /* ── Buttons ── */
        .obc-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          border-radius: 6px;
        }
        .obc-btn--primary {
          padding: 8px 16px;
          background: #ededed;
          color: #0a0a0a;
          font-size: 14px;
        }
        .obc-btn--primary:hover {
          background: #fff;
        }
        .obc-btn--secondary {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #333;
          color: #a1a1a1;
          font-size: 14px;
        }
        .obc-btn--secondary:hover {
          border-color: #555;
          color: #ededed;
        }
        .obc-btn--lg {
          padding: 10px 24px;
          font-size: 15px;
          font-weight: 500;
          border-radius: 8px;
        }

        /* ── Range ── */
        .obc-range-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 18px;
        }
        .obc-range-value {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          color: #ededed;
        }
        .obc-range-sep {
          font-size: 14px;
          color: #555;
          font-weight: 400;
          padding: 0 2px;
        }
        .obc-range-unit {
          font-size: 14px;
          color: #555;
          margin-left: 4px;
        }
        .obc-dual-track-wrap {
          margin-bottom: 18px;
        }
        .obc-dual-track {
          position: relative;
          height: 4px;
          background: #2e2e2e;
          border-radius: 2px;
          cursor: pointer;
          touch-action: none;
        }
        .obc-dual-track-fill {
          position: absolute;
          top: 0;
          height: 100%;
          background: #ededed;
          border-radius: 2px;
          pointer-events: none;
        }
        .obc-dual-thumb {
          position: absolute;
          top: 50%;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ededed;
          transform: translate(-50%, -50%);
          cursor: grab;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4);
          transition: box-shadow 0.15s;
          touch-action: none;
        }
        .obc-dual-thumb:hover {
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.5), 0 0 0 4px rgba(237,237,237,0.15);
        }
        .obc-dual-thumb:active {
          cursor: grabbing;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.5), 0 0 0 6px rgba(237,237,237,0.2);
        }
        .obc-dual-bounds {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 11px;
          color: #444;
          font-variant-numeric: tabular-nums;
        }

        /* ── Slider (legacy) ── */
        .obc-slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .obc-slider-labels span {
          font-size: 13px;
          color: #555;
          font-weight: 500;
          transition: color 0.2s;
        }
        .obc-slider-label--active {
          color: #ededed !important;
        }
        .obc-slider-input {
          width: 100%;
          margin-bottom: 10px;
        }
        .obc-slider-desc {
          font-size: 13px;
          color: #888;
          padding: 12px 16px;
          background: #1a1a1a;
          border: 1px solid #2e2e2e;
          border-radius: 8px;
          margin-bottom: 14px;
          line-height: 1.5;
        }

        /* ── Glide Scale ── */
        .obc-glide-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 12px;
        }
        .obc-glide-tier {
          font-size: 18px;
          font-weight: 600;
          transition: color 0.3s;
        }
        .obc-glide-value {
          font-size: 13px;
          color: #666;
          font-variant-numeric: tabular-nums;
        }
        .obc-glide-track-wrap {
          margin-bottom: 16px;
        }
        .obc-glide-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, var(--glide-color) 0%, var(--glide-color) var(--glide-pct), #2e2e2e var(--glide-pct), #2e2e2e 100%);
          outline: none;
          margin-bottom: 8px;
          transition: background 0.15s;
        }
        .obc-glide-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ededed;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4);
          transition: box-shadow 0.15s;
        }
        .obc-glide-input::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.5), 0 0 0 4px rgba(237,237,237,0.15);
        }
        .obc-glide-ticks {
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }
        .obc-glide-tick-label {
          font-size: 10px;
          color: #555;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .obc-glide-desc {
          font-size: 13px;
          color: #999;
          padding: 14px 16px;
          background: #111;
          border: 1px solid #2e2e2e;
          border-radius: 10px;
          margin-bottom: 14px;
          line-height: 1.6;
          transition: border-color 0.3s;
        }
        .obc-glide-desc-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          transition: color 0.3s;
        }

        /* ── Textarea ── */
        .obc-textarea {
          width: 100%;
          min-height: 90px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #2e2e2e;
          background: #0a0a0a;
          color: #ededed;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .obc-textarea:focus {
          outline: none;
          border-color: #ededed;
        }

        /* ── Upload ── */
        .obc-upload-actions {
          display: flex;
          gap: 10px;
        }
        .obc-dropzone-wrap {
          margin-bottom: 14px;
          animation: fadeUp 0.25s ease;
        }
        .obc-dropzone {
          border: 1px dashed #333;
          border-radius: 8px;
          padding: 36px 24px;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .obc-dropzone:hover {
          border-color: #555;
          background: #111;
        }
        .obc-dropzone-close {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #1a1a1a;
          color: #666;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .obc-dropzone-close:hover {
          background: #292929;
          color: #a1a1a1;
        }
        .obc-dropzone-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          color: #666;
        }
        .obc-dropzone-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #a1a1a1;
        }
        .obc-dropzone-sub {
          font-size: 13px;
          color: #555;
        }
        .obc-dropzone-hint {
          font-size: 12px;
          color: #444;
          margin-top: 10px;
        }

        /* ── Input bar ── */
        .obc-inputbar {
          display: flex;
          align-items: center;
          background: #0a0a0a;
          border: 1px solid #2e2e2e;
          border-radius: 8px;
          padding: 4px 6px;
          transition: border-color 0.2s;
        }
        .obc-inputbar:focus-within {
          border-color: #555;
        }
        .obc-inputbar-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #555;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .obc-inputbar-icon:hover {
          color: #a1a1a1;
        }
        .obc-inputbar-icon--active {
          color: #ededed;
        }
        .obc-mic--active {
          color: #ef4444;
          animation: micPulse 1.5s ease-in-out infinite;
        }
        .obc-text-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ededed;
          font-size: 14px;
          outline: none;
          padding: 10px 8px;
          font-family: inherit;
        }
        .obc-text-input::placeholder {
          color: #444;
        }
        .obc-send {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: none;
          background: #1a1a1a;
          color: #444;
          cursor: default;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .obc-send--active {
          background: #ededed;
          color: #0a0a0a;
          cursor: pointer;
        }
        .obc-send--active:hover {
          background: #fff;
        }

        /* ── Welcome CTA ── */
        .obc-welcome-cta {
          border-top: 1px solid #1f1f1f;
          padding: 24px 32px;
          display: flex;
          justify-content: center;
        }

        /* ── Sidebar ── */
        .obc-sidebar {
          width: 280px;
          border-left: 1px solid #1f1f1f;
          background: #000;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .obc-sidebar-header {
          padding: 18px 24px;
          border-bottom: 1px solid #1f1f1f;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #555;
        }
        .obc-sidebar-body {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        .obc-context h3 {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 10px;
          color: #ededed;
          letter-spacing: -0.01em;
        }
        .obc-context p {
          font-size: 13px;
          color: #666;
          line-height: 1.7;
        }

        /* ── Steps list ── */
        .obc-steps-list {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #1f1f1f;
        }
        .obc-steps-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #555;
          margin-bottom: 14px;
        }
        .obc-step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          font-size: 13px;
          color: #444;
          font-weight: 400;
          transition: color 0.2s;
        }
        .obc-step-item--current {
          color: #ededed;
          font-weight: 500;
        }
        .obc-step-item--done {
          color: #666;
        }
        .obc-step-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #2e2e2e;
          transition: all 0.2s;
        }
        .obc-step-item--current .obc-step-dot {
          border-color: #ededed;
          background: rgba(237, 237, 237, 0.1);
        }
        .obc-step-item--done .obc-step-dot {
          border-color: #50e3c2;
          background: rgba(80, 227, 194, 0.08);
          color: #50e3c2;
        }

        /* ── Range inputs (non-glide) ── */
        input[type="range"]:not(.obc-glide-input) {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          background: #2e2e2e;
          border-radius: 1px;
          outline: none;
        }
        input[type="range"]:not(.obc-glide-input)::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ededed;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
        }

        /* ── Scrollbar ── */
        .obc-messages::-webkit-scrollbar { width: 6px; }
        .obc-messages::-webkit-scrollbar-track { background: transparent; }
        .obc-messages::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 3px; }
        .obc-sidebar-body::-webkit-scrollbar { width: 4px; }
        .obc-sidebar-body::-webkit-scrollbar-track { background: transparent; }
        .obc-sidebar-body::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }

        /* ── Animations ── */
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes micPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
