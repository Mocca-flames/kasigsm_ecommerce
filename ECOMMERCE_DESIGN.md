# ECOMMERCE_DESIGN.md — E-Commerce Card System (Terminal Aesthetic)
> **Audience:** Technicians buying tools, services, and digital products.
> **Aesthetic:** Diagnostic Terminal — inherited from DESIGN.md.

---

## 1. Design Intent

Technicians are power users. The catalog must feel like an **inventory terminal** — fast to scan, data-dense, no fluff. Cards are "desks" in a parts store: instant recognition of SKU (slug/uid), price, stock, and type.

### Core Principles
- **Scannability first.** Price, type, and stock must be visible in a 200px card at a glance.
- **Green = go.** Price and availability use `--text-green` and `--green-bright`; out-of-stock flips to `--text-muted`.
- **Sharp corners.** The e-commerce surface is `border-radius: 6px` (softer than panels, harder than buttons) to separate it from the diagnostic tool UI.
- **No emoji / no shadow.** Terminal scanlines and borders only.

---

## 2. Card Anatomy

```
┌────────────────────────────────────┐
│ IMAGE / THUMBNAIL    [TYPE BADGE] │
│                                    │
│ TITLE                              │
│ DESCRIPTION (2-line clamp)         │
│ ─────────────────────────────────  │
│ PRICE          DELIVERY   STOCK    │
│ R 450.00      30 min     12 left   │
└────────────────────────────────────┘
```

| Zone | Token | Notes |
|------|-------|-------|
| Card surface | `--bg-surface` | `#111111` |
| Border | `--border-dim` | `rgba(255,255,255,0.06)` |
| Border hover | `--border-green` | `rgba(0,255,65,0.25)` |
| Type badge bg | ` rgba(0,255,65,0.08)` | pill, 10px text |
| Title | `--text-primary` mono 14px/500 | |
| Description | `--text-secondary` mono 13px | `-webkit-line-clamp: 2` |
| Price | `--green-bright` mono 20px/600 | |
| Delivery / meta | `--text-secondary` mono 12px | |
| Stock in/out | `--green-mid` / `--text-muted` | |

---

## 3. E-Commerce Terminals

To make the catalog feel "inside" the same system as the diagnostic tool, every product card is conceptually a **Terminal Window**.

### 3.1 Terminal Window Frame (Card Titlebar)
```
┌── color dots ── [ item slug / SKU ] ─┐
^
```
```css
.card-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-dim);
}
.card-titlebar .dots {
  display: flex;
  gap: 4px;
}
.card-titlebar .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green-dim);
}
.card-titlebar .dot.active { background: var(--green-bright); }
.card-titlebar .slug {
  font: 400 11px var(--font-mono);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}
```

### 3.2 Item Card (Catalog Grid)
```css
.ecom-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-dim);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ecom-card:hover {
  border-color: var(--border-green);
  box-shadow: 0 0 16px rgba(0,255,65,0.06);
}
.ecom-card .thumb-wrap {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.ecom-card .thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ecom-card .type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(0,255,65,0.08);
  color: var(--green-mid);
  font: 500 10px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ecom-card .card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  flex: 1;
}
.ecom-card .card-body h3 {
  font: 500 14px var(--font-mono);
  color: var(--text-primary);
  line-height: 1.3;
}
.ecom-card .desc {
  font: 400 12px var(--font-mono);
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-line-orient: vertical;
  overflow: hidden;
}
.ecom-card .meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border-dim);
}
.ecom-card .price {
  font: 600 18px var(--font-mono);
  color: var(--green-bright);
}
.ecom-card .meta {
  display: flex;
  gap: 12px;
  font: 400 11px var(--font-mono);
  color: var(--text-secondary);
}
.ecom-card .stock.in  { color: var(--green-mid); }
.ecom-card .stock.out { color: var(--text-muted); }
```

### 3.3 Grid Layout (Catalog)
```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
```
On `--bp-sm` (≤ 480px): `repeat(auto-fill, minmax(160px, 1fr))` — 2-up mobile.

---

## 4. Detail Page — Single Product Terminal

### 4.1 Layout
```
┌───────────────────────────────────────┐
│ THUMBNAIL (left)  │  DETAIL (right)   │
│                    │  Title             │
│                    │  desc              │
│                    │  PRICE             │
│                    │  type | cat | stock │
│                    │  qty  [ADD TO CART]│
│ ─── provider listings ──────────────── │
│ PROVIDER          COST   PREF          │
│ Telkom-SA         280.00 ✓            │
│ Vodacom           295.00                │
└───────────────────────────────────────┘
```

```css
.detail-terminal {
  background: var(--bg-surface);
  border: 1px solid var(--border-mid);
  border-radius: 6px;
  overflow: hidden;
}
.detail-inner {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
}
@media (max-width: 768px) {
  .detail-inner { grid-template-columns: 1fr; }
}
.detail-img {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-right: 1px solid var(--border-dim);
}
.detail-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-content h1 {
  font: 600 20px var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.detail-content .description {
  font: 400 13px var(--font-mono);
  color: var(--text-secondary);
  line-height: 1.6;
}
.detail-price {
  font: 600 28px var(--font-mono);
  color: var(--green-bright);
}
.detail-meta {
  display: flex;
  gap: 16px;
  font: 400 12px var(--font-mono);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-meta .val {
  color: var(--text-green);
}
```

### 4.2 Provider Listings Table
```css
.provider-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 12px var(--font-mono);
  color: var(--text-secondary);
  margin-top: 8px;
  border-top: 1px solid var(--border-dim);
}
.provider-table th,
.provider-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-dim);
}
.provider-table th {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: rgba(0,0,0,0.2);
}
.provider-table td .preferred {
  color: var(--green-mid);
  font-weight: 500;
}
```

---

## 5. Cart — Inventory Review

### 5.1 Cart Table (List Layout)
```css
.cart-table {
  width: 100%;
  border-collapse: collapse;
}
.cart-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border-dim);
  vertical-align: middle;
}
.cart-table td.item-title {
  font: 500 13px var(--font-mono);
  color: var(--text-primary);
}
.cart-table td.item-price {
  font: 400 13px var(--font-mono);
  color: var(--text-green);
}
.cart-table .qty-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.cart-table .qty-ctrl button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-dim);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
  font: 500 14px var(--font-mono);
  line-height: 1;
}
.cart-table .qty-ctrl button:hover {
  border-color: var(--border-green);
  background: var(--bg-overlay);
}
.cart-table .qty-ctrl span {
  min-width: 24px;
  text-align: center;
  font: 400 13px var(--font-mono);
  color: var(--text-green);
}
.cart-table .btn-remove {
  background: none;
  border: none;
  color: var(--red-alert);
  cursor: pointer;
  font: 400 11px var(--font-mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cart-table .btn-remove:hover {
  color: var(--text-primary);
}
```

### 5.2 Cart Summary (Side Panel or Bottom)
```css
.cart-totals {
  margin-top: 24px;
  max-width: 320px;
  margin-left: auto;
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-mid);
  border-radius: 6px;
}
.cart-totals .line {
  display: flex;
  justify-content: space-between;
  font: 400 13px var(--font-mono);
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.cart-totals .line.total {
  font: 600 18px var(--font-mono);
  color: var(--text-primary);
  border-top: 1px solid var(--border-dim);
  padding-top: 10px;
  margin-top: 10px;
}
.cart-totals .discount-line {
  color: var(--green-mid);
}
.btn-checkout {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border-green-bright);
  color: var(--green-bright);
  font: 500 14px var(--font-mono);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-checkout:hover {
  background: var(--green-ghost);
  box-shadow: 0 0 16px rgba(0,255,65,0.12);
}
.btn-checkout:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## 6. Orders — Receipt / Job Ticket

### 6.1 Order Card
```css
.order-ticket {
  background: var(--bg-surface);
  border: 1px solid var(--border-dim);
  border-radius: 6px;
  overflow: hidden;
}
.order-ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-dim);
}
.order-ticket-header .id {
  font: 500 13px var(--font-mono);
  color: var(--text-primary);
}
.order-ticket-header .status {
  font: 500 10px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 3px;
}
.status-pending   { background: rgba(255,184,0,0.12); color: var(--amber-warn); }
.status-paid      { background: rgba(0,204,51,0.12);  color: var(--green-mid); }
.status-fulfilled { background: rgba(0,255,65,0.08);  color: var(--green-bright); }
.status-cancelled { background: rgba(255,59,59,0.12); color: var(--red-alert); }
.status-refunded  { background: rgba(255,59,59,0.08); color: var(--red-alert); }

.order-ticket-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-meta-line {
  display: flex;
  justify-content: space-between;
  font: 400 12px var(--font-mono);
  color: var(--text-secondary);
}
.order-meta-line .val {
  color: var(--text-primary);
}
.order-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 10px;
  background: var(--bg-elevated);
  border-radius: 4px;
  font: 400 12px var(--font-mono);
  color: var(--text-secondary);
}
.order-item .name { color: var(--text-primary); }
.order-item .amt  { color: var(--text-green); }

/* Credentials block (PAID orders) */
.credentials-block {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(0,255,65,0.15);
  border-radius: 4px;
  background: rgba(0,255,65,0.03);
}
.credentials-block h4 {
  font: 500 11px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green-mid);
  margin-bottom: 8px;
}
.credentials-block pre {
  font: 400 12px var(--font-mono);
  color: var(--text-green);
  white-space: pre-wrap;
  word-break: break-all;
}
```

### 6.2 Empty State / List Container
```css
.orders-container { display: flex; flex-direction: column; gap: 12px; }
```

---

## 7. Promo Code — Coupon Validation
```css
.promo-bar {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dim);
  border-radius: 6px;
}
.promo-bar input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  font: 400 13px var(--font-mono);
  color: var(--text-primary);
  outline: none;
}
.promo-bar input:focus {
  border-color: var(--border-green);
}
.promo-bar button {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-green-bright);
  color: var(--green-bright);
  font: 500 12px var(--font-mono);
  border-radius: 4px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.promo-bar button:hover {
  background: var(--green-ghost);
}
.promo-msg {
  margin-top: 8px;
  font: 400 12px var(--font-mono);
}
.promo-msg.valid   { color: var(--green-mid); }
.promo-msg.invalid { color: var(--red-alert); }
```

---

## 8. Wallet — Terminal Account View
```css
.wallet-panel {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
}
@media (max-width: 768px) {
  .wallet-panel { grid-template-columns: 1fr; }
}
.wallet-status-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-mid);
  border-radius: 6px;
  padding: 20px;
}
.wallet-status-card .lbl {
  font: 400 11px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.wallet-status-card .balance {
  font: 600 32px var(--font-mono);
  color: var(--text-green);
  margin: 8px 0 16px;
}
.wallet-status-card .low a {
  color: var(--amber-warn);
}
.wallet-tx-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 13px var(--font-mono);
}
.wallet-tx-table th,
.wallet-tx-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-dim);
  color: var(--text-secondary);
}
.wallet-tx-table th {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: rgba(0,0,0,0.2);
}
.wallet-tx-table .credit { color: var(--green-mid); }
.wallet-tx-table .debit  { color: var(--red-alert); }
```

---

## 9. Buttons (E-Commerce Specific)

These supplements exist in DESIGN.md; for e-commerce use the following consistent set:

| Button | Style |
|--------|-------|
| `btn-primary` | `--green-bright` text on transparent, `--border-green-bright` border |
| `btn-secondary` | `--text-secondary` text, `--border-dim` border |
| `btn-danger` | `--red-alert` text, hover `rgba(255,59,59,0.1)` background |
| `btn-checkout` | same as primary, full-width, larger pad |

All: `border-radius: 4px`, `font: 500 14px var(--font-mono)`, `transition: background 0.15s`.

---

## 10. Responsive Behavior

| Breakpoint | Cards | Detail |
|-----------|-------|--------|
| ≥ 1024px | 3–4 columns | 2-column (img | detail) |
| 768–1023 | 2–3 columns | 2-column |
| < 768 | 2 columns | 1-column, images top |
| < 480 | 1–2 columns, smaller thumb | 1-column full-width |

---

## 11. Implementation Checklist
- [ ] Replace `App.css` root tokens with DESIGN.md terminal tokens.
- [ ] Add all `.ecom-*` classes above.
- [ ] Update `ItemsPage` card to use titlebar + badge layout.
- [ ] Update `ItemDetailPage` to terminal detail layout + provider table.
- [ ] Update `CartPage` to table layout + promo bar.
- [ ] Update `OrdersPage` to ticket layout + credential block.
- [ ] Ensure all `<img>` items prefix with `/media/` before `src`.
- [ ] Verify `item.thumbnail` vs `item.media_url` mapping (API: both fields present in detail, thumbnail on list).
