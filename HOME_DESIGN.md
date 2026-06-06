# DESIGN.md — KasiGSM Homepage

> Scope: homepage only.
> Aesthetic: professional GSM repair terminal. Clean, fast, trustworthy.
> The bar: a tool a senior technician would not be embarrassed to show a customer.

---

## Design Philosophy

Technicians are not consumers. They will not be charmed by flashy design. They will be put off by it. What builds trust in this industry is software that looks like it *knows what it's doing* — precise readouts, clear states, no clutter, no marketing fluff.

The homepage has two visual registers:

**Dark / terminal register** — used for the scanner section. Monospace font, teal-on-black data readouts, status indicators. This is where the tool lives. It should feel like professional software.

**Clean / editorial register** — used for hero, value props, blog, IMEI checker. Lighter background, standard sans-serif, breathing room. This is where the site explains itself to a new visitor.

The transition between the two registers on scroll is intentional — it signals "you've moved from marketing to tool."

---

## Color Tokens

Define these as CSS custom properties in `src/styles/tokens.css`. Use these everywhere — no hardcoded hex values in components.

```css
:root {
  /* Page */
  --color-bg-page:         #0A0A0F;
  --color-bg-card:         #111118;
  --color-bg-input:        #0F0F1A;
  --color-bg-hover:        rgba(0, 200, 150, 0.05);

  /* Borders */
  --color-border-default:  #1E1E2E;
  --color-border-active:   #00C896;
  --color-border-warning:  #FF6B35;
  --color-border-error:    #FF3B3B;
  --color-border-subtle:   rgba(255,255,255,0.06);

  /* Accent */
  --color-accent:          #00C896;   /* teal-green — primary live/active color */
  --color-accent-dim:      rgba(0, 200, 150, 0.15);
  --color-premium:         #7B61FF;   /* purple — paid/premium indicators */
  --color-warning:         #FF6B35;   /* orange — caution states */
  --color-error:           #FF3B3B;   /* red — failure states */
  --color-amber:           #FFB800;   /* scanning / in-progress state */

  /* Text */
  --color-text-primary:    #E8E8F0;
  --color-text-secondary:  #8888A0;
  --color-text-muted:      #444460;
  --color-text-data:       #00C896;   /* all monospace data readouts */
  --color-text-price:      #E8E8F0;
  --color-text-save:       #00C896;   /* "Save $XX" lines */
  --color-text-strike:     #FF3B3B;   /* struck-through full prices */

  /* Status dots */
  --color-status-idle:      #444460;
  --color-status-scanning:  #FFB800;
  --color-status-connected: #00C896;
  --color-status-error:     #FF3B3B;

  /* Hero / editorial section (lighter) */
  --color-bg-editorial:     #F8F8FC;  /* light mode for hero + value props */
  --color-text-editorial:   #0A0A0F;
}
```

**Dark mode note:** The scanner section is always dark regardless of system preference. The hero and editorial sections match system preference. Use `@media (prefers-color-scheme: dark)` to flip `--color-bg-editorial` and `--color-text-editorial` for the editorial sections only.

---

## Typography

One font family: **JetBrains Mono**. Used everywhere — terminal feel without looking unprofessional.

```html
<!-- In index.html <head> — non-blocking -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

```css
/* src/styles/global.css */
* {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  -webkit-font-smoothing: antialiased;
}

/* Scale */
--text-xs:   0.75rem;   /* 12px — muted labels, meta, trust micro-copy */
--text-sm:   0.875rem;  /* 14px — body, card descriptions */
--text-base: 1rem;      /* 16px — default */
--text-lg:   1.125rem;  /* 18px — card titles, section labels */
--text-xl:   1.5rem;    /* 24px — hero sub-headline */
--text-2xl:  2rem;      /* 32px — hero headline */
--text-data: 1.1rem;    /* 17.6px — AT command readouts, model numbers */

/* Weights */
--weight-regular: 400;
--weight-medium:  500;
--weight-bold:    600;

/* Letter spacing */
--tracking-wide:   0.04em;  /* headings */
--tracking-wider:  0.08em;  /* data readouts, model numbers */
--tracking-widest: 0.12em;  /* uppercase labels, badges */
```

---

## Homepage Section Specs

### Section 1 — Navigation
No design changes. Existing nav stays as-is.

---

### Section 2 — Promotional Banner

**Layout:** Full-width strip, sits flush under nav.

```
┌──────────────────────────────────────────────────────────────────┐
│  📢  [Title]: [Content text]          [CTA link →]          [×]  │
└──────────────────────────────────────────────────────────────────┘
```

**Variants:**
- Text-only: icon + title + content + optional CTA
- Image: full-width background image (`1920×600px`, webp preferred), title overlaid

**Tokens:**
```
background:  rgba(0, 200, 150, 0.08)
border:      1px solid var(--color-border-active)  [bottom border only]
padding:     10px 24px
font-size:   var(--text-sm)
color:       var(--color-text-primary)
CTA color:   var(--color-accent)
```

**Dismiss behaviour:** Click `×` → add banner `id` to `localStorage['dismissed_banners']` array → banner unmounts → does not reappear on refresh.

**Multiple banners:** Stack vertically. Max 2 visible at once. Third banner hidden behind "Show more" if needed.

---

### Section 3 — Hero

**Purpose:** First impression. One clear message. One clear action.

**Layout (desktop):** Two columns. Left: headline + CTAs. Right: static SVG illustration (Phase 1) → animated (Phase 2).

**Layout (mobile):** Single column. Illustration above text.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  The #1 GSM tool platform                  [SVG: phone     │
│  for phone technicians.                     connecting     │
│                                             to laptop]     │
│  Plug in any phone. We detect it                           │
│  and recommend the right tool to fix it.                   │
│                                                             │
│  [ ⚡ Scan my device — free ]  [ Browse all tools ]        │
│                                                             │
│  ✓ Samsung · Apple · Xiaomi · Tecno · 20+ brands           │
│  ✓ No install · No admin rights · Chrome / Edge            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tokens:**
```
section background:   var(--color-bg-editorial)
headline:             var(--text-2xl), weight 600, var(--color-text-editorial)
sub-headline:         var(--text-base), weight 400, var(--color-text-secondary)
section padding:      80px 0 desktop / 48px 0 mobile
max content width:    960px, centered
```

**Primary button:**
```
background:    var(--color-accent)
color:         #0A0A0F (dark text on teal — always legible)
border:        none
border-radius: 6px
padding:       12px 28px
font-size:     var(--text-base)
font-weight:   var(--weight-medium)
letter-spacing: var(--tracking-wide)
```

**Secondary button:**
```
background:    transparent
color:         var(--color-text-secondary)
border:        1px solid var(--color-border-default)
border-radius: 6px
padding:       12px 28px
```

**Trust micro-copy:**
```
font-size:   var(--text-xs)
color:       var(--color-text-muted)
margin-top:  12px
items separated by · (interpunct)
```

**Hero illustration — Phase 1 (static):**
Simple SVG: laptop silhouette on right, phone silhouette on left, USB cable connecting them, small green pulse dot on laptop screen. No animation. Approximately 2KB SVG inline. No external file load.

**Hero illustration — Phase 2 (animated):**
Same SVG, CSS keyframes added:
- Cable "draws in" from phone end to laptop port: `stroke-dashoffset` animation, 600ms ease-in-out
- Green pulse dot appears after cable connects: `opacity 0→1` + `scale 0→1`, 200ms ease-out, then pulse loop 2s infinite
- Phone icon gets a subtle glow border: `box-shadow` 0→teal 0 0 8px, 300ms ease-out
- `prefers-reduced-motion`: all animations skipped, static SVG shown

---

### Section 4 — Device Scanner

**Purpose:** Core feature. Detects phone, drives issue selection, surfaces tool recommendations.

**Background:** `var(--color-bg-page)` — always dark, regardless of system theme. Creates a strong visual break from the hero section above.

**Max width:** 760px centered. Scanner feels focused and deliberate, not stretched.

**Section padding:** `64px 24px` desktop / `40px 16px` mobile.

**Section heading:**
```
FREE DEVICE SCANNER
```
```
font-size:      var(--text-xs)
font-weight:    var(--weight-medium)
letter-spacing: var(--tracking-widest)
color:          var(--color-accent)
text-transform: uppercase
margin-bottom:  8px
```

Below heading, one line of muted body copy: "Plug in your phone via USB. No install required."

---

#### Scanner Component States

**State: IDLE**
```
┌─────────────────────────────────────────────┐
│  ● READY                                    │  ← status dot (idle, #444460)
│                                             │
│  Connect your phone via USB, then click     │
│  the button below.                          │
│                                             │
│  [ ⚡ Connect & scan device ]               │
│                                             │
│  Enter device manually ↓                   │
│  Chrome or Edge required for auto-detect    │
└─────────────────────────────────────────────┘
```

**State: REQUESTING**
```
┌─────────────────────────────────────────────┐
│  ◉ REQUESTING PORT ACCESS                  │  ← status dot (amber, pulse)
│                                             │
│  > Requesting port access...█              │  ← typewriter, cursor blinks
│                                             │
│  Allow the browser permission dialog        │
│  to continue.                               │
└─────────────────────────────────────────────┘
```

**State: READING**
```
┌─────────────────────────────────────────────┐
│  ◉ READING DEVICE                          │  ← status dot (amber, pulse)
│                                             │
│  > Requesting port access...   ✓           │
│  > Port connected                ✓          │
│  > AT+CGMM ............ SM-A546B█          │  ← active line typing
│                                             │
└─────────────────────────────────────────────┘
```

**State: IDENTIFIED**
```
┌─────────────────────────────────────────────┐
│  ● DEVICE IDENTIFIED                       │  ← status dot (teal, steady)
│                                             │
│  > Requesting port access...   ✓           │
│  > Port connected              ✓           │
│  > AT+CGMM ............ SM-A546B           │
│  > AT+CGMR ............ A546BXXU5CXB1      │
│  > AT+CGSN ............ 3521••••••18       │
│                                             │
│  ──────────────────────────────────────    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ▸ SAMSUNG GALAXY A54 5G   [LIVE ●] │   │  ← device card fades in
│  │ ──────────────────────────────────  │   │
│  │ Model     SM-A546B                  │   │
│  │ Chipset   Exynos 1380               │   │
│  │ Android   14                        │   │
│  │ Firmware  A546BXXU5CXB1             │   │
│  │ IMEI      3521••••••18  [Check →]   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  What do you need to fix?                   │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │ FRP  │ │ NET  │ │ MDM  │               │  ← issue chips fade in staggered
│  └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐               │
│  │iCloud│ │ PWD  │ │  OS  │               │
│  └──────┘ └──────┘ └──────┘               │
└─────────────────────────────────────────────┘
```

**State: RESULTS (after issue selected)**
```
  Recommended tools for SM-A546B · FRP Lock

  ┌──────────────────────────────────────────────┐
  │ Unlock Tool Rent [6 hours]                   │
  │ ✓ Compatible with SM-A546B Android 14        │
  │ ✓ FRP bypass in under 10 minutes             │
  │                                              │
  │ Rent         Full license                    │
  │ $0.48        ~$45.00                         │
  │ ─────────────────────────────                │
  │ Save $44.52 by renting                       │
  │                                              │
  │ [ RENT NOW — $0.48 ]  [ See details ]        │
  └──────────────────────────────────────────────┘

  [  Save these results — enter your email  ]    ← soft registration, 3s delay
```

---

#### Typewriter Component Spec

**Behaviour:**
- Each line types character by character using a `setInterval` at 28ms per character
- After a line completes, cursor blinks for 400ms then moves to next line
- A `✓` check mark appends to completed lines with a 150ms delay after line finishes
- All lines remain visible as new ones type below
- Maximum 8 lines visible — older lines fade out (opacity 0.4) as new ones appear

**Performance rules:**
- No animation library. Pure `useState` + `useEffect` + `setInterval`.
- `clearInterval` on every unmount and state transition — no memory leaks.
- `prefers-reduced-motion` check in the hook: if `true`, skip intervals, render all lines at full opacity instantly.

```javascript
// Pseudo-code — actual implementation in src/components/Scanner/Typewriter.jsx
const lines = [
  { text: 'Requesting port access...',     suffix: '✓' },
  { text: 'Port connected',               suffix: '✓' },
  { text: 'AT+CGMM ............ SM-A546B', suffix: null },
  { text: 'AT+CGMR ............ A546BXXU5CXB1', suffix: null },
  { text: 'AT+CGSN ............ 3521••••••18',  suffix: null },
]
```

**CSS for blinking cursor:**
```css
.cursor {
  display: inline-block;
  width: 8px;
  height: 1em;
  background: var(--color-accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.75s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; opacity: 1; }
}
```

---

#### Device Card Component Spec

```css
.device-card {
  background:    var(--color-bg-card);
  border:        1px solid var(--color-border-default);
  border-left:   3px solid var(--color-accent);
  border-radius: 8px;
  padding:       16px 20px;

  /* Entry animation */
  animation: card-enter 300ms ease-out forwards;
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.device-card__label {
  font-size:      var(--text-xs);
  color:          var(--color-text-muted);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
}

.device-card__value {
  font-size:      var(--text-data);
  color:          var(--color-text-data);
  letter-spacing: var(--tracking-wider);
  font-weight:    var(--weight-medium);
}

.device-card__live-badge {
  font-size:      var(--text-xs);
  color:          var(--color-accent);
  border:         1px solid var(--color-accent);
  border-radius:  4px;
  padding:        2px 6px;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  display:        inline-flex;
  align-items:    center;
  gap:            4px;
}
```

---

#### Issue Chip Component Spec

```css
.issue-chip {
  background:    var(--color-bg-card);
  border:        1px solid var(--color-border-default);
  border-radius: 8px;
  padding:       12px 8px;
  text-align:    center;
  cursor:        pointer;
  font-size:     var(--text-xs);
  color:         var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  transition:    border-color 150ms ease, background 150ms ease, transform 100ms ease;
  user-select:   none;
}

.issue-chip:hover {
  border-color: var(--color-border-subtle);
  transform:    scale(1.02);
}

.issue-chip.selected {
  border-color: var(--color-accent);
  background:   var(--color-accent-dim);
  color:        var(--color-accent);
}
```

Staggered appearance: chips render with CSS `animation-delay` of `n * 40ms` where `n` is chip index.

```css
.issue-chip:nth-child(1) { animation-delay: 0ms; }
.issue-chip:nth-child(2) { animation-delay: 40ms; }
.issue-chip:nth-child(3) { animation-delay: 80ms; }
/* etc. */

@keyframes chip-enter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.issue-chip { animation: chip-enter 200ms ease-out both; }

@media (prefers-reduced-motion: reduce) {
  .issue-chip { animation: none; }
}
```

---

#### Tool Recommendation Card Component Spec

```
┌────────────────────────────────────────────────┐
│  UNLOCK TOOL                     [COMPATIBLE]  │  ← brand uppercase, teal badge
│  Unlock Tool Rent [6 hours]                    │  ← tool name
│                                                │
│  ✓ Compatible with SM-A546B Android 14         │  ← teal checkmarks
│  ✓ FRP bypass in under 10 minutes              │
│                                                │
│  RENT              FULL LICENSE                │
│  $0.48             $45.00                      │  ← full price in red strikethrough
│  ─────────────────────────────────             │
│  Save $44.52 by renting                        │  ← teal, this is the key line
│                                                │
│  [ RENT NOW — $0.48 ]    [ See details ]       │
└────────────────────────────────────────────────┘
```

```css
.tool-card {
  background:    var(--color-bg-card);
  border:        1px solid var(--color-border-default);
  border-radius: 8px;
  padding:       20px;
  animation:     card-enter 300ms ease-out forwards;  /* reuse same keyframe */
}

.tool-card__save-line {
  color:       var(--color-text-save);   /* #00C896 */
  font-size:   var(--text-sm);
  font-weight: var(--weight-medium);
}

.tool-card__full-price {
  color:            var(--color-text-strike);  /* #FF3B3B */
  text-decoration:  line-through;
  font-size:        var(--text-sm);
  margin-left:      8px;
}

.tool-card__rent-btn {
  background:    var(--color-accent);
  color:         #0A0A0F;
  border:        none;
  border-radius: 6px;
  padding:       10px 20px;
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  cursor:        pointer;
  transition:    opacity 150ms ease;
}

.tool-card__rent-btn:hover {
  opacity: 0.88;
}

.tool-card__details-btn {
  background:    transparent;
  color:         var(--color-text-secondary);
  border:        1px solid var(--color-border-default);
  border-radius: 6px;
  padding:       10px 16px;
  cursor:        pointer;
  transition:    border-color 150ms ease;
}

.tool-card__details-btn:hover {
  border-color: var(--color-border-subtle);
}
```

---

### Section 5 — Trust Bar

**Layout:** Single row 4 columns desktop. 2×2 grid mobile.

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   50,000+    │   12,000+    │   $0.48      │     24/7     │
│ Devices fixed│ Technicians  │ Lowest rent  │Instant deliver│
└──────────────┴──────────────┴──────────────┴──────────────┘
```

```css
.trust-bar {
  background:    var(--color-bg-card);
  border-top:    1px solid var(--color-border-default);
  border-bottom: 1px solid var(--color-border-default);
  padding:       24px 0;
}

.trust-stat__number {
  font-size:   var(--text-xl);
  font-weight: var(--weight-bold);
  color:       var(--color-accent);
}

.trust-stat__label {
  font-size:   var(--text-xs);
  color:       var(--color-text-muted);
  margin-top:  4px;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

---

### Section 6 — Why Rent, Not Buy

**Layout:** 2×2 grid desktop, 1 column mobile. Light editorial background.

Each card has:
- Tabler icon (24px, teal)
- Title (text-base, weight 500)
- 2-sentence description with a real number in each

```
✓ Real numbers only — no vague claims.
✓ Every card answers a specific technician objection.
```

| Card | Objection answered |
|---|---|
| Rent, don't buy | "Tools are too expensive" |
| Instant delivery | "I need it now, not tomorrow" |
| Every brand | "Does it work on my phones?" |
| 24/7 support | "What if it doesn't work?" |

---

### Section 7 — Free IMEI Checker

**Layout:** Horizontal card, left: title + description, right: input + button.

```
┌──────────────────────────────────────────────────────┐
│  🔍 Free IMEI checker                                │
│  Check blacklist, carrier lock, and warranty.        │
│  No registration needed.                             │
│                                         [___________]│
│                                         [ Check free ]│
└──────────────────────────────────────────────────────┘
```

After result shows below:
- Blacklist status (clean / flagged)
- Carrier lock status
- Warranty status
- If locked: "Need to remove this? [Find the right tool →]" → links to relevant store category

---

### Section 8 — Most Rented This Week

**Layout:** 3 cards in a row desktop, stacked mobile.

**Key design rule:** The full license price must be visible and struck through on every card. The "Save $XX" or price delta is more persuasive than the rent price alone.

---

### Section 9 — Guides and New Tools

**Layout:** 2-column grid. Category badge (Guide / New Tool / Update) in teal/purple/amber.

**Image placeholder:** If no thumbnail, show category-branded colour block with icon — never a broken image.

---

## Scanline Overlay

Applied to the scanner section only. Gives the dark terminal section subtle depth without being a visual gimmick.

```css
.scanner-section {
  position: relative;
}

.scanner-section::after {
  content:         '';
  position:        absolute;
  inset:           0;
  background:      repeating-linear-gradient(
    0deg,
    transparent, transparent 2px,
    rgba(0, 0, 0, 0.025) 2px, rgba(0, 0, 0, 0.025) 4px
  );
  pointer-events:  none;
  z-index:         1;
}

/* All scanner content sits above the overlay */
.scanner-content {
  position: relative;
  z-index:  2;
}
```

---

## Status Dot Component

Used in scanner header only.

```css
.status-dot {
  width:         8px;
  height:        8px;
  border-radius: 50%;
  display:       inline-block;
  flex-shrink:   0;
}

.status-dot--idle      { background: var(--color-status-idle); }
.status-dot--scanning  { background: var(--color-status-scanning);  animation: dot-pulse 0.8s ease-in-out infinite; }
.status-dot--connected { background: var(--color-status-connected); }
.status-dot--error     { background: var(--color-status-error); }

@keyframes dot-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .status-dot--scanning { animation: none; }
}
```

---

## Browser Compatibility Warning

Shown only when `!navigator.serial` — Firefox, Safari.

```
┌──────────────────────────────────────────────────────────┐
│  ⚠  Auto-detect requires Chrome or Edge.                 │
│     You can still enter your device manually below.      │
└──────────────────────────────────────────────────────────┘
```

```css
.browser-warning {
  background:    rgba(255, 107, 53, 0.08);
  border:        1px solid var(--color-border-warning);
  border-radius: 6px;
  padding:       10px 14px;
  font-size:     var(--text-xs);
  color:         var(--color-warning);
}
```

---

## Skeleton Loading State

Used while tool recommendations are fetching. No external library.

```css
.skeleton {
  background:    var(--color-bg-card);
  border-radius: 6px;
  overflow:      hidden;
  position:      relative;
}

.skeleton::after {
  content:    '';
  position:   absolute;
  inset:      0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.04) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation:  shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}
```

---

## Responsive Breakpoints

```css
/* Mobile first */
/* xs: default — single column everything */

/* sm: 640px — issue chips go 2-col */
@media (min-width: 640px) {}

/* md: 768px — hero goes 2-col, trust bar goes 4-col */
@media (min-width: 768px) {}

/* lg: 1024px — issue chips go 3-col, tool cards side by side, value props 2×2 */
@media (min-width: 1024px) {}
```

---

## Animation Performance Rules

These are non-negotiable. One laggy animation on a workshop PC with 40 tabs open loses the technician permanently.

1. **Only animate `transform` and `opacity`** — these are GPU-composited and never trigger layout recalc. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`, or `font-size`.
2. **No Framer Motion on the homepage** — pure CSS keyframes and `useState` intervals only. Framer Motion is a large bundle. Save it if you later need gesture-based animation.
3. **Every animation respects `prefers-reduced-motion`** — wrap all `@keyframes` blocks in `@media (prefers-reduced-motion: no-preference)` or add explicit `reduce` overrides.
4. **Typewriter uses `setInterval`, not `requestAnimationFrame` loops** — 28ms interval is imperceptible lag, produces clean character stepping, and is trivially cancellable.
5. **Skeleton shimmer uses `background-position` on a `::after` pseudo-element** — no JS, no library, composited by the browser.
6. **Scanner section scanlines use a static CSS gradient** — zero CPU cost, renders once.
7. **No box-shadow, blur, or filter animations** — these force paint and are the #1 cause of jank on mid-range hardware.