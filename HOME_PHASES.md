# PHASES.md — KasiGSM Homepage Build Phases

> Scope: homepage only. Store is complete.
> Each phase ships independently. Phase 1 is a real, usable homepage.
> All phases assume Vite + React frontend, FastAPI backend, existing KasiGSM store unchanged.

---

## Phase 1 — Functional Homepage (Ship First)

**What ships:** A complete, working homepage with all sections except hero animation and blog.
**Timeline:** 1–2 weeks.
**Definition of done:** A technician lands, scans their phone, selects an issue, sees tool recommendations, and clicks through to the store. Every section is present and functional.

---

### Section checklist

#### Navigation
- [ ] Existing nav carried over — no changes
- [ ] Confirm login/register links point to existing auth

#### Banner
- [ ] `GET /banners` call on page load
- [ ] Render first active banner (or none if empty)
- [ ] Dismiss button sets localStorage flag so dismissed banners don't reappear on refresh
- [ ] Handle `starts_at` / `ends_at` filtering (backend already filters — frontend just renders what it receives)
- [ ] Image banner variant: `image_url` → full-width banner image with overlay text
- [ ] Text-only variant: icon + title + content + optional CTA link

#### Hero section
- [ ] Headline, sub-headline, two CTA buttons
- [ ] Primary CTA scrolls smoothly to scanner section
- [ ] Secondary CTA links to existing store
- [ ] Trust micro-copy row: brand list + "no install" + "10 seconds"
- [ ] Static placeholder illustration (phone + USB cable + laptop, SVG, no animation yet — deferred to Phase 2)
- [ ] Browser compatibility detection on mount: if not Chrome/Edge, hide "Scan" button in hero, show "Use Chrome or Edge for auto-detect" note

#### Device scanner
**State machine — 6 states:**

```
IDLE → REQUESTING → READING → IDENTIFIED → ISSUE_SELECTED → RESULTS
                                    ↓
                                  ERROR (at any point after REQUESTING)
                                    ↓
                                MANUAL_ENTRY (fallback from IDLE or ERROR)
```

- [ ] `useDeviceSerial` hook
  - Opens Web Serial port (triggers browser permission dialog)
  - Sets baud rate 115200, 8 data bits, no parity, 1 stop bit
  - Sends `AT+CGMM\r\n` → parses model number
  - Sends `AT+CGMR\r\n` → parses firmware string
  - Sends `AT+CGSN\r\n` → parses IMEI (masks middle 6 digits for display)
  - 3-second timeout per command, graceful fail to MANUAL_ENTRY
  - Cleanup: closes reader + port on unmount or error

- [ ] Typewriter terminal component
  - Renders lines one at a time with character-by-character typing
  - Each line: `> COMMAND ........... RESPONSE`
  - Blinking cursor `_` at end of active line
  - Completed lines stay visible, scroll up as new lines appear
  - Pure CSS + `useState` interval — no animation library
  - `prefers-reduced-motion` check: if set, skip animation, show all lines instantly

- [ ] Status dot component (idle / scanning / connected / error)

- [ ] Device result card
  - Appears with `opacity 0→1` + `translateY(8px)→0` CSS transition, 300ms ease-out
  - Shows: brand, model, chipset, firmware, Android version
  - IMEI row with masked display + "Check blacklist →" link to `/imei-checker`
  - Left border accent `#00C896`

- [ ] Issue selector
  - Calls `GET /device/issues` on mount, caches response
  - Renders chips in 2-col (mobile) / 3-col (desktop) grid
  - Single selection only
  - Selected state: teal border + teal background tint
  - Appears below device card with staggered fade-in (50ms delay per chip, CSS only)

- [ ] Tool results
  - Calls store tool recommendation endpoint with `{ brand, model, issue_slug }`
  - Renders tool cards (see component spec in DESIGN.md)
  - "Rent now" → opens existing store service page in same tab
  - "See details" → opens store service page
  - Loading state: skeleton cards (CSS shimmer, no library)
  - Empty state: "No tools found for this combination — contact support" + WhatsApp link

- [ ] Soft registration prompt
  - Appears below tool results after 3 seconds
  - Not a modal, not a blocker — inline card
  - "Save these results + get notified when new tools support your device"
  - Email input + "Save" button → calls existing registration endpoint
  - Dismissible, dismissed state persists in localStorage

- [ ] Manual entry fallback
  - Brand dropdown (from `GET /device/brands`)
  - Model text input (free text)
  - Chipset dropdown (from `GET /device/chipsets`, optional)
  - "Find tools" button → same flow as auto-scan from ISSUE_SELECTED onwards
  - Always accessible via "Enter manually" link, not hidden behind error state

- [ ] Firefox / Safari fallback
  - On unsupported browsers: scan button replaced with manual entry form directly
  - No error message — just the manual form with a subtle note: "Auto-detect requires Chrome or Edge"

#### Trust bar
- [ ] Four static stat tiles: devices fixed, technicians, lowest price, delivery speed
- [ ] Hard-coded values — update manually when milestones change
- [ ] Single-row on desktop, 2×2 grid on mobile

#### Why rent, not buy
- [ ] Four cards: Rent not buy / Instant delivery / Every brand / 24/7 support
- [ ] Each card: icon (Tabler), title, 2-sentence description with real price anchors
- [ ] Static content — no API

#### Free IMEI checker (inline embed)
- [ ] Input field + "Check free" button
- [ ] Submits to existing `/imei-checker` — either inline API call or redirect
- [ ] If inline: show result (blacklist status, carrier lock, warranty) below input
- [ ] After result: contextual upsell strip linking to relevant store category

#### Most rented this week
- [ ] Three tool cards, static content Phase 1 (hardcoded from your top 3 rentals)
- [ ] Each card: brand name, tool name, rent price, full price struck through, turnaround
- [ ] "All tools →" link to existing store
- [ ] Dynamic version deferred to Phase 2

#### Footer
- [ ] Existing footer — no changes

---

### Phase 1 — Technical setup

- [ ] Vite React project scaffolded
- [ ] `src/` structure:
  ```
  src/
    components/
      Banner/
      Hero/
      Scanner/
        useDeviceSerial.js
        Typewriter.jsx
        StatusDot.jsx
        DeviceCard.jsx
        IssueSelector.jsx
        ToolResults.jsx
        ManualEntry.jsx
        RegistrationPrompt.jsx
      TrustBar/
      ValueProps/
      ImeiChecker/
      ToolSpotlight/
      Blog/
    hooks/
      useDeviceSerial.js
      useBanners.js
      useIssues.js
      useBrands.js
    lib/
      api.js          ← all fetch calls, base URL from env var
      serialUtils.js  ← AT command helpers
    styles/
      tokens.css      ← CSS custom properties (all colors, fonts, spacing)
      global.css
    App.jsx
    main.jsx
  ```
- [ ] `.env` file: `VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io`
- [ ] CORS: FastAPI configured to allow `kasigsm.co.za` and `localhost:5173`
- [ ] All API calls go through `lib/api.js` — one place to swap ngrok → production URL

---

## Phase 2 — Polish + Animation (hero + dynamic tools)

**What ships:** Hero animation, dynamic "most rented" section, registered user personalisation.
**Timeline:** 1 week after Phase 1 stable.

- [ ] Hero CSS/SVG animation: phone → USB cable plugs in → laptop → pulse indicator
  - Pure CSS keyframes, no library, no GIF
  - `prefers-reduced-motion`: static illustration fallback
  - Total weight under 5KB including SVG markup
- [ ] "Most rented this week" becomes dynamic — backend endpoint returning top 3 by rental count
- [ ] Returning registered user: homepage detects auth cookie → shows "Welcome back [name]" in hero
- [ ] Scanner pre-fills last scanned device for registered users
- [ ] "New tool for your device" badge if applicable
- [ ] Blog section: connect to CMS or markdown files, display 2 latest posts dynamically

---

## Phase 3 — SEO Content Pages

**What ships:** Auto-generated landing pages for device + issue combinations.
**Timeline:** 2–3 weeks after Phase 2.

These live outside the homepage but are linked from it (blog posts, tool result pages).

- [ ] Route: `/fix/[brand]/[model]/[issue]` e.g. `/fix/samsung/sm-a546b/frp`
- [ ] Page content: device summary, issue description, step-by-step generic guide, tool recommendations
- [ ] Schema.org `HowTo` JSON-LD on each page (triggers Google rich results)
- [ ] `GET /sitemap.xml` — auto-generated from all brand/model/issue combinations in the DB
- [ ] 500+ pages targeting search queries like "FRP bypass Samsung SM-A546B 2026"

---

## Phase 4 — Full Diagnostics Card

**What ships:** Richer device data from additional AT commands, shown post-scan.
**Timeline:** Phase 3 stable first.

Additional AT commands:
| Command | Data returned | Displayed as |
|---|---|---|
| `AT+COPS?` | Current network operator | Carrier name |
| `AT+CSQ` | Signal strength (0–31) | Signal bar visual |
| `AT+CIMI` | SIM IMSI | Carrier/region inference |
| `AT+CLAC` | Supported AT commands | Used internally, not displayed |
| `AT+DEVCONINFO` | Samsung full device dump | Extended model info |

Diagnostics card additions:
- [ ] Carrier + SIM status
- [ ] Signal strength indicator
- [ ] Firmware vs latest available (calls firmware lookup endpoint)
- [ ] IMEI Luhn validity check (client-side, instant)
- [ ] "Full diagnostics" link → drives traffic to IMEI checker

---

## Non-goals (homepage forever out of scope)

These will never be on the homepage regardless of future requests:

- Running repair tools in the browser
- Processing payments on the homepage
- Flashing firmware
- Replacing the store
- A full user account dashboard (that's a `/dashboard` route, not the homepage)