import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Type Definitions ──

type Status = "approved" | "in_review" | "generating" | "not_started" | "in_progress" | "locked";

interface Section {
  id: string;
  title: string;
  status: Status;
  content?: string | null;
  why: string;
  duration?: string;
  type?: string;
  messages?: number;
  timeline?: string;
}

interface Category {
  id: string;
  label: string;
  order: number;
  status: Status;
  description: string;
  progress: number;
  sections: Section[];
}

// ── Data ──

const campaignData = {
  name: "Denver Pre-Retirees — Tax Optimization — Q1 2026",
  firm: "Cornerstone Wealth Partners",
  icp: "Pre-Retirees, 55–67, Tax-Efficient Income",
} as const;

const categories: Category[] = [
  {
    id: "webinar",
    label: "Webinar / VSL Script",
    order: 1,
    status: "in_progress",
    description: "The destination. Everything drives here. Script your core educational content first — ads, funnels, and sequences all flow from this.",
    progress: 65,
    sections: [
      { id: "w1", title: "Opening Hook + Introduction", status: "approved", duration: "0:00 – 2:30", content: "\"Most people approaching retirement think their biggest financial risk is the stock market crashing. But there's a silent threat that could cost you tens of thousands more — and most people don't see it until it's too late.\n\nHi, I'm David Mitchell. I'm a CFP® and CPA who's spent the last 15 years helping people in the Denver area navigate the transition into retirement. And today I'm going to walk you through the three biggest mistakes I see pre-retirees make — and exactly how to avoid them.\n\nIf you're within 5 to 10 years of retirement, or you've recently retired and you're not sure if your current plan is optimized... this is going to be the most valuable 30 minutes you spend this month.\"", why: "The hook challenges a common assumption (stock market = biggest risk) to create curiosity. The introduction establishes credentials (CFP + CPA) immediately. The time qualifier ('5 to 10 years') filters for the exact ICP." },
      { id: "w2", title: "Topic 1: The Tax Time Bomb", status: "approved", duration: "2:30 – 12:00", content: "\"Here's what nobody tells you about your 401(k) and traditional IRA: every dollar in there has a tax bill attached to it. You haven't paid taxes on that money yet — and the IRS is going to collect.\n\nLet me show you what I mean. Say you've got $1.2 million in your traditional IRA. You might think of that as $1.2 million. But depending on your tax bracket in retirement, the IRS could take $250,000 to $400,000 of that. Your $1.2 million is really $800,000 to $950,000.\n\nNow here's where it gets interesting — and where most people make a critical mistake. There's a window of time, usually the 5 to 10 years before you turn 72 and Required Minimum Distributions kick in, where you have an opportunity to strategically convert portions of that money to a Roth IRA at a lower tax rate...\"", why: "Tax optimization is the #1 concern for this ICP. Leading with a specific dollar example ($1.2M → real value) makes it tangible. The 'window of time' creates urgency aligned with their life stage." },
      { id: "w3", title: "Topic 2: Social Security Optimization", status: "in_review", duration: "12:00 – 20:00", content: "\"The second biggest mistake I see is claiming Social Security at the wrong time. And I don't mean a little wrong — I mean leaving $100,000 or more on the table over your lifetime.\n\nThere are 567 different rules governing Social Security benefits. And the claiming decision intersects with everything else in your financial life — your tax strategy, your spouse's benefits, your pension, your healthcare coverage before Medicare kicks in.\n\nLet me walk you through three scenarios...\"", why: "Social Security is universally relevant to this ICP. The $100K figure creates urgency. Mentioning 567 rules positions professional help as necessary, not optional." },
      { id: "w4", title: "Topic 3: The Retirement Paycheck", status: "generating", duration: "20:00 – 28:00", content: null, why: "This section ties everything together — how to create predictable income from multiple sources (SS, IRA, Roth, pension, taxable accounts) while minimizing lifetime taxes." },
      { id: "w5", title: "CTA + Objection Handling", status: "not_started", duration: "28:00 – 32:00", content: null, why: "The transition from education to offer. Must feel natural, not salesy. Addresses top objections." },
      { id: "w6", title: "Pre-Webinar VSL (Short Version)", status: "not_started", duration: "2–3 min standalone", content: null, why: "Shown on the registration confirmation page. Captures high-intent prospects who want to book immediately." },
    ],
  },
  {
    id: "ads",
    label: "Ad Scripts",
    order: 2,
    status: "in_progress",
    description: "Traffic drivers. Scripted AFTER the webinar so messaging aligns with the destination. UGC-style: Hook — Relate — Educate — CTA.",
    progress: 40,
    sections: [
      { id: "a1", title: "Tax Time Bomb (SS Angle)", status: "approved", type: "UGC", content: "\"HOOK: Most retirees think their biggest risk is the stock market. It's not. The IRS is quietly taking more of your money than you realize.\n\nRELATE: If you've been saving into a 401(k) or traditional IRA for the last 20 or 30 years, you probably feel pretty good about that balance. But here's what your HR department never told you — every single dollar in that account has a tax bill attached to it.\n\nEDUCATE: There's a strategy called a Roth conversion ladder that lets you move money from your traditional IRA to a Roth IRA at a lower tax rate — but only if you do it during a specific window.\n\nCTA: I put together a free 30-minute training that walks through exactly how this works with real numbers. Link's in the bio.\"", why: "Leads with the contrarian hook from the webinar. The Roth conversion ladder is the core educational takeaway." },
      { id: "a2", title: "The Hidden IRA Tax Bill", status: "approved", type: "UGC", content: "\"HOOK: Your $1 million IRA isn't really worth $1 million. Here's what it's actually worth after the IRS takes their cut.\n\nRELATE: I talk to people every week who look at their retirement account balance and think that's their number. But if most of your savings are in traditional accounts, you haven't paid taxes on that money yet.\n\nEDUCATE: Depending on your tax bracket in retirement, the IRS could take 22% to 37% of your traditional IRA. That $1 million? It might really be $630,000 to $780,000.\n\nCTA: I break down exactly how this works in a free training. Takes about 30 minutes and could save you a fortune. Link below.\"", why: "Direct attack on the #1 pain point. Specific dollar amounts make it tangible and personal." },
      { id: "a3", title: "5-Year Window", status: "in_review", type: "UGC", content: "\"HOOK: The 5 years before and after retirement are the most important financial years of your life.\n\nRELATE: Everyone focuses on the big number — can I retire with enough? But almost nobody focuses on the TRANSITION.\n\nEDUCATE: I call this the Retirement Transition Window. Get it right, and you could save hundreds of thousands.\n\nCTA: I created a free training specifically for people in this window. 30 minutes, real examples, no sales pitch.\"", why: "Time-bound urgency. Speaks directly to pre-retirees approaching something big." },
      { id: "a4", title: "Retirement Paycheck", status: "generating", type: "Direct", content: null, why: "Aspirational angle — creating certainty and a predictable 'paycheck' from a complex mix of accounts." },
      { id: "a5", title: "Second Opinion", status: "not_started", type: "Educational", content: null, why: "Lower barrier offer. Appeals to people who already have an advisor." },
    ],
  },
  {
    id: "sequences",
    label: "Email / SMS Sequences",
    order: 3,
    status: "in_progress",
    description: "The follow-up engine. Nurture new leads, confirm appointments, recover no-shows, and drip long-term value to stay top of mind.",
    progress: 30,
    sections: [
      { id: "s1", title: "New Lead Nurture", status: "approved", messages: 6, timeline: "14 days", content: "\"EMAIL 1 — Sent immediately after registration:\nSubject: Your training is ready — here's what to expect\n\nHi [First Name],\n\nThanks for registering. Your training is ready to watch anytime.\n\n→ Watch now: [link]\n\n---\n\nEMAIL 2 — Day 2:\nSubject: The IRA math most people get wrong\n\nQuick question: if you have $1 million in a traditional IRA, how much of that is actually yours?\n\n---\n\nEMAIL 3-6: Continue with SS-focused value, case study, soft pitch, final value-driven email.\"", why: "First touch after registration. Each email delivers standalone value while building toward a booking." },
      { id: "s2", title: "Appointment Confirmation", status: "in_review", messages: 3, timeline: "Booking to Meeting", content: "\"EMAIL 1 — Immediately after booking:\nSubject: You're confirmed — here's how to prepare\n\nEMAIL 2 — 24 hours before:\nSubject: Quick reminder — we meet tomorrow\n\nEMAIL 3 — 1 hour before:\nSubject: See you in 1 hour\"", why: "Confirm, prepare, remind. Setting expectations reduces anxiety and increases show rates." },
      { id: "s3", title: "Show-Up Sequence", status: "not_started", messages: 3, timeline: "24hrs before", content: null, why: "Pre-meeting prep via SMS. Sets expectations, builds anticipation." },
      { id: "s4", title: "No-Show Recovery", status: "not_started", messages: 3, timeline: "48hrs post", content: null, why: "Re-engage without being pushy. Offer to reschedule, acknowledge life happens." },
      { id: "s5", title: "Long-Term Nurture", status: "not_started", messages: 10, timeline: "90 days", content: null, why: "For leads who don't book. Drip value, case studies, social proof over 90 days." },
    ],
  },
  {
    id: "confirmation_video",
    label: "Appointment Confirmation Video",
    order: 4,
    status: "in_progress",
    description: "A personalized video sent after someone books an appointment. Builds trust, sets expectations for the meeting, and reduces no-shows.",
    progress: 45,
    sections: [
      { id: "cv1", title: "Opening — Personal Welcome", status: "approved", duration: "0:00 – 0:30", content: "\"Hey [First Name], it's David Mitchell from Cornerstone Wealth Partners. I just saw that you booked a Retirement Readiness Review with me — and I wanted to take 60 seconds to personally thank you and tell you what to expect.\n\nThis isn't a sales call. This is a real conversation about your money, your goals, and whether there's a smarter path to get you there.\"", why: "Personal touch immediately after booking creates connection and reduces buyer's remorse. Using their first name and acknowledging the action they just took builds trust." },
      { id: "cv2", title: "What to Expect", status: "in_review", duration: "0:30 – 1:15", content: "\"Here's what we'll cover in our 30 to 45 minutes together:\n\nFirst, I'll ask you a few questions about where you are right now — your accounts, your timeline, your goals. Nothing complicated.\n\nThen I'll walk you through a quick analysis of your current tax exposure and Social Security timing. Most people are surprised by what they find.\n\nAnd at the end, I'll be honest with you — if I think I can help, I'll tell you how. If I don't think we're the right fit, I'll tell you that too. Either way, you'll leave with more clarity than you came in with.\"", why: "Removes uncertainty about what the meeting will be like. The 'I'll be honest' line builds credibility and lowers defenses." },
      { id: "cv3", title: "Quick Prep + Close", status: "generating", duration: "1:15 – 1:45", content: null, why: "Gives them one simple thing to prepare (rough account balances) so the meeting is more productive. Closes with warmth and anticipation." },
    ],
  },
];

const statusLabel: Record<Status, string> = {
  approved: "Approved",
  in_review: "In Review",
  generating: "Generating",
  not_started: "Not Started",
  in_progress: "In Progress",
  locked: "Locked",
};

const statusColor: Record<Status, string> = {
  approved: "#50e3c2",
  in_review: "#f5a623",
  generating: "#ededed",
  not_started: "#555",
  in_progress: "#ededed",
  locked: "#555",
};

// ── Loading Screen Steps ──

const loadingSteps = [
  { label: "Analyzing your marketing blueprint", duration: 2200 },
  { label: "Mapping ICP pain points to content angles", duration: 1800 },
  { label: "Building webinar script framework", duration: 2400 },
  { label: "Generating ad scripts from core messaging", duration: 2000 },
  { label: "Drafting email and SMS nurture flows", duration: 1800 },
  { label: "Scripting appointment confirmation video", duration: 1400 },
  { label: "Aligning compliance guidelines", duration: 1200 },
  { label: "Finalizing content studio", duration: 1400 },
];

// ── Loading Screen Component ──

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let stepIdx = 0;
    let totalElapsed = 0;
    const totalDuration = loadingSteps.reduce((s, st) => s + st.duration, 0);

    function runStep() {
      if (stepIdx >= loadingSteps.length) {
        setProgress(100);
        setFadeOut(true);
        setTimeout(() => onCompleteRef.current(), 600);
        return;
      }

      setCurrentStep(stepIdx);

      const dur = loadingSteps[stepIdx].duration;
      const tickInterval = 50;
      let elapsed = 0;

      const ticker = setInterval(() => {
        elapsed += tickInterval;
        totalElapsed += tickInterval;
        setProgress(Math.min((totalElapsed / totalDuration) * 100, 100));

        if (elapsed >= dur) {
          clearInterval(ticker);
          stepIdx++;
          runStep();
        }
      }, tickInterval);
    }

    runStep();
  }, []);

  return (
    <div className="cs-root" style={{ opacity: fadeOut ? 0 : 1, transition: "opacity 0.6s ease" }}>
      <style>{loadingStyles}</style>
      <div className="cs-loading-container">
        <div className="cs-loading-brand">
          <div className="cs-loading-logo">A</div>
          <h1 className="cs-loading-title">Building Your Content Studio</h1>
          <p className="cs-loading-subtitle">
            Creating personalized marketing content from your approved blueprint
          </p>
        </div>

        <div className="cs-loading-steps">
          {loadingSteps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className="cs-loading-step"
                style={{
                  opacity: isDone ? 0.5 : isActive ? 1 : 0.25,
                  color: isDone ? "#888" : isActive ? "#ededed" : "#555",
                }}
              >
                <div className="cs-step-indicator">
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50e3c2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : isActive ? (
                    <div className="cs-step-spinner" />
                  ) : (
                    <div className="cs-step-dot" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="cs-loading-progress-row">
          <div className="cs-loading-track">
            <div className="cs-loading-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="cs-loading-pct">{Math.round(progress)}%</span>
        </div>

        <div className="cs-loading-campaign">{campaignData.name}</div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function ContentStudio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [editText, setEditText] = useState("");

  // Chat state
  interface ChatMessage { sender: "user" | "ai"; text: string; }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Your content is being generated. I can help you edit sections, adjust tone, add specifics, or answer questions about the strategy behind any piece of content." },
  ]);
  const [aiThinking, setAiThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const activeCat = categories.find(c => c.id === activeCategory);

  const suggestedPrompts = editingSection ? [
    "Make the opening hook stronger",
    "Add more specific data points",
    "Make this more conversational",
    "Shorten this section",
    "Strengthen the CTA",
  ] : activeCategory ? [
    "Generate all remaining sections",
    "What's the strategy behind this category?",
    "Review what's been approved so far",
    "Suggest improvements to the approved content",
  ] : [
    "Walk me through the content strategy",
    "What should I review first?",
    "How does the webinar connect to the ads?",
    "What's left to generate?",
    "Suggest changes to improve conversion",
  ];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiThinking]);

  function handleChatSend(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg || aiThinking) return;
    setChatMessages(prev => [...prev, { sender: "user", text: msg }]);
    setChatInput("");
    setAiThinking(true);

    const lower = msg.toLowerCase();

    let response = "I've reviewed your request. Let me make those adjustments — you'll see the updated content reflected in the editor. Is there anything else you'd like to refine?";

    if (lower.includes("strategy") || lower.includes("walk me through") || lower.includes("connect")) {
      response = "The content flows in a specific order: the webinar is the core educational asset — everything else references and reinforces it. Ad scripts pull hooks and angles directly from the webinar topics. Email sequences nurture leads toward booking, and the confirmation video builds trust to reduce no-shows. Each piece is designed to move the prospect one step closer to a meeting.";
    } else if (lower.includes("review first") || lower.includes("prioritize")) {
      response = "Start with the webinar script — it's the foundation. Review the approved sections to make sure the messaging feels authentic to you, then check the sections still in review. Once the webinar is locked, the ad scripts and sequences will be easier to finalize since they pull directly from the webinar content.";
    } else if (lower.includes("hook") || lower.includes("opening")) {
      response = "I can strengthen the opening hook. The current version leads with a contrarian take — challenging the assumption that the stock market is the biggest risk. I can make it more direct, more emotional, or more data-driven. Which direction feels right for your audience?";
    } else if (lower.includes("conversational") || lower.includes("tone")) {
      response = "I'll adjust the tone to feel more like a one-on-one conversation. That means shorter sentences, more contractions, and a rhythm that sounds like you're talking to someone across a table — not reading from a script. I'll preserve the key data points and structure.";
    } else if (lower.includes("shorten")) {
      response = "I'll tighten this up — cutting redundant phrases and getting to the point faster without losing the core message. The goal is to keep every sentence earning its place. I'll have the revised version ready for you to review.";
    } else if (lower.includes("cta") || lower.includes("call to action")) {
      response = "The CTA can be strengthened by adding a specific outcome they'll get from taking action. Instead of a generic 'book a call,' we can frame it as getting clarity on a specific number — like their true after-tax retirement income. That makes the next step feel valuable, not just transactional.";
    } else if (lower.includes("data") || lower.includes("specific")) {
      response = "I'll add more concrete numbers and examples. The more specific the data, the more credible it feels. I'll pull from common scenarios for your ICP — tax brackets, account sizes, Social Security timing windows — to make every point tangible.";
    } else if (lower.includes("generate") || lower.includes("remaining")) {
      response = "I'll start generating the remaining sections now. Each one will follow the same strategy framework — tailored to your ICP, aligned with the approved content, and written in your voice. I'll notify you as each section is ready for review.";
    } else if (lower.includes("left") || lower.includes("what's left")) {
      const notStarted = categories.flatMap(c => c.sections.filter(s => s.status === "not_started"));
      const generating = categories.flatMap(c => c.sections.filter(s => s.status === "generating"));
      response = `You have ${generating.length} section${generating.length !== 1 ? "s" : ""} currently generating and ${notStarted.length} section${notStarted.length !== 1 ? "s" : ""} not yet started. The generating sections should be ready shortly. Want me to queue up the remaining ones?`;
    }

    setTimeout(() => {
      setAiThinking(false);
      setChatMessages(prev => [...prev, { sender: "ai", text: response }]);
    }, 1500 + Math.random() * 1500);
  }

  function handleLoadingComplete() {
    setLoading(false);
    requestAnimationFrame(() => setFadeIn(true));
  }

  function openEditor(section: Section) {
    setEditingSection(section);
    setEditText(section.content || "");
  }

  function closeEditor() {
    setEditingSection(null);
    setEditText("");
    setChatInput("");
  }

  function renderChatSidebar() {
    // Context block at the top — changes based on what's selected
    let contextBlock: React.ReactNode = null;

    if (editingSection) {
      contextBlock = (
        <div className="cs-chat-context">
          <div className="cs-dim-label">Editing</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{editingSection.title}</div>
          {editingSection.duration && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{editingSection.duration}</div>}
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 8 }}>{editingSection.why}</div>
        </div>
      );
    } else if (activeCategory && activeCat) {
      const sec = expandedSection ? activeCat.sections.find(s => s.id === expandedSection) : null;
      contextBlock = (
        <div className="cs-chat-context">
          {sec ? (
            <>
              <div className="cs-dim-label">Selected Section</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{sec.title}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 6 }}>{sec.why}</div>
            </>
          ) : (
            <>
              <div className="cs-dim-label">Category</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{activeCat.label}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 6 }}>{activeCat.description}</div>
            </>
          )}
        </div>
      );
    }

    return (
      <aside className="cs-chat">
        <div className="cs-chat-header">
          <div className="cs-chat-avatar">A</div>
          <div>
            <div className="cs-chat-title">Content Assistant</div>
            <div className="cs-chat-status">Online</div>
          </div>
        </div>

        <div ref={chatScrollRef} className="cs-chat-messages">
          {contextBlock}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`cs-chat-msg cs-chat-msg--${msg.sender}`}>
              {msg.sender === "ai" && <div className="cs-chat-msg-avatar">A</div>}
              <div className={`cs-chat-bubble cs-chat-bubble--${msg.sender}`}>{msg.text}</div>
            </div>
          ))}

          {aiThinking && (
            <div className="cs-chat-msg cs-chat-msg--ai">
              <div className="cs-chat-msg-avatar">A</div>
              <div className="cs-chat-bubble cs-chat-bubble--ai">
                <div className="cs-thinking-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          {chatMessages.length <= 1 && !aiThinking && (
            <div className="cs-chat-prompts">
              <div className="cs-dim-label" style={{ marginBottom: 10 }}>Suggested</div>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => handleChatSend(p)} className="cs-chat-prompt">{p}</button>
              ))}
            </div>
          )}
        </div>

        <div className="cs-chat-input-wrap">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && chatInput.trim() && handleChatSend()}
            placeholder="Ask about your content..."
            className="cs-chat-input"
          />
          <button
            onClick={() => chatInput.trim() && handleChatSend()}
            className={`cs-chat-send ${chatInput.trim() ? "cs-chat-send--active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </aside>
    );
  }

  if (loading) return <LoadingScreen onComplete={handleLoadingComplete} />;

  return (
    <div className="cs-root" style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.5s ease" }}>
      <style>{studioStyles}</style>

      {/* ── SIDEBAR ── */}
      <div className="cs-sidebar">
        <div className="cs-sidebar-header">
          <button className="cs-back-arrow" onClick={() => navigate("/amplify-os/blueprint")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="cs-sidebar-title">Content Studio</div>
            <div className="cs-sidebar-sub">Campaign assets</div>
          </div>
        </div>

        <div className="cs-sidebar-nav">
          <div className="cs-sidebar-label">Creation Order</div>

          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`cs-nav-btn ${isActive ? "cs-nav-btn--active" : ""}`}
                onClick={() => isActive ? setActiveCategory(null) : (setActiveCategory(cat.id), setExpandedSection(null), setEditingSection(null))}
              >
                <div className="cs-nav-order">{idx + 1}</div>
                <div className="cs-nav-info">
                  <div className="cs-nav-name">{cat.label}</div>
                  <div className="cs-nav-meta">
                    {cat.status !== "locked" && cat.status !== "not_started" && (
                      <div className="cs-nav-track">
                        <div className="cs-nav-fill" style={{ width: `${cat.progress}%` }} />
                      </div>
                    )}
                    <span style={{ color: statusColor[cat.status] }}>{statusLabel[cat.status]}</span>
                  </div>
                </div>
              </button>
            );
          })}

          <div style={{ padding: "20px 8px 4px" }}>
            <div className="cs-sidebar-label" style={{ marginBottom: 8 }}>Other</div>
            {["Funnel Builder", "Content Library", "Deployment"].map(item => (
              <div key={item} className="cs-sidebar-other-item">{item}</div>
            ))}
          </div>
        </div>

        <div className="cs-sidebar-footer">
          <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{campaignData.firm}</div>
          <div style={{ fontSize: 10, color: "#555", opacity: 0.6 }}>{campaignData.icp}</div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="cs-main">

        {/* OVERVIEW */}
        {!activeCategory && !editingSection && (
          <div className="cs-split">
            <div className="cs-scroll-area" style={{ flex: 1 }}>
              <div className="cs-content-max">
                <div style={{ marginBottom: 32 }}>
                  <h1 className="cs-page-title">Content Studio</h1>
                  <p className="cs-page-sub">{campaignData.name}</p>
                </div>

                <div className="cs-overview-grid">
                  {categories.map(cat => {
                    const approved = cat.sections.filter(s => s.status === "approved").length;
                    return (
                      <div key={cat.id} className="cs-overview-card" onClick={() => (setActiveCategory(cat.id), setExpandedSection(null))}>
                        <div className="cs-overview-card-bar">
                          <div style={{ width: `${cat.progress}%`, height: "100%", background: "#ededed", transition: "width 0.5s" }} />
                        </div>
                        <div className="cs-overview-card-top">
                          <div className="cs-overview-card-order">{cat.order}</div>
                          <span className="cs-tag" style={{ color: statusColor[cat.status] }}>{statusLabel[cat.status]}</span>
                        </div>
                        <div className="cs-overview-card-title">{cat.label}</div>
                        <div className="cs-overview-card-desc">{cat.description}</div>
                        <div className="cs-overview-card-meta">{approved}/{cat.sections.length} sections approved</div>
                      </div>
                    );
                  })}
                </div>

                <div className="cs-card">
                  <div className="cs-card-title">Why this order?</div>
                  <div className="cs-order-flow">
                    {categories.map((cat, i) => (
                      <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="cs-order-chip">
                          <span className="cs-order-chip-num">{cat.order}</span>
                          <span>{cat.label.split("/")[0].split("(")[0].trim()}</span>
                        </div>
                        {i < categories.length - 1 && <span style={{ color: "#555" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 12, lineHeight: 1.6 }}>
                    The webinar is the destination — ads drive traffic to it. Sequences nurture and convert leads after they register. The confirmation video reduces no-shows and builds trust before the first meeting. Each step builds context for the next.
                  </div>
                </div>
              </div>
            </div>

            {/* Chat sidebar */}
            {renderChatSidebar()}
          </div>
        )}

        {/* CATEGORY VIEW */}
        {activeCategory && !editingSection && activeCat && (
          <div className="cs-split">
            <div className="cs-scroll-area" style={{ flex: 1 }}>
              <div className="cs-section-max">
                <button className="cs-text-btn" onClick={() => setActiveCategory(null)} style={{ marginBottom: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                  Back
                </button>

                <h2 className="cs-section-heading">{activeCat.label}</h2>
                <p className="cs-section-desc">{activeCat.description}</p>

                <div className="cs-progress-row">
                  <div className="cs-progress-track">
                    <div className="cs-progress-fill" style={{ width: `${activeCat.progress}%` }} />
                  </div>
                  <span className="cs-progress-label">
                    {activeCat.sections.filter(s => s.status === "approved").length}/{activeCat.sections.length} approved
                  </span>
                </div>

                {activeCat.sections.map((section, idx) => {
                  const isExpanded = expandedSection === section.id;
                  const hasContent = !!section.content;
                  return (
                    <div key={section.id} className={`cs-expandable ${isExpanded ? "cs-expandable--open" : ""}`} style={{ marginBottom: 8 }}>
                      <div className="cs-expand-header" onClick={() => setExpandedSection(isExpanded ? null : section.id)}>
                        <div className="cs-rank">{idx + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cs-expand-title">{section.title}</div>
                          <div className="cs-expand-meta">
                            {section.duration && <span>{section.duration}</span>}
                            {section.type && <span className="cs-type-tag">{section.type}</span>}
                            {section.messages && <span>{section.messages} messages · {section.timeline}</span>}
                          </div>
                        </div>
                        <span className="cs-tag" style={{ color: statusColor[section.status] }}>{statusLabel[section.status]}</span>
                        <span className={`cs-chevron ${isExpanded ? "cs-chevron--open" : ""}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="cs-expand-body">
                          {hasContent ? (
                            <>
                              <div className="cs-preview">
                                {section.content!.slice(0, 500)}{section.content!.length > 500 ? "..." : ""}
                                <div className="cs-preview-fade" />
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                <button className="cs-btn-primary" onClick={(e) => { e.stopPropagation(); openEditor(section); }}>Open Editor</button>
                                {section.status !== "approved" && (
                                  <button className="cs-btn-secondary" style={{ color: "#50e3c2", borderColor: "#50e3c233" }}>Approve</button>
                                )}
                              </div>
                            </>
                          ) : section.status === "generating" ? (
                            <div className="cs-generating-row">
                              <div className="cs-spinner" />
                              <span>AI is generating this section...</span>
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                              <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>This section hasn't been generated yet.</div>
                              <button className="cs-btn-secondary">Generate This Section</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeCat.sections.some(s => s.status === "not_started") && (
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <button className="cs-btn-primary">Generate All Remaining Sections</button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat sidebar */}
            {renderChatSidebar()}
          </div>
        )}

        {/* EDITOR VIEW */}
        {editingSection && (
          <div className="cs-split">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="cs-editor-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button className="cs-text-btn" onClick={closeEditor}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                    Back
                  </button>
                  <span style={{ color: "#333" }}>·</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{editingSection.title}</span>
                  {editingSection.duration && <span className="cs-type-tag">{editingSection.duration}</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="cs-btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }}>Version History</button>
                  {editingSection.status !== "approved" && (
                    <button className="cs-btn-primary" style={{ padding: "6px 14px", fontSize: 12, background: "#50e3c2", color: "#0a0a0a" }}>Approve Section</button>
                  )}
                </div>
              </div>

              <div className="cs-scroll-area" style={{ flex: 1 }}>
                <div style={{ maxWidth: 660, margin: "0 auto", padding: "24px 32px" }}>
                  {activeCat && (
                    <div className="cs-editor-cat-label">{activeCat.label}</div>
                  )}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="cs-editable"
                    dangerouslySetInnerHTML={{ __html: editText.replace(/\n/g, "<br>") }}
                  />
                </div>
              </div>
            </div>

            {/* Chat sidebar */}
            {renderChatSidebar()}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──

const loadingStyles = `
  .cs-root {
    min-height: 100vh;
    background: #0a0a0a;
    color: #ededed;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cs-loading-container {
    width: 100%; max-width: 480px; padding: 0 24px;
    animation: cs-fadeUp 0.6s ease;
  }

  .cs-loading-brand { text-align: center; margin-bottom: 40px; }

  .cs-loading-logo {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px;
    background: #ededed; color: #0a0a0a;
    font-size: 15px; font-weight: 700; margin-bottom: 20px;
  }

  .cs-loading-title { font-size: 20px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.02em; }
  .cs-loading-subtitle { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }

  .cs-loading-steps {
    background: #111; border: 1px solid #1f1f1f; border-radius: 12px;
    padding: 18px 22px; margin-bottom: 24px;
  }

  .cs-loading-step {
    display: flex; align-items: center; gap: 12px;
    padding: 7px 0; font-size: 13px; transition: opacity 0.3s, color 0.3s;
  }

  .cs-step-indicator {
    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .cs-step-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid #1f1f1f; border-top-color: #ededed;
    animation: cs-spin 0.7s linear infinite;
  }

  .cs-step-dot { width: 5px; height: 5px; border-radius: 50%; background: #333; }

  .cs-loading-progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }

  .cs-loading-track { flex: 1; height: 4px; border-radius: 2px; background: #1f1f1f; overflow: hidden; }

  .cs-loading-fill {
    height: 100%; border-radius: 2px; background: #ededed;
    transition: width 0.15s ease;
  }

  .cs-loading-pct { font-size: 12px; font-weight: 600; color: #888; min-width: 32px; text-align: right; }

  .cs-loading-campaign { text-align: center; font-size: 11px; color: #555; }

  @keyframes cs-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cs-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const studioStyles = `
  .cs-root {
    height: 100vh; display: flex;
    background: #0a0a0a; color: #ededed;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .cs-sidebar {
    width: 240px; border-right: 1px solid #1f1f1f; background: #111;
    display: flex; flex-direction: column; flex-shrink: 0;
  }
  .cs-sidebar-header {
    padding: 16px; border-bottom: 1px solid #1f1f1f;
    display: flex; align-items: center; gap: 10px;
  }
  .cs-back-arrow {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid #1f1f1f;
    background: transparent; color: #888; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .cs-back-arrow:hover { border-color: #2e2e2e; color: #ededed; }
  .cs-sidebar-title { font-size: 14px; font-weight: 600; }
  .cs-sidebar-sub { font-size: 11px; color: #555; }
  .cs-sidebar-nav { padding: 12px 8px; flex: 1; overflow-y: auto; }
  .cs-sidebar-label {
    padding: 4px 8px; font-size: 10px; color: #555;
    text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; margin-bottom: 6px;
  }

  .cs-nav-btn {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px;
    margin-bottom: 2px; border-radius: 8px; border: none; text-align: left;
    cursor: pointer; background: transparent; color: #ededed; transition: all 0.15s;
  }
  .cs-nav-btn:hover { background: #1a1a1a; }
  .cs-nav-btn--active { background: #1a1a1a; }

  .cs-nav-order {
    width: 24px; height: 24px; border-radius: 6px; background: #1f1f1f;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #888; flex-shrink: 0;
  }
  .cs-nav-btn--active .cs-nav-order { background: #ededed; color: #0a0a0a; }

  .cs-nav-info { flex: 1; min-width: 0; }
  .cs-nav-name { font-size: 13px; font-weight: 500; color: #888; margin-bottom: 3px; }
  .cs-nav-btn--active .cs-nav-name { color: #ededed; font-weight: 600; }

  .cs-nav-meta { display: flex; align-items: center; gap: 6px; font-size: 10px; }
  .cs-nav-track { width: 48px; height: 3px; border-radius: 2px; background: #1f1f1f; }
  .cs-nav-fill { height: 100%; border-radius: 2px; background: #ededed; transition: width 0.3s; }

  .cs-sidebar-other-item {
    padding: 8px 12px; font-size: 13px; color: #555; border-radius: 6px; cursor: pointer;
  }
  .cs-sidebar-other-item:hover { color: #888; }

  .cs-sidebar-footer { padding: 12px 16px; border-top: 1px solid #1f1f1f; }

  /* ── Main ── */
  .cs-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .cs-scroll-area { overflow-y: auto; padding: 32px; }
  .cs-content-max { max-width: 900px; margin: 0 auto; animation: cs-fadeIn 0.3s ease; }
  .cs-section-max { max-width: 700px; margin: 0 auto; animation: cs-fadeIn 0.3s ease; }
  .cs-split { flex: 1; display: flex; overflow: hidden; }

  .cs-page-title { font-size: 22px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.02em; }
  .cs-page-sub { font-size: 13px; color: #666; margin: 0; }

  /* ── Overview cards ── */
  .cs-overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
  .cs-overview-card {
    background: #111; border: 1px solid #1f1f1f; border-radius: 12px;
    padding: 20px; cursor: pointer; transition: border-color 0.15s;
    position: relative; overflow: hidden;
  }
  .cs-overview-card:hover { border-color: #2e2e2e; }
  .cs-overview-card-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #1f1f1f; }
  .cs-overview-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .cs-overview-card-order {
    width: 32px; height: 32px; border-radius: 8px; background: #1a1a1a;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #ededed;
  }
  .cs-overview-card-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .cs-overview-card-desc { font-size: 12px; color: #888; line-height: 1.5; margin-bottom: 12px; }
  .cs-overview-card-meta { font-size: 11px; color: #555; }

  .cs-tag { font-size: 10px; font-weight: 600; }

  /* ── Card ── */
  .cs-card {
    background: #111; border: 1px solid #1f1f1f; border-radius: 12px;
    padding: 24px; transition: border-color 0.15s;
  }
  .cs-card:hover { border-color: #2e2e2e; }
  .cs-card-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; }

  .cs-order-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cs-order-chip {
    display: flex; align-items: center; gap: 8px; padding: 6px 14px;
    border-radius: 8px; border: 1px solid #1f1f1f; background: #1a1a1a;
    font-size: 12px; color: #ededed; font-weight: 500;
  }
  .cs-order-chip-num {
    width: 18px; height: 18px; border-radius: 4px; background: #2e2e2e;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }

  /* ── Dim label ── */
  .cs-dim-label {
    font-size: 11px; color: #555; text-transform: uppercase;
    letter-spacing: 0.04em; font-weight: 500;
  }

  /* ── Buttons ── */
  .cs-text-btn {
    background: transparent; border: none; color: #888; cursor: pointer;
    font-size: 13px; padding: 0; display: inline-flex; align-items: center; gap: 5px;
    transition: color 0.15s;
  }
  .cs-text-btn:hover { color: #ededed; }

  .cs-btn-primary {
    padding: 8px 20px; border-radius: 8px; border: none;
    background: #ededed; color: #0a0a0a; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
  }
  .cs-btn-primary:hover { background: #d4d4d4; }

  .cs-btn-secondary {
    padding: 8px 16px; border-radius: 8px; border: 1px solid #2e2e2e;
    background: transparent; color: #888; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .cs-btn-secondary:hover { border-color: #454545; color: #ededed; }

  /* ── Section heading ── */
  .cs-section-heading { font-size: 22px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.02em; }
  .cs-section-desc { font-size: 13px; color: #666; line-height: 1.6; margin: 0 0 24px; }

  /* ── Progress ── */
  .cs-progress-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
    padding: 12px 16px; background: #111; border-radius: 10px; border: 1px solid #1f1f1f;
  }
  .cs-progress-track { flex: 1; height: 4px; border-radius: 2px; background: #1f1f1f; }
  .cs-progress-fill { height: 100%; border-radius: 2px; background: #ededed; transition: width 0.5s; }
  .cs-progress-label { font-size: 12px; color: #888; flex-shrink: 0; }

  /* ── Expandable sections ── */
  .cs-expandable {
    background: #111; border: 1px solid #1f1f1f; border-radius: 12px;
    overflow: hidden; transition: border-color 0.15s;
  }
  .cs-expandable:hover { border-color: #2e2e2e; }
  .cs-expandable--open { border-color: #2e2e2e; }

  .cs-expand-header {
    padding: 14px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer;
  }
  .cs-rank {
    width: 32px; height: 32px; border-radius: 8px; background: #1a1a1a;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #888; flex-shrink: 0;
  }
  .cs-expand-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
  .cs-expand-meta { display: flex; gap: 8px; align-items: center; font-size: 11px; color: #555; }
  .cs-type-tag {
    font-size: 10px; padding: 2px 8px; border-radius: 6px;
    border: 1px solid #1f1f1f; color: #555; background: #0a0a0a;
  }
  .cs-chevron { color: #555; transition: transform 0.15s; flex-shrink: 0; display: flex; }
  .cs-chevron--open { transform: rotate(180deg); }

  .cs-expand-body { padding: 0 18px 18px; border-top: 1px solid #1a1a1a; padding-top: 16px; }

  .cs-preview {
    font-size: 13px; color: #ededed; line-height: 1.8; white-space: pre-wrap;
    max-height: 180px; overflow: hidden; position: relative;
  }
  .cs-preview-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
    background: linear-gradient(transparent, #111);
  }

  .cs-generating-row {
    display: flex; align-items: center; gap: 10px; padding: 12px 0;
    font-size: 13px; color: #888;
  }
  .cs-spinner {
    width: 16px; height: 16px; border: 2px solid #1f1f1f; border-top-color: #ededed;
    border-radius: 50%; animation: cs-spin 0.8s linear infinite;
  }

  /* ── Editor ── */
  .cs-editor-header {
    padding: 12px 24px; border-bottom: 1px solid #1f1f1f;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cs-editor-cat-label {
    font-size: 11px; font-weight: 600; color: #555; text-transform: uppercase;
    letter-spacing: 0.04em; margin-bottom: 16px;
  }
  .cs-editable {
    font-size: 15px; line-height: 2; color: #ededed; outline: none;
    white-space: pre-wrap; min-height: 300px; padding: 4px 0;
  }
  .cs-editable:focus { outline: none; }

  /* ── Chat Sidebar ── */
  .cs-chat {
    width: 380px; flex-shrink: 0; border-left: 1px solid #1f1f1f;
    display: flex; flex-direction: column; background: #0a0a0a;
  }
  .cs-chat-header {
    padding: 16px 20px; border-bottom: 1px solid #1f1f1f; flex-shrink: 0;
    display: flex; align-items: center; gap: 10px;
  }
  .cs-chat-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: #ededed; color: #0a0a0a;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
  }
  .cs-chat-title { font-size: 13px; font-weight: 600; }
  .cs-chat-status { font-size: 11px; color: #50e3c2; }

  .cs-chat-messages {
    flex: 1; overflow-y: auto; padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .cs-chat-messages::-webkit-scrollbar { width: 4px; }
  .cs-chat-messages::-webkit-scrollbar-track { background: transparent; }
  .cs-chat-messages::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }

  .cs-chat-context {
    padding: 14px 16px; background: #111; border: 1px solid #1f1f1f;
    border-radius: 10px; margin-bottom: 8px;
  }

  .cs-chat-msg {
    display: flex; gap: 8px; align-items: flex-start;
    animation: cs-fadeIn 0.3s ease;
  }
  .cs-chat-msg--user { justify-content: flex-end; }
  .cs-chat-msg--ai { justify-content: flex-start; }

  .cs-chat-msg-avatar {
    width: 24px; height: 24px; border-radius: 50%;
    background: #ededed; color: #0a0a0a;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
  }

  .cs-chat-bubble {
    max-width: 85%; font-size: 13px; line-height: 1.5;
    border-radius: 14px; padding: 10px 14px;
  }
  .cs-chat-bubble--ai {
    background: #1a1a1a; color: #ededed;
    border: 1px solid #1f1f1f; border-radius: 14px 14px 14px 4px;
  }
  .cs-chat-bubble--user {
    background: #ededed; color: #0a0a0a;
    border-radius: 14px 14px 4px 14px;
  }

  .cs-chat-prompts { padding: 4px 0; }

  .cs-chat-prompt {
    display: block; width: 100%; text-align: left;
    padding: 8px 12px; margin-bottom: 4px; border-radius: 8px;
    border: 1px solid #1f1f1f; background: transparent;
    color: #888; font-size: 12px; cursor: pointer; transition: all 0.15s;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }
  .cs-chat-prompt:hover { border-color: #2e2e2e; color: #ededed; background: #111; }

  .cs-chat-input-wrap {
    padding: 14px 16px; border-top: 1px solid #1f1f1f;
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .cs-chat-input {
    flex: 1; padding: 10px 14px; border-radius: 10px;
    border: 1px solid #2e2e2e; background: #111; color: #ededed;
    font-size: 13px; outline: none; transition: border-color 0.15s;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }
  .cs-chat-input:focus { border-color: #454545; }
  .cs-chat-input::placeholder { color: #555; }

  .cs-chat-send {
    width: 34px; height: 34px; border-radius: 8px; border: none;
    background: transparent; color: #555; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .cs-chat-send--active { background: #ededed; color: #0a0a0a; }
  .cs-chat-send--active:hover { background: #d4d4d4; }

  .cs-thinking-dots { display: flex; gap: 4px; align-items: center; }
  .cs-thinking-dots span {
    width: 6px; height: 6px; border-radius: 50%; background: #555;
    animation: cs-dot-bounce 1.2s infinite;
  }
  .cs-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
  .cs-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes cs-dot-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-4px); opacity: 1; }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 3px; }

  @keyframes cs-fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cs-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
