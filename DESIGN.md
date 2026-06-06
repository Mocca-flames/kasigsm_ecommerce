# DESIGN.md — GsmCheap Mixed Design System
> Modern storefront aesthetic with diagnostic terminal reserved for the Intelligent (Technician) section

---

## 1. Design Direction

### Concept: "Split Identity — Store Meets Terminal"
The interface has two distinct zones:

| Zone | Vibe | Pages |
|---|---|---|
| **Storefront** | Modern dark ecommerce — polished, trustworthy, approachable | All pages except `/technician/request` |
| **Intelligent Terminal** | Phosphor green-on-black diagnostic terminal — hardware diagnostic aesthetic | `/technician/request` only |

The one thing a user remembers from the store pages: this is a premium digital products store — clean cards, generous spacing, trustworthy dark interface. From the Intelligent section: they just launched a diagnostic terminal — the screen came alive with green phosphor glow and told them exactly what was wrong.

### Aesthetic Pillars
| Pillar | Storefront | Intelligent Terminal |
|---|---|---|
| **Palette** | Deep navy-charcoal + teal/green accents | Near-black + phosphor green |
| **Typography** | Inter/sans for reads, mono for data | JetBrains Mono exclusively |
| **Space** | Generous padding, white-space-led | Compact, data-dense |
| **Borders** | Subtle rounded (6–8px) | Thin borders, grid alignment, squared |
| **Motion** | Smooth 200–300ms, CSS transitions | Stagger animations feel like data loading |
| **Texture** | Flat, clean, card-shadow subtle | Scanlines, glow, pulsating indicators |

---

## 2. Storefront Color System

### Base Palette
```css
:root {
  /* Backgrounds */
  --store-bg:         #0B0E14;   /* Page background — deep midnight navy */
  --store-surface:    #13171F;   /* Card surface — slightly lighter */
  --store-elevated:   #1A1F2B;   /* Hover, expanded cards */
  --store-input-bg:   #0E1118;   /* Form input background */

  /* Primary — Teal-Green (not pure phosphor) */
  --accent:           #2DD4A8;   /* Primary CTA, links, active states */
  --accent-hover:     #5EEAD4;   /* Hover state */
  --accent-subtle:    rgba(45, 212, 168, 0.10); /* Faint green backgrounds */
  --accent-border:    rgba(45, 212, 168, 0.25);

  /* Secondary — Slate */
  --slate-400:        #94A3B8;   /* Secondary text, labels */
  --slate-500:        #64748B;   /* Muted labels */
  --slate-600:        #475569;   /* Low-emphasis */
  --slate-700:        #334155;   /* Borders, dividers */
  --slate-800:        #1E293B;   /* Elevated backgrounds */

  /* Semantic */
  --success:          #34D399;
  --warning:          #FBBF24;
  --error:            #F87171;

  /* Text */
  --text-primary:     #E2E8F0;
  --text-secondary:   #94A3B8;
  --text-muted:       #475569;

  /* Borders */
  --border-subtle:    rgba(148, 163, 184, 0.10);
  --border-default:   rgba(148, 163, 184, 0.16);
  --border-focus:     var(--accent-border);

  /* Font stacks */
  --font-body: 'Inter', 'DM Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 56px;
  --space-10: 80px;

  --grid-max: 1200px;
  --grid-gutter: 24px;
}
```

### Semantic Color Usage (Storefront)
| Use case | Token |
|---|---|
| Primary CTA | `--accent` text, `--accent-border` border |
| Card background | `--store-surface` with `--border-subtle` |
| Hover / elevated | `--store-elevated` |
| Input background | `--store-input-bg` with `--border-default` |
| Focus ring | `--border-focus` |
| Success state | `--success` |
| Warning state | `--warning` |
| Error state | `--error` |
| Metadata / labels | `--text-secondary` |

---

## 3. Intelligent Terminal Color System
Scoped exclusively to the `/technician/request` route and its descendants.

```css
.terminal-zone {
  --bg-void:           #080808;
  --bg-terminal:       #0C0C0C;
  --bg-surface:        #101010;
  --bg-elevated:       #161616;
  --bg-overlay:        rgba(0, 255, 65, 0.03);

  --green-bright:      #00FF41;
  --green-mid:         #00CC33;
  --green-dim:         #00882B;
  --green-ghost:       rgba(0, 255, 65, 0.08);

  --red-alert:         #FF3B3B;
  --amber-warn:        #FFB800;

  --text-primary:      #E8E8E8;
  --text-secondary:    #888888;
  --text-muted:        #444444;
  --text-green:        #00FF41;

  --border-dim:        rgba(255, 255, 255, 0.06);
  --border-mid:        rgba(255, 255, 255, 0.12);
  --border-green:      rgba(0, 255, 65, 0.25);
  --border-green-bright: rgba(0, 255, 65, 0.6);

  --scanline-opacity:  0.025;

  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-family: var(--font-mono);
}
```

### Terminal Scanline (scoped)
```css
.terminal-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, var(--scanline-opacity)) 2px,
    rgba(0, 0, 0, var(--scanline-opacity)) 4px
  );
  pointer-events: none;
  z-index: 1;
}
```

### Designer Notes: Terminal zone
- `.terminal-zone` is applied to the root element of `/technician/request` only
- All terminal child elements inherit from `.terminal-zone` custom properties
- No terminal styles escape this scope — the rest of the site uses storefront variables

---

## 4. Typography

### Storefront Font Stack
```
Primary:  Inter / DM Sans / system-ui / sans-serif
Mono:     JetBrains Mono / Fira Code / Cascadia Code / monospace
```

### Type Scale (Storefront)
| Token | Usage | Style |
|---|---|---|
| `.store-heading` | Page titles, card headers | 600 24px / var(--font-body) |
| `.store-subheading` | Section labels | 500 14px / var(--font-body); letter-spacing 0.06em; text-transform uppercase |
| `.store-body` | Long-form content | 400 15px / var(--font-body); line-height 1.7 |
| `.store-mono` | Prices, codes, data values | 500 14px / var(--font-mono) |
| `.store-label` | Metadata, timestamps | 400 12px / var(--font-mono); color var(--text-secondary) |

### Type Scale (Intelligent Terminal)
Identical to existing terminal system:
- `.type-heading`, `.type-sub`, `.type-mono`, `.type-body`, `.type-label`, `.type-code` all use `--font-mono`
- No sans-serif anywhere in the terminal zone

---

## 5. Layout

### Grid
```css
/* Shared */
--grid-max: 1200px;
--grid-gutter: 24px;

/* Storefront container */
.container {
  max-width: var(--grid-max);
  margin: 0 auto;
  padding: 0 var(--grid-gutter);
}
```

### Homepage Vertical Rhythm (Storefront)
```
[Header]         64px
[Hero spacer]    80px
[Product grid]   fluid
[Footer]         64px
```

---

## 6. Component Specifications

### 6.1 Navbar (Storefront)
```
Height: 56px
Background: var(--store-bg)
Border-bottom: 1px solid var(--border-subtle)
Logo: "KasiGSM" — "Kasi" in var(--accent), "GSM" in var(--text-primary), font-body 700
Nav links: var(--text-secondary) → var(--text-primary) on hover, font-body 14px
Sticky at top, z-50
No terminal styling
```

### 6.2 Storefront Card (replaces .ecom-card)
```css
.store-card {
  background: var(--store-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
}

.store-card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}
```

### 6.3 Product Card Helper Bar
Replace `.card-titlebar` with a subtle header — no dots.
```css
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-header .badge {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 4px;
  font: 500 10px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### 6.4 Buttons (Storefront)

#### Primary CTA
```css
.btn-primary {
  background: var(--accent);
  border: none;
  color: var(--store-bg);
  padding: 10px 20px;
  border-radius: 6px;
  font: 600 14px var(--font-body);
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  letter-spacing: 0;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

#### Secondary / Ghost Button
```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
  font: 500 13px var(--font-body);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.btn-secondary:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
}
```

#### Nav Logout Button
```css
.nav-logout {
  background: none;
  border: none;
  color: var(--text-secondary);
  font: 400 13px var(--font-body);
  cursor: pointer;
  transition: color 0.15s;
}

.nav-logout:hover {
  color: var(--text-primary);
}
```

### 6.5 Form Inputs (Storefront)
```css
.form-group label {
  font: 500 13px var(--font-body);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  display: block;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--store-input-bg);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  font: 400 14px var(--font-body);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}
```

### 6.6 Cart / Order / Wallet Tables (Storefront)
Shared table style:
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 13px var(--font-body);
  color: var(--text-secondary);
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table th {
  font: 500 11px var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.2);
}

.data-table .amount {
  color: var(--accent);
  font: 500 13px var(--font-mono);
}

.data-table .value {
  color: var(--text-primary);
}
```

### 6.7 Status Badges (Storefront)
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 4px;
  font: 500 11px var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  gap: 4px;
}

.badge-success  { background: rgba(52, 211, 153, 0.12); color: var(--success); }
.badge-warning  { background: rgba(251, 191, 36, 0.12); color: var(--warning); }
.badge-error    { background: rgba(248, 113, 113, 0.12); color: var(--error); }
.badge-info     { background: var(--accent-subtle); color: var(--accent); }
.badge-neutral  { background: rgba(148, 163, 184, 0.10); color: var(--text-secondary); }
```

### 6.8 Quantity Control (Storefront)
```css
.qty-control {
  display: inline-flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
}

.qty-control button {
  width: 32px;
  height: 32px;
  background: var(--store-elevated);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font: 500 14px var(--font-mono);
  transition: background 0.15s;
}

.qty-control button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.qty-control span {
  min-width: 36px;
  text-align: center;
  font: 500 13px var(--font-mono);
  color: var(--text-primary);
  background: var(--store-surface);
}
```

### 6.9 Checkout Bar (Storefront)
```css
.checkout-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  background: var(--store-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin-top: var(--space-5);
}

.checkout-bar .total-amount {
  font: 600 24px var(--font-mono);
  color: var(--text-primary);
}

.checkout-bar .actions {
  display: flex;
  gap: var(--space-3);
}
```

### 6.10 Auth Card (Storefront)
```css
.auth-card {
  background: var(--store-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: var(--space-7);
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.auth-card h1 {
  font: 600 22px var(--font-body);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  text-align: center;
}
```

---

## 7. Existing Terminal Components (Unchanged)

These components exist in CODE.css but are now scoped within `.terminal-zone`. DO NOT apply terminal styles outside this class.

- `.terminal-card` / `.terminal-titlebar` / `.terminal-dot` / `.terminal-title`
- `.btn-connect` / `.btn-connect.scanning`
- `.status-dot` / `.status-dot.connected`
- `.terminal-output` / `.terminal-line` / `.terminal-line .prompt` / `.terminal-line .output`
- `.terminal-cursor` / `@keyframes cursor-blink`
- `.device-profile` / `.device-brand-logo` / `.device-model` / `.device-meta`
- `.issue-card` / `.badge-severity`
- `.tool-card` / `.tool-price` / `.tool-locked-steps` / `.tool-card.purchased`
- `@keyframes status-pulse` / `@keyframes border-pulse` / `@keyframes shimmer`
- `.skeleton`

Terminal values (reenforced in `.terminal-zone`):
```css
.terminal-zone {
  --bg-void: #080808;
  --bg-terminal: #0C0C0C;
  --bg-surface: #101010;
  --bg-elevated: #161616;
  --green-bright: #00FF41;
  --green-mid: #00CC33;
  --green-dim: #00882B;
  --red-alert: #FF3B3B;
  --amber-warn: #FFB800;
  --text-primary: #E8E8E8;
  --text-secondary: #888888;
  --text-muted: #444444;
  --text-green: #00FF41;
  --border-dim: rgba(255,255,255,0.06);
  --border-mid: rgba(255,255,255,0.12);
  --border-green: rgba(0,255,65,0.25);
  --border-green-bright: rgba(0,255,65,0.6);
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-family: var(--font-mono);
  background: var(--bg-void);
  color: var(--text-primary);
}
```

---

## 8. Responsive Breakpoints (Unchanged)
```css
--bp-sm:  480px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
```

### Mobile Adjustments
- Storefront cards collapse to **stacked layout** on < 768px
- Nav collapses gracefully
- Forms stretch full-width
- Data tables → card-style stacked rows

---

## 9. Migration Rules (Storefront from .ecom-card)

| Old `.ecom-card` class | New class | Notes |
|---|---|---|
| `.ecom-card` | `.store-card` | Renamed, updated borders/radius |
| `.card-titlebar` | `.card-header` | Removed `.dots` — replaced with `.badge` |
| `.card-titlebar .dot` | *removed* | macOS dots gone |
| `.card-titlebar .dot.active` | *removed* | macOS dots gone |
| `.thumb-wrap` | `.card-thumb` | Same functionality |
| `.type-badge` | `.badge` | Renamed |
| `.card-body` | `.card-body` | Unchanged |
| `.price` (catalog) | `.card-price` | Unchanged |
| `.stock.in` / `.stock.out` | `.stock-in` / `.stock-out` | Renamed for consistency |
| `.btn-primary` | `.btn-primary` | Updated color tokens (accent) |
| `.form-group input` | `.form-group input` | Updated color tokens |
| `.provider-table` | `.data-table` | Updated color tokens |
| `.wallet-status-card` | `.wallet-status-card` | Updated color tokens |
| `.wallet-tx-table` | `.data-table` | Updated color tokens |
| `.order-ticket` | `.store-card` | Same class |
| `.credentials-block` | `.credential-block` | Updated color tokens |
| `.qty-ctrl` | `.qty-control` | Updated color tokens |

---

## 10. Iconography

### Storefront
Lucide React icons for:
| Element | Icon | Size |
|---|---|---|
| Cart | `ShoppingBag` | 18px |
| Orders | `ClipboardList` | 16px |
| Wallet | `Wallet` | 16px |
| Technician / Intelligence | `Microscope` | 16px |
| Search | `Search` | 16px |
| Filter | `SlidersHorizontal` | 16px |
| Remove | `Trash2` | 14px |
| Success check | `CheckCircle` | 14px |
| Warning triangle | `AlertTriangle` | 14px |
| Error circle | `XCircle` | 14px |
| Arrow left (back) | `ArrowLeft` | 16px |
| External link | `ExternalLink` | 14px |

### Intelligent Terminal (Unchanged)
Existing terminal iconography preserved: `Usb`, `Plug`, `CheckCircle`, `Loader2`, `AlertCircle`, `Lock`, `Cloud`, `Wifi`, `Terminal`, `Hash`, `Unlock`, `Zap`, `ShoppingCart`, `Copy`, `ExternalLink`.

All icons: `strokeWidth={1.5}`.

---

## 11. What NOT to Do

| Avoid | Why |
|---|---|
| Purple gradients anywhere | Generic AI-tool aesthetic |
| Light backgrounds anywhere except modals | Breaks dark storefront identity |
| Sans-serif mixed into terminal zone | Destroys phosphor terminal identity |
| Drop shadows on terminal elements | Use border glow instead, per existing spec |
| Emoji in UI (except UI-provided icons) | Use Lucide icons |
| Blue as primary accent | Already overused — teal-green is distinctive and on-brand for "GSM" |
| `.ecom-card` classes for new pages | Use `.store-card` |
| Rounded pill buttons (storefront) | Capsule pills are friendly but cheap — use standard 6px radius |
| Green/black outside terminal zone | Break the split-identity rule |
| Terminal styling on auth pages | Auth is the gate — keep it clean and store-like |

---

*This document supersedes the prior single-aesthetic DESIGN.md. The Intelligent Terminal is now an isolated, opt-in zone within the broader modern storefront.*
