# Amplified Growth OS — UI Design Direction

**Style:** Monochromatic, Apple-inspired, very simplistic.

We want the app to feel calm, focused, and premium — like a well-designed Apple product: lots of space, clear hierarchy, no visual noise.

---

## Principles

1. **Monochromatic** — One neutral palette only. Grays from near-white to near-black. No colored accents for MVP (or a single, very subtle accent if we add one later). No rainbow buttons or decorative color.
2. **Apple-like** — Clean sans-serif, generous whitespace, subtle borders and shadows, rounded corners. Feels native to a premium OS, not “web 2.0” or busy.
3. **Simplistic** — Few UI elements per screen. One primary action. No clutter. Type and spacing do the work; decoration doesn’t.

---

## Palette (Neutrals)

| Role        | Light mode | Dark mode (optional) |
|------------|------------|----------------------|
| Background | `#fafafa` – `#ffffff` | `#000000` – `#0a0a0a` |
| Surface    | `#ffffff`, subtle border | `#141414` |
| Text primary | `#1d1d1f` | `#f5f5f7` |
| Text secondary | `#6e6e73` | `#a1a1a6` |
| Border / divider | `#d2d2d7` | `#424245` |
| Subtle fill | `#f5f5f7` | `#1d1d1f` |

No brand color required for MVP. If we add one later, use sparingly (e.g. one primary button or link).

---

## Typography

- **Font:** Geist (already in project) — clean, neutral, Apple-adjacent. System font stack as fallback.
- **Weights:** Regular (400), Medium (500), Semibold (600). Avoid bold (700) except rare emphasis.
- **Scale:** Clear hierarchy — large titles, smaller body, muted captions. No more than 3–4 sizes per view.
- **Line height:** Generous for body (e.g. 1.5–1.6); tighter for large headings.

---

## Space & Layout

- **Whitespace:** Generous padding and margins. Don’t crowd content.
- **Max width:** Constrain main content (e.g. 640–720px for forms, 800px for reading) so lines don’t stretch.
- **Grid:** Simple, consistent spacing scale (4, 8, 16, 24, 32, 48, 64).

---

## Components (Guidelines)

- **Buttons:** Filled primary = dark background (e.g. `#1d1d1f`), white text; secondary = light fill or border-only. Rounded (e.g. 10–12px). One clear primary per section.
- **Inputs:** Light border, rounded, minimal. Focus state = subtle ring or border, not heavy glow.
- **Cards / surfaces:** White (or dark in dark mode), very subtle border or shadow, rounded corners (12–16px).
- **No** gradients, strong shadows, or decorative icons unless they’re functional.

---

## Reference

- Think: Apple’s Settings, App Store product pages, or a calm productivity app — not a dashboard with charts and rainbow CTAs.
- We’ll implement this via Tailwind in `globals.css` and reuse tokens across the step-locked workflow.
