import React, { useState } from "react";

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

interface AdvisorFees {
  aumFeePct: number;           // e.g. 1.0 = 1%
  avgClientAUM: number;        // average AUM per client
  aumMixPct: number;           // % of new clients that are AUM (e.g. 60)
  annuityAvgCommission: number; // upfront commission per annuity sale
  annuityMixPct: number;       // % of new clients that are annuity (e.g. 40)
  financialPlanAvgPrice: number;// fee per financial plan
  planAttachRate: number;      // % of clients that also buy a plan (e.g. 70)
  monthlyAdSpend: number;
  leadsPerMonth: number;
  leadToClientPct: number;     // conversion rate (e.g. 8 = 8%)
}

interface YearProjection {
  year: number;
  newClients: number;
  aumRevenue: number;          // recurring AUM fees (cumulative clients)
  annuityRevenue: number;      // one-time commissions that year
  planRevenue: number;         // plan fees that year
  totalRevenue: number;
  adSpend: number;
  netROI: number;
  cumulativeRevenue: number;
  cumulativeAdSpend: number;
  cumulativeROI: number;
  totalClientsManaged: number; // running count of AUM clients
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
  fees: AdvisorFees;
}

type TabId = "icp" | "pain" | "angles" | "education" | "targeting" | "projections";

type ProjectionHorizon = "1y" | "2y" | "5y" | "10y";

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
  fees: {
    aumFeePct: 1.0,
    avgClientAUM: 450000,
    aumMixPct: 60,
    annuityAvgCommission: 4500,
    annuityMixPct: 40,
    financialPlanAvgPrice: 2500,
    planAttachRate: 70,
    monthlyAdSpend: 3000,
    leadsPerMonth: 40,
    leadToClientPct: 8,
  },
};

// ─── Projection Engine ───────────────────────────────────────────────────────

function buildProjections(fees: AdvisorFees, years: number): YearProjection[] {
  const newClientsPerMonth = fees.leadsPerMonth * (fees.leadToClientPct / 100);
  const newClientsPerYear = Math.round(newClientsPerMonth * 12);
  const aumClientsPerYear = Math.round(newClientsPerYear * (fees.aumMixPct / 100));
  const annuityClientsPerYear = Math.round(newClientsPerYear * (fees.annuityMixPct / 100));
  const planClientsPerYear = Math.round(newClientsPerYear * (fees.planAttachRate / 100));
  const annualAumPerClient = fees.avgClientAUM * (fees.aumFeePct / 100);
  const annualAdSpend = fees.monthlyAdSpend * 12;

  const projections: YearProjection[] = [];
  let cumulativeRevenue = 0;
  let cumulativeAdSpend = 0;
  let totalAumClients = 0;

  for (let y = 1; y <= years; y++) {
    totalAumClients += aumClientsPerYear;
    const aumRevenue = totalAumClients * annualAumPerClient;
    const annuityRevenue = annuityClientsPerYear * fees.annuityAvgCommission;
    const planRevenue = planClientsPerYear * fees.financialPlanAvgPrice;
    const totalRevenue = aumRevenue + annuityRevenue + planRevenue;
    cumulativeRevenue += totalRevenue;
    cumulativeAdSpend += annualAdSpend;

    projections.push({
      year: y,
      newClients: newClientsPerYear,
      aumRevenue: Math.round(aumRevenue),
      annuityRevenue: Math.round(annuityRevenue),
      planRevenue: Math.round(planRevenue),
      totalRevenue: Math.round(totalRevenue),
      adSpend: annualAdSpend,
      netROI: Math.round(totalRevenue - annualAdSpend),
      cumulativeRevenue: Math.round(cumulativeRevenue),
      cumulativeAdSpend: Math.round(cumulativeAdSpend),
      cumulativeROI: Math.round(cumulativeRevenue - cumulativeAdSpend),
      totalClientsManaged: totalAumClients + annuityClientsPerYear,
    });
  }
  return projections;
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatCurrencyFull(n: number): string {
  return `$${n.toLocaleString()}`;
}

const COLORS = {
  bg: "#09090b",
  card: "#111114",
  cardHover: "#18181c",
  border: "#1e1e24",
  borderLight: "#2a2a32",
  text: "#e4e4e7",
  textMuted: "#71717a",
  textDim: "#52525b",
  accent: "#3b82f6",
  accentMuted: "#1e3a5f",
  green: "#22c55e",
  greenMuted: "#14532d",
  amber: "#f59e0b",
  amberMuted: "#78350f",
  red: "#ef4444",
  redMuted: "#7f1d1d",
  purple: "#a855f7",
  purpleMuted: "#581c87",
  cyan: "#06b6d4",
  cyanMuted: "#164e63",
} as const;

const categoryColors: Record<AngleCategory, CategoryColor> = {
  Tax: { bg: "#1e3a5f", text: "#60a5fa" },
  SS: { bg: "#14532d", text: "#4ade80" },
  Income: { bg: "#78350f", text: "#fbbf24" },
  Cost: { bg: "#7f1d1d", text: "#f87171" },
  Urgency: { bg: "#581c87", text: "#c084fc" },
  Risk: { bg: "#164e63", text: "#22d3ee" },
  Healthcare: { bg: "#365314", text: "#a3e635" },
};

const urgencyColors: Record<PainPoint["urgency"], string> = {
  High: COLORS.red,
  Medium: COLORS.amber,
  Low: COLORS.green,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketingBlueprint(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("icp");
  const [expandedAngle, setExpandedAngle] = useState<number | null>(null);
  const [expandedPain, setExpandedPain] = useState<number | null>(null);
  const [projectionHorizon, setProjectionHorizon] = useState<ProjectionHorizon>("1y");

  const d = mockData;
  const allProjections = buildProjections(d.fees, 10);
  const horizonYears: Record<ProjectionHorizon, number> = { "1y": 1, "2y": 2, "5y": 5, "10y": 10 };
  const visibleYears = horizonYears[projectionHorizon];
  const projections = allProjections.slice(0, visibleYears);
  const lastYear = projections[projections.length - 1];

  const tabs: Tab[] = [
    { id: "icp", label: "ICP Profile" },
    { id: "pain", label: "Pain Points" },
    { id: "angles", label: "Ad Angles" },
    { id: "education", label: "Education Topics" },
    { id: "targeting", label: "Targeting" },
    { id: "projections", label: "Projections" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>Marketing Blueprint</span>
          <span style={{ fontSize: 13, color: COLORS.textDim }}>•</span>
          <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{d.firmName}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${COLORS.borderLight}`, background: "transparent", color: COLORS.textMuted, fontSize: 13, cursor: "pointer" }}>Edit Blueprint</button>
          <button style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: COLORS.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Approve & Continue →</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* Header summary */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>{d.avatar.label}</h1>
          <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0 }}>{d.advisorName} · {d.market} · Compliance: {d.complianceLevel}</p>
        </div>

        {/* Quick stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Age Range", value: `${d.avatar.ageRange[0]}–${d.avatar.ageRange[1]}` },
            { label: "Net Worth", value: d.avatar.netWorth },
            { label: "Min AUM", value: d.avatar.minimumAUM },
            { label: "Life Stage", value: d.avatar.lifeStage },
            { label: "Ad Angles", value: `${d.angles.length} angles` },
          ].map((s, i) => (
            <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 18px", fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, cursor: "pointer",
              background: "transparent", border: "none",
              color: activeTab === t.id ? COLORS.text : COLORS.textMuted,
              borderBottom: activeTab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* TAB: ICP PROFILE */}
        {activeTab === "icp" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left: Demographics */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: COLORS.accent }}>Demographics</h3>
              {[
                ["Age Range", `${d.avatar.ageRange[0]}–${d.avatar.ageRange[1]} years old`],
                ["Income", d.avatar.incomeRange],
                ["Net Worth", d.avatar.netWorth],
                ["Minimum AUM", d.avatar.minimumAUM],
                ["Life Stage", d.avatar.lifeStage],
                ["Geography", d.targeting.geo],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 5 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Right: Psychographics */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: COLORS.purple }}>Psychographic Profile</h3>
              {[
                ["Occupation", d.avatar.occupation],
                ["Decision Style", d.avatar.decisionStyle],
                ["Tone Match", d.tone],
              ].map(([label, val], i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{val}</div>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Desired Outcomes</div>
                {d.desiredOutcomes.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: i === 0 ? COLORS.greenMuted : i === 1 ? COLORS.accentMuted : i === 2 ? COLORS.purpleMuted : COLORS.amberMuted, color: i === 0 ? COLORS.green : i === 1 ? COLORS.accent : i === 2 ? COLORS.purple : COLORS.amber, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>{o.type}</span>
                    <span style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>{o.outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAIN POINTS */}
        {activeTab === "pain" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.painPoints.map((pp, i) => (
              <div key={i} onClick={() => setExpandedPain(expandedPain === i ? null : i)}
                style={{ background: COLORS.card, border: `1px solid ${expandedPain === i ? COLORS.borderLight : COLORS.border}`, borderRadius: 12, cursor: "pointer", overflow: "hidden", transition: "border-color 0.15s" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accentMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                    {pp.rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{pp.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{pp.description.slice(0, 80)}...</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 600, background: pp.urgency === "High" ? COLORS.redMuted : COLORS.amberMuted, color: urgencyColors[pp.urgency] }}>{pp.urgency} Urgency</span>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: COLORS.purpleMuted, color: COLORS.purple, fontWeight: 600 }}>{pp.emotional}</span>
                  </div>
                  <span style={{ color: COLORS.textDim, fontSize: 16, transform: expandedPain === i ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                </div>
                {expandedPain === i && (
                  <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${COLORS.border}` }}>
                    <div style={{ paddingTop: 14, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7 }}>{pp.description}</div>
                    <div style={{ marginTop: 12, padding: "10px 14px", background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>WHY THIS MATTERS FOR CONTENT</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
                        This pain point directly informs ad angles, webinar content, and sequence messaging. Ads that lead with this concern will resonate because the emotional weight ({pp.emotional.toLowerCase()}) combined with {pp.urgency.toLowerCase()} urgency creates a strong motivation to act.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: AD ANGLES */}
        {activeTab === "angles" && (
          <div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
              These are the content angles the system will use to generate ad scripts. Each angle targets a specific pain point with a unique messaging approach. Meta's Andromeda algorithm performs best with 15+ diverse angles per month.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {d.angles.map((a, i) => {
                const cc = categoryColors[a.category] || { bg: COLORS.accentMuted, text: COLORS.accent };
                const isExp = expandedAngle === i;
                return (
                  <div key={i} onClick={() => setExpandedAngle(isExp ? null : i)}
                    style={{ background: COLORS.card, border: `1px solid ${isExp ? COLORS.borderLight : COLORS.border}`, borderRadius: 12, cursor: "pointer", overflow: "hidden", transition: "border-color 0.15s" }}>
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: cc.bg, color: cc.text, fontWeight: 600 }}>{a.category}</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                        </div>
                        <span style={{ color: COLORS.textDim, fontSize: 14, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>"{a.hook}"</div>
                    </div>
                    {isExp && (
                      <div style={{ padding: "0 18px 14px", borderTop: `1px solid ${COLORS.border}` }}>
                        <div style={{ paddingTop: 12 }}>
                          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Why This Angle Works</div>
                          <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>{a.why}</div>
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
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
              These 3 topics form the backbone of all educational content — the webinar, long-form videos, and organic posts. The Amplified framework always focuses on exactly 3 topics to build authority without overwhelming the audience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.educationTopics.map((t, i) => (
                <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? COLORS.accentMuted : i === 1 ? COLORS.greenMuted : COLORS.purpleMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: i === 0 ? COLORS.accent : i === 1 ? COLORS.green : COLORS.purple, flexShrink: 0 }}>
                    {t.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>{t.description}</div>
                    <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                      {(["Webinar", "Ads", "Organic"] as const).map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textDim }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TARGETING */}
        {activeTab === "targeting" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: COLORS.cyan }}>Targeting Approach</h3>
              <div style={{ padding: "10px 14px", background: COLORS.cyanMuted, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.cyan }}>{d.targeting.approach}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.5 }}>Let the creative do the targeting. Broad audience + specific messaging = Andromeda finds the right people.</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Primary Market</div>
                <div style={{ fontSize: 13 }}>{d.targeting.geo}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Expansion Markets</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>{d.targeting.geoSecondary}</div>
              </div>
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: COLORS.amber }}>Interest Signals</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {d.targeting.interests.map((int, i) => (
                  <span key={i} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, background: COLORS.amberMuted, color: COLORS.amber, fontWeight: 500 }}>{int}</span>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Compliance Level</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(["Conservative", "Moderate", "Aggressive"] as const).map((level, i) => (
                    <div key={level} style={{
                      flex: 1, padding: "8px 0", borderRadius: 6, textAlign: "center", fontSize: 12, fontWeight: d.complianceLevel === level ? 600 : 400,
                      background: d.complianceLevel === level ? (i === 0 ? COLORS.greenMuted : i === 1 ? COLORS.amberMuted : COLORS.redMuted) : COLORS.bg,
                      color: d.complianceLevel === level ? (i === 0 ? COLORS.green : i === 1 ? COLORS.amber : COLORS.red) : COLORS.textDim,
                      border: `1px solid ${d.complianceLevel === level ? "transparent" : COLORS.border}`,
                    }}>{level}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Angle Coverage</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Object.entries(categoryColors) as [AngleCategory, CategoryColor][]).map(([cat, cc]) => {
                    const count = d.angles.filter(a => a.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: cc.bg, fontSize: 11 }}>
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
          const maxCumulativeRev = allProjections[visibleYears - 1].cumulativeRevenue;
          const chartH = 240;
          const barColors = { aum: COLORS.accent, annuity: COLORS.green, plan: COLORS.purple };

          // Revenue mix for the donut
          const totalAum = projections.reduce((s, p) => s + p.aumRevenue, 0);
          const totalAnnuity = projections.reduce((s, p) => s + p.annuityRevenue, 0);
          const totalPlan = projections.reduce((s, p) => s + p.planRevenue, 0);
          const totalAll = totalAum + totalAnnuity + totalPlan;
          const pctAum = totalAll > 0 ? totalAum / totalAll : 0;
          const pctAnnuity = totalAll > 0 ? totalAnnuity / totalAll : 0;

          // SVG donut helper
          const donutR = 52;
          const donutC = 2 * Math.PI * donutR;
          const seg1 = donutC * pctAum;
          const seg2 = donutC * pctAnnuity;
          const seg3 = donutC - seg1 - seg2;

          return (
            <div>
              {/* Horizon sub-tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                {(["1y", "2y", "5y", "10y"] as ProjectionHorizon[]).map(h => (
                  <button key={h} onClick={() => setProjectionHorizon(h)} style={{
                    padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: projectionHorizon === h ? 600 : 400, cursor: "pointer",
                    background: projectionHorizon === h ? COLORS.accentMuted : COLORS.card,
                    border: `1px solid ${projectionHorizon === h ? COLORS.accent : COLORS.border}`,
                    color: projectionHorizon === h ? COLORS.accent : COLORS.textMuted,
                    fontFamily: "inherit",
                  }}>
                    {{ "1y": "Year 1", "2y": "2 Years", "5y": "5 Years", "10y": "10 Years" }[h]}
                  </button>
                ))}
              </div>

              {/* KPI cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Total Revenue", value: formatCurrency(lastYear.cumulativeRevenue), sub: `${visibleYears}yr cumulative`, color: COLORS.green },
                  { label: "Total Ad Spend", value: formatCurrency(lastYear.cumulativeAdSpend), sub: `${formatCurrencyFull(d.fees.monthlyAdSpend)}/mo`, color: COLORS.red },
                  { label: "Net ROI", value: formatCurrency(lastYear.cumulativeROI), sub: `${Math.round((lastYear.cumulativeRevenue / lastYear.cumulativeAdSpend) * 100) / 100}x return`, color: lastYear.cumulativeROI > 0 ? COLORS.green : COLORS.red },
                  { label: "New Clients", value: `${lastYear.newClients * visibleYears}`, sub: `~${lastYear.newClients}/yr`, color: COLORS.accent },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{kpi.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, marginBottom: 2 }}>{kpi.value}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }}>

                {/* Stacked bar chart */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>Revenue by Year</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Stacked by revenue source</div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([["AUM Fees", barColors.aum], ["Annuity Comm.", barColors.annuity], ["Planning Fees", barColors.plan]] as const).map(([label, color]) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <svg width="100%" height={chartH + 40} viewBox={`0 0 ${projections.length * 80 + 40} ${chartH + 40}`} style={{ overflow: "visible" }}>
                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                      const y = chartH - chartH * pct;
                      const val = maxCumulativeRev > 0 ? Math.round((pct * (Math.max(...projections.map(p => p.totalRevenue)))) ) : 0;
                      return (
                        <g key={pct}>
                          <line x1={40} x2={projections.length * 80 + 40} y1={y} y2={y} stroke={COLORS.border} strokeWidth={1} />
                          {pct > 0 && <text x={36} y={y + 4} textAnchor="end" fill={COLORS.textDim} fontSize={10}>{formatCurrency(val)}</text>}
                        </g>
                      );
                    })}
                    {/* Bars */}
                    {projections.map((p, i) => {
                      const maxYearRev = Math.max(...projections.map(pr => pr.totalRevenue));
                      const barW = 40;
                      const x = 50 + i * 80;
                      const aumH = maxYearRev > 0 ? (p.aumRevenue / maxYearRev) * chartH : 0;
                      const annH = maxYearRev > 0 ? (p.annuityRevenue / maxYearRev) * chartH : 0;
                      const planH = maxYearRev > 0 ? (p.planRevenue / maxYearRev) * chartH : 0;
                      return (
                        <g key={i}>
                          {/* Plan (bottom) */}
                          <rect x={x} y={chartH - planH} width={barW} height={Math.max(planH, 0)} rx={3} fill={barColors.plan} opacity={0.85} />
                          {/* Annuity (middle) */}
                          <rect x={x} y={chartH - planH - annH} width={barW} height={Math.max(annH, 0)} rx={0} fill={barColors.annuity} opacity={0.85} />
                          {/* AUM (top) */}
                          <rect x={x} y={chartH - planH - annH - aumH} width={barW} height={Math.max(aumH, 0)} rx={3} fill={barColors.aum} opacity={0.85} />
                          {/* Label */}
                          <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fill={COLORS.textMuted} fontSize={11}>Yr {p.year}</text>
                          {/* Value on top */}
                          <text x={x + barW / 2} y={chartH - planH - annH - aumH - 8} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>{formatCurrency(p.totalRevenue)}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Revenue mix donut */}
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, alignSelf: "flex-start" }}>Revenue Mix</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20, alignSelf: "flex-start" }}>{visibleYears}-year breakdown</div>

                  <svg width={140} height={140} viewBox="0 0 140 140" style={{ marginBottom: 20 }}>
                    <circle cx={70} cy={70} r={donutR} fill="none" stroke={barColors.aum} strokeWidth={14}
                      strokeDasharray={`${seg1} ${donutC - seg1}`} strokeDashoffset={donutC * 0.25}
                      style={{ transition: "stroke-dasharray 0.4s" }} />
                    <circle cx={70} cy={70} r={donutR} fill="none" stroke={barColors.annuity} strokeWidth={14}
                      strokeDasharray={`${seg2} ${donutC - seg2}`} strokeDashoffset={donutC * 0.25 - seg1}
                      style={{ transition: "stroke-dasharray 0.4s" }} />
                    <circle cx={70} cy={70} r={donutR} fill="none" stroke={barColors.plan} strokeWidth={14}
                      strokeDasharray={`${seg3} ${donutC - seg3}`} strokeDashoffset={donutC * 0.25 - seg1 - seg2}
                      style={{ transition: "stroke-dasharray 0.4s" }} />
                    <text x={70} y={66} textAnchor="middle" fill={COLORS.text} fontSize={18} fontWeight={700}>{formatCurrency(totalAll)}</text>
                    <text x={70} y={82} textAnchor="middle" fill={COLORS.textMuted} fontSize={10}>total</text>
                  </svg>

                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "AUM Fees", amount: totalAum, color: barColors.aum, pct: Math.round(pctAum * 100) },
                      { label: "Annuity Comm.", amount: totalAnnuity, color: barColors.annuity, pct: Math.round(pctAnnuity * 100) },
                      { label: "Planning Fees", amount: totalPlan, color: barColors.plan, pct: Math.round((1 - pctAum - pctAnnuity) * 100) },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                            <span style={{ fontSize: 12, color: COLORS.textMuted }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{item.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: COLORS.border }}>
                          <div style={{ width: `${item.pct}%`, height: "100%", borderRadius: 2, background: item.color, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cumulative growth line chart */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Cumulative Growth</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Revenue vs. ad spend over time</div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 16, height: 3, borderRadius: 2, background: COLORS.green }} />
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>Cumulative Revenue</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 16, height: 3, borderRadius: 2, background: COLORS.red }} />
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>Cumulative Ad Spend</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const lineW = 700;
                  const lineH = 180;
                  const maxVal = lastYear.cumulativeRevenue;
                  const padL = 60;
                  const padR = 20;
                  const usableW = lineW - padL - padR;
                  const stepX = projections.length > 1 ? usableW / (projections.length - 1) : usableW;

                  const revPoints = projections.map((p, i) => `${padL + i * stepX},${lineH - (p.cumulativeRevenue / maxVal) * lineH}`).join(" ");
                  const spendPoints = projections.map((p, i) => `${padL + i * stepX},${lineH - (p.cumulativeAdSpend / maxVal) * lineH}`).join(" ");
                  // Fill area for revenue
                  const revFill = `${padL},${lineH} ${revPoints} ${padL + (projections.length - 1) * stepX},${lineH}`;

                  return (
                    <svg width="100%" height={lineH + 30} viewBox={`0 0 ${lineW} ${lineH + 30}`} style={{ overflow: "visible" }}>
                      {/* Grid */}
                      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                        const y = lineH - lineH * pct;
                        return (
                          <g key={pct}>
                            <line x1={padL} x2={lineW - padR} y1={y} y2={y} stroke={COLORS.border} strokeWidth={1} />
                            <text x={padL - 8} y={y + 4} textAnchor="end" fill={COLORS.textDim} fontSize={10}>{formatCurrency(Math.round(maxVal * pct))}</text>
                          </g>
                        );
                      })}
                      {/* Revenue fill */}
                      <polygon points={revFill} fill={COLORS.green} opacity={0.07} />
                      {/* Revenue line */}
                      <polyline points={revPoints} fill="none" stroke={COLORS.green} strokeWidth={2.5} strokeLinejoin="round" />
                      {/* Spend line */}
                      <polyline points={spendPoints} fill="none" stroke={COLORS.red} strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" />
                      {/* Dots & labels */}
                      {projections.map((p, i) => {
                        const x = padL + i * stepX;
                        const yRev = lineH - (p.cumulativeRevenue / maxVal) * lineH;
                        const ySpend = lineH - (p.cumulativeAdSpend / maxVal) * lineH;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={yRev} r={4} fill={COLORS.green} />
                            <circle cx={x} cy={ySpend} r={3} fill={COLORS.red} />
                            <text x={x} y={lineH + 16} textAnchor="middle" fill={COLORS.textMuted} fontSize={11}>Yr {p.year}</text>
                            {(i === projections.length - 1 || projections.length <= 5) && (
                              <text x={x} y={yRev - 10} textAnchor="middle" fill={COLORS.green} fontSize={10} fontWeight={600}>{formatCurrency(p.cumulativeRevenue)}</text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              {/* Year-by-year breakdown table */}
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Year-by-Year Breakdown</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Year", "New Clients", "AUM Revenue", "Annuity Comm.", "Plan Fees", "Total Revenue", "Ad Spend", "Net ROI"].map(h => (
                          <th key={h} style={{ textAlign: h === "Year" ? "left" : "right", padding: "10px 12px", fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map((p, i) => (
                        <tr key={i} style={{ borderBottom: i < projections.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>Year {p.year}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.textMuted }}>{p.newClients}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.accent }}>{formatCurrencyFull(p.aumRevenue)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.green }}>{formatCurrencyFull(p.annuityRevenue)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.purple }}>{formatCurrencyFull(p.planRevenue)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{formatCurrencyFull(p.totalRevenue)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: COLORS.red }}>({formatCurrencyFull(p.adSpend)})</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: p.netROI > 0 ? COLORS.green : COLORS.red }}>{p.netROI > 0 ? "+" : ""}{formatCurrencyFull(p.netROI)}</td>
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr style={{ borderTop: `2px solid ${COLORS.borderLight}`, background: COLORS.bg }}>
                        <td style={{ padding: "12px 12px", fontWeight: 700 }}>Total</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: COLORS.textMuted }}>{lastYear.newClients * visibleYears}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: COLORS.accent }}>{formatCurrencyFull(totalAum)}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: COLORS.green }}>{formatCurrencyFull(totalAnnuity)}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: COLORS.purple }}>{formatCurrencyFull(totalPlan)}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700 }}>{formatCurrencyFull(lastYear.cumulativeRevenue)}</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: COLORS.red }}>({formatCurrencyFull(lastYear.cumulativeAdSpend)})</td>
                        <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: lastYear.cumulativeROI > 0 ? COLORS.green : COLORS.red }}>{lastYear.cumulativeROI > 0 ? "+" : ""}{formatCurrencyFull(lastYear.cumulativeROI)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assumptions footnote */}
              <div style={{ marginTop: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12 }}>📊</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>Projection Assumptions</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Ad Spend", value: `${formatCurrencyFull(d.fees.monthlyAdSpend)}/mo` },
                    { label: "Leads/Month", value: `${d.fees.leadsPerMonth} leads` },
                    { label: "Close Rate", value: `${d.fees.leadToClientPct}%` },
                    { label: "AUM Fee", value: `${d.fees.aumFeePct}%` },
                    { label: "Avg Client AUM", value: formatCurrencyFull(d.fees.avgClientAUM) },
                    { label: "Revenue Mix", value: `${d.fees.aumMixPct}% AUM / ${d.fees.annuityMixPct}% Annuity` },
                    { label: "Avg Annuity Comm.", value: formatCurrencyFull(d.fees.annuityAvgCommission) },
                    { label: "Financial Plan Fee", value: formatCurrencyFull(d.fees.financialPlanAvgPrice) },
                    { label: "Plan Attach Rate", value: `${d.fees.planAttachRate}%` },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: COLORS.textDim }}>{a.label}</span>
                      <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Strategy Rationale */}
        <div style={{ marginTop: 28, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Strategy Rationale</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7 }}>
            Cornerstone Wealth Partners' strength in tax planning combined with a pre-retiree ICP in the Denver metro means <span style={{ color: COLORS.text, fontWeight: 500 }}>Roth conversion and Social Security optimization angles will outperform generic retirement messaging</span>. The target demographic (55–67, $500K–$3M) is actively planning but hasn't committed to an advisor — they're researching. Content that educates first and sells second aligns with their research-driven decision style. The 3-topic education framework (tax efficiency, Social Security, retirement transition) covers their top concerns while positioning David's CPA + CFP® credentials as the unique differentiator against advisors who only do investments.
          </div>
        </div>

      </div>
    </div>
  );
}
