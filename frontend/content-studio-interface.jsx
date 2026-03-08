import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#09090b", panel: "#111115", card: "#16161c", cardHover: "#1c1c24",
  border: "#1e1e26", borderLight: "#2a2a34", borderAccent: "#1e3a5f",
  text: "#e4e4e7", muted: "#71717a", dim: "#52525b",
  accent: "#3b82f6", accentBg: "#172554", accentDark: "#1d4ed8",
  green: "#22c55e", greenBg: "#14532d", greenDim: "#166534",
  amber: "#f59e0b", amberBg: "#78350f",
  purple: "#a78bfa", purpleBg: "#581c87",
  red: "#ef4444", redBg: "#7f1d1d",
  cyan: "#06b6d4", cyanBg: "#164e63",
};

const campaignData = {
  name: "Denver Pre-Retirees — Tax Optimization — Q1 2026",
  firm: "Cornerstone Wealth Partners",
  icp: "Pre-Retirees, 55–67, Tax-Efficient Income",
};

const categories = [
  {
    id: "webinar",
    label: "Webinar / VSL Script",
    icon: "🎬",
    color: C.accent,
    colorBg: C.accentBg,
    order: 1,
    status: "in_progress",
    description: "The destination. Everything drives here. Script your core educational content first — ads, funnels, and sequences all flow from this.",
    progress: 65,
    sections: [
      { id: "w1", title: "Opening Hook + Introduction", status: "approved", duration: "0:00 – 2:30", content: "\"Most people approaching retirement think their biggest financial risk is the stock market crashing. But there's a silent threat that could cost you tens of thousands more — and most people don't see it until it's too late.\n\nHi, I'm David Mitchell. I'm a CFP® and CPA who's spent the last 15 years helping people in the Denver area navigate the transition into retirement. And today I'm going to walk you through the three biggest mistakes I see pre-retirees make — and exactly how to avoid them.\n\nIf you're within 5 to 10 years of retirement, or you've recently retired and you're not sure if your current plan is optimized... this is going to be the most valuable 30 minutes you spend this month.\"", why: "The hook challenges a common assumption (stock market = biggest risk) to create curiosity. The introduction establishes credentials (CFP + CPA) immediately. The time qualifier ('5 to 10 years') filters for the exact ICP." },
      { id: "w2", title: "Topic 1: The Tax Time Bomb", status: "approved", duration: "2:30 – 12:00", content: "\"Here's what nobody tells you about your 401(k) and traditional IRA: every dollar in there has a tax bill attached to it. You haven't paid taxes on that money yet — and the IRS is going to collect.\n\nLet me show you what I mean. Say you've got $1.2 million in your traditional IRA. You might think of that as $1.2 million. But depending on your tax bracket in retirement, the IRS could take $250,000 to $400,000 of that. Your $1.2 million is really $800,000 to $950,000.\n\nNow here's where it gets interesting — and where most people make a critical mistake. There's a window of time, usually the 5 to 10 years before you turn 72 and Required Minimum Distributions kick in, where you have an opportunity to strategically convert portions of that money to a Roth IRA at a lower tax rate...\n\n[Continues with Roth conversion strategy, bracket management, specific examples]\"", why: "Tax optimization is the #1 concern for this ICP. Leading with a specific dollar example ($1.2M → real value) makes it tangible. The 'window of time' creates urgency aligned with their life stage." },
      { id: "w3", title: "Topic 2: Social Security Optimization", status: "in_review", duration: "12:00 – 20:00", content: "\"The second biggest mistake I see is claiming Social Security at the wrong time. And I don't mean a little wrong — I mean leaving $100,000 or more on the table over your lifetime.\n\nThere are 567 different rules governing Social Security benefits. And the claiming decision intersects with everything else in your financial life — your tax strategy, your spouse's benefits, your pension, your healthcare coverage before Medicare kicks in.\n\nLet me walk you through three scenarios...\"", why: "Social Security is universally relevant to this ICP. The $100K figure creates urgency. Mentioning 567 rules positions professional help as necessary, not optional." },
      { id: "w4", title: "Topic 3: The Retirement Paycheck", status: "generating", duration: "20:00 – 28:00", content: null, why: "This section ties everything together — how to create predictable income from multiple sources (SS, IRA, Roth, pension, taxable accounts) while minimizing lifetime taxes." },
      { id: "w5", title: "CTA + Objection Handling", status: "not_started", duration: "28:00 – 32:00", content: null, why: "The transition from education to offer. Must feel natural, not salesy. Addresses top objections: 'I already have an advisor,' 'I'm not ready yet,' 'I can handle this myself.'" },
      { id: "w6", title: "Pre-Webinar VSL (Short Version)", status: "not_started", duration: "2–3 min standalone", content: null, why: "Shown on the registration confirmation page. Captures high-intent prospects who want to book immediately without watching the full webinar." },
    ],
  },
  {
    id: "ads",
    label: "Ad Scripts",
    icon: "📱",
    color: C.green,
    colorBg: C.greenBg,
    order: 2,
    status: "in_progress",
    description: "Traffic drivers. Scripted AFTER the webinar so messaging aligns with the destination. UGC-style: Hook → Relate → Educate → CTA.",
    progress: 40,
    sections: [
      { id: "a1", title: "Tax Time Bomb (SS Angle)", status: "approved", type: "UGC", content: "\"HOOK: Most retirees think their biggest risk is the stock market. It's not. The IRS is quietly taking more of your money than you realize.\n\nRELATE: If you've been saving into a 401(k) or traditional IRA for the last 20 or 30 years, you probably feel pretty good about that balance. But here's what your HR department never told you — every single dollar in that account has a tax bill attached to it.\n\nEDUCATE: There's a strategy called a Roth conversion ladder that lets you move money from your traditional IRA to a Roth IRA at a lower tax rate — but only if you do it during a specific window. Usually the 5 to 10 years before you turn 72. After that, Required Minimum Distributions kick in and the window closes.\n\nI've seen this save clients $150,000 to $250,000 in lifetime taxes. But most people don't know about it until it's too late.\n\nCTA: I put together a free 30-minute training that walks through exactly how this works with real numbers. Link's in the bio — it might be the most valuable half hour you spend this year.\"", why: "Leads with the contrarian hook from the webinar. The Roth conversion ladder is the core educational takeaway. Specific dollar savings create urgency." },
      { id: "a2", title: "The Hidden IRA Tax Bill", status: "approved", type: "UGC", content: "\"HOOK: Your $1 million IRA isn't really worth $1 million. Here's what it's actually worth after the IRS takes their cut.\n\nRELATE: I talk to people every week who look at their retirement account balance and think that's their number. But if most of your savings are in traditional accounts, you haven't paid taxes on that money yet. And the IRS doesn't forget.\n\nEDUCATE: Depending on your tax bracket in retirement, the IRS could take 22% to 37% of your traditional IRA. That $1 million? It might really be $630,000 to $780,000. The good news is there are legal strategies to reduce that tax hit significantly — but you need to start before you retire, not after.\n\nCTA: I break down exactly how this works in a free training. Takes about 30 minutes and could save you a fortune. Link below.\"", why: "Direct attack on the #1 pain point. Specific dollar amounts ($1M → real value) make it tangible and personal." },
      { id: "a3", title: "5-Year Window", status: "in_review", type: "UGC", content: "\"HOOK: The 5 years before and after retirement are the most important financial years of your life. Here's why most people waste them.\n\nRELATE: Everyone focuses on the big number — can I retire with enough? But almost nobody focuses on the TRANSITION. Those 5 to 10 years around retirement are when the biggest financial decisions happen: when to claim Social Security, how to handle your 401(k), how to set up income, how to manage taxes.\n\nEDUCATE: I call this the Retirement Transition Window. It's when you have the most flexibility and the most at stake. Get it right, and you could save hundreds of thousands in taxes and set up income that lasts 30 years. Get it wrong, and you're locked into decisions that are hard to undo.\n\nCTA: I created a free training specifically for people in this window. 30 minutes, real examples, no sales pitch. Check the link below.\"", why: "Time-bound urgency. Speaks directly to pre-retirees who know they're approaching something big but don't have a plan for the transition itself." },
      { id: "a4", title: "Retirement Paycheck", status: "generating", type: "Direct", content: null, why: "Aspirational angle — creating certainty and a predictable 'paycheck' from a complex mix of accounts." },
      { id: "a5", title: "Second Opinion", status: "not_started", type: "Educational", content: null, why: "Lower barrier offer. Appeals to people who already have an advisor but aren't sure they're optimized." },
    ],
  },
  {
    id: "funnel",
    label: "Funnel Copy",
    icon: "📄",
    color: C.purple,
    colorBg: C.purpleBg,
    order: 3,
    status: "in_progress",
    description: "The pages between ad and webinar. Registration page, pre-webinar VSL page, webinar room, and post-webinar booking page.",
    progress: 60,
    sections: [
      { id: "f1", title: "Registration / Landing Page", status: "approved", content: "\"HEADLINE: The 3 Biggest Retirement Mistakes That Could Cost You $250,000+ (And How to Avoid Them)\n\nSUBHEADLINE: A free 30-minute training for professionals within 10 years of retirement\n\nBODY: If you're approaching retirement with $500,000 or more saved, this training reveals:\n\n• Why your IRA balance isn't what you think it is (and what it's really worth after taxes)\n• The Roth conversion window most people miss — and why timing matters more than amount\n• How to claim Social Security without leaving $100,000+ on the table\n• A framework for creating a predictable retirement 'paycheck' from multiple account types\n\nThis isn't a sales pitch. It's a real training with real numbers from a CFP® and CPA who's helped hundreds of Denver families navigate this exact transition.\n\nCTA: Reserve your seat — choose a time that works for you.\n\n[Calendar embed]\n\nTRUST SIGNALS: David Mitchell, CFP®, CPA | 15 years experience | Fee-only fiduciary | 200+ families served\"", why: "First page after ad click. The headline mirrors the ad messaging for scent continuity. Trust signals at the bottom reinforce credibility." },
      { id: "f2", title: "Pre-Webinar VSL Page", status: "approved", content: "\"HEADLINE: Before You Watch the Training — Can I Ask You Something?\n\nVSL SCRIPT (2 min):\nHey, David Mitchell here. Thanks for registering. Before you watch the full training, I want to save you some time.\n\nIf you're someone who already knows you need help with your retirement transition — maybe you've been thinking about it for months and you just want to talk to someone who gets it — we can skip the training and just have a conversation.\n\nI offer a free Retirement Readiness Review. It takes 30 to 45 minutes. We'll look at your specific numbers, your tax situation, your Social Security timing, and I'll tell you honestly whether I think I can help or not.\n\nNo pitch, no pressure. If we're a fit, great. If not, you'll still walk away with clarity.\n\nCTA: Book your free review below. Or scroll down to watch the full training first — totally up to you.\n\n[Calendar embed]\n\nFALLBACK: Or watch the full training →\"", why: "Captures high-intent prospects immediately after registration. Some people don't need the webinar — they already know they want help. This page catches them." },
      { id: "f3", title: "Webinar Watch Room", status: "in_review", content: "\"ABOVE VIDEO: Your Free Training: The 3 Biggest Retirement Mistakes That Could Cost You $250,000+\n\nBELOW VIDEO: Ready to see how this applies to your situation?\n\nDavid offers a free Retirement Readiness Review for qualified individuals. In 30–45 minutes, you'll get:\n• A clear picture of your retirement tax situation\n• A Social Security claiming analysis\n• An honest assessment of whether professional help makes sense for you\n\n[Book Your Free Review button]\n\nTRUST BAR: CFP® | CPA | Fee-Only | 15 Years | 200+ Families\"", why: "Copy around the video embed. Below-video CTA catches people who are ready to act after watching. Trust bar reinforces credentials." },
      { id: "f4", title: "Post-Webinar Booking Page", status: "generating", content: null, why: "Final conversion page after the webinar. Recaps key takeaways, includes testimonials, FAQ, and the calendar embed. Last chance to convert." },
      { id: "f5", title: "FAQ Section", status: "not_started", content: null, why: "Addresses remaining objections: cost, time commitment, what to expect, how it works. Can be used on the booking page and as a standalone resource." },
    ],
  },
  {
    id: "sequences",
    label: "Email / SMS Sequences",
    icon: "✉️",
    color: C.amber,
    colorBg: C.amberBg,
    order: 4,
    status: "in_progress",
    description: "The follow-up engine. Nurture, confirm, recover no-shows, and drip long-term value.",
    progress: 30,
    sections: [
      { id: "s1", title: "New Lead Nurture", status: "approved", messages: 6, timeline: "14 days", content: "\"EMAIL 1 — Sent immediately after registration:\nSubject: Your training is ready — here's what to expect\n\nHi [First Name],\n\nThanks for registering. Your training — The 3 Biggest Retirement Mistakes That Could Cost You $250,000+ — is ready to watch anytime.\n\n→ Watch now: [link]\n\nHere's what you'll learn in 30 minutes:\n• Why your IRA balance isn't what you think after taxes\n• The Roth conversion window and why timing matters\n• How to claim Social Security without leaving money on the table\n\nIf you'd rather skip the training and just talk, you can book a free Retirement Readiness Review here: [calendar link]\n\nEither way, I'm here to help.\n\nDavid Mitchell, CFP®, CPA\nCornerstone Wealth Partners\n\n---\n\nEMAIL 2 — Day 2:\nSubject: The IRA math most people get wrong\n\nHi [First Name],\n\nQuick question: if you have $1 million in a traditional IRA, how much of that is actually yours?\n\nMost people say $1 million. But after taxes, it might be closer to $650,000–$780,000.\n\nI break this down with real numbers in the training: [link]\n\nThe good news: there are strategies to keep more of it. But timing matters.\n\nDavid\n\n---\n\nEMAIL 3 — Day 4:\nSubject: Social Security: when to claim (and why most people get it wrong)\n\n[Continues with SS-focused value email]\n\n---\n\nEMAIL 4 — Day 7:\nSubject: A real example — how one couple saved $218,000\n\n[Case study email]\n\n---\n\nEMAIL 5 — Day 10:\nSubject: Is a Retirement Readiness Review right for you?\n\n[Soft pitch for booking a call]\n\n---\n\nEMAIL 6 — Day 14:\nSubject: Last thought from me\n\n[Final value-driven email with booking CTA]\"", why: "First touch after registration. Each email delivers standalone value while building toward a booking. Never feels salesy — always educational first." },
      { id: "s2", title: "Appointment Confirmation", status: "in_review", messages: 3, timeline: "Booking → Meeting", content: "\"EMAIL 1 — Sent immediately after booking:\nSubject: You're confirmed — here's how to prepare\n\nHi [First Name],\n\nYour Retirement Readiness Review with David Mitchell is confirmed for [Date] at [Time].\n\nHere's what to expect:\n• 30–45 minutes, no pressure\n• We'll review your current situation, tax exposure, and Social Security timing\n• You'll leave with clarity — whether we work together or not\n\nTo make the most of our time, it helps to have a rough idea of:\n• Your total retirement account balances (401k, IRA, Roth, etc.)\n• Your expected retirement age\n• Any pensions or Social Security estimates\n\nDon't worry about being exact — ballpark is fine.\n\nLooking forward to it.\n\nDavid\n\n---\n\nEMAIL 2 — 24 hours before:\nSubject: Quick reminder — we meet tomorrow\n\n[Reminder with meeting link + prep checklist]\n\n---\n\nEMAIL 3 — 1 hour before:\nSubject: See you in 1 hour\n\n[Short reminder with direct meeting link]\"", why: "Confirm, prepare, remind. Setting expectations reduces anxiety and increases show rates. The prep list makes the meeting more productive." },
      { id: "s3", title: "Show-Up Sequence", status: "not_started", messages: 3, timeline: "24hrs before", content: null, why: "Pre-meeting prep via SMS. Sets expectations, builds anticipation, gives them a reason to show up prepared." },
      { id: "s4", title: "No-Show Recovery", status: "not_started", messages: 3, timeline: "48hrs post", content: null, why: "Re-engage without being pushy or desperate. Offer to reschedule, acknowledge life happens." },
      { id: "s5", title: "Long-Term Nurture", status: "not_started", messages: 10, timeline: "90 days", content: null, why: "For leads who don't book. Drip value, case studies, market commentary, and social proof over 90 days." },
    ],
  },
];

const statusConfig = {
  approved: { label: "Approved", color: C.green, bg: C.greenBg, icon: "✓" },
  in_review: { label: "In Review", color: C.amber, bg: C.amberBg, icon: "◎" },
  generating: { label: "Generating...", color: C.accent, bg: C.accentBg, icon: "⟳" },
  not_started: { label: "Not Started", color: C.dim, bg: C.card, icon: "○" },
  in_progress: { label: "In Progress", color: C.accent, bg: C.accentBg, icon: "◐" },
  locked: { label: "Locked", color: C.dim, bg: C.card, icon: "🔒" },
};

export default function ContentStudio() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [editText, setEditText] = useState("");
  const chatRef = useRef(null);

  const activeCat = categories.find(c => c.id === activeCategory);

  function openEditor(section) {
    setEditingSection(section);
    setEditText(section.content || "");
  }

  function closeEditor() {
    setEditingSection(null);
    setEditText("");
    setChatInput("");
  }

  return (
    <div style={{ height: "100vh", display: "flex", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── SIDEBAR NAV ── */}
      <div style={{ width: 240, borderRight: `1px solid ${C.border}`, background: C.panel, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Content Studio</div>
          <div style={{ fontSize: 11, color: C.dim }}>Campaign assets</div>
        </div>

        <div style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "4px 8px", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Creation Order</div>
          </div>

          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            const sc = statusConfig[cat.status];
            const isLocked = cat.status === "locked";
            return (
              <button key={cat.id} onClick={() => isActive ? setActiveCategory(null) : (setActiveCategory(cat.id), setExpandedSection(null), setEditingSection(null))}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 2,
                  borderRadius: 8, border: "none", textAlign: "left", cursor: "pointer",
                  background: isActive ? cat.colorBg : "transparent",
                  transition: "all 0.15s",
                }}>
                <div style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? C.text : C.muted, marginBottom: 2 }}>{cat.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {cat.status !== "locked" && cat.status !== "not_started" && (
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border, maxWidth: 60 }}>
                        <div style={{ width: `${cat.progress}%`, height: "100%", borderRadius: 2, background: cat.color, transition: "width 0.3s" }} />
                      </div>
                    )}
                    <span style={{ fontSize: 10, color: sc.color }}>{sc.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>{idx + 1}</div>
              </button>
            );
          })}

          <div style={{ padding: "16px 8px 4px" }}>
            <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Other</div>
            {["Content Library", "Video Editing", "Deployment"].map(item => (
              <div key={item} style={{ padding: "8px 12px", fontSize: 13, color: C.dim, borderRadius: 6, cursor: "pointer" }}>{item}</div>
            ))}
          </div>
        </div>

        {/* Campaign info */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>{campaignData.firm}</div>
          <div style={{ fontSize: 10, color: C.dim, opacity: 0.6 }}>{campaignData.icp}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── OVERVIEW (no category selected) ── */}
        {!activeCategory && !editingSection && (
          <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Content Studio</h1>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{campaignData.name}</p>
              </div>

              {/* Overall progress */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
                {categories.map(cat => {
                  const sc = statusConfig[cat.status];
                  const isLocked = cat.status === "locked";
                  const approved = cat.sections.filter(s => s.status === "approved").length;
                  const total = cat.sections.length;
                  return (
                    <div key={cat.id} onClick={() => (setActiveCategory(cat.id), setExpandedSection(null))}
                      style={{
                        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
                        cursor: "pointer",
                        transition: "all 0.2s", position: "relative", overflow: "hidden",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + "60"; e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.border }}>
                        <div style={{ width: `${cat.progress}%`, height: "100%", background: cat.color, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <span style={{ fontSize: 28 }}>{cat.icon}</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{cat.label}</div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>{cat.description}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>
                        {`${approved}/${total} sections approved`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Creation order explanation */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Why this order?</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {categories.map((cat, i) => (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: cat.colorBg, border: `1px solid ${cat.color}30` }}>
                        <span style={{ fontSize: 14 }}>{cat.icon}</span>
                        <span style={{ fontSize: 12, color: cat.color, fontWeight: 500 }}>{cat.label.split("/")[0].split("(")[0].trim()}</span>
                      </div>
                      {i < categories.length - 1 && <span style={{ color: C.dim, fontSize: 16 }}>→</span>}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>
                  The webinar is the destination — everything else drives traffic to it. Ads reference webinar content. Funnel copy bridges the two. Sequences follow up. Each step builds context for the next.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORY VIEW (sections list) ── */}
        {activeCategory && !editingSection && activeCat && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Section list */}
            <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
              <div style={{ maxWidth: 700, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <button onClick={() => setActiveCategory(null)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0 }}>← Back</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{activeCat.icon}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{activeCat.label}</h2>
                </div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: "0 0 24px" }}>{activeCat.description}</p>

                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, padding: "12px 16px", background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border }}>
                    <div style={{ width: `${activeCat.progress}%`, height: "100%", borderRadius: 3, background: activeCat.color, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
                    {activeCat.sections.filter(s => s.status === "approved").length}/{activeCat.sections.length} approved
                  </span>
                </div>

                {/* Section cards */}
                {activeCat.sections.map((section, idx) => {
                  const sc = statusConfig[section.status];
                  const isExpanded = expandedSection === section.id;
                  const hasContent = !!section.content;

                  return (
                    <div key={section.id} style={{ marginBottom: 8 }}>
                      <div
                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        style={{
                          background: C.card, border: `1px solid ${isExpanded ? activeCat.color + "40" : C.border}`,
                          borderRadius: isExpanded ? "12px 12px 0 0" : 12, padding: "14px 18px",
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 14,
                        }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = C.borderLight; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = C.border; }}
                      >
                        {/* Status icon */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0,
                          animation: section.status === "generating" ? "spin 2s linear infinite" : "none",
                        }}>{sc.icon}</div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{section.title}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {section.duration && <span style={{ fontSize: 11, color: C.dim }}>{section.duration}</span>}
                            {section.type && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: C.bg, color: C.dim, border: `1px solid ${C.border}` }}>{section.type}</span>}
                            {section.messages && <span style={{ fontSize: 11, color: C.dim }}>{section.messages} messages · {section.timeline}</span>}
                          </div>
                        </div>

                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: sc.bg, color: sc.color, fontWeight: 600, flexShrink: 0 }}>{sc.label}</span>
                        <span style={{ color: C.dim, fontSize: 14, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>▾</span>
                      </div>

                      {/* Expanded preview */}
                      {isExpanded && (
                        <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, border: `1px solid ${activeCat.color}40`, borderTopColor: C.border, borderRadius: "0 0 12px 12px", padding: 20 }}>
                          {hasContent ? (
                            <>
                              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 180, overflow: "hidden", position: "relative", marginBottom: 14 }}>
                                {section.content.slice(0, 500)}{section.content.length > 500 ? "..." : ""}
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(transparent, ${C.card})` }} />
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={(e) => { e.stopPropagation(); openEditor(section); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: activeCat.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                  Open Editor
                                </button>
                                {section.status !== "approved" && (
                                  <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.greenDim}`, background: "transparent", color: C.green, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                    Approve ✓
                                  </button>
                                )}
                              </div>
                            </>
                          ) : section.status === "generating" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
                              <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: activeCat.color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              <span style={{ fontSize: 13, color: C.muted }}>AI is generating this section...</span>
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                              <div style={{ fontSize: 13, color: C.dim, marginBottom: 10 }}>
                                {section.status === "not_started" ? "This section hasn't been generated yet." : ""}
                              </div>
                              <button style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.borderLight}`, background: "transparent", color: C.text, fontSize: 13, cursor: "pointer" }}>
                                Generate This Section
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Generate all button */}
                {activeCat.sections.some(s => s.status === "not_started") && (
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <button style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${activeCat.color}, ${activeCat.color}cc)`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${activeCat.color}30` }}>
                      Generate All Remaining Sections
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Context sidebar */}
            <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, background: C.panel, padding: 20, overflowY: "auto", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Context</div>

              {expandedSection ? (
                <div>
                  {(() => {
                    const sec = activeCat.sections.find(s => s.id === expandedSection);
                    if (!sec) return null;
                    return (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: activeCat.color }}>{sec.title}</div>
                        <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, marginTop: 16 }}>Why This Section Matters</div>
                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{sec.why}</div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: activeCat.color }}>{activeCat.label}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>{activeCat.description}</div>
                  <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Section Breakdown</div>
                  {activeCat.sections.map(s => {
                    const sc = statusConfig[s.status];
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                        <span style={{ fontSize: 10, color: sc.color }}>{sc.icon}</span>
                        <span style={{ fontSize: 12, color: s.status === "approved" ? C.text : C.muted }}>{s.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EDITOR VIEW (full content editing) ── */}
        {editingSection && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Main editor */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Editor header */}
              <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={closeEditor} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0 }}>← Back</button>
                  <span style={{ color: C.dim }}>·</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{editingSection.title}</span>
                  {editingSection.duration && <span style={{ fontSize: 11, color: C.dim, padding: "2px 8px", background: C.card, borderRadius: 4 }}>{editingSection.duration}</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.borderLight}`, background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer" }}>Version History</button>
                  {editingSection.status !== "approved" && (
                    <button style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: C.green, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve Section ✓</button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                <div style={{ maxWidth: 660, margin: "0 auto" }}>
                  {/* Section label */}
                  {activeCat && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: activeCat.colorBg, marginBottom: 16 }}>
                      <span style={{ fontSize: 12 }}>{activeCat.icon}</span>
                      <span style={{ fontSize: 11, color: activeCat.color, fontWeight: 500 }}>{activeCat.label}</span>
                    </div>
                  )}

                  {/* Editable content */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      fontSize: 15, lineHeight: 2, color: C.text, outline: "none",
                      whiteSpace: "pre-wrap", minHeight: 300, padding: "4px 0",
                      borderBottom: `1px solid ${C.border}22`,
                    }}
                    dangerouslySetInnerHTML={{ __html: editText.replace(/\n/g, "<br>") }}
                  />
                </div>
              </div>

              {/* Chat bar */}
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 24px 16px" }}>
                <div style={{ maxWidth: 660, margin: "0 auto" }}>
                  <div style={{ display: "flex", alignItems: "center", background: C.card, border: `1.5px solid ${C.borderLight}`, borderRadius: 14, padding: "4px 4px 4px 6px" }}>
                    <button style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask AI to revise... (e.g. 'Make the opening more conversational' or 'Add a mention of Roth conversions')"
                      style={{ flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 13, outline: "none", padding: "10px 8px" }}
                    />
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      <button style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "transparent", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      </button>
                      <button style={{
                        width: 36, height: 36, borderRadius: 8, border: "none",
                        background: chatInput.trim() ? C.accent : C.border,
                        color: chatInput.trim() ? "#fff" : C.dim,
                        cursor: chatInput.trim() ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 6, paddingLeft: 4 }}>
                    Edit text directly above, or ask AI to make changes. All edits are versioned.
                  </div>
                </div>
              </div>
            </div>

            {/* Editor context sidebar */}
            <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, background: C.panel, padding: 20, overflowY: "auto", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Section Context</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: activeCat?.color }}>{editingSection.title}</div>
              {editingSection.duration && (
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 14 }}>{editingSection.duration}</div>
              )}

              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Purpose</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>{editingSection.why}</div>

              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Quick Actions</div>
              {["Shorten this section", "Make more conversational", "Add more data/specifics", "Strengthen the CTA", "Soften the tone"].map(action => (
                <button key={action} style={{
                  display: "block", width: "100%", padding: "8px 12px", marginBottom: 4, borderRadius: 6,
                  border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12,
                  textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >{action}</button>
              ))}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Version</div>
                <div style={{ fontSize: 12, color: C.muted }}>v3 · Last edited 2 min ago</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>2 prior versions saved</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        [contenteditable]:focus { outline: none; }
      `}</style>
    </div>
  );
}
