import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Avatar {
  label: string;
  ageRange: [number, number];
  incomeRange: string;
  netWorth: string;
  minimumAUM: string;
  lifeStage: string;
  occupation: string;
  decisionStyle: string;
}

interface PainPoint {
  rank: number;
  title: string;
  description: string;
  emotional: string;
  urgency: "High" | "Medium" | "Low";
}

interface DesiredOutcome {
  type: string;
  outcome: string;
}

type AngleCategory = "Tax" | "SS" | "Income" | "Cost" | "Urgency" | "Risk" | "Healthcare";

interface Angle {
  id: number;
  name: string;
  category: AngleCategory;
  hook: string;
  why: string;
}

interface EducationTopic {
  num: number;
  title: string;
  description: string;
}

interface Targeting {
  approach: string;
  geo: string;
  geoSecondary: string;
  interests: string[];
}

interface BlueprintData {
  firmName: string;
  advisorName: string;
  market: string;
  avatar: Avatar;
  painPoints: PainPoint[];
  desiredOutcomes: DesiredOutcome[];
  angles: Angle[];
  educationTopics: EducationTopic[];
  targeting: Targeting;
  complianceLevel: "Conservative" | "Moderate" | "Aggressive";
  tone: string;
}

type TabId = "icp" | "pain" | "angles" | "education" | "targeting" | "projections";

interface Tab {
  id: TabId;
  label: string;
}

interface CategoryColor {
  bg: string;
  text: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const mockData: BlueprintData = {
  firmName: "Cornerstone Wealth Partners",
  advisorName: "David Mitchell, CFP®, CPA",
  market: "Denver Metro Area",
  avatar: {
    label: "Pre-Retirees Seeking Tax-Efficient Retirement Income",
    ageRange: [55, 67],
    incomeRange: "$150K – $400K household income",
    netWorth: "$500K – $3M investable assets",
    minimumAUM: "$250K",
    lifeStage: "5–10 years from retirement",
    occupation: "Corporate professionals, small business owners, federal employees",
    decisionStyle: "Research-driven, risk-aware, seeks professional validation",
  },
  painPoints: [
    { rank: 1, title: "Tax Uncertainty in Retirement", description: "Fear of paying more taxes on retirement income than necessary. Don't understand Roth conversion timing or tax bracket management.", emotional: "Anxiety", urgency: "High" },
    { rank: 2, title: "Running Out of Money", description: "No clear picture of whether current savings will sustain their lifestyle for 25–30 years. Withdrawal strategy is unclear.", emotional: "Fear", urgency: "High" },
    { rank: 3, title: "Social Security Timing", description: "Overwhelmed by claiming strategies. Don't know if they should claim early, at full retirement, or delay to 70.", emotional: "Confusion", urgency: "Medium" },
    { rank: 4, title: "Healthcare Cost Gap", description: "Pre-65 healthcare coverage gap if they retire early. Medicare complexity once eligible.", emotional: "Stress", urgency: "Medium" },
    { rank: 5, title: "Lack of a Coordinated Plan", description: "Have multiple accounts, an old 401(k), some IRAs, maybe a pension — but no unified strategy tying it all together.", emotional: "Overwhelm", urgency: "High" },
  ],
  desiredOutcomes: [
    { type: "Immediate", outcome: "Clarity on their tax situation and a specific number they need to retire" },
    { type: "Medium-term", outcome: "A coordinated withdrawal strategy that minimizes taxes over their retirement" },
    { type: "Long-term", outcome: "Confidence they won't outlive their money and can leave something behind" },
    { type: "Emotional", outcome: "Permission to stop worrying and start enjoying what they've built" },
  ],
  angles: [
    { id: 1, name: "Tax Time Bomb", category: "Tax", hook: "Your 401(k) has a tax bill hiding inside it. Here's what most people don't realize until it's too late.", why: "Roth conversion urgency is a top concern. Creates awareness of a problem they haven't fully quantified." },
    { id: 2, name: "Social Security Mistake", category: "SS", hook: "Most people claim Social Security at the wrong time and leave $100K+ on the table. Here's how to know when to claim.", why: "Specific dollar amount creates urgency. Everyone with SS has this question." },
    { id: 3, name: "The Retirement Paycheck", category: "Income", hook: "You've spent 30 years getting a paycheck. In retirement, you have to create your own. Most people get this wrong.", why: "Relatable transition moment. Positions the advisor as the person who solves this." },
    { id: 4, name: "Hidden Fees", category: "Cost", hook: "The average retiree pays $170K in unnecessary fees over their retirement. Here's how to find out if you're one of them.", why: "Quantified cost of inaction. Appeals to the research-driven buyer." },
    { id: 5, name: "The 5-Year Window", category: "Urgency", hook: "The 5 years before and after retirement are the most important financial years of your life. Here's why.", why: "Creates a time-bound urgency. Aligns with their exact life stage." },
    { id: 6, name: "Market Crash Protection", category: "Risk", hook: "What happens to your retirement if the market drops 40% the year you retire? Most people have no plan for this.", why: "Sequence-of-returns risk is real and scary. Drives need for professional guidance." },
    { id: 7, name: "IRA Rollover Trap", category: "Tax", hook: "Rolled over your 401(k) to an IRA? There's a chance you made a mistake that's costing you thousands.", why: "Many in this demographic have done this. Creates doubt that drives action." },
    { id: 8, name: "Medicare Maze", category: "Healthcare", hook: "Medicare has 48 different plan combinations. Pick the wrong one and you could pay $60K more over your retirement.", why: "Healthcare anxiety is universal. Specific number creates urgency." },
  ],
  educationTopics: [
    { num: 1, title: "Tax-Efficient Retirement Income", description: "Roth conversions, tax bracket management, withdrawal sequencing. The core differentiator for this firm." },
    { num: 2, title: "Social Security Optimization", description: "Claiming strategies, spousal benefits, coordination with other income sources." },
    { num: 3, title: "The Retirement Transition Plan", description: "Tying it all together: healthcare, income, taxes, estate. The comprehensive view." },
  ],
  targeting: {
    approach: "Broad + Message Diversity (Andromeda-Optimized)",
    geo: "Denver-Aurora-Lakewood MSA, 25-mile radius",
    geoSecondary: "Colorado Springs, Fort Collins (expansion)",
    interests: ["Personal finance", "Retirement planning", "Investing", "AARP", "Kiplinger", "MarketWatch"],
  },
  complianceLevel: "Moderate",
  tone: "Professional but warm. Lead with empathy, back with data. No jargon.",
};

const categoryColors: Record<AngleCategory, CategoryColor> = {
  Tax: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  SS: { bg: "rgba(80,227,194,0.1)", text: "#50e3c2" },
  Income: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  Cost: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  Urgency: { bg: "rgba(192,132,252,0.1)", text: "#c084fc" },
  Risk: { bg: "rgba(34,211,238,0.1)", text: "#22d3ee" },
  Healthcare: { bg: "rgba(163,230,53,0.1)", text: "#a3e635" },
};

const urgencyColors: Record<PainPoint["urgency"], string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#50e3c2",
};

const outcomeColors = [
  { bg: "rgba(80,227,194,0.1)", text: "#50e3c2" },
  { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  { bg: "rgba(192,132,252,0.1)", text: "#c084fc" },
  { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketingBlueprint(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("icp");
  const [expandedAngle, setExpandedAngle] = useState<number | null>(null);
  const [expandedPain, setExpandedPain] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Your Marketing Blueprint is ready. I can walk you through the strategy, answer questions, or make adjustments. What would you like to dig into?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const d = mockData;

  const suggestedPrompts = [
    "Why did you choose these pain points?",
    "Can we add more ad angles?",
    "Explain the targeting strategy",
    "How would this change for a different niche?",
    "What should I prioritize first?",
    "Adjust the compliance level",
  ];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function handleChatSend(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setChatInput("");
    // Simulate AI response
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: "ai", text: "That's a great question. Let me think through that based on your blueprint data and get back to you with a detailed answer." }]);
    }, 800);
  }

  const tabs: Tab[] = [
    { id: "icp", label: "ICP Profile" },
    { id: "pain", label: "Pain Points" },
    { id: "angles", label: "Ad Angles" },
    { id: "education", label: "Education Topics" },
    { id: "targeting", label: "Targeting" },
    { id: "projections", label: "Projections" },
  ];

  return (
    <div className="bp-root">
      <style>{`
        .bp-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #ededed;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .bp-header {
          border-bottom: 1px solid #1f1f1f;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0a0a0a;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .bp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bp-logo {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #ededed;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .bp-header-title {
          font-size: 14px;
          font-weight: 600;
        }
        .bp-header-sub {
          font-size: 12px;
          color: #666;
        }
        .bp-header-actions {
          display: flex;
          gap: 8px;
        }
        .bp-btn-secondary {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #2e2e2e;
          background: transparent;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-btn-secondary:hover {
          border-color: #454545;
          color: #ededed;
        }
        .bp-btn-primary {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: #ededed;
          color: #0a0a0a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bp-btn-primary:hover {
          background: #d4d4d4;
        }

        /* ── Hero ── */
        .bp-hero {
          margin-bottom: 32px;
        }
        .bp-hero h1 {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .bp-hero-sub {
          font-size: 13px;
          color: #666;
          margin: 0;
        }

        /* ── Stats ── */
        .bp-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 28px;
        }
        .bp-stat {
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
          padding: 16px 18px;
          transition: border-color 0.15s;
        }
        .bp-stat:hover {
          border-color: #2e2e2e;
        }
        .bp-stat-label {
          font-size: 11px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .bp-stat-value {
          font-size: 15px;
          font-weight: 600;
          color: #ededed;
        }

        /* ── Tabs ── */
        .bp-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 24px;
          border-bottom: 1px solid #1f1f1f;
        }
        .bp-tab {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          background: transparent;
          border: none;
          color: #666;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s;
        }
        .bp-tab:hover {
          color: #888;
        }
        .bp-tab--active {
          color: #ededed;
          font-weight: 500;
          border-bottom-color: #ededed;
        }

        /* ── Cards ── */
        .bp-card {
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 24px;
          transition: border-color 0.15s;
        }
        .bp-card:hover {
          border-color: #2e2e2e;
        }
        .bp-card-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 18px;
          color: #ededed;
        }
        .bp-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #1a1a1a;
        }
        .bp-row:last-child {
          border-bottom: none;
        }
        .bp-row-label {
          font-size: 13px;
          color: #666;
        }
        .bp-row-value {
          font-size: 13px;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          color: #ededed;
        }

        /* ── Dim label ── */
        .bp-dim-label {
          font-size: 11px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }

        /* ── Expandable rows ── */
        .bp-expandable {
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .bp-expandable:hover {
          border-color: #2e2e2e;
        }
        .bp-expandable--open {
          border-color: #2e2e2e;
        }
        .bp-expand-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .bp-expand-body {
          padding: 0 20px 18px;
          border-top: 1px solid #1a1a1a;
        }
        .bp-rank {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .bp-chevron {
          color: #555;
          font-size: 14px;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
        .bp-chevron--open {
          transform: rotate(180deg);
        }

        /* ── Tags/Chips ── */
        .bp-tag {
          font-size: 10px;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 600;
          white-space: nowrap;
        }
        .bp-tag-outline {
          font-size: 10px;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #1f1f1f;
          color: #555;
          background: #0a0a0a;
        }

        /* ── Interest chips ── */
        .bp-interest {
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid #2e2e2e;
          color: #ededed;
          background: #1a1a1a;
          transition: border-color 0.15s;
        }
        .bp-interest:hover {
          border-color: #454545;
        }

        /* ── Compliance bar ── */
        .bp-compliance-level {
          flex: 1;
          padding: 8px 0;
          border-radius: 8px;
          text-align: center;
          font-size: 12px;
          font-weight: 400;
          border: 1px solid #1f1f1f;
          color: #555;
          background: transparent;
          transition: all 0.15s;
        }
        .bp-compliance-level--active {
          font-weight: 600;
          border-color: transparent;
        }

        /* ── Rationale ── */
        .bp-rationale {
          margin-top: 28px;
          background: #111;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 24px;
        }
        .bp-rationale-text {
          font-size: 13px;
          color: #888;
          line-height: 1.8;
        }
        .bp-rationale-text strong {
          color: #ededed;
          font-weight: 500;
        }

        /* ── Angle category coverage ── */
        .bp-coverage {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
        }

        /* ── Education number ── */
        .bp-edu-num {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ── Approach callout ── */
        .bp-callout {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          border: 1px solid #1f1f1f;
          background: #111;
        }
        .bp-callout-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .bp-callout-sub {
          font-size: 11px;
          color: #666;
          line-height: 1.5;
        }

        /* ── Psychographic section ── */
        .bp-psych-row {
          padding: 12px 0;
          border-bottom: 1px solid #1a1a1a;
        }
        .bp-psych-row:last-child {
          border-bottom: none;
        }

        /* ── Layout ── */
        .bp-layout {
          display: flex;
          height: calc(100vh - 61px);
          overflow: hidden;
        }
        .bp-content {
          flex: 1;
          overflow-y: auto;
          max-width: none;
          padding: 32px 32px 80px;
          margin: 0;
        }

        /* ── Chat Sidebar ── */
        .bp-chat {
          width: 380px;
          flex-shrink: 0;
          border-left: 1px solid #1f1f1f;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
        }
        .bp-chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid #1f1f1f;
          flex-shrink: 0;
        }
        .bp-chat-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bp-chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ededed;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .bp-chat-title {
          font-size: 13px;
          font-weight: 600;
        }
        .bp-chat-status {
          font-size: 11px;
          color: #50e3c2;
        }

        /* ── Chat Messages ── */
        .bp-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bp-chat-messages::-webkit-scrollbar { width: 4px; }
        .bp-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .bp-chat-messages::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        .bp-chat-msg {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          animation: bpFadeIn 0.3s ease;
        }
        .bp-chat-msg--user {
          justify-content: flex-end;
        }
        .bp-chat-msg--ai {
          justify-content: flex-start;
        }
        .bp-chat-msg-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ededed;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .bp-chat-bubble {
          max-width: 85%;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .bp-chat-bubble--ai {
          background: #1a1a1a;
          color: #ededed;
          border: 1px solid #1f1f1f;
          border-radius: 14px 14px 14px 4px;
        }
        .bp-chat-bubble--user {
          background: #ededed;
          color: #0a0a0a;
          border-radius: 14px 14px 4px 14px;
        }

        /* ── Suggested Prompts ── */
        .bp-chat-prompts {
          padding: 4px 0;
        }
        .bp-chat-prompts-label {
          font-size: 11px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
          margin-bottom: 10px;
          padding-left: 2px;
        }
        .bp-chat-prompt {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 8px;
          border: 1px solid #1f1f1f;
          background: transparent;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-chat-prompt:hover {
          border-color: #2e2e2e;
          color: #ededed;
          background: #111;
        }

        /* ── Chat Input ── */
        .bp-chat-input-wrap {
          padding: 14px 16px;
          border-top: 1px solid #1f1f1f;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .bp-chat-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #2e2e2e;
          background: #111;
          color: #ededed;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }
        .bp-chat-input:focus {
          border-color: #454545;
        }
        .bp-chat-input::placeholder {
          color: #555;
        }
        .bp-chat-send {
          width: 34px;
          height: 34px;
          border-radius: 8px;
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
        .bp-chat-send--active {
          background: #ededed;
          color: #0a0a0a;
        }
        .bp-chat-send--active:hover {
          background: #d4d4d4;
        }

        @keyframes bpFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header className="bp-header">
        <div className="bp-header-left">
          <div className="bp-logo">A</div>
          <div>
            <div className="bp-header-title">Marketing Blueprint</div>
            <div className="bp-header-sub">{d.firmName}</div>
          </div>
        </div>
        <div className="bp-header-actions">
          <button className="bp-btn-secondary">Edit Blueprint</button>
          <button className="bp-btn-primary">
            Approve & Continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </header>

      <div className="bp-layout">
      <div className="bp-content">

        {/* Hero */}
        <div className="bp-hero">
          <h1>{d.avatar.label}</h1>
          <p className="bp-hero-sub">{d.advisorName} · {d.market} · Compliance: {d.complianceLevel}</p>
        </div>

        {/* Stats */}
        <div className="bp-stats">
          {[
            { label: "Age Range", value: `${d.avatar.ageRange[0]}–${d.avatar.ageRange[1]}` },
            { label: "Net Worth", value: d.avatar.netWorth },
            { label: "Min AUM", value: d.avatar.minimumAUM },
            { label: "Life Stage", value: d.avatar.lifeStage },
            { label: "Ad Angles", value: `${d.angles.length} angles` },
          ].map((s, i) => (
            <div key={i} className="bp-stat">
              <div className="bp-stat-label">{s.label}</div>
              <div className="bp-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bp-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`bp-tab ${activeTab === t.id ? "bp-tab--active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: ICP PROFILE */}
        {activeTab === "icp" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="bp-card">
              <h3 className="bp-card-title">Demographics</h3>
              {[
                ["Age Range", `${d.avatar.ageRange[0]}–${d.avatar.ageRange[1]} years old`],
                ["Income", d.avatar.incomeRange],
                ["Net Worth", d.avatar.netWorth],
                ["Minimum AUM", d.avatar.minimumAUM],
                ["Life Stage", d.avatar.lifeStage],
                ["Geography", d.targeting.geo],
              ].map(([label, val], i) => (
                <div key={i} className="bp-row">
                  <span className="bp-row-label">{label}</span>
                  <span className="bp-row-value">{val}</span>
                </div>
              ))}
            </div>

            <div className="bp-card">
              <h3 className="bp-card-title">Psychographic Profile</h3>
              {[
                ["Occupation", d.avatar.occupation],
                ["Decision Style", d.avatar.decisionStyle],
                ["Tone Match", d.tone],
              ].map(([label, val], i) => (
                <div key={i} className="bp-psych-row">
                  <div className="bp-dim-label" style={{ marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{val}</div>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div className="bp-dim-label" style={{ marginBottom: 12 }}>Desired Outcomes</div>
                {d.desiredOutcomes.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span className="bp-tag" style={{ background: outcomeColors[i].bg, color: outcomeColors[i].text, marginTop: 2 }}>{o.type}</span>
                    <span style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{o.outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAIN POINTS */}
        {activeTab === "pain" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {d.painPoints.map((pp, i) => {
              const isOpen = expandedPain === i;
              return (
                <div key={i} onClick={() => setExpandedPain(isOpen ? null : i)} className={`bp-expandable ${isOpen ? "bp-expandable--open" : ""}`}>
                  <div className="bp-expand-header">
                    <div className="bp-rank" style={{ background: "rgba(237,237,237,0.06)", color: "#ededed" }}>
                      {pp.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{pp.title}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{pp.description.slice(0, 80)}...</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="bp-tag" style={{ background: pp.urgency === "High" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: urgencyColors[pp.urgency] }}>{pp.urgency} Urgency</span>
                      <span className="bp-tag" style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc" }}>{pp.emotional}</span>
                    </div>
                    <span className={`bp-chevron ${isOpen ? "bp-chevron--open" : ""}`}>&#9662;</span>
                  </div>
                  {isOpen && (
                    <div className="bp-expand-body">
                      <div style={{ paddingTop: 14, fontSize: 13, color: "#888", lineHeight: 1.7 }}>{pp.description}</div>
                      <div style={{ marginTop: 14, padding: "12px 16px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1f1f1f" }}>
                        <div className="bp-dim-label" style={{ marginBottom: 6 }}>Why This Matters for Content</div>
                        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
                          This pain point directly informs ad angles, webinar content, and sequence messaging. Ads that lead with this concern will resonate because the emotional weight ({pp.emotional.toLowerCase()}) combined with {pp.urgency.toLowerCase()} urgency creates a strong motivation to act.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: AD ANGLES */}
        {activeTab === "angles" && (
          <div>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 16px", lineHeight: 1.6 }}>
              These are the content angles the system will use to generate ad scripts. Each angle targets a specific pain point with a unique messaging approach. Meta's Andromeda algorithm performs best with 15+ diverse angles per month.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {d.angles.map((a, i) => {
                const cc = categoryColors[a.category] || { bg: "rgba(237,237,237,0.06)", text: "#ededed" };
                const isExp = expandedAngle === i;
                return (
                  <div key={i} onClick={() => setExpandedAngle(isExp ? null : i)} className={`bp-expandable ${isExp ? "bp-expandable--open" : ""}`}>
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="bp-tag" style={{ background: cc.bg, color: cc.text, borderRadius: 6 }}>{a.category}</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                        </div>
                        <span className={`bp-chevron ${isExp ? "bp-chevron--open" : ""}`}>&#9662;</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, fontStyle: "italic" }}>"{a.hook}"</div>
                    </div>
                    {isExp && (
                      <div style={{ padding: "0 18px 16px", borderTop: "1px solid #1a1a1a" }}>
                        <div style={{ paddingTop: 14 }}>
                          <div className="bp-dim-label" style={{ marginBottom: 6 }}>Why This Angle Works</div>
                          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{a.why}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: EDUCATION TOPICS */}
        {activeTab === "education" && (
          <div>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 20px", lineHeight: 1.6 }}>
              These 3 topics form the backbone of all educational content — the webinar, long-form videos, and organic posts. The Amplified framework always focuses on exactly 3 topics to build authority without overwhelming the audience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.educationTopics.map((t, i) => {
                const colors = [
                  { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
                  { bg: "rgba(80,227,194,0.1)", text: "#50e3c2" },
                  { bg: "rgba(192,132,252,0.1)", text: "#c084fc" },
                ];
                return (
                  <div key={i} className="bp-card" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    <div className="bp-edu-num" style={{ background: colors[i].bg, color: colors[i].text }}>
                      {t.num}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{t.description}</div>
                      <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                        {(["Webinar", "Ads", "Organic"] as const).map(tag => (
                          <span key={tag} className="bp-tag-outline">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: TARGETING */}
        {activeTab === "targeting" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="bp-card">
              <h3 className="bp-card-title">Targeting Approach</h3>
              <div className="bp-callout">
                <div className="bp-callout-title" style={{ color: "#50e3c2" }}>{d.targeting.approach}</div>
                <div className="bp-callout-sub">Let the creative do the targeting. Broad audience + specific messaging = Andromeda finds the right people.</div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div className="bp-dim-label" style={{ marginBottom: 8 }}>Primary Market</div>
                <div style={{ fontSize: 13 }}>{d.targeting.geo}</div>
              </div>
              <div>
                <div className="bp-dim-label" style={{ marginBottom: 8 }}>Expansion Markets</div>
                <div style={{ fontSize: 13, color: "#888" }}>{d.targeting.geoSecondary}</div>
              </div>
            </div>
            <div className="bp-card">
              <h3 className="bp-card-title">Interest Signals</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {d.targeting.interests.map((interest, i) => (
                  <span key={i} className="bp-interest">{interest}</span>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="bp-dim-label" style={{ marginBottom: 10 }}>Compliance Level</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {(["Conservative", "Moderate", "Aggressive"] as const).map((level, i) => {
                    const active = d.complianceLevel === level;
                    const activeColors = [
                      { bg: "rgba(80,227,194,0.1)", color: "#50e3c2" },
                      { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
                      { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
                    ];
                    return (
                      <div key={level} className={`bp-compliance-level ${active ? "bp-compliance-level--active" : ""}`}
                        style={active ? { background: activeColors[i].bg, color: activeColors[i].color, borderColor: "transparent" } : {}}>
                        {level}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="bp-dim-label" style={{ marginBottom: 10 }}>Angle Coverage</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Object.entries(categoryColors) as [AngleCategory, CategoryColor][]).map(([cat, cc]) => {
                    const count = d.angles.filter(a => a.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <div key={cat} className="bp-coverage" style={{ background: cc.bg }}>
                        <span style={{ color: cc.text, fontWeight: 600 }}>{count}</span>
                        <span style={{ color: cc.text, opacity: 0.7 }}>{cat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROJECTIONS */}
        {activeTab === "projections" && (() => {
          const spend = 5000;
          const cpl = 35;
          const leads = Math.round(spend / cpl);
          const qualRate = 0.4;
          const qualLeads = Math.round(leads * qualRate);
          const bookingRate = 0.5;
          const appts = Math.round(qualLeads * bookingRate);
          const closeRate = 0.3;
          const clients = Math.round(appts * closeRate);
          const avgAUM = 500000;
          const feeRate = 0.01;
          const annualRevPerClient = avgAUM * feeRate;
          const totalNewRev = clients * annualRevPerClient;
          const roi = ((totalNewRev - spend * 12) / (spend * 12) * 100);

          const funnel = [
            { label: "Monthly Ad Spend", value: `$${spend.toLocaleString()}`, sub: "Based on your budget range", color: "#ededed" },
            { label: "Total Leads", value: leads.toString(), sub: `~$${cpl} cost per lead`, color: "#60a5fa" },
            { label: "Qualified Leads", value: qualLeads.toString(), sub: `${Math.round(qualRate * 100)}% qualification rate`, color: "#50e3c2" },
            { label: "Appointments Booked", value: appts.toString(), sub: `${Math.round(bookingRate * 100)}% booking rate`, color: "#c084fc" },
            { label: "New Clients", value: clients.toString(), sub: `${Math.round(closeRate * 100)}% close rate`, color: "#fbbf24" },
          ];

          return (
            <div>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 24px", lineHeight: 1.6 }}>
                Based on your target audience, service model, and market — here's what a typical month could look like. These are conservative estimates based on industry benchmarks for financial advisor campaigns.
              </p>

              {/* Funnel */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {funnel.map((f, i) => (
                  <div key={i} style={{ flex: 1, position: "relative" }}>
                    <div className="bp-card" style={{ textAlign: "center", padding: "20px 14px", borderTop: `2px solid ${f.color}` }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.value}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{f.sub}</div>
                    </div>
                    {i < funnel.length - 1 && (
                      <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "#333", fontSize: 16, zIndex: 1 }}>&#8250;</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Revenue projections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="bp-card">
                  <h3 className="bp-card-title">Revenue Impact</h3>
                  {[
                    ["Avg AUM per Client", `$${avgAUM.toLocaleString()}`],
                    ["Fee Rate", `${(feeRate * 100).toFixed(1)}%`],
                    ["Revenue per Client", `$${annualRevPerClient.toLocaleString()}/yr`],
                    ["New Clients (Monthly)", clients.toString()],
                    ["New Annual Revenue", `$${totalNewRev.toLocaleString()}`],
                  ].map(([label, val], i) => (
                    <div key={i} className="bp-row">
                      <span className="bp-row-label">{label}</span>
                      <span className="bp-row-value" style={i === 4 ? { color: "#50e3c2", fontWeight: 600 } : {}}>{val}</span>
                    </div>
                  ))}
                </div>

                <div className="bp-card">
                  <h3 className="bp-card-title">Return on Investment</h3>
                  <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: roi > 0 ? "#50e3c2" : "#ef4444", letterSpacing: "-0.03em" }}>{roi > 0 ? "+" : ""}{Math.round(roi)}%</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Estimated first-year ROI</div>
                  </div>
                  <div style={{ marginTop: 20, padding: "14px 16px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1f1f1f" }}>
                    <div className="bp-dim-label" style={{ marginBottom: 6 }}>The Math</div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>Annual ad spend</span>
                        <span style={{ color: "#ededed" }}>${(spend * 12).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>New revenue generated</span>
                        <span style={{ color: "#50e3c2" }}>${totalNewRev.toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1f1f1f", paddingTop: 6, marginTop: 4 }}>
                        <span style={{ fontWeight: 500, color: "#ededed" }}>Net return</span>
                        <span style={{ fontWeight: 600, color: "#50e3c2" }}>${(totalNewRev - spend * 12).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                    * Projections assume AUM-based fee model. Actual results vary based on market conditions, ad creative quality, and sales process.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Strategy Rationale */}
        <div className="bp-rationale">
          <div className="bp-dim-label" style={{ marginBottom: 10 }}>Strategy Rationale</div>
          <div className="bp-rationale-text">
            Cornerstone Wealth Partners' strength in tax planning combined with a pre-retiree ICP in the Denver metro means <strong>Roth conversion and Social Security optimization angles will outperform generic retirement messaging</strong>. The target demographic (55–67, $500K–$3M) is actively planning but hasn't committed to an advisor — they're researching. Content that educates first and sells second aligns with their research-driven decision style. The 3-topic education framework (tax efficiency, Social Security, retirement transition) covers their top concerns while positioning David's CPA + CFP® credentials as the unique differentiator against advisors who only do investments.
          </div>
        </div>

      </div>

      {/* ── Chat Sidebar ── */}
      <aside className="bp-chat">
        <div className="bp-chat-header">
          <div className="bp-chat-header-left">
            <div className="bp-chat-avatar">A</div>
            <div>
              <div className="bp-chat-title">Strategy Assistant</div>
              <div className="bp-chat-status">Online</div>
            </div>
          </div>
        </div>
        <div ref={chatScrollRef} className="bp-chat-messages">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`bp-chat-msg bp-chat-msg--${msg.sender}`}>
              {msg.sender === "ai" && <div className="bp-chat-msg-avatar">A</div>}
              <div className={`bp-chat-bubble bp-chat-bubble--${msg.sender}`}>{msg.text}</div>
            </div>
          ))}
          {chatMessages.length === 1 && (
            <div className="bp-chat-prompts">
              <div className="bp-chat-prompts-label">Suggested questions</div>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => handleChatSend(p)} className="bp-chat-prompt">{p}</button>
              ))}
            </div>
          )}
        </div>
        <div className="bp-chat-input-wrap">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && chatInput.trim() && handleChatSend()}
            placeholder="Ask about your blueprint..."
            className="bp-chat-input"
          />
          <button onClick={() => chatInput.trim() && handleChatSend()} className={`bp-chat-send ${chatInput.trim() ? "bp-chat-send--active" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </aside>
      </div>
    </div>
  );
}
