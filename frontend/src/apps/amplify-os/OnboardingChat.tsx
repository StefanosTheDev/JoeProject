import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeProvider";

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
  | "currency"
  | "percent"
  | "upload"
  | "complete";

/** Condition: step is shown only when a previous multi/single choice step includes a given option */
interface StepCondition {
  stepId: string;
  hasOption: string;
}

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
  condition?: StepCondition;
}

interface Message {
  stepId: string;
  sender: "ai" | "user" | "system";
  text: string;
  done?: boolean;
}

/* ── Steps ── */

const STEPS: Step[] = [
  /* ─── Welcome ─── */
  {
    id: "welcome",
    ai: "Welcome to Amplify. I'm going to learn everything about you, your firm, your clients, and your goals — then build a growth engine around it. Let's get started.",
    type: "auto",
    context: { title: "Getting Started", body: "This onboarding captures everything the system needs to generate your Marketing Blueprint, ad campaigns, content strategy, and growth plan. The more detail you give, the better your output." },
  },

  /* ─── Section 1: The Advisor ─── */
  {
    id: "name",
    ai: "First things first — what's your name?",
    type: "text",
    placeholder: "e.g. David Mitchell",
    context: { title: "Your Identity", body: "Your name is used across all generated content — ads, emails, landing pages, video scripts, and call prep sheets." },
  },
  {
    id: "firm_name",
    ai: "And what's the name of your firm?",
    type: "text",
    placeholder: "e.g. Cornerstone Wealth Partners",
    context: { title: "Firm Identity", body: "Your firm name appears in all branded assets, ad copy, and compliance disclosures the system generates." },
  },
  {
    id: "website",
    ai: "Drop your website URL below. I'll analyze your site to understand your current positioning.",
    type: "url",
    placeholder: "https://yourfirm.com",
    context: { title: "Website Intelligence", body: "The AI extracts services, client signals, geographic focus, credentials, tone of voice, and differentiators from your site." },
  },
  {
    id: "website_analysis",
    ai: null,
    type: "analysis",
    context: { title: "AI Analysis", body: "The system is reading your website and building a structured profile of your firm." },
  },
  {
    id: "socials",
    ai: "What social media profiles does your firm have? Drop the links for any that apply.",
    type: "text",
    placeholder: "e.g. linkedin.com/in/david-mitchell, youtube.com/@cornerstonewealth",
    context: { title: "Social Presence", body: "Social profiles help the AI analyze your current content, voice, and audience engagement to inform the content strategy." },
  },
  {
    id: "credentials",
    ai: "What credentials or designations do you hold?",
    type: "multi_choice",
    options: [
      { id: "cfp", label: "CFP®" },
      { id: "cpa", label: "CPA" },
      { id: "cfa", label: "CFA" },
      { id: "ricp", label: "RICP" },
      { id: "chfc", label: "ChFC" },
      { id: "clu", label: "CLU" },
      { id: "aif", label: "AIF®" },
      { id: "ea", label: "EA" },
      { id: "none", label: "None" },
    ],
    context: { title: "Credibility Signals", body: "Credentials are trust accelerators in your ads and funnel copy. The system emphasizes these in all generated content." },
  },
  {
    id: "advisor_story",
    ai: "Tell me your story. How did you get into this business? Any publications, media features, awards, or a background that sets you apart?",
    type: "text",
    placeholder: "e.g. Former CPA turned advisor, featured in Financial Planning Magazine, 20+ years in the industry...",
    context: { title: "Your Story", body: "Your personal narrative is one of the strongest trust-building tools in marketing. This shapes video scripts, about-page copy, and ad hooks." },
  },
  {
    id: "differentiator",
    ai: "What makes you different from every other advisor? Why should a client choose you over the firm down the street?",
    type: "text",
    placeholder: "e.g. We specialize in tax-efficient retirement income for federal employees — it's all we do.",
    context: { title: "Positioning", body: "Your differentiator drives your core messaging across every piece of content. This is the foundation of your brand promise." },
  },

  /* ─── Section 2: The Firm ─── */
  {
    id: "firm_story",
    ai: "Now tell me about the firm itself. When was it founded? What's the backstory?",
    type: "text",
    placeholder: "e.g. Founded in 2008 after the financial crisis, built on the belief that every family deserves fiduciary advice...",
    context: { title: "Firm Narrative", body: "The firm story adds depth and authenticity to your marketing. It's used in brand content, about pages, and video intros." },
  },
  {
    id: "team_size",
    ai: "How big is your team?",
    type: "single_choice",
    options: [
      { id: "solo", label: "Solo Practice", desc: "Just you" },
      { id: "2_5", label: "2–5 People", desc: "Small team" },
      { id: "6_15", label: "6–15 People", desc: "Mid-size firm" },
      { id: "16_50", label: "16–50 People", desc: "Large firm" },
      { id: "50p", label: "50+", desc: "Enterprise" },
    ],
    context: { title: "Team Size", body: "Team size affects how the system positions your firm — boutique vs. full-service — and the scale of content it generates." },
  },
  {
    id: "team_members",
    ai: "Who are the key people on your team that clients should know about? Names, roles, and any relevant credentials.",
    type: "text",
    placeholder: "e.g. Sarah Chen (CFP®, Lead Planner), Mike Torres (CPA, Tax Strategy)...",
    context: { title: "Key People", body: "Team members can be featured in content, bios, and team pages. This helps humanize your firm in marketing." },
  },
  {
    id: "service_offerings",
    ai: "What are your main service offerings?",
    type: "multi_choice",
    options: [
      { id: "wealth_mgmt", label: "Wealth Management", desc: "Investment management & planning" },
      { id: "retirement", label: "Retirement Planning", desc: "Income strategies, Social Security, pensions" },
      { id: "tax_strategy", label: "Tax Strategy", desc: "Tax optimization & mitigation" },
      { id: "estate", label: "Estate Planning", desc: "Trusts, wills, legacy planning" },
      { id: "insurance", label: "Insurance", desc: "Life, disability, long-term care" },
      { id: "business", label: "Business Planning", desc: "Succession, exit planning, 401(k)" },
      { id: "equity_comp", label: "Equity Compensation", desc: "RSUs, stock options, ISOs, ESPPs" },
      { id: "high_income", label: "High-Income Strategies", desc: "Deferred comp, backdoor Roth, tax-loss harvesting" },
      { id: "annuities", label: "Annuities", desc: "Fixed, indexed, or variable annuities" },
      { id: "financial_plans", label: "Financial Plans", desc: "Comprehensive or modular financial plans" },
      { id: "other", label: "Other" },
    ],
    context: { title: "Services", body: "Your service mix determines the content topics, ad angles, and funnel offers the system generates." },
  },
  {
    id: "comp_model",
    ai: "How do you charge clients? Select all that apply.",
    type: "multi_choice",
    options: [
      { id: "aum", label: "AUM-Based Fees", desc: "% of assets under management" },
      { id: "flat_fee", label: "Flat Fee", desc: "Fixed annual or project fee" },
      { id: "hourly", label: "Hourly", desc: "Billed by the hour" },
      { id: "subscription", label: "Subscription", desc: "Monthly or quarterly retainer" },
      { id: "commission", label: "Commission", desc: "Product-based commissions" },
    ],
    context: { title: "Compensation Model", body: "Your fee structure affects compliance guardrails, offer framing, and how the system positions your value proposition. Select every model you use — we'll ask for details on each." },
  },

  /* ─── Conditional: AUM Fee % ─── */
  {
    id: "aum_fee_pct",
    ai: "What's your average AUM fee percentage?",
    type: "percent",
    min: 0,
    max: 300,
    placeholder: "e.g. 1.00",
    context: { title: "AUM Fee Rate", body: "Your AUM fee rate helps the system calculate revenue-per-client, set realistic growth projections, and frame your pricing competitively in marketing." },
    condition: { stepId: "comp_model", hasOption: "aum" },
  },

  /* ─── Conditional: Flat Fee Amount ─── */
  {
    id: "flat_fee_amount",
    ai: "What's your typical flat fee for a client?",
    type: "currency",
    placeholder: "e.g. 3,500",
    context: { title: "Flat Fee Pricing", body: "Your flat fee amount helps the system model client value, frame your offer in funnels, and set ad budget recommendations." },
    condition: { stepId: "comp_model", hasOption: "flat_fee" },
  },

  /* ─── Conditional: Hourly Rate ─── */
  {
    id: "hourly_rate",
    ai: "What's your hourly rate?",
    type: "currency",
    placeholder: "e.g. 350",
    context: { title: "Hourly Rate", body: "Your hourly rate helps the system position your value proposition and calculate projected client revenue for ROI modeling." },
    condition: { stepId: "comp_model", hasOption: "hourly" },
  },

  /* ─── Conditional: Subscription Amount ─── */
  {
    id: "subscription_fee",
    ai: "What's your quarterly subscription fee?",
    type: "currency",
    placeholder: "e.g. 750",
    context: { title: "Quarterly Subscription Fee", body: "Your quarterly subscription fee helps the system model recurring revenue, position your retainer offer, and calculate lifetime client value." },
    condition: { stepId: "comp_model", hasOption: "subscription" },
  },

  /* ─── Conditional: Commission % ─── */
  {
    id: "commission_pct",
    ai: "What's your average commission percentage on products?",
    type: "percent",
    min: 0,
    max: 1500,
    placeholder: "e.g. 5.00",
    context: { title: "Commission Rate", body: "Your commission rate helps the system calculate per-sale revenue, model campaign ROI for product-based offers, and set acquisition cost targets." },
    condition: { stepId: "comp_model", hasOption: "commission" },
  },

  /* ─── Conditional: Annuity Commission ─── */
  {
    id: "annuity_avg_commission",
    ai: "You mentioned annuities — what's your average commission per annuity sale?",
    type: "currency",
    placeholder: "e.g. 4,500",
    context: { title: "Annuity Commission", body: "Your average annuity commission helps the system calculate ROI projections, cost-per-acquisition targets, and campaign profitability for annuity-focused campaigns." },
    condition: { stepId: "service_offerings", hasOption: "annuities" },
  },

  /* ─── Conditional: Financial Plan Price ─── */
  {
    id: "financial_plan_avg_price",
    ai: "You offer financial plans — what do you typically charge for a plan?",
    type: "currency",
    placeholder: "e.g. 2,500",
    context: { title: "Financial Plan Pricing", body: "Your average plan price helps the system model lead-to-revenue conversion, set ad budget recommendations, and frame your planning offer in funnels." },
    condition: { stepId: "service_offerings", hasOption: "financial_plans" },
  },
  {
    id: "asset_minimums",
    ai: "Do you have asset minimums or requirements for clients?",
    type: "single_choice",
    options: [
      { id: "none", label: "No Minimum" },
      { id: "100k", label: "$100K" },
      { id: "250k", label: "$250K" },
      { id: "500k", label: "$500K" },
      { id: "1m", label: "$1M+" },
      { id: "custom", label: "Custom / Varies" },
    ],
    context: { title: "Client Minimums", body: "Asset requirements shape your targeting. The system uses this to qualify prospects and frame offers at the right level." },
  },
  {
    id: "case_studies",
    ai: "Share any client success stories or case studies. No names needed — just the situation, what you did, and the outcome.",
    type: "text",
    placeholder: "e.g. Couple retiring at 58 with $1.2M — built a Roth conversion ladder that saved $180K in taxes over 10 years...",
    context: { title: "Social Proof", body: "Case studies are powerful conversion tools. The system uses these in ads, landing pages, and email sequences (subject to your compliance level)." },
  },

  /* ─── Section 3: Ideal Client & Positioning ─── */
  {
    id: "ideal_client",
    ai: "Describe your ideal client. Think demographics, life stage, net worth, profession — paint the picture.",
    type: "text",
    placeholder: "e.g. Married couple, 55-65, $800K-$2M investable, corporate professional approaching retirement, worried about taxes...",
    context: { title: "Ideal Client Profile", body: "This is the most important input for targeting. Every ad, piece of content, and funnel is built around this person." },
  },
  {
    id: "client_age",
    ai: "What age range are most of your ideal clients?",
    type: "range",
    min: 25,
    max: 85,
    defaultRange: [50, 70],
    context: { title: "Age Targeting", body: "Age range drives Meta ad targeting, messaging tone, and life-stage concerns your content addresses." },
  },
  {
    id: "niche",
    ai: "Do you specialize in a particular niche or client type?",
    type: "multi_choice",
    options: [
      { id: "pre_retirees", label: "Pre-Retirees", desc: "5–10 years from retirement" },
      { id: "retirees", label: "Retirees", desc: "Already retired, income planning" },
      { id: "business_owners", label: "Business Owners", desc: "Exit & succession planning" },
      { id: "federal", label: "Federal Employees", desc: "TSP, FERS, CSRS" },
      { id: "medical", label: "Medical Professionals", desc: "Doctors, dentists, specialists" },
      { id: "tech", label: "Tech Professionals", desc: "RSUs, stock options, IPOs" },
      { id: "women", label: "Women in Transition", desc: "Divorce, widowhood, career change" },
      { id: "hni", label: "High Net Worth", desc: "$1M+ investable" },
      { id: "young_prof", label: "Young Professionals", desc: "Accumulators, early career" },
      { id: "generalist", label: "Generalist", desc: "No specific niche" },
    ],
    context: { title: "Niche Focus", body: "Niche targeting dramatically improves ad performance and content relevance. The system tailors everything to speak directly to your niche." },
  },
  {
    id: "geo_focus",
    ai: "What's your geographic focus?",
    type: "single_choice",
    options: [
      { id: "local", label: "Local", desc: "One city or metro area" },
      { id: "regional", label: "Regional", desc: "Multiple cities or a state" },
      { id: "national", label: "National", desc: "Serve clients across the country" },
      { id: "virtual", label: "Virtual-First", desc: "Fully remote, location-independent" },
    ],
    context: { title: "Geographic Reach", body: "Geographic focus affects ad targeting, local SEO strategy, and whether content references location-specific concerns." },
  },
  {
    id: "coi",
    ai: "Who are the key referral partners or centers of influence in your network? Think CPAs, attorneys, insurance agents — anyone who sends you clients.",
    type: "text",
    placeholder: "e.g. Local CPA firms, estate attorneys, HR departments at major employers...",
    context: { title: "Referral Network", body: "Understanding your COI network helps the system build referral-focused content and co-marketing strategies." },
  },

  /* ─── Section 4: Firm Financials & Metrics ─── */
  {
    id: "total_aum",
    ai: "What's your firm's total AUM?",
    type: "single_choice",
    options: [
      { id: "u10", label: "Under $10M" },
      { id: "10_50", label: "$10M – $50M" },
      { id: "50_100", label: "$50M – $100M" },
      { id: "100_250", label: "$100M – $250M" },
      { id: "250_500", label: "$250M – $500M" },
      { id: "500_1b", label: "$500M – $1B" },
      { id: "1bp", label: "$1B+" },
    ],
    context: { title: "Total AUM", body: "AUM calibrates messaging sophistication, positioning strategy, and the scale of growth targets." },
  },
  {
    id: "households",
    ai: "How many client households do you serve?",
    type: "single_choice",
    options: [
      { id: "u25", label: "Under 25" },
      { id: "25_50", label: "25–50" },
      { id: "50_100", label: "50–100" },
      { id: "100_200", label: "100–200" },
      { id: "200_500", label: "200–500" },
      { id: "500p", label: "500+" },
    ],
    context: { title: "Client Base", body: "Household count helps the system understand capacity, growth potential, and whether the firm needs volume or high-value targeting." },
  },
  {
    id: "revenue",
    ai: "What's your approximate annual revenue?",
    type: "single_choice",
    options: [
      { id: "u250k", label: "Under $250K" },
      { id: "250_500k", label: "$250K – $500K" },
      { id: "500k_1m", label: "$500K – $1M" },
      { id: "1m_2m", label: "$1M – $2M" },
      { id: "2m_5m", label: "$2M – $5M" },
      { id: "5mp", label: "$5M+" },
    ],
    context: { title: "Revenue", body: "Revenue context helps the system recommend appropriate marketing budgets and ROI-realistic growth targets." },
  },
  {
    id: "tech_stack",
    ai: "What tools do you currently use? Select any that apply.",
    type: "multi_choice",
    options: [
      { id: "salesforce", label: "Salesforce" },
      { id: "redtail", label: "Redtail" },
      { id: "wealthbox", label: "Wealthbox" },
      { id: "emoney", label: "eMoney" },
      { id: "moneyguide", label: "MoneyGuidePro" },
      { id: "rightcapital", label: "RightCapital" },
      { id: "riskalyze", label: "Riskalyze" },
      { id: "holistiplan", label: "Holistiplan" },
      { id: "hubspot", label: "HubSpot" },
      { id: "mailchimp", label: "Mailchimp" },
      { id: "other", label: "Other" },
    ],
    context: { title: "Tech Stack", body: "Knowing your tools helps the system identify integration opportunities and avoid recommending redundant software." },
  },

  /* ─── Section 5: Marketing & Growth ─── */
  {
    id: "current_marketing",
    ai: "How are you currently getting clients? Walk me through your marketing and lead flow.",
    type: "text",
    placeholder: "e.g. Mostly referrals, some LinkedIn posting, ran Facebook ads last year with mixed results...",
    context: { title: "Current Marketing", body: "Understanding what you've tried (and what's worked) helps the system build on existing momentum and avoid repeating what hasn't worked." },
  },
  {
    id: "marketing_budget",
    ai: "What's your expected monthly marketing budget?",
    type: "single_choice",
    options: [
      { id: "u1k", label: "Under $1K" },
      { id: "1_3k", label: "$1K – $3K" },
      { id: "3_5k", label: "$3K – $5K" },
      { id: "5_10k", label: "$5K – $10K" },
      { id: "10_25k", label: "$10K – $25K" },
      { id: "25kp", label: "$25K+" },
      { id: "unsure", label: "Not Sure Yet" },
    ],
    context: { title: "Ad Budget", body: "Your marketing budget determines ad spend allocation, channel mix, and the pace at which the system scales campaigns. This helps set realistic ROI targets." },
  },
  {
    id: "marketing_goals",
    ai: "What do you want this system and your marketing to actually do for you?",
    type: "text",
    placeholder: "e.g. Generate 10-15 qualified leads per month, build a consistent content engine, fill my seminar pipeline...",
    context: { title: "System Expectations", body: "This directly shapes your Marketing Blueprint priorities and the campaigns the system recommends first." },
  },
  {
    id: "short_term_goals",
    ai: "What are your short-term goals? Think next 6–12 months.",
    type: "text",
    placeholder: "e.g. Add $20M in new AUM, hire a junior advisor, launch a podcast...",
    context: { title: "Short-Term Goals", body: "Short-term goals determine the urgency, channel mix, and campaign types the system prioritizes for immediate impact." },
  },
  {
    id: "growth_goals",
    ai: "What are your bigger growth goals? Where do you want to be in 3–5 years?",
    type: "text",
    placeholder: "e.g. Double AUM to $200M, build a team of 5 advisors, open a second office...",
    context: { title: "Growth Vision", body: "Long-term goals inform the overall strategy arc — whether the system optimizes for rapid scale, niche dominance, or enterprise positioning." },
  },
  {
    id: "long_term_plan",
    ai: "What's the long-term plan for the firm? Are you building to keep, looking at succession, or planning an eventual exit?",
    type: "single_choice",
    options: [
      { id: "build_keep", label: "Build & Keep", desc: "Growing a legacy practice" },
      { id: "succession", label: "Succession Plan", desc: "Transitioning to a successor" },
      { id: "sell", label: "Planning to Sell", desc: "Building for an eventual exit" },
      { id: "undecided", label: "Undecided", desc: "Haven't decided yet" },
    ],
    context: { title: "Exit Strategy", body: "Your long-term plan affects how the system builds brand equity — personal brand vs. firm brand — and the growth trajectory it recommends." },
  },

  /* ─── Section 6: Compliance ─── */
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

  /* ─── Section 7: Brand Assets ─── */
  {
    id: "brand_upload",
    ai: "Last step — upload any brand assets you have. Logos, headshots, branding guides, marketing materials, compliance docs. Drop everything here.",
    type: "upload",
    context: { title: "Brand Assets", body: "Logos, headshots, and brand guidelines ensure generated content matches your visual identity. Compliance docs help the AI stay within your firm's specific guardrails." },
  },

  /* ─── Complete ─── */
  {
    id: "complete",
    ai: "That's everything. Building your Marketing Blueprint now — this is going to be good.",
    type: "complete",
    context: { title: "Blueprint", body: "Generating your ICP profile, positioning strategy, ad angles, content calendar, funnel architecture, and campaign recommendations." },
  },
];

/* ── Step label map ── */

const STEP_LABELS: Record<string, string> = {
  name: "Your Name",
  firm_name: "Firm Name",
  website: "Website",
  socials: "Socials",
  credentials: "Credentials",
  advisor_story: "Your Story",
  differentiator: "Differentiator",
  firm_story: "Firm Story",
  team_size: "Team Size",
  team_members: "Team",
  service_offerings: "Services",
  comp_model: "Fees",
  aum_fee_pct: "AUM %",
  flat_fee_amount: "Flat Fee",
  hourly_rate: "Hourly Rate",
  subscription_fee: "Subscription",
  commission_pct: "Commission %",
  annuity_avg_commission: "Annuity Commission",
  financial_plan_avg_price: "Plan Price",
  asset_minimums: "Minimums",
  case_studies: "Case Studies",
  ideal_client: "Ideal Client",
  client_age: "Age Range",
  niche: "Niche",
  geo_focus: "Geography",
  coi: "Referrals",
  total_aum: "AUM",
  households: "Households",
  revenue: "Revenue",
  tech_stack: "Tech Stack",
  current_marketing: "Current Marketing",
  marketing_budget: "Budget",
  marketing_goals: "Goals",
  short_term_goals: "Short-Term",
  growth_goals: "Growth",
  long_term_plan: "Long-Term",
  compliance: "Compliance",
  brand_upload: "Brand Assets",
  complete: "Blueprint",
};

/* ── Component ── */

export default function OnboardingChat() {
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [answers, _setAnswers] = useState<Record<string, string[]>>({});
  const answersRef = useRef<Record<string, string[]>>({});
  /** Always update both state (for re-render) and ref (for immediate reads in advance/goBack) */
  function setAnswers(updater: (prev: Record<string, string[]>) => Record<string, string[]>) {
    _setAnswers((prev) => {
      const next = updater(prev);
      answersRef.current = next;
      return next;
    });
  }
  const [currencyVal, setCurrencyVal] = useState("");
  const [percentVal, setPercentVal] = useState(100);
  const [inputVal, setInputVal] = useState("");
  const [rangeVal, setRangeVal] = useState<[number, number]>([55, 70]);
  const [sliderVal, setSliderVal] = useState(5);
  const [prefillVal, setPrefillVal] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [genFadeOut, setGenFadeOut] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
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
    if (step?.type === "percent") {
      // Default to ~1/3 of range (e.g. 1.00% for AUM)
      const pMin = step.min ?? 0;
      const pMax = step.max ?? 300;
      setPercentVal(Math.round((pMax - pMin) / 3) + pMin);
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
      setGenStep(0);
      setGenProgress(0);
      setGenFadeOut(false);

      const GEN_STEPS = [
        { at: 0 },    // step 0
        { at: 12 },   // step 1 at 12%
        { at: 28 },   // step 2
        { at: 44 },   // step 3
        { at: 58 },   // step 4
        { at: 72 },   // step 5
        { at: 85 },   // step 6
        { at: 95 },   // step 7
      ];

      let progress = 0;
      const totalDuration = 8000; // 8 seconds total
      const tickMs = 60;
      const increment = 100 / (totalDuration / tickMs);

      const iv = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
          progress = 100;
          clearInterval(iv);
          setGenProgress(100);
          setGenStep(GEN_STEPS.length - 1);
          // fade out then navigate
          setTimeout(() => {
            setGenFadeOut(true);
            setTimeout(() => navigate("/amplify-os/blueprint"), 600);
          }, 800);
          return;
        }
        setGenProgress(Math.round(progress));
        // advance step based on progress thresholds
        for (let i = GEN_STEPS.length - 1; i >= 0; i--) {
          if (progress >= GEN_STEPS[i].at) {
            setGenStep(i);
            break;
          }
        }
      }, tickMs);

      return () => clearInterval(iv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /** Check if a conditional step should be shown based on prior answers (reads ref for immediate accuracy) */
  function isStepActive(s: Step): boolean {
    if (!s.condition) return true;
    const prev = answersRef.current[s.condition.stepId];
    return prev ? prev.includes(s.condition.hasOption) : false;
  }

  function advance() {
    if (currentStep >= STEPS.length - 1) return;
    // Find next active step (skip conditional steps whose condition isn't met)
    let next = currentStep + 1;
    while (next < STEPS.length - 1 && !isStepActive(STEPS[next])) {
      next++;
    }
    setCurrentStep(next);
    setSelections({});
    setInputVal("");
    setCurrencyVal("");
    setPercentVal(STEPS[next]?.min != null ? Math.round(((STEPS[next].max ?? 300) - (STEPS[next].min ?? 0)) / 3) + (STEPS[next].min ?? 0) : 100);
    setShowUploadZone(false);
  }

  function goBack() {
    if (currentStep <= 0) return;
    // Find the previous non-analysis, active step
    let target = currentStep - 1;
    while (target > 0 && (STEPS[target].type === "analysis" || !isStepActive(STEPS[target]))) {
      target--;
    }
    // Remove messages from the current step and the step we're going back to (so they can re-answer)
    const targetStepId = STEPS[target].id;
    const currentStepId = STEPS[currentStep].id;
    setMessages((prev) => prev.filter((m) => m.stepId !== targetStepId && m.stepId !== currentStepId));
    setCurrentStep(target);
    setSelections({});
    setInputVal("");
    setCurrencyVal("");
    setPercentVal(STEPS[target]?.min != null ? Math.round(((STEPS[target].max ?? 300) - (STEPS[target].min ?? 0)) / 3) + (STEPS[target].min ?? 0) : 100);
    setShowUploadZone(false);
    setEditingMsgIdx(null);
  }

  function startEditMsg(idx: number) {
    setEditingMsgIdx(idx);
    setEditingText(messages[idx].text);
  }

  function saveEditMsg() {
    if (editingMsgIdx === null) return;
    const newText = editingText.trim();
    if (!newText) return;
    setMessages((prev) => prev.map((m, i) => i === editingMsgIdx ? { ...m, text: newText } : m));
    setEditingMsgIdx(null);
    setEditingText("");
  }

  function cancelEditMsg() {
    setEditingMsgIdx(null);
    setEditingText("");
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
    setAnswers((prev) => ({ ...prev, [step.id]: selected }));
    setSelections({});
    setTimeout(() => advance(), 400);
  }

  function handleSingleChoice(opt: StepOption) {
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: opt.label }]);
    setAnswers((prev) => ({ ...prev, [step.id]: [opt.id] }));
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

  function handleCurrencySubmit() {
    const cleaned = currencyVal.trim();
    if (!cleaned) return;
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: `$${cleaned}` }]);
    setCurrencyVal("");
    setTimeout(() => advance(), 400);
  }

  function handlePercentSubmit() {
    const display = (percentVal / 100).toFixed(2);
    setMessages((prev) => [...prev, { stepId: step.id, sender: "user", text: `${display}%` }]);
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
          <button onClick={toggleTheme} style={{ background: "transparent", border: "1px solid var(--app-border)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "var(--app-text-secondary)", display: "flex", alignItems: "center" }}>
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button
            className="obc-dev-skip"
            onClick={() => setCurrentStep(STEPS.length - 1)}
            title="Dev mode: skip onboarding with dummy data"
          >
            Skip to Blueprint
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="obc-messages">
          <div className="obc-messages-inner">
            {(() => {
              // Find the index of the last user message overall
              let lastUserMsgIdx = -1;
              for (let j = messages.length - 1; j >= 0; j--) {
                if (messages[j].sender === "user") { lastUserMsgIdx = j; break; }
              }
              return messages.map((msg, i) => {
                const isCurrentStepAi = msg.sender === "ai" && msg.stepId === step.id;
                const isLastAiForStep = isCurrentStepAi && !messages.slice(i + 1).some((m) => m.sender === "ai" && m.stepId === step.id);
                const canGoBack = isLastAiForStep && currentStep > 1;
                const isLastUserMsg = msg.sender === "user" && i === lastUserMsgIdx;
                const isUserMsg = msg.sender === "user";
                return (
                  <div key={i}>
                    <div className={`obc-msg obc-msg--${msg.sender}`}>
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
                      {isUserMsg && editingMsgIdx === i ? (
                        <div className="obc-edit-wrap">
                          <textarea
                            value={editingText}
                            onChange={(e) => { setEditingText(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditMsg(); } if (e.key === "Escape") cancelEditMsg(); }}
                            className="obc-edit-input"
                            autoFocus
                            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                          />
                          <div className="obc-edit-actions">
                            <button onClick={saveEditMsg} className="obc-edit-btn obc-edit-btn--save">Save</button>
                            <button onClick={cancelEditMsg} className="obc-edit-btn obc-edit-btn--cancel">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`obc-bubble obc-bubble--${msg.sender} ${msg.done ? "obc-bubble--done" : ""}`}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                    {/* Edit button: always visible on latest user msg, hover-visible on older ones */}
                    {isUserMsg && editingMsgIdx !== i && (
                      <div className={`obc-edit-row ${isLastUserMsg ? "obc-edit-row--visible" : ""}`}>
                        <button onClick={() => startEditMsg(i)} className="obc-edit-link">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          Edit
                        </button>
                      </div>
                    )}
                    {canGoBack && (
                      <div className="obc-goback-wrap">
                        <button onClick={goBack} className="obc-goback-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
                          Go back
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {step?.type === "analysis" && analyzing && (
              <div className="obc-dots">
                <span /><span /><span />
              </div>
            )}

            {step?.type === "complete" && generating && (
              <div className={`obc-gen-screen ${genFadeOut ? "obc-gen-screen--fadeout" : ""}`}>
                {/* Animated grid background */}
                <div className="obc-gen-grid">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="obc-gen-grid-cell" style={{ animationDelay: `${(i * 0.12) % 3}s` }} />
                  ))}
                </div>

                <div className="obc-gen-content">
                  {/* Pulsing orb */}
                  <div className="obc-gen-orb">
                    <div className="obc-gen-orb-ring obc-gen-orb-ring--1" />
                    <div className="obc-gen-orb-ring obc-gen-orb-ring--2" />
                    <div className="obc-gen-orb-ring obc-gen-orb-ring--3" />
                    <div className="obc-gen-orb-core" />
                  </div>

                  {/* Status text */}
                  <div className="obc-gen-status">
                    {[
                      "Initializing analysis engine",
                      "Processing your business profile",
                      "Mapping competitive landscape",
                      "Analyzing target audience segments",
                      "Identifying content opportunities",
                      "Building channel strategy",
                      "Generating personalized blueprint",
                      "Finalizing your marketing plan",
                    ].map((label, i) => (
                      <p key={i} className={`obc-gen-step ${genStep === i ? "obc-gen-step--active" : ""} ${genStep > i ? "obc-gen-step--done" : ""}`}>
                        <span className="obc-gen-step-indicator">
                          {genStep > i ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          ) : genStep === i ? (
                            <span className="obc-gen-step-dot" />
                          ) : (
                            <span className="obc-gen-step-dot obc-gen-step-dot--idle" />
                          )}
                        </span>
                        {label}
                      </p>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="obc-gen-progress-track">
                    <div className="obc-gen-progress-fill" style={{ width: `${genProgress}%` }} />
                  </div>
                  <p className="obc-gen-percent">{genProgress}%</p>

                  {/* Data points ticker */}
                  <div className="obc-gen-ticker">
                    {genStep >= 1 && <span className="obc-gen-ticker-item">12 data points extracted</span>}
                    {genStep >= 3 && <span className="obc-gen-ticker-item">4 audience segments identified</span>}
                    {genStep >= 5 && <span className="obc-gen-ticker-item">6 channels optimized</span>}
                    {genStep >= 7 && <span className="obc-gen-ticker-item">Blueprint ready</span>}
                  </div>
                </div>
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

                {step.type === "currency" && (
                  <div>
                    <div className="obc-currency-wrap">
                      <span className="obc-currency-symbol">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={currencyVal}
                        onChange={(e) => {
                          // Allow only digits and commas — auto-format with commas
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          if (!raw) { setCurrencyVal(""); return; }
                          const formatted = Number(raw).toLocaleString("en-US");
                          setCurrencyVal(formatted);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" && currencyVal.trim()) handleCurrencySubmit(); }}
                        placeholder={step.placeholder?.replace("$", "") ?? "0"}
                        className="obc-currency-input"
                        autoFocus
                      />
                    </div>
                    <button onClick={handleCurrencySubmit} disabled={!currencyVal.trim()} className="obc-btn obc-btn--primary" style={{ marginTop: 12 }}>Continue</button>
                  </div>
                )}

                {step.type === "percent" && (() => {
                  const pMin = step.min ?? 0;
                  const pMax = step.max ?? 300;
                  const display = (percentVal / 100).toFixed(2);
                  const pct = ((percentVal - pMin) / (pMax - pMin)) * 100;
                  return (
                    <div>
                      <div className="obc-pct-display">
                        <span className="obc-pct-value">{display}</span>
                        <span className="obc-pct-symbol">%</span>
                      </div>
                      <div className="obc-pct-slider-wrap">
                        <input
                          type="range"
                          min={pMin}
                          max={pMax}
                          value={percentVal}
                          onChange={(e) => setPercentVal(+e.target.value)}
                          className="obc-slider-input obc-pct-slider"
                          style={{ "--pct-fill": `${pct}%` } as React.CSSProperties}
                        />
                        <div className="obc-pct-bounds">
                          <span>{(pMin / 100).toFixed(1)}%</span>
                          <span>{(pMax / 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <button onClick={handlePercentSubmit} className="obc-btn obc-btn--primary" style={{ marginTop: 12 }}>Continue</button>
                    </div>
                  );
                })()}

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
                  placeholder={(() => {
                    if (step.type === "text" || step.type === "url") return step.placeholder;
                    if (step.type === "multi_choice") return "Add context — e.g. anything else not listed above...";
                    if (step.type === "single_choice") return "Add context — e.g. explain your selection...";
                    if (step.type === "slider") return "Add context — e.g. any compliance specifics...";
                    if (step.type === "range") return "Add context — e.g. we also work with younger clients...";
                    if (step.type === "upload") return "Add context — e.g. describe what you're uploading...";
                    if (step.type === "currency") return "Add context — e.g. varies by product type...";
                    if (step.type === "percent") return "Add context — e.g. tiered based on AUM level...";
                    return "Add context or additional details...";
                  })()}
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
            <div className="obc-steps-label">Onboarding Sections</div>
            {(() => {
              const SECTIONS: { label: string; ids: string[] }[] = [
                { label: "About You", ids: ["name", "firm_name", "website", "socials", "credentials", "advisor_story", "differentiator"] },
                { label: "Your Firm", ids: ["firm_story", "team_size", "team_members", "service_offerings", "comp_model", "asset_minimums", "case_studies"] },
                { label: "Your Ideal Client", ids: ["ideal_client", "client_age", "niche", "geo_focus", "coi"] },
                { label: "Your Financials", ids: ["total_aum", "households", "revenue", "tech_stack"] },
                { label: "Your Growth", ids: ["current_marketing", "marketing_budget", "marketing_goals", "short_term_goals", "growth_goals", "long_term_plan"] },
                { label: "Compliance", ids: ["compliance"] },
                { label: "Your Brand", ids: ["brand_upload"] },
              ];
              return SECTIONS.map((section) => {
                const sectionSteps = STEPS.filter((s) => section.ids.includes(s.id));
                const allDone = sectionSteps.every((s) => STEPS.indexOf(s) < currentStep);
                const hasCurrent = sectionSteps.some((s) => STEPS.indexOf(s) === currentStep);
                const completedCount = sectionSteps.filter((s) => STEPS.indexOf(s) < currentStep).length;
                return (
                  <div key={section.label} className={`obc-section-group ${allDone ? "obc-section--done" : ""} ${hasCurrent ? "obc-section--current" : ""}`}>
                    <div className="obc-section-header">
                      <div className="obc-step-dot">
                        {allDone && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </div>
                      <span className="obc-section-label">{section.label}</span>
                      {!allDone && hasCurrent && (
                        <span className="obc-section-count">{completedCount}/{sectionSteps.length}</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
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
          background: var(--app-bg);
          color: var(--app-text);
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
          border-bottom: 1px solid var(--app-border);
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
          background: var(--app-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: var(--app-bg);
        }
        .obc-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--app-text);
          letter-spacing: -0.01em;
        }
        .obc-subtitle {
          font-size: 12px;
          color: var(--app-text-muted);
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
          background: var(--app-border);
          overflow: hidden;
        }
        .obc-progress-fill {
          height: 100%;
          border-radius: 1px;
          background: var(--app-text);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .obc-progress-label {
          font-size: 11px;
          color: var(--app-text-muted);
          font-variant-numeric: tabular-nums;
          min-width: 28px;
          text-align: right;
        }
        .obc-dev-skip {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px dashed var(--app-text-dim);
          background: transparent;
          color: var(--app-text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
          margin-left: 12px;
        }
        .obc-dev-skip:hover {
          border-color: var(--app-text-secondary);
          color: var(--app-text);
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
          background: var(--app-text);
          color: var(--app-bg);
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
          background: var(--app-border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-right: 12px;
          margin-top: 2px;
          color: var(--app-text-muted);
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
          background: var(--app-border-subtle);
          border: 1px solid var(--app-border-hover);
          border-radius: 16px 16px 16px 4px;
        }
        .obc-bubble--user {
          padding: 14px 18px;
          background: var(--app-text);
          border-radius: 16px 16px 4px 16px;
          color: var(--app-bg);
          position: relative;
        }
        .obc-edit-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 2px;
          margin-bottom: 4px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .obc-edit-row--visible {
          opacity: 1;
        }
        .obc-msg--user:hover + .obc-edit-row,
        .obc-edit-row:hover {
          opacity: 1;
        }
        .obc-edit-link {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--app-text-dim);
          font-size: 11px;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .obc-edit-link:hover {
          color: var(--app-text);
        }
        .obc-edit-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: calc(100% - 42px);
        }
        .obc-edit-input {
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid var(--app-text);
          background: var(--app-border-subtle);
          color: var(--app-text);
          font-size: 14px;
          font-family: inherit;
          line-height: 1.5;
          outline: none;
          width: 100%;
          min-height: 44px;
          max-height: 300px;
          resize: none;
          overflow-y: auto;
        }
        .obc-edit-input:focus {
          border-color: #50e3c2;
        }
        .obc-edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .obc-edit-btn {
          padding: 4px 14px;
          border-radius: 6px;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .obc-edit-btn--save {
          background: var(--app-text);
          color: var(--app-bg);
        }
        .obc-edit-btn--save:hover {
          background: #d4d4d4;
        }
        .obc-edit-btn--cancel {
          background: transparent;
          color: var(--app-text-muted);
          border: 1px solid var(--app-border-hover);
        }
        .obc-edit-btn--cancel:hover {
          color: var(--app-text);
          border-color: #444;
        }
        .obc-goback-wrap {
          display: flex;
          justify-content: flex-start;
          padding-left: 42px;
          margin-top: -4px;
          margin-bottom: 8px;
        }
        .obc-goback-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--app-text-dim);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .obc-goback-btn:hover {
          color: var(--app-text);
          background: rgba(237, 237, 237, 0.06);
        }
        .obc-bubble--system {
          padding: 6px 0;
          background: transparent;
          color: var(--app-text-muted);
          font-size: 13px;
        }
        .obc-bubble--done {
          color: #50e3c2;
        }

        .obc-spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid var(--app-text-faint);
          border-top-color: var(--app-text-secondary);
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
          background: var(--app-text-dim);
          animation: dotPulse 1.4s ease-in-out infinite;
        }
        .obc-dots span:nth-child(2) { animation-delay: 0.2s; }
        .obc-dots span:nth-child(3) { animation-delay: 0.4s; }

        /* ── Blueprint Generation Screen ── */
        .obc-gen-screen {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 480px;
          overflow: hidden;
          animation: obc-gen-fadein 0.6s ease;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .obc-gen-screen--fadeout {
          opacity: 0;
          transform: scale(1.02);
        }
        @keyframes obc-gen-fadein {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Grid background */
        .obc-gen-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 1px;
          opacity: 0.15;
        }
        .obc-gen-grid-cell {
          background: var(--app-border);
          animation: obc-gen-cell-pulse 3s ease-in-out infinite;
        }
        @keyframes obc-gen-cell-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Content layer */
        .obc-gen-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          padding: 40px 24px;
          max-width: 400px;
          width: 100%;
        }

        /* Pulsing orb */
        .obc-gen-orb {
          position: relative;
          width: 72px;
          height: 72px;
        }
        .obc-gen-orb-core {
          position: absolute;
          inset: 22px;
          border-radius: 50%;
          background: var(--app-text);
          animation: obc-gen-core-pulse 2s ease-in-out infinite;
        }
        @keyframes obc-gen-core-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.7; }
        }
        .obc-gen-orb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(237, 237, 237, 0.2);
        }
        .obc-gen-orb-ring--1 {
          animation: obc-gen-ring-spin 4s linear infinite;
          border-top-color: rgba(237, 237, 237, 0.6);
        }
        .obc-gen-orb-ring--2 {
          inset: -8px;
          animation: obc-gen-ring-spin 6s linear infinite reverse;
          border-right-color: rgba(237, 237, 237, 0.4);
        }
        .obc-gen-orb-ring--3 {
          inset: -16px;
          animation: obc-gen-ring-spin 8s linear infinite;
          border-bottom-color: rgba(237, 237, 237, 0.2);
        }
        @keyframes obc-gen-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Status steps */
        .obc-gen-status {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .obc-gen-step {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--app-text-faint);
          transition: all 0.4s ease;
          height: 0;
          overflow: hidden;
          opacity: 0;
          margin: 0;
        }
        .obc-gen-step--active {
          color: var(--app-text);
          height: 24px;
          opacity: 1;
        }
        .obc-gen-step--done {
          color: var(--app-text-dim);
          height: 22px;
          opacity: 1;
          font-size: 12px;
        }
        .obc-gen-step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .obc-gen-step-indicator svg {
          color: var(--app-text-dim);
        }
        .obc-gen-step-dot {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--app-text);
          animation: obc-gen-dot-pulse 1s ease-in-out infinite;
        }
        .obc-gen-step-dot--idle {
          background: var(--app-text-faint);
          animation: none;
        }
        @keyframes obc-gen-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }

        /* Progress bar */
        .obc-gen-progress-track {
          width: 100%;
          height: 3px;
          background: var(--app-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .obc-gen-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--app-text-dim), var(--app-text));
          border-radius: 2px;
          transition: width 0.15s linear;
        }
        .obc-gen-percent {
          font-size: 12px;
          color: var(--app-text-dim);
          font-variant-numeric: tabular-nums;
          margin: -16px 0 0;
        }

        /* Ticker */
        .obc-gen-ticker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .obc-gen-ticker-item {
          font-size: 11px;
          color: #444;
          background: #141414;
          border: 1px solid var(--app-border);
          border-radius: 4px;
          padding: 4px 10px;
          animation: obc-gen-ticker-in 0.4s ease;
        }
        @keyframes obc-gen-ticker-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Input area ── */
        .obc-input-area {
          border-top: 1px solid var(--app-border);
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
          border: 1px solid var(--app-border-hover);
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
          background: var(--app-border-subtle);
          color: var(--app-text);
        }
        .obc-chip--selected {
          border-color: var(--app-text);
          background: var(--app-border-subtle);
          color: var(--app-text);
        }
        .obc-chip--single:hover {
          border-color: var(--app-text);
          background: var(--app-border-subtle);
          color: var(--app-text);
          transform: translateY(-1px);
        }
        .obc-chip-label {
          font-size: 14px;
          font-weight: 500;
        }
        .obc-chip-desc {
          font-size: 12px;
          color: var(--app-text-muted);
        }
        .obc-chip--selected .obc-chip-desc {
          color: var(--app-text-secondary);
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
          background: var(--app-text);
          color: var(--app-bg);
          font-size: 14px;
        }
        .obc-btn--primary:hover {
          background: #fff;
        }
        .obc-btn--secondary {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--app-text-faint);
          color: #a1a1a1;
          font-size: 14px;
        }
        .obc-btn--secondary:hover {
          border-color: var(--app-text-dim);
          color: var(--app-text);
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
          color: var(--app-text);
        }
        .obc-range-sep {
          font-size: 14px;
          color: var(--app-text-dim);
          font-weight: 400;
          padding: 0 2px;
        }
        .obc-range-unit {
          font-size: 14px;
          color: var(--app-text-dim);
          margin-left: 4px;
        }
        .obc-dual-track-wrap {
          margin-bottom: 18px;
        }
        .obc-dual-track {
          position: relative;
          height: 4px;
          background: var(--app-border-hover);
          border-radius: 2px;
          cursor: pointer;
          touch-action: none;
        }
        .obc-dual-track-fill {
          position: absolute;
          top: 0;
          height: 100%;
          background: var(--app-text);
          border-radius: 2px;
          pointer-events: none;
        }
        .obc-dual-thumb {
          position: absolute;
          top: 50%;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--app-text);
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
          color: var(--app-text-dim);
          font-weight: 500;
          transition: color 0.2s;
        }
        .obc-slider-label--active {
          color: var(--app-text) !important;
        }
        .obc-slider-input {
          width: 100%;
          margin-bottom: 10px;
        }
        .obc-slider-desc {
          font-size: 13px;
          color: var(--app-text-secondary);
          padding: 12px 16px;
          background: var(--app-border-subtle);
          border: 1px solid var(--app-border-hover);
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
          color: var(--app-text-muted);
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
          background: linear-gradient(to right, var(--glide-color) 0%, var(--glide-color) var(--glide-pct), var(--app-border-hover) var(--glide-pct), var(--app-border-hover) 100%);
          outline: none;
          margin-bottom: 8px;
          transition: background 0.15s;
        }
        .obc-glide-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--app-text);
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
          color: var(--app-text-dim);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .obc-glide-desc {
          font-size: 13px;
          color: #999;
          padding: 14px 16px;
          background: var(--app-surface);
          border: 1px solid var(--app-border-hover);
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
          border: 1px solid var(--app-border-hover);
          background: var(--app-bg);
          color: var(--app-text);
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .obc-textarea:focus {
          outline: none;
          border-color: var(--app-text);
        }

        /* ── Currency input ── */
        .obc-currency-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--app-bg);
          border: 1px solid var(--app-border-hover);
          border-radius: 10px;
          padding: 14px 18px;
          transition: border-color 0.2s;
        }
        .obc-currency-wrap:focus-within {
          border-color: var(--app-text);
        }
        .obc-currency-symbol {
          font-size: 22px;
          font-weight: 600;
          color: var(--app-text-secondary);
        }
        .obc-currency-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--app-text);
          font-size: 22px;
          font-weight: 600;
          font-family: inherit;
          letter-spacing: 0.5px;
        }
        .obc-currency-input::placeholder {
          color: #444;
          font-weight: 400;
        }

        /* ── Percent slider ── */
        .obc-pct-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          margin-bottom: 16px;
        }
        .obc-pct-value {
          font-size: 36px;
          font-weight: 700;
          color: var(--app-text);
          letter-spacing: -1px;
          font-variant-numeric: tabular-nums;
        }
        .obc-pct-symbol {
          font-size: 20px;
          font-weight: 600;
          color: var(--app-text-secondary);
        }
        .obc-pct-slider-wrap {
          margin-bottom: 4px;
        }
        .obc-pct-slider {
          --pct-fill: 33%;
        }
        .obc-pct-bounds {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--app-text-muted);
          margin-top: 4px;
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
          border: 1px dashed var(--app-text-faint);
          border-radius: 8px;
          padding: 36px 24px;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .obc-dropzone:hover {
          border-color: var(--app-text-dim);
          background: var(--app-surface);
        }
        .obc-dropzone-close {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: var(--app-border-subtle);
          color: var(--app-text-muted);
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
          background: var(--app-border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          color: var(--app-text-muted);
        }
        .obc-dropzone-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #a1a1a1;
        }
        .obc-dropzone-sub {
          font-size: 13px;
          color: var(--app-text-dim);
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
          background: var(--app-bg);
          border: 1px solid var(--app-border-hover);
          border-radius: 8px;
          padding: 4px 6px;
          transition: border-color 0.2s;
        }
        .obc-inputbar:focus-within {
          border-color: var(--app-text-dim);
        }
        .obc-inputbar-icon {
          width: 36px;
          height: 36px;
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
        .obc-inputbar-icon:hover {
          color: #a1a1a1;
        }
        .obc-inputbar-icon--active {
          color: var(--app-text);
        }
        .obc-mic--active {
          color: #ef4444;
          animation: micPulse 1.5s ease-in-out infinite;
        }
        .obc-text-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--app-text);
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
          background: var(--app-border-subtle);
          color: #444;
          cursor: default;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .obc-send--active {
          background: var(--app-text);
          color: var(--app-bg);
          cursor: pointer;
        }
        .obc-send--active:hover {
          background: #fff;
        }

        /* ── Welcome CTA ── */
        .obc-welcome-cta {
          border-top: 1px solid var(--app-border);
          padding: 24px 32px;
          display: flex;
          justify-content: flex-start;
        }

        /* ── Sidebar ── */
        .obc-sidebar {
          width: 280px;
          border-left: 1px solid var(--app-border);
          background: #000;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .obc-sidebar-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--app-border);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--app-text-dim);
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
          color: var(--app-text);
          letter-spacing: -0.01em;
        }
        .obc-context p {
          font-size: 13px;
          color: var(--app-text-muted);
          line-height: 1.7;
        }

        /* ── Steps list ── */
        .obc-steps-list {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--app-border);
        }
        .obc-steps-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--app-text-dim);
          margin-bottom: 14px;
        }
        .obc-section-group {
          padding: 8px 0;
          transition: all 0.2s;
        }
        .obc-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #444;
          font-weight: 400;
          transition: color 0.2s;
        }
        .obc-section--current .obc-section-header {
          color: var(--app-text);
          font-weight: 500;
        }
        .obc-section--done .obc-section-header {
          color: var(--app-text-muted);
        }
        .obc-section-label {
          flex: 1;
        }
        .obc-section-count {
          font-size: 11px;
          color: var(--app-text-dim);
          font-variant-numeric: tabular-nums;
        }
        .obc-step-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid var(--app-border-hover);
          transition: all 0.2s;
        }
        .obc-section--current .obc-step-dot {
          border-color: var(--app-text);
          background: rgba(237, 237, 237, 0.1);
        }
        .obc-section--done .obc-step-dot {
          border-color: #50e3c2;
          background: rgba(80, 227, 194, 0.08);
          color: #50e3c2;
        }

        /* ── Range inputs (non-glide) ── */
        input[type="range"]:not(.obc-glide-input) {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          background: var(--app-border-hover);
          border-radius: 1px;
          outline: none;
        }
        input[type="range"]:not(.obc-glide-input)::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--app-text);
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
        }

        /* ── Scrollbar ── */
        .obc-messages::-webkit-scrollbar { width: 6px; }
        .obc-messages::-webkit-scrollbar-track { background: transparent; }
        .obc-messages::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 3px; }
        .obc-sidebar-body::-webkit-scrollbar { width: 4px; }
        .obc-sidebar-body::-webkit-scrollbar-track { background: transparent; }
        .obc-sidebar-body::-webkit-scrollbar-thumb { background: var(--app-border-subtle); border-radius: 2px; }

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
