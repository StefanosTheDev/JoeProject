import { useState } from "react";

const mockData = {
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
};

const categoryColors = {
  Tax: { bg: "#1e3a5f", text: "#60a5fa" },
  SS: { bg: "#14532d", text: "#4ade80" },
  Income: { bg: "#78350f", text: "#fbbf24" },
  Cost: { bg: "#7f1d1d", text: "#f87171" },
  Urgency: { bg: "#581c87", text: "#c084fc" },
  Risk: { bg: "#164e63", text: "#22d3ee" },
  Healthcare: { bg: "#365314", text: "#a3e635" },
};

const urgencyColors = { High: COLORS.red, Medium: COLORS.amber, Low: COLORS.green };

export default function MarketingBlueprint() {
  const [activeTab, setActiveTab] = useState("icp");
  const [expandedAngle, setExpandedAngle] = useState(null);
  const [expandedPain, setExpandedPain] = useState(null);

  const d = mockData;

  const tabs = [
    { id: "icp", label: "ICP Profile" },
    { id: "pain", label: "Pain Points" },
    { id: "angles", label: "Ad Angles" },
    { id: "education", label: "Education Topics" },
    { id: "targeting", label: "Targeting" },
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
                      {["Webinar", "Ads", "Organic"].map(tag => (
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
                  {["Conservative", "Moderate", "Aggressive"].map((level, i) => (
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
                  {Object.entries(categoryColors).map(([cat, cc]) => {
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
