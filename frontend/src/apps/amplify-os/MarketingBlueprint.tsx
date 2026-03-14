import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeProvider";

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

/** Pool of additional angles the AI can "generate" */
const EXTRA_ANGLES: Angle[] = [
  { id: 100, name: "The Pension Puzzle", category: "Income", hook: "You have a pension — but do you know the 3 decisions that could cost you $200K if you get them wrong?", why: "Pension holders are high-value prospects. Creates urgency around irrevocable decisions they haven't fully analyzed." },
  { id: 101, name: "Widow's Tax Trap", category: "Tax", hook: "When one spouse passes, the surviving spouse gets hit with a massive tax increase nobody warned them about.", why: "Emotionally powerful and underserved topic. Targets couples who haven't planned for the tax impact of losing a spouse." },
  { id: 102, name: "The Inheritance Mistake", category: "Tax", hook: "Your kids could lose 40% of what you leave them. Here's the one move that changes everything.", why: "Legacy planning is a deep emotional driver. Quantified loss creates urgency to act now." },
  { id: 103, name: "The Early Retirement Trap", category: "Healthcare", hook: "Want to retire before 65? There's a healthcare gap that costs early retirees $30K+ if they don't plan for it.", why: "Pre-65 healthcare is a real blocker for early retirement. Specific cost makes it tangible." },
  { id: 104, name: "The Inflation Blindspot", category: "Risk", hook: "Inflation has already eroded 25% of your purchasing power since 2020. Here's what that means for your retirement plan.", why: "Timely and relevant. Makes an abstract concern concrete with a specific, relatable number." },
  { id: 105, name: "The RMD Time Bomb", category: "Tax", hook: "At 73, the IRS forces you to withdraw from your retirement accounts — and most people aren't ready for the tax bill.", why: "Required minimum distributions catch people off guard. Creates a planning window that demands action." },
  { id: 106, name: "The Spousal Benefit Secret", category: "SS", hook: "There's a Social Security spousal strategy that most couples never hear about. It could be worth $50K+ over your retirement.", why: "Spousal benefits are misunderstood. Dollar amount creates curiosity and positions the advisor as an expert." },
  { id: 107, name: "The Bucket Strategy", category: "Income", hook: "The smartest retirees don't have one investment account — they have three 'buckets.' Here's why it changes everything.", why: "Framework-based content performs well. Simple concept that implies sophisticated planning behind it." },
];

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
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("icp");
  const [expandedAngle, setExpandedAngle] = useState<number | null>(null);
  const [expandedPain, setExpandedPain] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Your Marketing Blueprint is ready. I can walk you through the strategy, answer questions, or make adjustments. What would you like to dig into?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalStage, setApprovalStage] = useState<"checking" | "approved" | "done">("checking");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ─── Live blueprint state ───
  const [angles, setAngles] = useState<Angle[]>(mockData.angles);
  const extraAnglesRef = useRef([...EXTRA_ANGLES]);

  // ─── Editable state ───
  const [eduNotes, setEduNotes] = useState<Record<number, string>>({});
  const [angleNotes, setAngleNotes] = useState<Record<number, string>>({});
  const [painNotes, setPainNotes] = useState<Record<number, string>>({});
  const [editGeo, setEditGeo] = useState(mockData.targeting.geo);
  const [editGeoSecondary, setEditGeoSecondary] = useState(mockData.targeting.geoSecondary);
  const [editCompliance, setEditCompliance] = useState<BlueprintData["complianceLevel"]>(mockData.complianceLevel);

  // ─── Revenue model state ───
  type RevenueModel = "aum" | "annuities" | "fee-based" | "hybrid";
  const [revenueModel, setRevenueModel] = useState<RevenueModel>("aum");
  const [revSplitAUM, setRevSplitAUM] = useState(100);
  const [revSplitAnnuities, setRevSplitAnnuities] = useState(0);
  const [revSplitFee, setRevSplitFee] = useState(0);

  function applyRevenuePreset(model: RevenueModel) {
    setRevenueModel(model);
    if (model === "aum") { setRevSplitAUM(100); setRevSplitAnnuities(0); setRevSplitFee(0); }
    else if (model === "annuities") { setRevSplitAUM(0); setRevSplitAnnuities(100); setRevSplitFee(0); }
    else if (model === "fee-based") { setRevSplitAUM(0); setRevSplitAnnuities(0); setRevSplitFee(100); }
    else { setRevSplitAUM(50); setRevSplitAnnuities(30); setRevSplitFee(20); }
  }

  const d = { ...mockData, angles };

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
  }, [chatMessages, aiThinking]);

  function handleChatSend(text?: string) {
    const msg = (text ?? chatInput).trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setChatInput("");
    setAiThinking(true);

    const lower = msg.toLowerCase();
    const isAngleRequest = lower.includes("suggest") && lower.includes("angle") ||
                           lower.includes("add") && lower.includes("angle") ||
                           lower.includes("more angle") ||
                           lower.includes("new angle");
    const isReviseAngle = lower.includes("revise ad angle") || lower.includes("revise angle");
    const isRevisePain = lower.includes("revise pain point");
    const isReviseEdu = lower.includes("revise education topic");

    if (isAngleRequest) {
      // Actually generate new angles
      const available = extraAnglesRef.current;
      if (available.length === 0) {
        setTimeout(() => {
          setAiThinking(false);
          setChatMessages((prev) => [...prev, { sender: "ai", text: "I've already added all available angles to your blueprint. You currently have " + angles.length + " angles — that's a strong set for Andromeda optimization. If you want me to create angles for a specific pain point or topic, describe it and I'll craft one." }]);
        }, 2000);
        return;
      }

      const count = Math.min(3, available.length);
      const newAngles = available.splice(0, count);
      // Re-number them based on current max
      const maxId = Math.max(...angles.map(a => a.id));
      const numbered = newAngles.map((a, i) => ({ ...a, id: maxId + i + 1 }));

      // Simulate thinking
      setTimeout(() => {
        setAngles((prev) => [...prev, ...numbered]);
        setAiThinking(false);
        const names = numbered.map(a => `**${a.name}** (${a.category})`).join(", ");
        setChatMessages((prev) => [...prev, {
          sender: "ai",
          text: `Done. I've added ${count} new angles based on your ICP's pain points and the gaps in your current angle coverage:\n\n${names}\n\nYou now have ${angles.length + count} total angles. Check the Ad Angles tab to review them — each one has a hook and strategic rationale. Want me to generate more, or adjust any of these?`,
        }]);
      }, 3000);
    } else if (isReviseAngle) {
      // Simulate revising an angle
      setTimeout(() => {
        setAiThinking(false);
        setChatMessages((prev) => [...prev, {
          sender: "ai",
          text: "I've reviewed your feedback and revised the angle. The updated hook and rationale are designed to hit harder on the emotional driver while staying compliant. I'll apply these changes to your blueprint once you save — check the Ad Angles tab to review.",
        }]);
      }, 2500);
    } else if (isRevisePain) {
      setTimeout(() => {
        setAiThinking(false);
        setChatMessages((prev) => [...prev, {
          sender: "ai",
          text: "Good feedback. I've refined the pain point based on your notes — the description and emotional weight have been adjusted to better reflect what you're hearing from real clients. This will cascade into more relevant ad angles and content topics. Review it in the Pain Points tab.",
        }]);
      }, 2500);
    } else if (isReviseEdu) {
      setTimeout(() => {
        setAiThinking(false);
        setChatMessages((prev) => [...prev, {
          sender: "ai",
          text: "I've revised the education topic with your context. The updated description will influence webinar content, long-form video scripts, and organic post themes. Take a look in the Education Topics tab and let me know if it needs further refinement.",
        }]);
      }, 2500);
    } else {
      // Generic response
      setTimeout(() => {
        setAiThinking(false);
        setChatMessages((prev) => [...prev, {
          sender: "ai",
          text: "That's a great question. Let me think through that based on your blueprint data and get back to you with a detailed answer.",
        }]);
      }, 1500);
    }
  }

  function handleApprove() {
    setShowApproval(true);
    setApprovalStage("checking");
    setTimeout(() => setApprovalStage("approved"), 2200);
    setTimeout(() => setApprovalStage("done"), 3800);
    setTimeout(() => navigate("/amplify-os/content-studio"), 5200);
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
          background: var(--app-bg);
          color: var(--app-text);
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .bp-header {
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
        .bp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bp-logo {
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
        .bp-header-title {
          font-size: 14px;
          font-weight: 600;
        }
        .bp-header-sub {
          font-size: 12px;
          color: var(--app-text-muted);
        }
        .bp-header-actions {
          display: flex;
          gap: 8px;
        }
        .bp-btn-secondary {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--app-border-hover);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-btn-secondary:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
        }
        .bp-btn-primary {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: var(--app-text);
          color: var(--app-bg);
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
          color: var(--app-text-muted);
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
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          padding: 16px 18px;
          transition: border-color 0.15s;
        }
        .bp-stat:hover {
          border-color: var(--app-border-hover);
        }
        .bp-stat-label {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .bp-stat-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--app-text);
        }

        /* ── Tabs ── */
        .bp-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--app-border);
        }
        .bp-tab {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          background: transparent;
          border: none;
          color: var(--app-text-muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s;
        }
        .bp-tab:hover {
          color: var(--app-text-secondary);
        }
        .bp-tab--active {
          color: var(--app-text);
          font-weight: 500;
          border-bottom-color: var(--app-text);
        }

        /* ── Cards ── */
        .bp-card {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          padding: 24px;
          transition: border-color 0.15s;
        }
        .bp-card:hover {
          border-color: var(--app-border-hover);
        }
        .bp-card-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 18px;
          color: var(--app-text);
        }
        .bp-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--app-border-subtle);
        }
        .bp-row:last-child {
          border-bottom: none;
        }
        .bp-row-label {
          font-size: 13px;
          color: var(--app-text-muted);
        }
        .bp-row-value {
          font-size: 13px;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          color: var(--app-text);
        }

        /* ── Dim label ── */
        .bp-dim-label {
          font-size: 11px;
          color: var(--app-text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }

        /* ── Expandable rows ── */
        .bp-expandable {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .bp-expandable:hover {
          border-color: var(--app-border-hover);
        }
        .bp-expandable--open {
          border-color: var(--app-border-hover);
        }
        .bp-expand-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .bp-expand-body {
          padding: 0 20px 18px;
          border-top: 1px solid var(--app-border-subtle);
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
          color: var(--app-text-dim);
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
          border: 1px solid var(--app-border);
          color: var(--app-text-dim);
          background: var(--app-bg);
        }

        /* ── Interest chips ── */
        .bp-interest {
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid var(--app-border-hover);
          color: var(--app-text);
          background: var(--app-border-subtle);
          transition: border-color 0.15s;
        }
        .bp-interest:hover {
          border-color: var(--app-border-hover);
        }

        /* ── Compliance bar ── */
        .bp-compliance-level {
          flex: 1;
          padding: 8px 0;
          border-radius: 8px;
          text-align: center;
          font-size: 12px;
          font-weight: 400;
          border: 1px solid var(--app-border);
          color: var(--app-text-dim);
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
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          padding: 24px;
        }
        .bp-rationale-text {
          font-size: 13px;
          color: var(--app-text-secondary);
          line-height: 1.8;
        }
        .bp-rationale-text strong {
          color: var(--app-text);
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
          border: 1px solid var(--app-border);
          background: var(--app-surface);
        }
        .bp-callout-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .bp-callout-sub {
          font-size: 11px;
          color: var(--app-text-muted);
          line-height: 1.5;
        }

        /* ── Psychographic section ── */
        .bp-psych-row {
          padding: 12px 0;
          border-bottom: 1px solid var(--app-border-subtle);
        }
        .bp-psych-row:last-child {
          border-bottom: none;
        }

        /* ── Edit mode ── */
        .bp-edit-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: rgba(96,165,250,0.06);
          border: 1px solid rgba(96,165,250,0.15);
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 12px;
          color: var(--app-text-secondary);
          line-height: 1.5;
        }
        .bp-edit-banner svg {
          flex-shrink: 0;
          color: #60a5fa;
        }
        .bp-edit-banner strong {
          color: var(--app-text);
          font-weight: 500;
        }
        .bp-edit-note-wrap {
          margin-top: 14px;
          animation: bp-fade-in 0.2s ease;
        }
        @keyframes bp-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bp-edit-note {
          width: 100%;
          min-height: 60px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--app-border-hover);
          background: var(--app-bg);
          color: var(--app-text);
          font-size: 12px;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .bp-edit-note:focus {
          outline: none;
          border-color: #60a5fa;
        }
        .bp-edit-note::placeholder {
          color: #444;
        }
        .bp-edit-ai-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(96,165,250,0.2);
          background: rgba(96,165,250,0.06);
          color: #60a5fa;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .bp-edit-ai-btn:hover {
          background: rgba(96,165,250,0.12);
          border-color: rgba(96,165,250,0.3);
        }
        .bp-edit-add-wrap {
          margin-top: 14px;
          display: flex;
          justify-content: center;
        }
        .bp-edit-field {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--app-border-hover);
          background: var(--app-bg);
          color: var(--app-text);
          font-size: 13px;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .bp-edit-field:focus {
          outline: none;
          border-color: #60a5fa;
        }
        .bp-edit-locked {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(237,237,237,0.03);
          border: 1px solid var(--app-border);
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 11px;
          color: var(--app-text-dim);
        }
        .bp-edit-locked svg {
          flex-shrink: 0;
        }
        .bp-edit-highlight {
          background: rgba(96,165,250,0.04);
          border: 1px dashed rgba(96,165,250,0.25);
          animation: bp-fade-in 0.2s ease;
        }
        .bp-edit-badge {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #60a5fa;
          background: rgba(96,165,250,0.1);
          padding: 2px 7px;
          border-radius: 4px;
        }
        .bp-compliance-level--editable {
          cursor: pointer;
        }
        .bp-compliance-level--editable:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
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
          border-left: 1px solid var(--app-border);
          display: flex;
          flex-direction: column;
          background: var(--app-bg);
        }
        .bp-chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--app-border);
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
          background: var(--app-text);
          color: var(--app-bg);
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
        .bp-chat-messages::-webkit-scrollbar-thumb { background: var(--app-border-subtle); border-radius: 2px; }
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
        .bp-chat-bubble {
          max-width: 85%;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 14px;
          padding: 10px 14px;
        }
        .bp-chat-bubble--ai {
          background: var(--app-border-subtle);
          color: var(--app-text);
          border: 1px solid var(--app-border);
          border-radius: 14px 14px 14px 4px;
        }
        .bp-chat-bubble--user {
          background: var(--app-text);
          color: var(--app-bg);
          border-radius: 14px 14px 4px 14px;
        }

        /* ── Suggested Prompts ── */
        .bp-chat-prompts {
          padding: 4px 0;
        }
        .bp-chat-prompts-label {
          font-size: 11px;
          color: var(--app-text-dim);
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
          border: 1px solid var(--app-border);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-chat-prompt:hover {
          border-color: var(--app-border-hover);
          color: var(--app-text);
          background: var(--app-surface);
        }

        /* ── Chat Input ── */
        .bp-chat-input-wrap {
          padding: 14px 16px;
          border-top: 1px solid var(--app-border);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .bp-chat-input {
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
        .bp-chat-input:focus {
          border-color: var(--app-border-hover);
        }
        .bp-chat-input::placeholder {
          color: var(--app-text-dim);
        }
        .bp-chat-send {
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
        .bp-chat-send--active {
          background: var(--app-text);
          color: var(--app-bg);
        }
        .bp-chat-send--active:hover {
          background: #d4d4d4;
        }

        /* ── Thinking dots ── */
        .bp-chat-thinking {
          padding: 12px 18px !important;
        }
        .bp-thinking-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .bp-thinking-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--app-text-dim);
          animation: bp-dot-bounce 1.2s infinite;
        }
        .bp-thinking-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .bp-thinking-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bp-dot-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }

        @keyframes bpFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Page entrance ── */
        .bp-page-enter .bp-header {
          animation: bp-section-appear 1.4s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.3s;
        }
        .bp-page-enter .bp-layout {
          animation: bp-section-appear 1.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.6s;
        }
        @keyframes bp-section-appear {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Approval Overlay ── */
        .bp-approval-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0);
          animation: bp-overlay-bg 0.6s ease forwards;
        }
        @keyframes bp-overlay-bg {
          to { background: rgba(0,0,0,0.85); }
        }
        .bp-approval-card {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 20px;
          padding: 48px 56px;
          text-align: center;
          min-width: 420px;
          animation: bp-approval-enter 0.5s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.2s;
        }
        @keyframes bp-approval-enter {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .bp-approval-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bp-approval-icon--checking {
          background: rgba(96,165,250,0.1);
          border: 2px solid rgba(96,165,250,0.3);
          animation: bp-pulse-ring 1.5s ease infinite;
        }
        .bp-approval-icon--approved {
          background: rgba(80,227,194,0.15);
          border: 2px solid rgba(80,227,194,0.4);
          animation: bp-pop-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes bp-pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96,165,250,0.15); }
          50% { box-shadow: 0 0 0 12px rgba(96,165,250,0); }
        }
        @keyframes bp-pop-in {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .bp-approval-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(96,165,250,0.2);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: bp-spin 0.8s linear infinite;
        }
        @keyframes bp-spin {
          to { transform: rotate(360deg); }
        }
        .bp-approval-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .bp-approval-sub {
          font-size: 13px;
          color: var(--app-text-muted);
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .bp-approval-checks {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
          margin-bottom: 28px;
        }
        .bp-approval-check {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--app-text-dim);
          transition: color 0.3s;
        }
        .bp-approval-check--done {
          color: var(--app-text);
        }
        .bp-approval-check-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid var(--app-border-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .bp-approval-check-dot--done {
          background: #50e3c2;
          border-color: #50e3c2;
        }
        .bp-approval-progress {
          width: 100%;
          height: 3px;
          background: var(--app-border);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        .bp-approval-progress-bar {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #60a5fa, #50e3c2);
          transition: width 1.8s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>

      <div className="bp-page-enter">

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
          {editMode ? (
            <>
              <button className="bp-btn-secondary" onClick={toggleTheme} style={{ display: "flex", alignItems: "center", padding: "8px 10px" }}>
                {dark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
              <button className="bp-btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="bp-btn-primary" onClick={() => {
                // Apply edits
                mockData.targeting.geo = editGeo;
                mockData.targeting.geoSecondary = editGeoSecondary;
                mockData.complianceLevel = editCompliance;
                setEditMode(false);
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="bp-btn-secondary" onClick={toggleTheme} style={{ display: "flex", alignItems: "center", padding: "8px 10px" }}>
                {dark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
              <button className="bp-btn-secondary" onClick={() => setEditMode(true)}>Edit Blueprint</button>
              <button className="bp-btn-primary" onClick={handleApprove}>
                Approve & Continue
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
              <button onClick={() => navigate("/amplify-os/content-studio")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px dashed var(--app-text-dim)", background: "transparent", color: "var(--app-text-secondary)", fontSize: 11, cursor: "pointer", marginLeft: 4, transition: "all 0.15s", flexShrink: 0 }} title="Skip to next section">Skip &rsaquo;</button>
            </>
          )}
        </div>
      </header>

      <div className="bp-layout">
      <div className="bp-content">

        {/* Hero */}
        <div className="bp-hero">
          <h1>{d.avatar.label}</h1>
          <p className="bp-hero-sub">{d.advisorName} · {d.market} · Compliance: {d.complianceLevel}</p>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="bp-edit-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            <span>Editing — You can add notes to <strong>Pain Points</strong>, <strong>Ad Angles</strong>, and <strong>Education Topics</strong>. You can edit <strong>Targeting</strong> markets and <strong>Compliance Level</strong>. Use the chat to revise the ICP or request AI rewrites.</span>
          </div>
        )}

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
            {editMode && (
              <div className="bp-edit-locked" style={{ gridColumn: "1 / -1" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                ICP Profile can only be revised through the chat. Ask the Strategy Assistant to make changes.
              </div>
            )}
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
                    <span style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.5 }}>{o.outcome}</span>
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
                <div key={i} className={`bp-expandable ${isOpen ? "bp-expandable--open" : ""}`}>
                  <div className="bp-expand-header" onClick={() => setExpandedPain(isOpen ? null : i)} style={{ cursor: "pointer" }}>
                    <div className="bp-rank" style={{ background: "rgba(237,237,237,0.06)", color: "var(--app-text)" }}>
                      {pp.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{pp.title}</div>
                      <div style={{ fontSize: 12, color: "var(--app-text-muted)" }}>{pp.description.slice(0, 80)}...</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="bp-tag" style={{ background: pp.urgency === "High" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: urgencyColors[pp.urgency] }}>{pp.urgency} Urgency</span>
                      <span className="bp-tag" style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc" }}>{pp.emotional}</span>
                    </div>
                    <span className={`bp-chevron ${isOpen ? "bp-chevron--open" : ""}`}>&#9662;</span>
                  </div>
                  {isOpen && (
                    <div className="bp-expand-body">
                      <div style={{ paddingTop: 14, fontSize: 13, color: "var(--app-text-secondary)", lineHeight: 1.7 }}>{pp.description}</div>
                      <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>
                        <div className="bp-dim-label" style={{ marginBottom: 6 }}>Why This Matters for Content</div>
                        <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.6 }}>
                          This pain point directly informs ad angles, webinar content, and sequence messaging. Ads that lead with this concern will resonate because the emotional weight ({pp.emotional.toLowerCase()}) combined with {pp.urgency.toLowerCase()} urgency creates a strong motivation to act.
                        </div>
                      </div>
                      {editMode && (
                        <div className="bp-edit-note-wrap">
                          <textarea
                            value={painNotes[i] ?? ""}
                            onChange={(e) => { e.stopPropagation(); setPainNotes((prev) => ({ ...prev, [i]: e.target.value })); }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Add notes — e.g. pain points you hear from clients, things that are missing..."
                            className="bp-edit-note"
                          />
                          <button
                            className="bp-edit-ai-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const note = painNotes[i]?.trim();
                              const prompt = note
                                ? `Revise pain point "${pp.title}" with this feedback: ${note}`
                                : `Completely revise pain point "${pp.title}" with a fresh perspective`;
                              handleChatSend(prompt);
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            Ask AI to Revise
                          </button>
                        </div>
                      )}
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
            <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              These are the content angles the system will use to generate ad scripts. Each angle targets a specific pain point with a unique messaging approach. Meta's Andromeda algorithm performs best with 15+ diverse angles per month.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {d.angles.map((a, i) => {
                const cc = categoryColors[a.category] || { bg: "rgba(237,237,237,0.06)", text: "var(--app-text)" };
                const isExp = expandedAngle === i;
                return (
                  <div key={i} className={`bp-expandable ${isExp ? "bp-expandable--open" : ""}`}>
                    <div style={{ padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpandedAngle(isExp ? null : i)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="bp-tag" style={{ background: cc.bg, color: cc.text, borderRadius: 6 }}>{a.category}</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                        </div>
                        <span className={`bp-chevron ${isExp ? "bp-chevron--open" : ""}`}>&#9662;</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.5, fontStyle: "italic" }}>"{a.hook}"</div>
                    </div>
                    {isExp && (
                      <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--app-border-subtle)" }}>
                        <div style={{ paddingTop: 14 }}>
                          <div className="bp-dim-label" style={{ marginBottom: 6 }}>Why This Angle Works</div>
                          <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.6 }}>{a.why}</div>
                        </div>
                        {editMode && (
                          <div className="bp-edit-note-wrap">
                            <textarea
                              value={angleNotes[i] ?? ""}
                              onChange={(e) => { e.stopPropagation(); setAngleNotes((prev) => ({ ...prev, [i]: e.target.value })); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Add insights, missing pain points, or notes for this angle..."
                              className="bp-edit-note"
                            />
                            <button
                              className="bp-edit-ai-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const note = angleNotes[i]?.trim();
                                const prompt = note
                                  ? `Revise ad angle "${a.name}" with this feedback: ${note}`
                                  : `Completely revise ad angle "${a.name}" with a fresh hook and approach`;
                                handleChatSend(prompt);
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                              Ask AI to Revise
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {editMode && (
              <div className="bp-edit-add-wrap">
                <button className="bp-edit-ai-btn" onClick={() => handleChatSend("Suggest additional ad angles based on pain points I think are missing")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Ask AI to Suggest More Angles
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: EDUCATION TOPICS */}
        {activeTab === "education" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: "var(--app-text-secondary)", lineHeight: 1.6 }}>{t.description}</div>
                      <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                        {(["Webinar", "Ads", "Organic"] as const).map(tag => (
                          <span key={tag} className="bp-tag-outline">{tag}</span>
                        ))}
                      </div>
                      {editMode && (
                        <div className="bp-edit-note-wrap">
                          <textarea
                            value={eduNotes[i] ?? ""}
                            onChange={(e) => setEduNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                            placeholder="Leave a note — e.g. different angles, additional context, things to add or change..."
                            className="bp-edit-note"
                          />
                          <button
                            className="bp-edit-ai-btn"
                            onClick={() => {
                              const note = eduNotes[i]?.trim();
                              const prompt = note
                                ? `Revise education topic "${t.title}" with this context: ${note}`
                                : `Completely revise education topic "${t.title}" with a fresh perspective`;
                              handleChatSend(prompt);
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            Ask AI to Revise
                          </button>
                        </div>
                      )}
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
              <div className={editMode ? "bp-edit-highlight" : ""} style={{ marginBottom: 18, padding: editMode ? 12 : 0, borderRadius: 8 }}>
                <div className="bp-dim-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  Primary Market
                  {editMode && <span className="bp-edit-badge">Editable</span>}
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={editGeo}
                    onChange={(e) => setEditGeo(e.target.value)}
                    className="bp-edit-field"
                  />
                ) : (
                  <div style={{ fontSize: 13 }}>{d.targeting.geo}</div>
                )}
              </div>
              <div className={editMode ? "bp-edit-highlight" : ""} style={{ padding: editMode ? 12 : 0, borderRadius: 8 }}>
                <div className="bp-dim-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  Expansion Markets
                  {editMode && <span className="bp-edit-badge">Editable</span>}
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={editGeoSecondary}
                    onChange={(e) => setEditGeoSecondary(e.target.value)}
                    className="bp-edit-field"
                  />
                ) : (
                  <div style={{ fontSize: 13, color: "var(--app-text-secondary)" }}>{d.targeting.geoSecondary}</div>
                )}
              </div>
            </div>
            <div className="bp-card">
              <h3 className="bp-card-title">Interest Signals</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {d.targeting.interests.map((interest, i) => (
                  <span key={i} className="bp-interest">{interest}</span>
                ))}
              </div>
              <div className={editMode ? "bp-edit-highlight" : ""} style={{ marginTop: 24, padding: editMode ? 12 : 0, borderRadius: 8 }}>
                <div className="bp-dim-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  Compliance Level
                  {editMode && <span className="bp-edit-badge">Editable</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {(["Conservative", "Moderate", "Aggressive"] as const).map((level, i) => {
                    const active = editMode ? editCompliance === level : d.complianceLevel === level;
                    const activeColors = [
                      { bg: "rgba(80,227,194,0.1)", color: "#50e3c2" },
                      { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
                      { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
                    ];
                    return (
                      <div
                        key={level}
                        className={`bp-compliance-level ${active ? "bp-compliance-level--active" : ""} ${editMode ? "bp-compliance-level--editable" : ""}`}
                        style={active ? { background: activeColors[i].bg, color: activeColors[i].color, borderColor: "transparent" } : {}}
                        onClick={() => editMode && setEditCompliance(level)}
                      >
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

          // Revenue model calculations
          const avgAUM = 500000;
          const aumFeeRate = 0.01;
          const avgAnnuityPremium = 250000;
          const annuityCommRate = 0.06;
          const avgFinPlanFee = 3500;

          const aumRevPerClient = avgAUM * aumFeeRate; // $5,000/yr recurring
          const annuityRevPerClient = avgAnnuityPremium * annuityCommRate; // $15,000 one-time
          const feeRevPerClient = avgFinPlanFee; // $3,500/yr

          const blendedRevPerClient = (
            (revSplitAUM / 100) * aumRevPerClient +
            (revSplitAnnuities / 100) * annuityRevPerClient +
            (revSplitFee / 100) * feeRevPerClient
          );
          const totalNewRev = clients * blendedRevPerClient;
          const roi = ((totalNewRev - spend * 12) / (spend * 12) * 100);

          // 12-month cumulative data (AUM recurring, annuities upfront, fees recurring)
          const monthlyData = Array.from({ length: 12 }, (_, m) => {
            const mo = m + 1;
            const aumCum = clients * mo * aumRevPerClient * (revSplitAUM / 100);
            const annuityCum = clients * mo * annuityRevPerClient * (revSplitAnnuities / 100);
            const feeCum = clients * mo * feeRevPerClient * (revSplitFee / 100);
            return { month: mo, aum: aumCum, annuity: annuityCum, fee: feeCum, total: aumCum + annuityCum + feeCum, spend: spend * mo };
          });
          const maxCumRev = monthlyData[11].total;

          const funnel = [
            { label: "Monthly Ad Spend", value: `$${spend.toLocaleString()}`, sub: "Based on your budget range", color: "var(--app-text)" },
            { label: "Total Leads", value: leads.toString(), sub: `~$${cpl} cost per lead`, color: "#60a5fa" },
            { label: "Qualified Leads", value: qualLeads.toString(), sub: `${Math.round(qualRate * 100)}% qualification rate`, color: "#50e3c2" },
            { label: "Appointments Booked", value: appts.toString(), sub: `${Math.round(bookingRate * 100)}% booking rate`, color: "#c084fc" },
            { label: "New Clients", value: clients.toString(), sub: `${Math.round(closeRate * 100)}% close rate`, color: "#fbbf24" },
          ];

          const modelLabels: Record<string, string> = { aum: "AUM", annuities: "Annuities", "fee-based": "Fee-Based", hybrid: "Hybrid" };

          return (
            <div>
              {editMode && (
                <div className="bp-edit-locked">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Projections are calculated automatically based on your blueprint data and cannot be manually edited.
                </div>
              )}
              <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
                Based on your target audience, service model, and market — here's what a typical month could look like. These are conservative estimates based on industry benchmarks for financial advisor campaigns.
              </p>

              {/* Revenue Model Selector */}
              <div className="bp-card" style={{ marginBottom: 20, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 className="bp-card-title" style={{ margin: 0 }}>Revenue Model</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["aum", "annuities", "fee-based", "hybrid"] as RevenueModel[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => applyRevenuePreset(m)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: revenueModel === m ? "1px solid var(--app-text)" : "1px solid var(--app-border-hover)",
                          background: revenueModel === m ? "var(--app-text)" : "transparent",
                          color: revenueModel === m ? "var(--app-bg)" : "var(--app-text-secondary)",
                          fontSize: 12,
                          fontWeight: revenueModel === m ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {modelLabels[m]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Revenue split sliders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                  {[
                    { label: "AUM Revenue", value: revSplitAUM, set: setRevSplitAUM, color: "#60a5fa", desc: `$${aumRevPerClient.toLocaleString()}/yr per client` },
                    { label: "Annuity Commissions", value: revSplitAnnuities, set: setRevSplitAnnuities, color: "#c084fc", desc: `$${annuityRevPerClient.toLocaleString()} per client` },
                    { label: "Financial Planning Fees", value: revSplitFee, set: setRevSplitFee, color: "#fbbf24", desc: `$${feeRevPerClient.toLocaleString()}/yr per client` },
                  ].map((s) => (
                    <div key={s.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "var(--app-text-secondary)" }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.value}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={s.value}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          s.set(v);
                          setRevenueModel("hybrid");
                        }}
                        style={{
                          width: "100%",
                          height: 4,
                          appearance: "none",
                          WebkitAppearance: "none",
                          background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${s.value}%, var(--app-border) ${s.value}%, var(--app-border) 100%)`,
                          borderRadius: 4,
                          outline: "none",
                          cursor: "pointer",
                          accentColor: s.color,
                        }}
                      />
                      <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginTop: 4 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
                {/* Split total indicator */}
                {(() => {
                  const total = revSplitAUM + revSplitAnnuities + revSplitFee;
                  return (
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--app-border)", overflow: "hidden", display: "flex" }}>
                        {revSplitAUM > 0 && <div style={{ width: `${(revSplitAUM / total) * 100}%`, background: "#60a5fa", height: "100%" }} />}
                        {revSplitAnnuities > 0 && <div style={{ width: `${(revSplitAnnuities / total) * 100}%`, background: "#c084fc", height: "100%" }} />}
                        {revSplitFee > 0 && <div style={{ width: `${(revSplitFee / total) * 100}%`, background: "#fbbf24", height: "100%" }} />}
                      </div>
                      <span style={{ fontSize: 11, color: total === 100 ? "var(--app-text-dim)" : "#ef4444", whiteSpace: "nowrap" }}>
                        {total === 100 ? "100% allocated" : `${total}% — adjust to 100%`}
                      </span>
                    </div>
                  );
                })()}
                <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--app-bg)", borderRadius: 8, border: "1px solid var(--app-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--app-text-secondary)" }}>Blended Revenue per Client</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#50e3c2" }}>${Math.round(blendedRevPerClient).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Funnel */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {funnel.map((f, i) => (
                  <div key={i} style={{ flex: 1, position: "relative" }}>
                    <div className="bp-card" style={{ textAlign: "center", padding: "20px 14px", borderTop: `2px solid ${f.color}` }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.value}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: "var(--app-text-dim)" }}>{f.sub}</div>
                    </div>
                    {i < funnel.length - 1 && (
                      <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "var(--app-text-faint)", fontSize: 16, zIndex: 1 }}>&#8250;</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Revenue projections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                <div className="bp-card">
                  <h3 className="bp-card-title">Revenue Impact</h3>
                  {[
                    ["Blended Rev / Client", `$${Math.round(blendedRevPerClient).toLocaleString()}`],
                    ...(revSplitAUM > 0 ? [["  AUM Component", `$${Math.round(aumRevPerClient * revSplitAUM / 100).toLocaleString()}/yr`]] : []),
                    ...(revSplitAnnuities > 0 ? [["  Annuity Component", `$${Math.round(annuityRevPerClient * revSplitAnnuities / 100).toLocaleString()}`]] : []),
                    ...(revSplitFee > 0 ? [["  Fee Component", `$${Math.round(feeRevPerClient * revSplitFee / 100).toLocaleString()}/yr`]] : []),
                    ["New Clients (Monthly)", clients.toString()],
                    ["New Annual Revenue", `$${Math.round(totalNewRev).toLocaleString()}`],
                  ].map(([label, val], i, arr) => (
                    <div key={i} className="bp-row">
                      <span className="bp-row-label" style={(label as string).startsWith("  ") ? { paddingLeft: 12, fontSize: 12, color: "var(--app-text-muted)" } : {}}>{(label as string).trim()}</span>
                      <span className="bp-row-value" style={i === arr.length - 1 ? { color: "#50e3c2", fontWeight: 600 } : {}}>{val}</span>
                    </div>
                  ))}
                </div>

                <div className="bp-card">
                  <h3 className="bp-card-title">Return on Investment</h3>
                  <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: roi > 0 ? "#50e3c2" : "#ef4444", letterSpacing: "-0.03em" }}>{roi > 0 ? "+" : ""}{Math.round(roi)}%</div>
                    <div style={{ fontSize: 13, color: "var(--app-text-secondary)", marginTop: 4 }}>Estimated first-year ROI</div>
                  </div>
                  <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>
                    <div className="bp-dim-label" style={{ marginBottom: 6 }}>The Math</div>
                    <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>Annual ad spend</span>
                        <span style={{ color: "var(--app-text)" }}>${(spend * 12).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span>New revenue generated</span>
                        <span style={{ color: "#50e3c2" }}>${Math.round(totalNewRev).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--app-border)", paddingTop: 6, marginTop: 4 }}>
                        <span style={{ fontWeight: 500, color: "var(--app-text)" }}>Net return</span>
                        <span style={{ fontWeight: 600, color: "#50e3c2" }}>${Math.round(totalNewRev - spend * 12).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 11, color: "var(--app-text-dim)", lineHeight: 1.5 }}>
                    * Projections based on your {modelLabels[revenueModel].toLowerCase()} revenue model. Actual results vary based on market conditions, ad creative quality, and sales process.
                  </div>
                </div>
              </div>

              {/* ── Visual Dashboard ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* 12-Month Revenue Growth Chart */}
                <div className="bp-card" style={{ padding: "24px" }}>
                  <h3 className="bp-card-title">12-Month Cumulative Revenue</h3>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, marginTop: 12 }}>
                    {monthlyData.map((m) => {
                      const pct = maxCumRev > 0 ? (m.total / maxCumRev) * 100 : 0;
                      const spendPct = maxCumRev > 0 ? (m.spend / maxCumRev) * 100 : 0;
                      return (
                        <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative" }}>
                          {/* Spend line indicator */}
                          <div style={{ position: "absolute", bottom: `${Math.min(spendPct, 100)}%`, left: 0, right: 0, borderTop: "1px dashed #ef444466", zIndex: 2 }} />
                          {/* Stacked bar */}
                          <div style={{ width: "100%", borderRadius: "3px 3px 0 0", overflow: "hidden", display: "flex", flexDirection: "column-reverse" }}>
                            {revSplitAUM > 0 && (
                              <div style={{ height: `${(m.aum / maxCumRev) * 160}px`, background: "#60a5fa", minHeight: m.aum > 0 ? 1 : 0 }} />
                            )}
                            {revSplitAnnuities > 0 && (
                              <div style={{ height: `${(m.annuity / maxCumRev) * 160}px`, background: "#c084fc", minHeight: m.annuity > 0 ? 1 : 0 }} />
                            )}
                            {revSplitFee > 0 && (
                              <div style={{ height: `${(m.fee / maxCumRev) * 160}px`, background: "#fbbf24", minHeight: m.fee > 0 ? 1 : 0 }} />
                            )}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--app-text-dim)", marginTop: 4 }}>M{m.month}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 14, justifyContent: "center" }}>
                    {revSplitAUM > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--app-text-secondary)" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#60a5fa" }} />AUM</div>}
                    {revSplitAnnuities > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--app-text-secondary)" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#c084fc" }} />Annuities</div>}
                    {revSplitFee > 0 && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--app-text-secondary)" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#fbbf24" }} />Fees</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--app-text-secondary)" }}><div style={{ width: 12, height: 0, borderTop: "1px dashed #ef4444" }} />Ad Spend</div>
                  </div>
                </div>

                {/* Revenue Breakdown Donut-style */}
                <div className="bp-card" style={{ padding: "24px" }}>
                  <h3 className="bp-card-title">Revenue Breakdown per Client</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                    {[
                      { label: "AUM Fees", value: aumRevPerClient * revSplitAUM / 100, split: revSplitAUM, color: "#60a5fa", type: "Recurring" },
                      { label: "Annuity Commissions", value: annuityRevPerClient * revSplitAnnuities / 100, split: revSplitAnnuities, color: "#c084fc", type: "Upfront" },
                      { label: "Planning Fees", value: feeRevPerClient * revSplitFee / 100, split: revSplitFee, color: "#fbbf24", type: "Recurring" },
                    ].filter(r => r.split > 0).map((r) => (
                      <div key={r.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: r.type === "Recurring" ? "rgba(80,227,194,0.1)" : "rgba(192,132,252,0.1)", color: r.type === "Recurring" ? "#50e3c2" : "#c084fc" }}>{r.type}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: r.color }}>${Math.round(r.value).toLocaleString()}</span>
                        </div>
                        <div style={{ height: 8, background: "var(--app-border)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${blendedRevPerClient > 0 ? (r.value / blendedRevPerClient) * 100 : 0}%`, background: r.color, borderRadius: 4, transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key metrics */}
                  <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ padding: "14px", background: "var(--app-bg)", borderRadius: 8, border: "1px solid var(--app-border)", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--app-text)" }}>${Math.round(totalNewRev / 12).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginTop: 2 }}>Monthly New Revenue</div>
                    </div>
                    <div style={{ padding: "14px", background: "var(--app-bg)", borderRadius: 8, border: "1px solid var(--app-border)", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: roi > 0 ? "#50e3c2" : "#ef4444" }}>{roi > 0 ? "+" : ""}{Math.round(roi)}%</div>
                      <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginTop: 2 }}>First-Year ROI</div>
                    </div>
                  </div>

                  {/* Breakeven indicator */}
                  {(() => {
                    const monthlyRev = totalNewRev / 12;
                    const breakeven = monthlyRev > 0 ? Math.ceil(spend / monthlyRev) : null;
                    return breakeven && breakeven <= 12 ? (
                      <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(80,227,194,0.05)", borderRadius: 8, border: "1px solid rgba(80,227,194,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#50e3c2" }} />
                        <span style={{ fontSize: 12, color: "#50e3c2" }}>Breakeven in ~{breakeven} month{breakeven > 1 ? "s" : ""} based on your revenue model</span>
                      </div>
                    ) : null;
                  })()}
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
          {aiThinking && (
            <div className="bp-chat-msg bp-chat-msg--ai">
              <div className="bp-chat-msg-avatar">A</div>
              <div className="bp-chat-bubble bp-chat-bubble--ai bp-chat-thinking">
                <div className="bp-thinking-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          {chatMessages.length === 1 && !aiThinking && (
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
      </div>{/* close reveal wrapper */}

      {/* ── Approval Overlay ── */}
      {showApproval && (() => {
        const checks = [
          { label: "ICP Profile verified", delay: 0.4 },
          { label: "Pain points & ad angles locked", delay: 0.8 },
          { label: "Education topics confirmed", delay: 1.2 },
          { label: "Targeting & compliance saved", delay: 1.6 },
          { label: "Blueprint approved", delay: 2.0 },
        ];
        const isDone = approvalStage === "approved" || approvalStage === "done";
        return (
          <div className="bp-approval-overlay">
            <div className="bp-approval-card">
              <div className={`bp-approval-icon ${isDone ? "bp-approval-icon--approved" : "bp-approval-icon--checking"}`}>
                {isDone ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#50e3c2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <div className="bp-approval-spinner" />
                )}
              </div>
              <div className="bp-approval-title">
                {approvalStage === "checking" ? "Finalizing Blueprint..." : approvalStage === "approved" ? "Blueprint Approved" : "Redirecting..."}
              </div>
              <div className="bp-approval-sub">
                {approvalStage === "checking"
                  ? "Locking in your strategy and preparing your content studio."
                  : approvalStage === "approved"
                  ? "Your marketing strategy is locked and ready. Let's build your content."
                  : "Taking you to the Video Generation Studio..."}
              </div>
              <div className="bp-approval-checks">
                {checks.map((c, i) => {
                  const checkDone = isDone || (approvalStage === "checking" && i < 3);
                  return (
                    <div key={i} className={`bp-approval-check ${checkDone ? "bp-approval-check--done" : ""}`} style={{ animation: `bp-fade-in 0.3s ease both`, animationDelay: `${c.delay}s` }}>
                      <div className={`bp-approval-check-dot ${checkDone ? "bp-approval-check-dot--done" : ""}`}>
                        {checkDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--app-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                      {c.label}
                    </div>
                  );
                })}
              </div>
              <div className="bp-approval-progress">
                <div className="bp-approval-progress-bar" style={{ width: approvalStage === "checking" ? "60%" : "100%" }} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
