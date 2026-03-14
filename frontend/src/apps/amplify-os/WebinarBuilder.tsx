import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeProvider";

// ── Types ──

interface SlideElement {
  id: string;
  type: "heading" | "body" | "bullet" | "image" | "shape" | "stat";
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  bg?: string;
  borderRadius?: number;
  opacity?: number;
}

interface Slide {
  id: string;
  label: string;
  bg: string;
  elements: SlideElement[];
  notes?: string;
}

// ── Mock Slide Data (auto-generated from webinar script) ──

const initialSlides: Slide[] = [
  {
    id: "s1",
    label: "Title Slide",
    bg: "#0f0f0f",
    elements: [
      { id: "e1", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)", borderRadius: 0, opacity: 1 },
      { id: "e2", type: "heading", x: 80, y: 140, w: 800, h: 80, content: "The 3 Retirement Mistakes That Could Cost You $250,000+", fontSize: 38, fontWeight: 700, color: "#ffffff", align: "center" },
      { id: "e3", type: "body", x: 200, y: 260, w: 560, h: 40, content: "And exactly how to avoid them before it's too late", fontSize: 20, fontWeight: 400, color: "#a0a0a0", align: "center" },
      { id: "e4", type: "body", x: 280, y: 380, w: 400, h: 30, content: "David Mitchell, CFP\u00AE, CPA", fontSize: 18, fontWeight: 600, color: "#50e3c2", align: "center" },
      { id: "e5", type: "body", x: 280, y: 420, w: 400, h: 24, content: "Cornerstone Wealth Partners", fontSize: 15, fontWeight: 400, color: "#666666", align: "center" },
    ],
    notes: "Welcome the audience. Set the stage for the 3 biggest mistakes. Establish credentials immediately.",
  },
  {
    id: "s2",
    label: "The Problem",
    bg: "#0f0f0f",
    elements: [
      { id: "e6", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "#0f0f0f", borderRadius: 0, opacity: 1 },
      { id: "e7", type: "body", x: 60, y: 40, w: 300, h: 24, content: "THE SILENT THREAT", fontSize: 12, fontWeight: 600, color: "#50e3c2", align: "left" },
      { id: "e8", type: "heading", x: 60, y: 70, w: 520, h: 70, content: "Most people think their biggest retirement risk is the stock market.", fontSize: 32, fontWeight: 600, color: "#ffffff", align: "left" },
      { id: "e9", type: "body", x: 60, y: 170, w: 520, h: 60, content: "It's not. The IRS is quietly positioned to take 22\u201337% of your retirement savings \u2014 and most people don't realize it until it's too late.", fontSize: 18, fontWeight: 400, color: "#a0a0a0", align: "left" },
      { id: "e10", type: "stat", x: 640, y: 100, w: 260, h: 200, content: "$250K+", fontSize: 56, fontWeight: 700, color: "#ef4444", align: "center", bg: "rgba(239,68,68,0.08)", borderRadius: 16 },
      { id: "e11", type: "body", x: 640, y: 310, w: 260, h: 40, content: "Potential tax liability hiding in your retirement accounts", fontSize: 13, fontWeight: 400, color: "#888888", align: "center" },
    ],
    notes: "Challenge the assumption that market risk is the biggest threat. Introduce tax exposure as the real danger.",
  },
  {
    id: "s3",
    label: "Mistake #1: Tax Time Bomb",
    bg: "#0f0f0f",
    elements: [
      { id: "e12", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "#0f0f0f", borderRadius: 0, opacity: 1 },
      { id: "e13", type: "body", x: 60, y: 40, w: 200, h: 24, content: "MISTAKE #1", fontSize: 12, fontWeight: 700, color: "#ef4444", align: "left" },
      { id: "e14", type: "heading", x: 60, y: 70, w: 500, h: 60, content: "The Tax Time Bomb Inside Your 401(k)", fontSize: 30, fontWeight: 700, color: "#ffffff", align: "left" },
      { id: "e15", type: "body", x: 60, y: 160, w: 500, h: 100, content: "Every dollar in your traditional IRA or 401(k) has a tax bill attached to it. You haven't paid taxes yet \u2014 and the IRS will collect.", fontSize: 17, fontWeight: 400, color: "#a0a0a0", align: "left" },
      { id: "e16", type: "shape", x: 620, y: 60, w: 290, h: 180, content: "", bg: "rgba(96,165,250,0.06)", borderRadius: 16, opacity: 1 },
      { id: "e17", type: "heading", x: 640, y: 80, w: 250, h: 30, content: "$1.2M", fontSize: 42, fontWeight: 700, color: "#60a5fa", align: "center" },
      { id: "e18", type: "body", x: 640, y: 130, w: 250, h: 20, content: "What you think you have", fontSize: 13, fontWeight: 500, color: "#888888", align: "center" },
      { id: "e19", type: "shape", x: 640, y: 160, w: 250, h: 1, content: "", bg: "#2e2e2e", borderRadius: 0, opacity: 1 },
      { id: "e20", type: "heading", x: 640, y: 170, w: 250, h: 30, content: "$800K\u2013$950K", fontSize: 36, fontWeight: 700, color: "#50e3c2", align: "center" },
      { id: "e21", type: "body", x: 640, y: 210, w: 250, h: 20, content: "What's actually yours", fontSize: 13, fontWeight: 500, color: "#888888", align: "center" },
      { id: "e22", type: "bullet", x: 60, y: 300, w: 500, h: 30, content: "The Roth conversion window: 5\u201310 years before RMDs begin", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e23", type: "bullet", x: 60, y: 340, w: 500, h: 30, content: "Strategic conversions at a lower tax bracket", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e24", type: "bullet", x: 60, y: 380, w: 500, h: 30, content: "Tax-free growth and withdrawals for life", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
    ],
    notes: "Deep dive into the tax time bomb. Use the $1.2M → $800K-$950K comparison to make it visceral. Introduce the Roth conversion window.",
  },
  {
    id: "s4",
    label: "Mistake #2: Social Security",
    bg: "#0f0f0f",
    elements: [
      { id: "e25", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "#0f0f0f", borderRadius: 0, opacity: 1 },
      { id: "e26", type: "body", x: 60, y: 40, w: 200, h: 24, content: "MISTAKE #2", fontSize: 12, fontWeight: 700, color: "#f59e0b", align: "left" },
      { id: "e27", type: "heading", x: 60, y: 70, w: 500, h: 60, content: "Claiming Social Security at the Wrong Time", fontSize: 30, fontWeight: 700, color: "#ffffff", align: "left" },
      { id: "e28", type: "stat", x: 620, y: 60, w: 290, h: 160, content: "$100K+", fontSize: 52, fontWeight: 700, color: "#fbbf24", align: "center", bg: "rgba(251,191,36,0.08)", borderRadius: 16 },
      { id: "e29", type: "body", x: 620, y: 230, w: 290, h: 40, content: "Left on the table by claiming at the wrong time", fontSize: 13, fontWeight: 400, color: "#888888", align: "center" },
      { id: "e30", type: "body", x: 60, y: 160, w: 500, h: 80, content: "There are 567 different rules governing Social Security benefits. The claiming decision intersects with your tax strategy, spousal benefits, pension, and healthcare.", fontSize: 17, fontWeight: 400, color: "#a0a0a0", align: "left" },
      { id: "e31", type: "bullet", x: 60, y: 290, w: 500, h: 30, content: "Claim early (62): Reduced benefits, but income sooner", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e32", type: "bullet", x: 60, y: 330, w: 500, h: 30, content: "Full retirement age (66\u201367): Standard benefit amount", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e33", type: "bullet", x: 60, y: 370, w: 500, h: 30, content: "Delay to 70: 8% increase per year \u2014 guaranteed", fontSize: 15, fontWeight: 500, color: "#ededed", align: "left" },
    ],
    notes: "Walk through 3 Social Security claiming scenarios. Emphasize the $100K+ difference. Use specific ages to make it real.",
  },
  {
    id: "s5",
    label: "Mistake #3: No Paycheck Plan",
    bg: "#0f0f0f",
    elements: [
      { id: "e34", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "#0f0f0f", borderRadius: 0, opacity: 1 },
      { id: "e35", type: "body", x: 60, y: 40, w: 200, h: 24, content: "MISTAKE #3", fontSize: 12, fontWeight: 700, color: "#c084fc", align: "left" },
      { id: "e36", type: "heading", x: 60, y: 70, w: 840, h: 60, content: "You've Spent 30 Years Getting a Paycheck. In Retirement, You Have to Create Your Own.", fontSize: 28, fontWeight: 700, color: "#ffffff", align: "left" },
      { id: "e37", type: "body", x: 60, y: 160, w: 500, h: 60, content: "Most people get this wrong \u2014 pulling from the wrong accounts at the wrong time, paying more taxes than necessary.", fontSize: 17, fontWeight: 400, color: "#a0a0a0", align: "left" },
      { id: "e38", type: "shape", x: 100, y: 280, w: 220, h: 120, content: "", bg: "rgba(96,165,250,0.08)", borderRadius: 12, opacity: 1 },
      { id: "e39", type: "heading", x: 120, y: 295, w: 180, h: 24, content: "Bucket 1", fontSize: 16, fontWeight: 700, color: "#60a5fa", align: "center" },
      { id: "e40", type: "body", x: 120, y: 325, w: 180, h: 60, content: "Short-term\n1\u20133 years of expenses\nCash & bonds", fontSize: 12, fontWeight: 400, color: "#a0a0a0", align: "center" },
      { id: "e41", type: "shape", x: 370, y: 280, w: 220, h: 120, content: "", bg: "rgba(80,227,194,0.08)", borderRadius: 12, opacity: 1 },
      { id: "e42", type: "heading", x: 390, y: 295, w: 180, h: 24, content: "Bucket 2", fontSize: 16, fontWeight: 700, color: "#50e3c2", align: "center" },
      { id: "e43", type: "body", x: 390, y: 325, w: 180, h: 60, content: "Mid-term\n3\u201310 years\nBalanced portfolio", fontSize: 12, fontWeight: 400, color: "#a0a0a0", align: "center" },
      { id: "e44", type: "shape", x: 640, y: 280, w: 220, h: 120, content: "", bg: "rgba(192,132,252,0.08)", borderRadius: 12, opacity: 1 },
      { id: "e45", type: "heading", x: 660, y: 295, w: 180, h: 24, content: "Bucket 3", fontSize: 16, fontWeight: 700, color: "#c084fc", align: "center" },
      { id: "e46", type: "body", x: 660, y: 325, w: 180, h: 60, content: "Long-term\n10+ years\nGrowth assets", fontSize: 12, fontWeight: 400, color: "#a0a0a0", align: "center" },
    ],
    notes: "Introduce the bucket strategy as the framework for creating a retirement paycheck. Visual, simple, memorable.",
  },
  {
    id: "s6",
    label: "The Solution",
    bg: "#0f0f0f",
    elements: [
      { id: "e47", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "linear-gradient(135deg, #0f0f0f 0%, #0f1a1a 100%)", borderRadius: 0, opacity: 1 },
      { id: "e48", type: "body", x: 60, y: 40, w: 300, h: 24, content: "TYING IT ALL TOGETHER", fontSize: 12, fontWeight: 600, color: "#50e3c2", align: "left" },
      { id: "e49", type: "heading", x: 60, y: 70, w: 600, h: 60, content: "Your Retirement Readiness Review", fontSize: 32, fontWeight: 700, color: "#ffffff", align: "left" },
      { id: "e50", type: "body", x: 60, y: 150, w: 500, h: 60, content: "A complimentary, no-obligation conversation about your specific situation. Here's what we'll cover:", fontSize: 18, fontWeight: 400, color: "#a0a0a0", align: "left" },
      { id: "e51", type: "bullet", x: 60, y: 250, w: 500, h: 28, content: "Your current tax exposure and Roth conversion opportunity", fontSize: 16, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e52", type: "bullet", x: 60, y: 290, w: 500, h: 28, content: "Your optimal Social Security claiming strategy", fontSize: 16, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e53", type: "bullet", x: 60, y: 330, w: 500, h: 28, content: "A clear picture of your retirement income plan", fontSize: 16, fontWeight: 500, color: "#ededed", align: "left" },
      { id: "e54", type: "shape", x: 620, y: 150, w: 290, h: 280, content: "", bg: "rgba(80,227,194,0.06)", borderRadius: 16, opacity: 1 },
      { id: "e55", type: "heading", x: 640, y: 180, w: 250, h: 30, content: "What You Get", fontSize: 18, fontWeight: 700, color: "#50e3c2", align: "center" },
      { id: "e56", type: "body", x: 640, y: 220, w: 250, h: 180, content: "30\u201345 minute conversation\n\nPersonalized tax analysis\n\nSocial Security timing report\n\nClear next steps \u2014 whether we work together or not", fontSize: 14, fontWeight: 400, color: "#a0a0a0", align: "center" },
    ],
    notes: "The CTA slide. Position the review as valuable and low-risk. 'Whether we work together or not' removes pressure.",
  },
  {
    id: "s7",
    label: "Thank You / Close",
    bg: "#0f0f0f",
    elements: [
      { id: "e57", type: "shape", x: 0, y: 0, w: 960, h: 540, content: "", bg: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)", borderRadius: 0, opacity: 1 },
      { id: "e58", type: "heading", x: 180, y: 160, w: 600, h: 60, content: "Thank You", fontSize: 44, fontWeight: 700, color: "#ffffff", align: "center" },
      { id: "e59", type: "body", x: 230, y: 250, w: 500, h: 30, content: "Book your complimentary Retirement Readiness Review", fontSize: 18, fontWeight: 400, color: "#a0a0a0", align: "center" },
      { id: "e60", type: "shape", x: 330, y: 320, w: 300, h: 50, content: "", bg: "#50e3c2", borderRadius: 12, opacity: 1 },
      { id: "e61", type: "body", x: 330, y: 330, w: 300, h: 30, content: "Book Your Review \u2192", fontSize: 16, fontWeight: 700, color: "#0a0a0a", align: "center" },
      { id: "e62", type: "body", x: 280, y: 420, w: 400, h: 24, content: "David Mitchell, CFP\u00AE, CPA \u00B7 Cornerstone Wealth Partners", fontSize: 14, fontWeight: 400, color: "#666666", align: "center" },
    ],
    notes: "Clean close. Single CTA button. Thank the audience for their time.",
  },
];

// ── Loading Screen ──

const loadingSteps = [
  { label: "Analyzing your approved webinar script", duration: 2000 },
  { label: "Mapping content to slide structure", duration: 1600 },
  { label: "Generating slide layouts and visuals", duration: 2200 },
  { label: "Applying brand styling", duration: 1400 },
  { label: "Finalizing presentation", duration: 1200 },
];

function BuilderLoading({ onComplete }: { onComplete: () => void }) {
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
    <div style={{ minHeight: "100vh", background: "var(--app-bg)", color: "var(--app-text)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", opacity: fadeOut ? 0 : 1, transition: "opacity 0.6s" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 24px", animation: "wb-fadeUp 0.6s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "var(--app-text)", color: "var(--app-bg)", fontSize: 15, fontWeight: 700, marginBottom: 20 }}>A</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Building Your Webinar Presentation</h1>
          <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>Generating slides from your approved webinar script</p>
        </div>
        <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, padding: "18px 22px", marginBottom: 24 }}>
          {loadingSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", fontSize: 13, opacity: i < currentStep ? 0.5 : i === currentStep ? 1 : 0.25, color: i < currentStep ? "var(--app-text-secondary)" : i === currentStep ? "var(--app-text)" : "var(--app-text-dim)", transition: "opacity 0.3s" }}>
              <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i < currentStep ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50e3c2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : i === currentStep ? (
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--app-border)", borderTopColor: "var(--app-text)", animation: "wb-spin 0.7s linear infinite" }} />
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--app-text-faint)" }} />
                )}
              </div>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--app-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "var(--app-text)", transition: "width 0.15s", width: `${progress}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--app-text-secondary)" }}>{Math.round(progress)}%</span>
        </div>
      </div>
      <style>{`
        @keyframes wb-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes wb-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Main Component ──

export default function WebinarBuilder() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const hasVisited = sessionStorage.getItem("wb-visited") === "1";
  const [loading, setLoading] = useState(!hasVisited);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [zoom, setZoom] = useState(100);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const slide = slides[activeSlide];
  const selectedEl = slide?.elements.find(e => e.id === selectedElement);

  function updateElement(slideIdx: number, elementId: string, updates: Partial<SlideElement>) {
    setSlides(prev => prev.map((s, i) => i !== slideIdx ? s : {
      ...s,
      elements: s.elements.map(el => el.id === elementId ? { ...el, ...updates } : el),
    }));
  }

  function updateSlideNotes(slideIdx: number, notes: string) {
    setSlides(prev => prev.map((s, i) => i !== slideIdx ? s : { ...s, notes }));
  }

  if (loading) {
    return <BuilderLoading onComplete={() => { sessionStorage.setItem("wb-visited", "1"); setLoading(false); }} />;
  }

  const canvasW = 960;
  const canvasH = 540;
  const scale = zoom / 100;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--app-bg)", color: "var(--app-text)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: "antialiased", overflow: "hidden" }}>
      <style>{`
        .wb-thumb { border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; overflow: hidden; }
        .wb-thumb:hover { border-color: var(--app-border-hover); }
        .wb-thumb--active { border-color: var(--app-text) !important; box-shadow: 0 0 0 2px rgba(80,227,194,0.2); }
        .wb-canvas-el { cursor: pointer; transition: outline-offset 0.1s; position: absolute; user-select: none; }
        .wb-canvas-el:hover { outline: 1px dashed rgba(80,227,194,0.4); outline-offset: 2px; }
        .wb-canvas-el--selected { outline: 2px solid #50e3c2 !important; outline-offset: 2px; }
        .wb-canvas-el textarea { background: transparent; border: none; outline: none; resize: none; width: 100%; height: 100%; font-family: inherit; padding: 0; }
        .wb-prop-input { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--app-border); background: var(--app-bg); color: var(--app-text); font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.15s; }
        .wb-prop-input:focus { border-color: var(--app-border-hover); }
        .wb-toolbar-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--app-border); background: transparent; color: var(--app-text-secondary); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s; }
        .wb-toolbar-btn:hover { border-color: var(--app-border-hover); color: var(--app-text); }
        .wb-toolbar-btn--active { background: var(--app-text); color: var(--app-bg); border-color: var(--app-text); }
        .wb-slide-list::-webkit-scrollbar { width: 4px; }
        .wb-slide-list::-webkit-scrollbar-track { background: transparent; }
        .wb-slide-list::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 2px; }
        @keyframes wb-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Top Toolbar ── */}
      <header style={{ padding: "10px 20px", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "var(--app-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/amplify-os/content-studio")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Webinar Builder</div>
            <div style={{ fontSize: 11, color: "var(--app-text-dim)" }}>Slide {activeSlide + 1} of {slides.length} — {slide.label}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="wb-toolbar-btn" onClick={() => setZoom(z => Math.max(50, z - 10))}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span style={{ fontSize: 11, color: "var(--app-text-secondary)", minWidth: 36, textAlign: "center" }}>{zoom}%</span>
          <button className="wb-toolbar-btn" onClick={() => setZoom(z => Math.min(150, z + 10))}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div style={{ width: 1, height: 20, background: "var(--app-border)", margin: "0 6px" }} />
          <button className={`wb-toolbar-btn${showNotes ? " wb-toolbar-btn--active" : ""}`} onClick={() => setShowNotes(!showNotes)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Notes
          </button>
          <button className="wb-toolbar-btn" onClick={toggleTheme}>
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <div style={{ width: 1, height: 20, background: "var(--app-border)", margin: "0 6px" }} />
          <button onClick={() => navigate("/amplify-os/video-studio")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--app-text)", color: "var(--app-bg)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s" }}>
            Continue to Video Studio
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Slide Panel (left) ── */}
        <div style={{ width: 180, borderRight: "1px solid var(--app-border)", background: "var(--app-surface)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px 10px", fontSize: 11, fontWeight: 600, color: "var(--app-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Slides</div>
          <div className="wb-slide-list" style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            {slides.map((s, i) => (
              <div key={s.id} onClick={() => { setActiveSlide(i); setSelectedElement(null); setEditingElement(null); }} style={{ marginBottom: 10 }}>
                <div className={`wb-thumb${i === activeSlide ? " wb-thumb--active" : ""}`}>
                  {/* Mini slide preview */}
                  <div style={{ width: "100%", aspectRatio: "16/9", background: s.bg, position: "relative", overflow: "hidden" }}>
                    {s.elements.filter(el => el.type !== "shape").slice(0, 4).map(el => (
                      <div key={el.id} style={{
                        position: "absolute",
                        left: `${(el.x / canvasW) * 100}%`,
                        top: `${(el.y / canvasH) * 100}%`,
                        width: `${(el.w / canvasW) * 100}%`,
                        fontSize: Math.max(4, (el.fontSize || 14) * 0.16),
                        fontWeight: el.fontWeight || 400,
                        color: el.color || "#fff",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        lineHeight: 1.2,
                      }}>
                        {el.content.split("\n")[0]}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: i === activeSlide ? "var(--app-text)" : "var(--app-text-dim)", marginTop: 4, textAlign: "center", fontWeight: i === activeSlide ? 600 : 400 }}>
                  {i + 1}. {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Canvas (center) ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 40, background: dark ? "#080808" : "#e8e8e8" }} onClick={() => { setSelectedElement(null); setEditingElement(null); }}>
            <div
              style={{
                width: canvasW * scale,
                height: canvasH * scale,
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                flexShrink: 0,
                animation: "wb-fadeIn 0.3s ease",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Render slide elements */}
              {slide.elements.map(el => {
                const isSelected = selectedElement === el.id;
                const isEditing = editingElement === el.id;

                return (
                  <div
                    key={el.id}
                    className={`wb-canvas-el${isSelected ? " wb-canvas-el--selected" : ""}`}
                    style={{
                      left: el.x * scale,
                      top: el.y * scale,
                      width: el.w * scale,
                      height: el.h * scale,
                      ...(el.type === "shape" ? {
                        background: el.bg,
                        borderRadius: (el.borderRadius || 0) * scale,
                        opacity: el.opacity ?? 1,
                        cursor: "default",
                        outline: "none",
                      } : {}),
                      ...(el.type === "stat" ? {
                        background: el.bg,
                        borderRadius: (el.borderRadius || 0) * scale,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      } : {}),
                    }}
                    onClick={e => { e.stopPropagation(); setSelectedElement(el.id); }}
                    onDoubleClick={() => { if (el.type !== "shape") setEditingElement(el.id); }}
                  >
                    {el.type === "shape" ? null : isEditing ? (
                      <textarea
                        ref={editRef}
                        autoFocus
                        defaultValue={el.content}
                        onBlur={(e) => {
                          updateElement(activeSlide, el.id, { content: e.target.value });
                          setEditingElement(null);
                        }}
                        onKeyDown={e => { if (e.key === "Escape") { setEditingElement(null); } }}
                        style={{
                          fontSize: (el.fontSize || 14) * scale,
                          fontWeight: el.fontWeight || 400,
                          color: el.color || "#ffffff",
                          textAlign: el.align || "left",
                          lineHeight: 1.3,
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: (el.fontSize || 14) * scale,
                        fontWeight: el.fontWeight || 400,
                        color: el.color || "#ffffff",
                        textAlign: el.align || "left",
                        lineHeight: 1.3,
                        whiteSpace: "pre-wrap",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: el.type === "stat" ? "center" : "flex-start",
                        justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
                        ...(el.type === "bullet" ? { paddingLeft: 16 * scale } : {}),
                      }}>
                        {el.type === "bullet" && <span style={{ marginRight: 8 * scale, color: "#50e3c2" }}>{"\u2022"}</span>}
                        {el.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Speaker Notes ── */}
          {showNotes && (
            <div style={{ borderTop: "1px solid var(--app-border)", padding: "14px 24px", background: "var(--app-surface)", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--app-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Speaker Notes</div>
              <textarea
                value={slide.notes || ""}
                onChange={e => updateSlideNotes(activeSlide, e.target.value)}
                placeholder="Add speaker notes for this slide..."
                style={{
                  width: "100%",
                  minHeight: 48,
                  maxHeight: 80,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--app-border)",
                  background: "var(--app-bg)",
                  color: "var(--app-text)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>
          )}
        </div>

        {/* ── Properties Panel (right) ── */}
        <div style={{ width: 260, borderLeft: "1px solid var(--app-border)", background: "var(--app-surface)", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
          {selectedEl && selectedEl.type !== "shape" ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--app-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16 }}>Element Properties</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Content</label>
                <textarea
                  className="wb-prop-input"
                  value={selectedEl.content}
                  onChange={e => updateElement(activeSlide, selectedEl.id, { content: e.target.value })}
                  rows={3}
                  style={{ resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Font Size</label>
                  <input
                    className="wb-prop-input"
                    type="number"
                    value={selectedEl.fontSize || 14}
                    onChange={e => updateElement(activeSlide, selectedEl.id, { fontSize: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Weight</label>
                  <select
                    className="wb-prop-input"
                    value={selectedEl.fontWeight || 400}
                    onChange={e => updateElement(activeSlide, selectedEl.id, { fontWeight: Number(e.target.value) })}
                  >
                    <option value={300}>Light</option>
                    <option value={400}>Regular</option>
                    <option value={500}>Medium</option>
                    <option value={600}>Semibold</option>
                    <option value={700}>Bold</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Color</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="color"
                    value={selectedEl.color || "#ffffff"}
                    onChange={e => updateElement(activeSlide, selectedEl.id, { color: e.target.value })}
                    style={{ width: 32, height: 32, border: "1px solid var(--app-border)", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 2 }}
                  />
                  <input
                    className="wb-prop-input"
                    value={selectedEl.color || "#ffffff"}
                    onChange={e => updateElement(activeSlide, selectedEl.id, { color: e.target.value })}
                    style={{ flex: 1, fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Alignment</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["left", "center", "right"] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => updateElement(activeSlide, selectedEl.id, { align: a })}
                      className={`wb-toolbar-btn${selectedEl.align === a ? " wb-toolbar-btn--active" : ""}`}
                      style={{ flex: 1, justifyContent: "center", padding: "6px 0" }}
                    >
                      {a === "left" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                      ) : a === "center" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>X</label>
                  <input className="wb-prop-input" type="number" value={selectedEl.x} onChange={e => updateElement(activeSlide, selectedEl.id, { x: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Y</label>
                  <input className="wb-prop-input" type="number" value={selectedEl.y} onChange={e => updateElement(activeSlide, selectedEl.id, { y: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Width</label>
                  <input className="wb-prop-input" type="number" value={selectedEl.w} onChange={e => updateElement(activeSlide, selectedEl.id, { w: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Height</label>
                  <input className="wb-prop-input" type="number" value={selectedEl.h} onChange={e => updateElement(activeSlide, selectedEl.id, { h: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--app-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16 }}>Slide Properties</div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Slide Label</label>
                <input
                  className="wb-prop-input"
                  value={slide.label}
                  onChange={e => setSlides(prev => prev.map((s, i) => i !== activeSlide ? s : { ...s, label: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "var(--app-text-secondary)", display: "block", marginBottom: 6 }}>Elements ({slide.elements.filter(e => e.type !== "shape").length})</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {slide.elements.filter(e => e.type !== "shape").map(el => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElement(el.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${selectedElement === el.id ? "#50e3c2" : "var(--app-border)"}`,
                        background: selectedElement === el.id ? "rgba(80,227,194,0.06)" : "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--app-text)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 10, color: "var(--app-text-dim)", textTransform: "uppercase", fontWeight: 600, minWidth: 44 }}>{el.type}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{el.content.split("\n")[0] || "(empty)"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "14px", background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>
                <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginBottom: 8, fontWeight: 600 }}>Quick Tips</div>
                <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.6 }}>
                  Click any element to select it. Double-click to edit text inline. Use the properties panel to fine-tune styling.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
