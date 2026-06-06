# PLAN.md — KasiGSM Homepage

> **Scope:** Homepage only. The store, checkout, and service pages are complete and unchanged.
> **Goal:** Turn the homepage into a conversion machine for technicians who have never heard of KasiGSM — and for regulars who need a reason to come back daily.
> **Revenue model:** Free value → registration → tool rental conversion. No purchase happens on the homepage itself. Every CTA links out to the existing store.

---

## The Problem With the Current Homepage

The existing homepage opens with a rotating ad carousel for specific services. A technician who doesn't already know what they need sees three ads and bounces. There is no hook for the undecided visitor. There is no reason to register. There is no free value delivered before asking for money.

The result: high bounce rate, low registration, low return visits.

---

## What the New Homepage Does Instead

It answers the question every technician has when they land: **"Can this site actually help me with the phone I have in my hand right now?"**

It answers that question in under 10 seconds — for free, without registration, without downloading anything — by detecting their device and telling them exactly which tool to rent.

Everything else on the page supports that one job.

---

## Homepage Sections (in order, top to bottom)

### 1. Navigation bar
Existing nav. No changes. Keep login/register, tool rent, IMEI service links.

### 2. Promotional banner
Pulled from `GET /banners`. Date-scoped, dismissible. Used for new tool announcements, limited offers, urgent news. Supports image or text. Disappears automatically when `ends_at` passes. Multiple banners stack vertically.

### 3. Hero section
The first thing a visitor sees. Replaces the rotating ad slider entirely.

**What it communicates in 3 seconds:**
- This site has a free tool that identifies your phone
- It works without installing anything
- It tells you exactly what to rent

**Content:**
- Headline: direct, benefit-first, one sentence
- Sub-headline: one line explaining how (plug in, we detect, we recommend)
- Primary CTA: "Scan my device — free" → scrolls to scanner
- Secondary CTA: "Browse all tools" → links to existing store
- Trust micro-copy below buttons: supported brands, no install, speed

**Animation (deferred — Phase 2):**
A lightweight CSS/SVG animation of a phone connecting to a laptop via USB cable. No GIF, no library. Pure CSS keyframes, under 5KB. Placeholder static illustration ships with Phase 1.

### 4. Device scanner
The core feature. Full section, dark background, centered.

**States:**
- Idle: scan button + manual entry link + browser compatibility check
- Requesting: browser permission dialog has opened (status dot amber, typewriter: "Requesting port access...")
- Reading: port open, AT commands firing one by one in terminal readout
- Identified: device card appears with model, firmware, chipset, Android version
- Issue selection: issue chips appear below device card (from `GET /device/issues`)
- Results: tool recommendation cards appear (from `POST /device/scan` → tool lookup)
- Error / unsupported browser: graceful fallback to manual brand + model entry

**API calls this section makes:**
```
GET  /device/brands    → populates manual entry brand dropdown
GET  /device/chipsets  → populates manual entry chipset dropdown
GET  /device/issues    → populates issue selector chips
POST /device/scan      → submits detected or manual device data, returns detected info + issue list
```
Tool recommendations come from a separate endpoint (defined in the store project, linked from results).

**What it does NOT do:**
- It does not run the repair. It recommends.
- It does not process payment. It links to the store.
- It does not require registration. Registration is offered softly after results.

### 5. Trust bar
Four numbers across one row. No copy needed. Devices fixed, technicians served, lowest rent price, delivery speed. Static content, updated manually when milestones change.

### 6. Why rent, not buy
Four value proposition cards. This is the most important section for visitors who are hesitant. It directly addresses the objection "I'll just save up and buy the full tool." Each card anchors a real price comparison. No fluff. No generic "we're the best" claims.

### 7. Free IMEI checker
Inline embed of the existing `/imei-checker` feature. No redirect. Technicians use this daily — embedding it means every visit has utility even if the technician doesn't need a repair tool that day. After a result, contextual upsell: "Need to remove this lock? Here are your options →" linking to the relevant store category.

### 8. Most rented this week
Three tool cards showing the top-rented tools. Each card shows tool name, rent price, full license price (struck through), and turnaround time. The price delta is the conversion copy. Static or dynamic — either works for Phase 1.

### 9. Guides and new tools (blog)
Two blog cards, latest posts. Category-tagged (Guide / New Tool / Update). Drives return visits and organic search traffic. Each post ends with a contextual tool recommendation. Managed separately — the homepage just displays the two most recent.

### 10. Footer
Existing footer. No changes.

---

## What Gets Removed

| Removed | Replaced with | Why |
|---|---|---|
| Rotating 3-banner ad slider | Hero section | Slider = bounce. Hero = action. |
| "Recent Added" product list at top | Moved below scanner | Products convert better after the technician knows what they need |

Everything else on the existing site remains exactly as-is.

---

## Conversion Flow (anonymous visitor)

```
Lands on homepage
  → Sees hero → clicks "Scan my device"
    → Scanner detects phone → selects issue
      → Sees tool recommendation → clicks "Rent now"
        → Lands on existing store service page
          → Prompted to register/login to complete purchase
            → Registered → purchase complete
```

## Conversion Flow (returning visitor, not registered)

```
Lands on homepage
  → Uses IMEI checker (free, immediate value)
    → Sees "Need to remove this lock?" upsell
      → Clicks through to store
        → Soft registration prompt
```

## Conversion Flow (returning registered user)

```
Lands on homepage
  → Greeted by name: "Welcome back, [name]"
    → Scanner pre-fills last scanned device
      → New tool badge if a tool was added for their device since last visit
        → Direct "Rent now" with no friction
```

---

## Success Metrics — Homepage Specific

| Metric | Target (Month 1) | How measured |
|---|---|---|
| Bounce rate | Below 55% (down from est. 70%+) | Google Analytics |
| Scanner use rate | 30%+ of unique visitors | Custom event on scan click |
| Scan → issue selection | 70%+ of scans | Custom event on issue chip click |
| Issue → store click-through | 40%+ | Outbound link tracking |
| IMEI checker uses | 20+ per day | Existing checker analytics |
| New registrations from homepage | 10+ per day | Auth system |

---

## Dependencies (homepage only)

| Dependency | Status | Notes |
|---|---|---|
| `GET /banners` | Backend — build | Returns active promotional banners |
| `GET /device/brands` | Backend — build | Brand list for manual fallback |
| `GET /device/chipsets` | Backend — build | Chipset list for manual fallback |
| `GET /device/issues` | Backend — build | Issue category list |
| `POST /device/scan` | Backend — build | Core scan endpoint |
| Tool recommendation endpoint | Store project — existing or TBD | Called after issue selection |
| Web Serial API | Browser | Chrome / Edge only |
| JetBrains Mono font | Google Fonts CDN | One `<link>` tag, non-blocking |
| Existing KasiGSM auth | Store project — existing | Login/register links only, no new auth work |
| Blog CMS or static posts | Content — manual | Two latest posts displayed on homepage |