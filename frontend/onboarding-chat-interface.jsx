import { useState, useRef, useEffect } from "react";

const STEPS = [
  {
    id: "welcome",
    ai: "Welcome to Amplified. I'm going to learn about your firm so I can build you a growth strategy that actually fits. This takes about 5 minutes. Let's start with the basics.",
    type: "auto",
    context: { title: "Getting Started", body: "This onboarding captures everything the system needs to generate your Marketing Blueprint, ad scripts, and campaign assets. Every question feeds directly into the AI engine — the better your answers, the more tailored your output." },
  },
  {
    id: "name",
    ai: "What's your name and the name of your firm?",
    type: "text",
    placeholder: "e.g. David Mitchell, Cornerstone Wealth Partners",
    context: { title: "Personalization", body: "Your name and firm name appear throughout your generated assets — ad copy, funnel pages, email sequences, and call scripts. Getting this right upfront means you won't need to find-and-replace later." },
  },
  {
    id: "website",
    ai: "Drop your website URL below. I'll analyze your site to understand your positioning, services, and the type of clients you attract.",
    type: "url",
    placeholder: "https://yourfirm.com",
    context: { title: "Website Intelligence", body: "The AI scrapes your site and extracts: services offered, client signals, geographic focus, credentials, tone of voice, and differentiators. This is the richest single input in the onboarding — it saves you from answering 15+ questions manually." },
  },
  {
    id: "website_analysis",
    ai: null,
    type: "analysis",
    context: { title: "AI Analysis", body: "The system is reading your website and building a structured profile of your firm. This typically takes 10–15 seconds. The more content on your site, the better the analysis." },
  },
  {
    id: "firm_description",
    ai: "Based on your website, here's how I'd describe your firm. Edit anything that doesn't feel right:",
    type: "prefilled_text",
    prefill: "Cornerstone Wealth Partners is a fee-only fiduciary advisory firm in Denver specializing in tax-efficient retirement planning for professionals approaching retirement. The firm emphasizes Roth conversion strategies, Social Security optimization, and comprehensive income planning.",
    context: { title: "Firm Identity", body: "This description feeds into every piece of content the system generates. It shapes how your brand voice comes across in ads, webinars, and sequences. Make sure it sounds like YOU — not like a generic advisor bio." },
  },
  {
    id: "service_model",
    ai: "How do you primarily charge clients? Select all that apply.",
    type: "multi_choice",
    options: [
      { id: "aum", label: "AUM-Based Fees", desc: "% of assets under management" },
      { id: "planning", label: "Financial Planning Fees", desc: "Flat fee or hourly for planning" },
      { id: "insurance", label: "Insurance Products", desc: "Commissions on insurance" },
      { id: "tax", label: "Tax Preparation", desc: "Tax return prep services" },
      { id: "hybrid", label: "Hybrid Model", desc: "Combination of fee types" },
    ],
    context: { title: "Service Model", body: "Your fee structure affects compliance guardrails, offer framing, and how the system positions your value. Insurance-heavy models need different ad language than fee-only firms. This also determines which disclaimers get auto-generated." },
  },
  {
    id: "aum_range",
    ai: "What's your approximate total AUM?",
    type: "single_choice",
    options: [
      { id: "u10", label: "Under $10M" },
      { id: "10_50", label: "$10M – $50M" },
      { id: "50_100", label: "$50M – $100M" },
      { id: "100_500", label: "$100M – $500M" },
      { id: "500p", label: "$500M+" },
    ],
    context: { title: "Firm Size", body: "AUM range helps calibrate messaging sophistication. A $500M+ firm communicates differently than a growing solo practice. This also influences the system's recommendations for minimum client thresholds and positioning strategy." },
  },
  {
    id: "client_type",
    ai: "Who are your best current clients? Not aspirational — who actually pays you today? Select the top 2–3.",
    type: "multi_choice",
    options: [
      { id: "pre_retire", label: "Pre-Retirees", desc: "5–10 years from retirement" },
      { id: "retired", label: "Recently Retired", desc: "Just retired, rollover candidates" },
      { id: "accum", label: "High-Income Accumulators", desc: "Peak earning years, growing wealth" },
      { id: "biz", label: "Business Owners", desc: "Exit planning, liquidity events" },
      { id: "federal", label: "Federal Employees", desc: "TSP/FERS specialists" },
      { id: "inherited", label: "Inherited Wealth", desc: "Wealth transfer recipients" },
    ],
    context: { title: "Client DNA", body: "This is the strongest signal for your ICP. The system uses who you ALREADY serve well to recommend who you should target — not generic demographics. Your best future clients usually look like your best current clients." },
  },
  {
    id: "client_age",
    ai: "What age range are most of your clients?",
    type: "range",
    min: 25,
    max: 85,
    defaultRange: [55, 70],
    context: { title: "Age Targeting", body: "Age range directly drives Meta ad targeting parameters, messaging tone, and the specific life-stage concerns your content should address. A 58-year-old pre-retiree has very different anxieties than a 72-year-old already in retirement." },
  },
  {
    id: "credentials",
    ai: "What credentials do you hold? I detected CFP® and CPA from your website — confirm or adjust.",
    type: "multi_choice",
    options: [
      { id: "cfp", label: "CFP®", preSelected: true },
      { id: "cpa", label: "CPA", preSelected: true },
      { id: "cfa", label: "CFA" },
      { id: "ricp", label: "RICP" },
      { id: "chfc", label: "ChFC" },
      { id: "ea", label: "EA" },
      { id: "other", label: "Other" },
    ],
    context: { title: "Credibility Signals", body: "Credentials are trust accelerators in your ads and funnel copy. A CFP® + CPA combination is a powerful differentiator — the system will emphasize this in generated content. The right credentials also affect which ad angles the system recommends." },
  },
  {
    id: "compliance",
    ai: "Last one. How conservative is your compliance team? This controls how bold your generated content can be.",
    type: "slider",
    labels: ["Conservative", "Moderate", "Aggressive"],
    descriptions: [
      "Maximum caution. No implied performance, heavy disclaimers.",
      "Standard compliant. Directional outcomes, professional tone.",
      "Comfortable pushing the line. Bolder claims, less hedging.",
    ],
    context: { title: "Compliance Calibration", body: "This setting affects EVERY piece of content the system generates. Conservative firms get more hedged language and heavier disclaimers. Aggressive firms get more direct messaging. You can adjust this per campaign later — this sets the default." },
  },
  {
    id: "upload",
    ai: "Optional: Have any existing marketing materials, client presentations, or compliance docs you'd like me to analyze? Drop them here, or skip to continue.",
    type: "upload",
    context: { title: "Bonus Context", body: "If you have existing materials (pitch decks, one-pagers, compliance guidelines, old ad copy), the AI can analyze them to better match your existing brand voice and stay within your compliance boundaries. Not required — but improves output quality." },
  },
  {
    id: "complete",
    ai: "That's everything I need. I'm now building your Marketing Blueprint — your strategic foundation for every campaign. This takes about 15 seconds.",
    type: "complete",
    context: { title: "Blueprint Generation", body: "The system is processing your firm profile, website analysis, client data, and credentials through the AI engine to generate: ICP profile, ad angles, education topics, targeting strategy, and strategy rationale. Once generated, you'll review and approve it before any content gets created." },
  },
];

const C = {
  bg: "#0a0a0c",
  panel: "#111115",
  card: "#18181e",
  border: "#1e1e26",
  borderLight: "#2a2a34",
  text: "#e4e4e7",
  muted: "#71717a",
  dim: "#52525b",
  accent: "#3b82f6",
  accentDark: "#1d4ed8",
  accentBg: "#172554",
  green: "#22c55e",
  greenBg: "#14532d",
  purple: "#a78bfa",
  userBubble: "#1e3a5f",
};

export default function OnboardingChat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [selections, setSelections] = useState({});
  const [inputVal, setInputVal] = useState("");
  const [rangeVal, setRangeVal] = useState([55, 70]);
  const [sliderVal, setSliderVal] = useState(1);
  const [prefillVal, setPrefillVal] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const step = STEPS[currentStep];

  useEffect(() => {
    if (step && step.ai && step.type !== "analysis") {
      const exists = messages.find(m => m.stepId === step.id && m.sender === "ai");
      if (!exists) {
        setMessages(prev => [...prev, { stepId: step.id, sender: "ai", text: step.ai }]);
      }
    }
    if (step && step.type === "prefilled_text") {
      setPrefillVal(step.prefill);
    }
    if (step && step.type === "analysis") {
      setAnalyzing(true);
      const msgs = [
        { text: "Analyzing your website...", delay: 0 },
        { text: "Extracting services and positioning...", delay: 1200 },
        { text: "Identifying client signals and credentials...", delay: 2400 },
        { text: "Building your firm profile...", delay: 3600 },
      ];
      msgs.forEach(({ text, delay }) => {
        setTimeout(() => {
          setMessages(prev => [...prev, { stepId: step.id, sender: "system", text }]);
        }, delay);
      });
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisDone(true);
        setMessages(prev => [...prev, { stepId: step.id, sender: "system", text: "✓ Analysis complete. I found 12 data points from your site.", done: true }]);
        setTimeout(() => advance(), 800);
      }, 5000);
    }
    if (step && step.type === "upload") {
      setShowUploadZone(true);
    }
    if (step && step.type === "complete") {
      setGenerating(true);
      setTimeout(() => setGenerating(false), 3000);
    }
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function advance() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelections({});
      setInputVal("");
      setShowUploadZone(false);
    }
  }

  function handleSubmitText() {
    if (!inputVal.trim()) return;
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: inputVal }]);
    setInputVal("");
    setTimeout(() => advance(), 400);
  }

  function handleSubmitPrefill() {
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: prefillVal }]);
    setTimeout(() => advance(), 400);
  }

  function toggleSelection(id) {
    setSelections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleChoiceSubmit() {
    const selected = Object.entries(selections).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) return;
    const labels = step.options.filter(o => selected.includes(o.id)).map(o => o.label);
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: labels.join(", ") }]);
    setSelections({});
    setTimeout(() => advance(), 400);
  }

  function handleSingleChoice(opt) {
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: opt.label }]);
    setTimeout(() => advance(), 400);
  }

  function handleRangeSubmit() {
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: `${rangeVal[0]} – ${rangeVal[1]} years old` }]);
    setTimeout(() => advance(), 400);
  }

  function handleSliderSubmit() {
    const labels = ["Conservative", "Moderate", "Aggressive"];
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: labels[sliderVal] }]);
    setTimeout(() => advance(), 400);
  }

  function handleSkip() {
    setMessages(prev => [...prev, { stepId: step.id, sender: "user", text: "Skipped" }]);
    setTimeout(() => advance(), 400);
  }

  const contextData = step?.context;
  const progress = Math.round(((currentStep) / (STEPS.length - 1)) * 100);

  return (
    <div style={{ height: "100vh", display: "flex", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── MAIN CHAT AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>A</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Growth OS Onboarding</div>
              <div style={{ fontSize: 11, color: C.muted }}>Setting up your firm profile</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 200, height: 4, borderRadius: 2, background: C.card }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: C.dim, minWidth: 30 }}>{progress}%</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                {msg.sender === "ai" && (
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginRight: 10, marginTop: 2 }}>A</div>
                )}
                {msg.sender === "system" && (
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: msg.done ? C.greenBg : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                    {msg.done ? "✓" : <span style={{ display: "inline-block", width: 12, height: 12, border: `2px solid ${C.muted}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
                  </div>
                )}
                <div style={{
                  maxWidth: "80%",
                  padding: msg.sender === "system" ? "8px 0" : "12px 16px",
                  borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : msg.sender === "system" ? 0 : "16px 16px 16px 4px",
                  background: msg.sender === "user" ? C.userBubble : msg.sender === "system" ? "transparent" : C.card,
                  border: msg.sender === "system" ? "none" : `1px solid ${msg.sender === "user" ? "transparent" : C.border}`,
                  fontSize: 14, lineHeight: 1.6,
                  color: msg.sender === "system" ? (msg.done ? C.green : C.muted) : C.text,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Analysis animation */}
            {step?.type === "analysis" && analyzing && (
              <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%", background: C.accent,
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Generating blueprint */}
            {step?.type === "complete" && generating && (
              <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, margin: "0 auto 12px", border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: 13, color: C.muted }}>Building your Marketing Blueprint...</div>
                </div>
              </div>
            )}
            {step?.type === "complete" && !generating && (
              <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                <button style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>
                  View Your Marketing Blueprint →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── INPUT AREA ── */}
        {step && step.type !== "analysis" && step.type !== "auto" && step.type !== "complete" && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "0 24px 20px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>

              {/* ── MODULAR CHOICES (float above the input bar) ── */}
              <div style={{ padding: "14px 0 10px" }}>

                {/* Multi choice */}
                {step.type === "multi_choice" && (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                      {step.options.map(opt => {
                        const sel = selections[opt.id] || opt.preSelected && selections[opt.id] === undefined;
                        return (
                          <button key={opt.id} onClick={() => toggleSelection(opt.id)} style={{
                            padding: opt.desc ? "10px 16px" : "8px 16px", borderRadius: 10,
                            border: `1.5px solid ${sel ? C.accent : C.borderLight}`,
                            background: sel ? C.accentBg : "transparent",
                            color: sel ? C.accent : C.text, cursor: "pointer", textAlign: "left",
                            transition: "all 0.15s",
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                            {opt.desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{opt.desc}</div>}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleChoiceSubmit} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Continue</button>
                  </div>
                )}

                {/* Single choice */}
                {step.type === "single_choice" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {step.options.map(opt => (
                      <button key={opt.id} onClick={() => handleSingleChoice(opt)} style={{
                        padding: "10px 20px", borderRadius: 10,
                        border: `1.5px solid ${C.borderLight}`, background: "transparent",
                        color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.background = C.accentBg; }}
                      onMouseLeave={e => { e.target.style.borderColor = C.borderLight; e.target.style.background = "transparent"; }}
                      >{opt.label}</button>
                    ))}
                  </div>
                )}

                {/* Range slider */}
                {step.type === "range" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{rangeVal[0]} – {rangeVal[1]}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>years old</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                      <input type="range" min={step.min} max={step.max} value={rangeVal[0]} onChange={e => setRangeVal([Math.min(+e.target.value, rangeVal[1] - 1), rangeVal[1]])}
                        style={{ flex: 1, accentColor: C.accent }} />
                      <input type="range" min={step.min} max={step.max} value={rangeVal[1]} onChange={e => setRangeVal([rangeVal[0], Math.max(+e.target.value, rangeVal[0] + 1)])}
                        style={{ flex: 1, accentColor: C.accent }} />
                    </div>
                    <button onClick={handleRangeSubmit} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Continue</button>
                  </div>
                )}

                {/* Compliance slider */}
                {step.type === "slider" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      {step.labels.map((l, i) => (
                        <span key={l} style={{ fontSize: 12, fontWeight: sliderVal === i ? 600 : 400, color: sliderVal === i ? (i === 0 ? C.green : i === 1 ? "#f59e0b" : "#ef4444") : C.dim }}>{l}</span>
                      ))}
                    </div>
                    <input type="range" min={0} max={2} value={sliderVal} onChange={e => setSliderVal(+e.target.value)}
                      style={{ width: "100%", accentColor: sliderVal === 0 ? C.green : sliderVal === 1 ? "#f59e0b" : "#ef4444", marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, padding: "8px 12px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                      {step.descriptions[sliderVal]}
                    </div>
                    <button onClick={handleSliderSubmit} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Continue</button>
                  </div>
                )}

                {/* Prefilled text */}
                {step.type === "prefilled_text" && (
                  <div>
                    <textarea value={prefillVal} onChange={e => setPrefillVal(e.target.value)}
                      style={{ width: "100%", minHeight: 80, padding: 14, borderRadius: 10, border: `1.5px solid ${C.borderLight}`, background: C.card, color: C.text, fontSize: 14, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={handleSubmitPrefill} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Looks Good</button>
                    </div>
                  </div>
                )}

                {/* Upload step specific prompt */}
                {step.type === "upload" && !showUploadZone && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowUploadZone(true)} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${C.borderLight}`, background: "transparent", color: C.text, fontSize: 13, cursor: "pointer" }}>Upload Files</button>
                    <button onClick={handleSkip} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Skip & Continue →</button>
                  </div>
                )}
              </div>

              {/* ── UPLOAD DROP ZONE (expands when attachment icon clicked) ── */}
              {showUploadZone && (
                <div style={{ marginBottom: 12, animation: "fadeIn 0.2s ease" }}>
                  <div style={{
                    border: `2px dashed ${C.borderLight}`, borderRadius: 14, padding: "28px 20px", textAlign: "center",
                    cursor: "pointer", background: `${C.card}80`, transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentBg + "40"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.background = `${C.card}80`; }}
                  >
                    <button onClick={() => setShowUploadZone(false)} style={{
                      position: "absolute", top: 8, right: 10, width: 24, height: 24, borderRadius: 6,
                      border: "none", background: "transparent", color: C.muted, cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drag & drop files here</div>
                    <div style={{ fontSize: 12, color: C.muted }}>or click to browse your files</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>PDF, DOCX, PPTX, images — up to 25MB each</div>
                  </div>
                  {step.type === "upload" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button onClick={handleSkip} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Continue Without Files →</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PERSISTENT INPUT BAR (always visible) ── */}
              <div style={{ display: "flex", alignItems: "center", background: C.card, border: `1.5px solid ${C.borderLight}`, borderRadius: 14, padding: "4px 4px 4px 6px", transition: "border-color 0.2s" }}>
                {/* Attachment / Upload icon */}
                <button onClick={() => setShowUploadZone(!showUploadZone)} title="Upload files" style={{
                  width: 38, height: 38, borderRadius: 8, border: "none",
                  background: showUploadZone ? C.accentBg : "transparent",
                  color: showUploadZone ? C.accent : C.muted,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s", flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && inputVal.trim() && handleSubmitText()}
                  placeholder={step.type === "text" || step.type === "url" ? step.placeholder : "Type a message or add context..."}
                  style={{ flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 14, outline: "none", padding: "10px 8px" }}
                />

                {/* Right-side icons */}
                <div style={{ display: "flex", gap: 2, padding: "2px", flexShrink: 0 }}>
                  {/* Voice input */}
                  <button title="Voice input" style={{
                    width: 38, height: 38, borderRadius: 8, border: "none", background: "transparent",
                    color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.muted}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>

                  {/* Send */}
                  <button onClick={() => inputVal.trim() && handleSubmitText()} title="Send" style={{
                    width: 38, height: 38, borderRadius: 8, border: "none",
                    background: inputVal.trim() ? C.accent : C.border,
                    color: inputVal.trim() ? "#fff" : C.dim,
                    cursor: inputVal.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-advance for welcome */}
        {step?.type === "auto" && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 24px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <button onClick={advance} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Let's Go →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTEXT SIDEBAR ── */}
      <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, background: C.panel, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Context</div>
        </div>
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {contextData && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: C.accent }}>{contextData.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{contextData.body}</div>
            </div>
          )}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Progress</div>
            {STEPS.filter(s => s.type !== "auto" && s.type !== "analysis").map((s, i) => {
              const stepIdx = STEPS.indexOf(s);
              const isDone = stepIdx < currentStep;
              const isCurrent = stepIdx === currentStep;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                    background: isDone ? C.greenBg : isCurrent ? C.accentBg : "transparent",
                    color: isDone ? C.green : isCurrent ? C.accent : C.dim,
                    border: isDone || isCurrent ? "none" : `1px solid ${C.border}`,
                  }}>{isDone ? "✓" : ""}</div>
                  <span style={{ fontSize: 11, color: isDone ? C.muted : isCurrent ? C.text : C.dim, fontWeight: isCurrent ? 500 : 400 }}>
                    {s.id === "name" ? "Basics" : s.id === "website" ? "Website" : s.id === "firm_description" ? "Description" : s.id === "service_model" ? "Services" : s.id === "aum_range" ? "Firm Size" : s.id === "client_type" ? "Clients" : s.id === "client_age" ? "Age Range" : s.id === "credentials" ? "Credentials" : s.id === "compliance" ? "Compliance" : s.id === "upload" ? "Documents" : s.id === "complete" ? "Blueprint" : s.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input[type="range"] { height: 4px; }
        input[type="range"]::-webkit-slider-thumb { width: 18px; height: 18px; }
        textarea:focus, input:focus { outline: none; border-color: ${C.accent} !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
