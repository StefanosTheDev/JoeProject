import type {
  WebsiteAnalysis,
  IcpProfile,
  OfferArchetype,
  Asset,
  Sequence,
  CallPrepItem,
  FunnelSectionContent,
  AdCreativeContent,
} from "./types";

export const MOCK_WEBSITE_ANALYSIS: WebsiteAnalysis = {
  services: [
    "Retirement Planning",
    "Tax Strategy",
    "Wealth Management",
    "Estate Planning",
    "Social Security Optimization",
  ],
  clientTypes: [
    "Pre-retirees",
    "Recently retired",
    "High-net-worth individuals",
  ],
  geographicMentions: ["Phoenix", "Scottsdale", "Arizona"],
  credentials: ["CFP", "CPA", "RICP"],
  tone: "Professional but approachable — emphasizes trust and long-term relationships",
  differentiators: [
    "Fee-only fiduciary",
    "Integrated tax and retirement planning",
    "30+ years combined experience",
  ],
  teamSize: "Small firm (3–5 advisors)",
};

export const MOCK_FIRM_DESCRIPTION =
  "We help Arizona families within 10 years of retirement build tax-efficient income strategies. As fee-only fiduciaries, we integrate financial planning, tax strategy, and Social Security optimization into one cohesive plan.";

export const MOCK_ICP: IcpProfile = {
  id: "icp-1",
  firmId: "firm-1",
  personaLabel: "Pre-Retirees Focused on Tax-Efficient Income",
  ageRange: [55, 67],
  assetBand: "$500K–$2M investable assets",
  lifeStage: "5–10 years from retirement",
  primaryConcern: "Minimizing taxes on retirement income",
  secondaryConcerns: [
    "Social Security optimization",
    "Healthcare costs in retirement",
    "Portfolio longevity",
  ],
  emotionalTriggers: [
    "Fear of running out of money",
    "Desire for certainty and a clear plan",
    "Distrust of Wall Street and big brokerages",
    "Anxiety about tax burden in retirement",
  ],
  objections: [
    "I already have a financial advisor",
    "I'm not ready to make changes yet",
    "I can manage my own investments",
    "Financial planners are too expensive",
    "I don't trust salespeople",
  ],
  toneSetting: 65,
  archetypeClassification: "retirement_tax_strategist",
  status: "draft",
};

export const MOCK_OFFER_ARCHETYPES: OfferArchetype[] = [
  {
    id: "arch-1",
    name: "Retirement Readiness Review",
    description:
      "A complimentary assessment that evaluates whether a prospect is on track for the retirement lifestyle they want. Covers income projections, tax exposure, and Social Security timing.",
    bestFitIcpTypes: ["pre-retiree", "recently_retired"],
    ctaTemplate: "Find out if you're on track for the retirement you want",
    meetingFormat: "45-min assessment call",
    whyItFits:
      "Your ICP is 5–10 years from retirement and focused on tax-efficient income — a Retirement Readiness Review directly addresses their core concern.",
  },
  {
    id: "arch-2",
    name: "Tax Strategy Session",
    description:
      "A focused session revealing potential tax savings on investments and retirement income. Ideal for high-income earners and those considering Roth conversions.",
    bestFitIcpTypes: ["high_income", "accumulator", "pre-retiree"],
    ctaTemplate:
      "Discover if you're overpaying in taxes on your investments",
    meetingFormat: "30-min tax review",
    whyItFits:
      "Your firm specializes in integrated tax strategy, making this a natural fit for prospects anxious about their retirement tax burden.",
  },
  {
    id: "arch-3",
    name: "Second Opinion Review",
    description:
      "An objective review of a prospect's current financial plan. Low-commitment entry point for people who already have an advisor but aren't fully satisfied.",
    bestFitIcpTypes: ["broad_appeal", "has_advisor"],
    ctaTemplate:
      "Get an objective second look at your current financial plan",
    meetingFormat: "45-min portfolio review",
    whyItFits:
      "Strong for reaching prospects who already have an advisor — one of the top objections your ICP may raise.",
  },
];

export const MOCK_AD_CREATIVE: Asset[] = [
  {
    id: "ad-1",
    assetSetId: "set-1",
    category: "ad_creative",
    type: "ad_variation",
    content: {
      hook: "Most people within 10 years of retirement have no idea how much they'll actually pay in taxes.",
      primaryText:
        "You've spent decades saving. But without a proactive tax strategy, you could lose a significant portion of your retirement income to the IRS. We help Arizona families build tax-efficient retirement income plans — so you keep more of what you've earned. No products. No sales pitch. Just clarity.",
      headline: "Your Retirement Tax Blind Spot",
      description: "Free retirement readiness review for Phoenix-area families",
      cta: "Book Your Free Review",
      disclaimer:
        "Investment advisory services offered through [Firm Name], a registered investment adviser.",
    } as AdCreativeContent,
    version: 1,
    status: "draft",
  },
  {
    id: "ad-2",
    assetSetId: "set-1",
    category: "ad_creative",
    type: "ad_variation",
    content: {
      hook: "Retiring in the next 5–10 years? Here's the question your current advisor probably isn't asking.",
      primaryText:
        "\"How will you create tax-efficient income in retirement?\" Most advisors focus on growing your portfolio. But the real risk for pre-retirees isn't market returns — it's tax exposure. Our team of CFPs and CPAs builds integrated plans that align your investments, Social Security timing, and tax strategy. One plan. One team. No conflicts of interest.",
      headline: "Tax-Smart Retirement Planning",
      description: "Fee-only fiduciary advisors in Scottsdale, AZ",
      cta: "Schedule Your Assessment",
    } as AdCreativeContent,
    version: 1,
    status: "draft",
  },
  {
    id: "ad-3",
    assetSetId: "set-1",
    category: "ad_creative",
    type: "ad_variation",
    content: {
      hook: "The average retiree overpays $47,000 in taxes during their first decade of retirement.",
      primaryText:
        "That's not a typo. Without proactive Roth conversion strategies, Social Security timing optimization, and tax-loss harvesting — most retirees leave tens of thousands on the table. We're a fee-only firm in Phoenix that specializes in exactly this. If you're within 10 years of retirement and want a second opinion on your tax exposure, we'd love to help.",
      headline: "Are You Overpaying in Retirement?",
      description: "Complimentary tax review — no obligation",
      cta: "Get Your Free Review",
      disclaimer:
        "This is not tax advice. Consult with a qualified tax professional regarding your individual circumstances.",
    } as AdCreativeContent,
    version: 1,
    status: "draft",
  },
  {
    id: "ad-4",
    assetSetId: "set-1",
    category: "ad_creative",
    type: "ad_variation",
    content: {
      hook: "What if your retirement plan had a built-in tax strategy — not just an investment strategy?",
      primaryText:
        "Most financial plans treat taxes as an afterthought. We treat them as the centerpiece. Our integrated approach combines financial planning, tax strategy, and Social Security optimization into one cohesive roadmap. You get a team of CFPs and CPAs working together — not in silos. No commissions. No conflicts. Just fiduciary advice built for your situation.",
      headline: "Integrated Tax & Retirement Planning",
      description: "Serving Arizona families for 30+ years",
      cta: "Book Your Free Consultation",
    } as AdCreativeContent,
    version: 1,
    status: "draft",
  },
];

export const MOCK_AD_CREATIVE_ALT: Record<string, AdCreativeContent> = {
  "ad-1": {
    hook: "Are you sure your retirement savings will last as long as you need them to?",
    primaryText:
      "The transition from saving to spending is one of the most complex financial shifts you'll ever make. Without a clear strategy for Social Security, tax-efficient withdrawals, and healthcare costs, your retirement could look very different than you planned. We help families in the Phoenix area build retirement income plans that are built to last.",
    headline: "Will Your Savings Last?",
    description: "Free retirement income assessment — Phoenix, AZ",
    cta: "Book Your Free Assessment",
  },
  "ad-2": {
    hook: "Your financial advisor manages your portfolio. But who manages your tax bill?",
    primaryText:
      "Investment returns get all the attention. But for pre-retirees, the biggest lever you can pull is tax efficiency. Our firm brings CFPs and CPAs to the same table — building plans that reduce your lifetime tax burden, not just grow your account balance. If you're within a decade of retirement, it might be time for a new perspective.",
    headline: "Beyond Portfolio Returns",
    description: "Tax-integrated retirement planning — fee-only",
    cta: "Schedule Your Free Review",
  },
  "ad-3": {
    hook: "Roth conversions, Social Security timing, Medicare surcharges — do you have a plan for all three?",
    primaryText:
      "These aren't just line items on a financial plan. They're the difference between a comfortable retirement and a stressful one. We help pre-retirees in Arizona coordinate all three into a tax-efficient strategy. No product sales, no commissions — just clear advice from fiduciaries who specialize in this exact situation.",
    headline: "The Retirement Tax Trifecta",
    description: "Complimentary consultation — no obligation",
    cta: "Get Your Free Consultation",
  },
  "ad-4": {
    hook: "\"I wish I had started my tax planning 5 years earlier.\" We hear this every week.",
    primaryText:
      "The best time to optimize your retirement tax strategy is before you retire. The second best time is today. Our team helps Arizona families create integrated financial plans that coordinate investments, tax strategy, and Social Security — all under one roof. No surprises. No conflicts of interest.",
    headline: "Start Your Tax Strategy Today",
    description: "30+ years of experience — Phoenix & Scottsdale",
    cta: "Book Your Free Session",
  },
};

export const MOCK_FUNNEL_SECTIONS: Asset[] = [
  {
    id: "funnel-1",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "headline",
      title: "Headline",
      body: "Retiring in the Next 10 Years? Make Sure Your Plan Includes a Tax Strategy.",
      required: true,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-2",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "problem",
      title: "The Problem",
      body: "You've worked hard to build your retirement savings. But most financial plans focus solely on investment returns — ignoring the single biggest drain on your retirement income: taxes. Without a proactive strategy for Roth conversions, Social Security timing, and tax-efficient withdrawals, you could pay tens of thousands more than necessary over your retirement.",
      required: true,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-3",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "solution",
      title: "The Solution",
      body: "Our Retirement Readiness Review is a complimentary, no-obligation assessment that evaluates your current plan through a tax-efficiency lens. We'll review your portfolio allocation, Social Security timing options, Roth conversion opportunities, and projected retirement income — all in 45 minutes. You'll walk away with a clear picture of where you stand and what changes could make the biggest impact.",
      required: true,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-4",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "credibility",
      title: "Credibility",
      body: "We're a fee-only fiduciary firm with over 30 years of combined experience in retirement and tax planning. Our team includes Certified Financial Planners (CFP®), Certified Public Accountants (CPA), and Retirement Income Certified Professionals (RICP®). We don't sell products or earn commissions — our only incentive is your success.",
      required: false,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-5",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "social_proof",
      title: "Social Proof",
      body: "\"We had no idea we were leaving so much on the table with our tax strategy. After one session, we had a completely new perspective on our retirement timeline.\" — Client, Scottsdale AZ\n\nJoin hundreds of Arizona families who have taken control of their retirement tax strategy.",
      required: false,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-6",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "about",
      title: "About the Advisor",
      body: "Our firm was founded on a simple principle: families approaching retirement deserve advice that considers the full picture — not just investments, but taxes, Social Security, healthcare costs, and legacy planning. We serve clients in Phoenix, Scottsdale, and across Arizona with integrated financial planning that puts your interests first.",
      required: false,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-7",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "cta",
      title: "Call to Action",
      body: "Ready to see where you stand? Book your complimentary Retirement Readiness Review today. 45 minutes. No obligation. No sales pitch. Just clarity about your retirement tax strategy.",
      required: true,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-8",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "faq",
      title: "FAQ",
      body: "Q: Is this really free?\nA: Yes. The Retirement Readiness Review is complimentary with no obligation.\n\nQ: What should I bring?\nA: A recent account statement and any questions you have about your retirement plan.\n\nQ: Are you trying to sell me something?\nA: No. We're fee-only fiduciaries — we don't sell products or earn commissions.\n\nQ: How long does it take?\nA: About 45 minutes. We'll cover your key areas and outline any opportunities.\n\nQ: Can my spouse join?\nA: Absolutely. We encourage both partners to attend.",
      required: false,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
  {
    id: "funnel-9",
    assetSetId: "set-2",
    category: "funnel_copy",
    type: "section",
    content: {
      sectionName: "disclaimer",
      title: "Disclaimer",
      body: "Investment advisory services offered through [Firm Name], a registered investment adviser. This is not tax, legal, or accounting advice. Please consult with a qualified professional regarding your individual circumstances. Past performance does not guarantee future results.",
      required: true,
    } as FunnelSectionContent,
    version: 1,
    status: "draft",
  },
];

export const MOCK_SEQUENCES: Sequence[] = [
  {
    id: "seq-1",
    name: "New Lead Nurture",
    description: "Warm the lead, build trust, drive booking over 14 days",
    messages: [
      {
        id: "msg-1-1",
        day: 0,
        type: "email",
        subject: "Your Retirement Readiness Review — Next Steps",
        body: "Hi [First Name],\n\nThank you for your interest in a Retirement Readiness Review. We know that planning for retirement can feel overwhelming — especially when it comes to tax strategy.\n\nOur goal is simple: give you a clear picture of where you stand and what adjustments could make the biggest impact.\n\nWe'll be in touch shortly to schedule a time that works for you. In the meantime, feel free to reply with any questions.\n\nWarm regards,\n[Advisor Name]",
        timing: "Immediately after opt-in",
        status: "draft",
      },
      {
        id: "msg-1-2",
        day: 1,
        type: "sms",
        body: "Hi [First Name], thanks for requesting your Retirement Readiness Review! We'll reach out soon to find a good time. Reply STOP to opt out.",
        timing: "Day 1 — morning",
        status: "draft",
      },
      {
        id: "msg-1-3",
        day: 3,
        type: "email",
        subject: "The #1 Tax Mistake Pre-Retirees Make",
        body: "Hi [First Name],\n\nIf you're within 10 years of retirement, here's the most common mistake we see: waiting too long to start Roth conversions.\n\nThe window between your highest earning years and the start of Required Minimum Distributions is your best opportunity to reduce lifetime tax liability. But most people don't realize this until it's too late.\n\nThat's exactly what we cover in the Retirement Readiness Review — a personalized look at your conversion opportunities, Social Security timing, and income strategy.\n\nWould you like to find a time to connect this week?\n\n[Scheduling Link]\n\nBest,\n[Advisor Name]",
        timing: "Day 3 — morning",
        status: "draft",
      },
      {
        id: "msg-1-4",
        day: 5,
        type: "sms",
        body: "Hi [First Name], quick question — have you had a chance to think about scheduling your Retirement Readiness Review? Happy to find a time that works: [Link]",
        timing: "Day 5 — afternoon",
        status: "draft",
      },
      {
        id: "msg-1-5",
        day: 7,
        type: "email",
        subject: "What a Retirement Readiness Review Actually Covers",
        body: "Hi [First Name],\n\nSome people wonder what exactly happens in a Retirement Readiness Review. Here's what we'll cover in 45 minutes:\n\n• Your current portfolio and how it aligns with your retirement timeline\n• Social Security optimization — when to claim for maximum benefit\n• Roth conversion analysis — is now the right time?\n• Tax-efficient withdrawal strategy\n• Any gaps or risks in your current plan\n\nNo sales pitch. No pressure. Just a clear, honest assessment.\n\nReady to book?\n\n[Scheduling Link]\n\n[Advisor Name]",
        timing: "Day 7 — morning",
        status: "draft",
      },
      {
        id: "msg-1-6",
        day: 10,
        type: "email",
        subject: "A quick thought about your retirement plan",
        body: "Hi [First Name],\n\nI wanted to share something that comes up in almost every conversation we have with pre-retirees: the peace of mind that comes from having a written plan.\n\nNot a stack of account statements. Not a generic projection from an online calculator. A real, personalized plan that accounts for your taxes, your Social Security, your healthcare costs, and your goals.\n\nThat's what we help families build — and it starts with a conversation.\n\nIf you're ready, we'd love to connect.\n\n[Scheduling Link]\n\nBest,\n[Advisor Name]",
        timing: "Day 10 — morning",
        status: "draft",
      },
    ],
  },
  {
    id: "seq-2",
    name: "Appointment Confirmation",
    description: "Confirm booking and reduce no-shows",
    messages: [
      {
        id: "msg-2-1",
        day: 0,
        type: "email",
        subject: "Your Retirement Readiness Review is Confirmed",
        body: "Hi [First Name],\n\nGreat news — your Retirement Readiness Review is confirmed for [Date] at [Time].\n\nHere's what to expect:\n• A 45-minute conversation focused on your retirement readiness\n• We'll review your tax exposure, Social Security timing, and income strategy\n• No sales pitch — just honest, fiduciary advice\n\nTo make the most of our time, please have a recent account statement handy.\n\nLooking forward to it,\n[Advisor Name]",
        timing: "Immediately after booking",
        status: "draft",
      },
      {
        id: "msg-2-2",
        day: -1,
        type: "sms",
        body: "Hi [First Name], friendly reminder: your Retirement Readiness Review is tomorrow at [Time]. Looking forward to speaking with you! — [Advisor Name]",
        timing: "24 hours before appointment",
        status: "draft",
      },
      {
        id: "msg-2-3",
        day: 0,
        type: "sms",
        body: "Hi [First Name], your Retirement Readiness Review starts in 1 hour. Here's your meeting link: [Link]. See you soon!",
        timing: "1 hour before appointment",
        status: "draft",
      },
    ],
  },
  {
    id: "seq-3",
    name: "No-Show Recovery",
    description: "Re-engage and reschedule within 48 hours",
    messages: [
      {
        id: "msg-3-1",
        day: 0,
        type: "email",
        subject: "We missed you — let's reschedule",
        body: "Hi [First Name],\n\nIt looks like we weren't able to connect today for your Retirement Readiness Review. No worries at all — life gets busy.\n\nI'd love to reschedule at a time that works better for you. Just pick a slot here:\n\n[Scheduling Link]\n\nLooking forward to connecting,\n[Advisor Name]",
        timing: "30 minutes after missed appointment",
        status: "draft",
      },
      {
        id: "msg-3-2",
        day: 1,
        type: "sms",
        body: "Hi [First Name], we missed you yesterday! Want to reschedule your Retirement Readiness Review? Here's a link to pick a new time: [Link]",
        timing: "Day 1 — morning",
        status: "draft",
      },
      {
        id: "msg-3-3",
        day: 2,
        type: "email",
        subject: "One more try — your review is still available",
        body: "Hi [First Name],\n\nJust wanted to reach out one more time. Your complimentary Retirement Readiness Review is still available whenever you're ready.\n\nWe understand that scheduling can be tricky, so we've set aside a few extra spots this week:\n\n[Scheduling Link]\n\nIf now isn't the right time, that's completely fine. We're here whenever you're ready.\n\nBest,\n[Advisor Name]",
        timing: "Day 2 — morning",
        status: "draft",
      },
    ],
  },
  {
    id: "seq-4",
    name: "Long-Term Nurture",
    description: "Drip value + social proof over 90 days for non-bookers",
    messages: [
      {
        id: "msg-4-1",
        day: 14,
        type: "email",
        subject: "3 Questions Every Pre-Retiree Should Ask Their Advisor",
        body: "Hi [First Name],\n\n1. \"What's my projected tax rate in retirement?\"\n2. \"Should I be doing Roth conversions now?\"\n3. \"When is the optimal time for me to claim Social Security?\"\n\nIf your current advisor can't answer these clearly, it might be time for a second opinion.\n\nOur Retirement Readiness Review covers all three — in 45 minutes, at no cost.\n\n[Scheduling Link]\n\nBest,\n[Advisor Name]",
        timing: "Day 14",
        status: "draft",
      },
      {
        id: "msg-4-2",
        day: 30,
        type: "email",
        subject: "What a tax-efficient retirement actually looks like",
        body: "Hi [First Name],\n\nMost people think retirement planning is about hitting a savings number. But the families we work with have learned that it's really about income — specifically, how you create tax-efficient income from the assets you've already built.\n\nThat means coordinating withdrawals across taxable, tax-deferred, and tax-free accounts. It means timing Social Security strategically. And it means having a Roth conversion plan in place before RMDs begin.\n\nThis is exactly what we help families do. If you're curious, we'd love to show you what this looks like for your situation.\n\n[Scheduling Link]\n\n[Advisor Name]",
        timing: "Day 30",
        status: "draft",
      },
      {
        id: "msg-4-3",
        day: 45,
        type: "email",
        subject: "A client story (with their permission)",
        body: "Hi [First Name],\n\nA couple came to us last year, both 61, planning to retire at 65. They had a solid portfolio but no tax strategy. After our initial review, we identified over $180,000 in potential tax savings through a multi-year Roth conversion strategy and optimized Social Security timing.\n\nThat's the kind of impact a proactive plan can make.\n\nWant to see what's possible for your situation?\n\n[Scheduling Link]\n\nBest,\n[Advisor Name]",
        timing: "Day 45",
        status: "draft",
      },
      {
        id: "msg-4-4",
        day: 60,
        type: "email",
        subject: "Tax season is a great time for a retirement check-up",
        body: "Hi [First Name],\n\nAs you look at this year's tax return, ask yourself: will my tax situation be better or worse in retirement?\n\nFor most pre-retirees, the answer is \"worse\" — unless you have a proactive plan in place.\n\nOur complimentary Retirement Readiness Review is designed to answer that question clearly. 45 minutes. No obligation.\n\n[Scheduling Link]\n\n[Advisor Name]",
        timing: "Day 60",
        status: "draft",
      },
      {
        id: "msg-4-5",
        day: 90,
        type: "email",
        subject: "Still thinking about your retirement plan?",
        body: "Hi [First Name],\n\nSometimes the timing just isn't right — and that's okay. We wanted to let you know that our Retirement Readiness Review is always available whenever you're ready.\n\nIn the meantime, the single most impactful thing you can do is review your Roth conversion window. If you're earning income now but haven't started converting, you may be in the sweet spot.\n\nWe're here when you're ready.\n\n[Scheduling Link]\n\nWarm regards,\n[Advisor Name]",
        timing: "Day 90",
        status: "draft",
      },
    ],
  },
];

export const MOCK_CALL_PREP: CallPrepItem[] = [
  {
    id: "cp-1",
    type: "question",
    title: "Current Retirement Timeline",
    content: "When are you hoping to retire, and how did you arrive at that timeline?",
    status: "draft",
  },
  {
    id: "cp-2",
    type: "question",
    title: "Tax Strategy Awareness",
    content: "Has your current advisor discussed a specific tax strategy for your retirement income — things like Roth conversions or withdrawal sequencing?",
    status: "draft",
  },
  {
    id: "cp-3",
    type: "question",
    title: "Social Security Planning",
    content: "Have you and your spouse discussed when you plan to claim Social Security, and have you looked at the difference between claiming at 62, 67, and 70?",
    status: "draft",
  },
  {
    id: "cp-4",
    type: "question",
    title: "Income Needs",
    content: "What does your ideal retirement look like in terms of annual income? Do you have a number in mind, or is that something you'd like help figuring out?",
    status: "draft",
  },
  {
    id: "cp-5",
    type: "question",
    title: "Healthcare Planning",
    content: "Have you factored healthcare costs into your retirement plan? Do you have a strategy for the gap between retirement and Medicare eligibility?",
    status: "draft",
  },
  {
    id: "cp-6",
    type: "question",
    title: "Current Advisor Relationship",
    content: "Tell me about your current financial advisor relationship. What's working well, and what do you wish were different?",
    status: "draft",
  },
  {
    id: "cp-7",
    type: "question",
    title: "Biggest Concern",
    content: "What's the single biggest financial concern you have about retirement right now?",
    status: "draft",
  },
  {
    id: "cp-8",
    type: "question",
    title: "Decision-Making Process",
    content: "If we find that there are meaningful improvements we could make to your plan, how do you typically make decisions like this? Is there anyone else who would need to be involved?",
    status: "draft",
  },
  {
    id: "cp-9",
    type: "agenda",
    title: "Meeting Agenda",
    content: "1. Introductions and background (5 min)\n2. Review your current financial situation and goals (10 min)\n3. Assess tax exposure and optimization opportunities (10 min)\n4. Social Security timing analysis (5 min)\n5. Discuss gaps and potential improvements (10 min)\n6. Next steps and Q&A (5 min)",
    status: "draft",
  },
  {
    id: "cp-10",
    type: "rebuttal",
    title: "\"I already have a financial advisor\"",
    content: "That's great — and this isn't about replacing anyone. Think of this as a second opinion, like getting one from a specialist before a medical procedure. We often find that advisors who are great at investment management may not specialize in tax-efficient retirement income planning. A fresh perspective can only help.",
    status: "draft",
  },
  {
    id: "cp-11",
    type: "rebuttal",
    title: "\"I'm not ready to make changes yet\"",
    content: "That's completely understandable. The review itself doesn't commit you to anything — it simply gives you information. Most people find that just knowing where they stand gives them confidence, whether they make changes now or in the future.",
    status: "draft",
  },
  {
    id: "cp-12",
    type: "rebuttal",
    title: "\"Financial planners are too expensive\"",
    content: "I hear that concern a lot. As fee-only fiduciaries, we don't earn commissions or sell products — so our costs are transparent. And in most cases, the tax savings and optimization we identify more than offset our fees. The review itself is complimentary, so there's no cost to find out.",
    status: "draft",
  },
  {
    id: "cp-13",
    type: "rebuttal",
    title: "\"I can manage my own investments\"",
    content: "Many of our clients are smart, capable investors. What they tell us is that investment management was the easy part — it's the tax coordination, Social Security timing, and withdrawal strategy that they wanted expert help with. Those are the areas where the stakes are highest and the rules are most complex.",
    status: "draft",
  },
  {
    id: "cp-14",
    type: "rebuttal",
    title: "\"I don't trust salespeople\"",
    content: "I don't blame you — and we're not salespeople. We're fiduciaries, which means we're legally obligated to act in your best interest. We don't earn commissions or sell products. Our only incentive is to give you the best advice we can.",
    status: "draft",
  },
  {
    id: "cp-15",
    type: "script",
    title: "Closing & Next Steps",
    content: "Based on what we've discussed today, here's what I'd recommend as a next step:\n\n1. We'll put together a preliminary retirement income projection based on the information you shared today.\n2. We'll send that to you within [X] business days along with a summary of the key opportunities we identified.\n3. If you'd like to explore further, we can schedule a follow-up meeting to go deeper into the tax strategy and build out a full plan.\n\nThere's no pressure to move forward — but I want to make sure you have everything you need to make an informed decision. Does that sound good?",
    status: "draft",
  },
];

export const MOCK_DEPLOYMENT_CHECKLIST = [
  { label: "Connect custom domain to landing page", completed: false },
  { label: "Install Meta Pixel on landing page", completed: false },
  { label: "Configure calendar integration (Calendly or GHL)", completed: false },
  { label: "Set up phone number for SMS sequences", completed: false },
  { label: "Import email/SMS sequences into HighLevel", completed: false },
  { label: "Configure UTM parameters in Meta Ads Manager", completed: false },
  { label: "Upload ad creative copy to Meta Ads Manager", completed: false },
  { label: "Set daily/lifetime budget in Ads Manager", completed: false },
  { label: "Review and publish landing page", completed: false },
  { label: "Test form submission and booking flow end-to-end", completed: false },
  { label: "Activate campaign in Meta Ads Manager", completed: false },
];

export const CLIENT_SITUATIONS = [
  "Approaching retirement",
  "Recently retired",
  "Business owner",
  "High-income earner",
  "Inherited wealth",
  "Federal employee",
  "Divorcee/widow",
  "Other",
];

export const AUM_RANGES = [
  "$100K–$250K",
  "$250K–$500K",
  "$500K–$1M",
  "$1M–$3M",
  "$3M–$5M",
  "$5M+",
];

export const FIRM_AUM_RANGES = [
  "$0–$10M",
  "$10M–$50M",
  "$50M–$100M",
  "$100M–$500M",
  "$500M+",
];

export const FEE_MODELS = [
  "AUM-based",
  "Financial planning fees",
  "Insurance products",
  "Tax preparation",
  "Hybrid",
];

export const PRIMARY_FOCUS_OPTIONS = [
  "Retirement Planning",
  "Tax Strategy",
  "Wealth Management",
  "Estate/Legacy",
  "Comprehensive",
];

export const SERVICE_RADIUS_OPTIONS = [
  "Local only",
  "Regional",
  "Statewide",
  "Nationwide/Virtual",
];

export const CREDENTIAL_OPTIONS = [
  "CFP",
  "CPA",
  "CFA",
  "RICP",
  "ChFC",
  "CLU",
  "EA",
  "JD",
  "Other",
];

export const BUDGET_RANGES = [
  "$500–$1K",
  "$1K–$3K",
  "$3K–$5K",
  "$5K–$10K",
  "$10K+",
];

export const EXCLUSION_OPTIONS = [
  "Remove insurance language",
  "Remove tax language",
  "Remove estate planning language",
  "Remove Social Security references",
  "Remove specific credential mentions",
];

export const ASSET_BAND_OPTIONS = [
  "$100K–$250K",
  "$250K–$500K",
  "$500K–$1M",
  "$1M–$2M",
  "$2M–$5M",
  "$5M+",
];

export const REVISION_FEEDBACK_OPTIONS = [
  "Tone",
  "Length",
  "Angle",
  "Proof emphasis",
  "Claim strength",
  "Compliance concern",
];
