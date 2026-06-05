# PHASES.md — Implementation Phases

## Phase 1: Foundation & Auth Completion (P0)
**Goal:** Stable auth flow + complete API surface.

1.1 Expand `src/services/api.js`
- Add `verifyOtp(email, code)`
- Add `resendOtp(email)`
- Add `searchValidate(q, category, serviceType, location, itemIds)`
- Add `getBanners()`
- Add `verifyPayment(reference)` (POST)
- Add `verifyPaymentGet(reference)` (GET)
- Add `getWallet()`
- Add `requestTopUp(amount, reference, proofNote)`
- Add `getWalletTransactions()`
- Add `payWithWallet(orderId)`
- Add `validatePromoCode(code, orderAmount)`
- Add `applyPromoCode(code)`
- Add `requestTechnicianRole(specialization)`

1.2 Auth Context & Routing
- Add `VerifyOtpPage` + route `/verify-otp`
- Update `AuthContext` to expose `user` fields beyond email if needed (id, role)
- Add protected route wrapper `RequireAuth`

1.3 Refresh `api.js` error response handling
- Map 429 → "Rate limit exceeded. Please try again later."
- Map 400 promo errors → pass through detail string

---

## Phase 2: Public Catalog & Navigation (P1)
**Goal:** Full catalog experience with banners and search.

2.1 Banners
- Fetch on app load via `getBanners()` and store in Context or simple state
- Add banner carousel/section to `ItemsPage` (homepage)

2.2 Search
- Extend `ItemsPage` with search bar using `searchValidate`
- Add category filter + location filter UI

2.3 Media URLs
- Ensure all item/banner image paths are prefixed with `/media/` when rendering `<img>` tags

2.4 Item Detail Enhancements
- Show provider listings table
- Add "Add to Cart" CTA with quantity selector (CartPage exists, verify implementation)

---

## Phase 3: Cart & Checkout (P1)
**Goal:** Working cart → order flow with promo codes and multiple payment options.

3.1 Cart Context/State
- Verify `CartPage` uses localStorage or context
- Ensure quantity updates, removals, and subtotal computation are correct

3.2 Promo Code Integration
- Add promo input in `CartPage`
- Call `validatePromoCode` on blur, `applyPromoCode` on apply
- Display discount breakdown and final total

3.3 Order Creation
- `createOrder` sends `{ items, promo_code }` — ensure this matches API contract
- Show loading/error states in terminal-style output

3.4 Order Detail / Credentials View
- `OrdersPage` list links to `/orders/:id`
- `OrderDetailPage` shows PAID credential payloads (if any)

---

## Phase 4: Payments & Wallet (P2)
**Goal:** Wallet balance flow + Paystack integration.

4.1 Wallet Pages
- `GET /wallet/me` → show in `/wallet` (or sidebar nav link)
- Show balance, status, low-balance indicator per ENDPOINTS.md

4.2 Top-Up Request
- Form in Wallet page: amount input with MIN/MAX/STEP validation
- Call `requestTopUp`, show PENDING status

4.3 Wallet Transactions
- `GET /wallet/transactions` → table in Wallet page, newest first

4.4 Pay with Wallet
- In `OrderDetailPage` (or CartPage), add "Pay with Wallet" button for PENDING orders
- Calls `payWithWallet`, redirects to Orders on success

4.5 Paystack Callback
- Ensure `Paystack` return_url points to a new `/payment/success?reference=` route or handles via verify endpoints

---

## Phase 5: Technician Request (P3)
**Goal:** User-initiated role upgrade.

5.1 Page & Route
- `TechnicianRequestPage` at `/technician/request`
- Form: specialization (optional)
- Show PENDING status / success message per API response

5.2 Guardrails
- Hide link if user is already ADMIN/TECHNICIAN
- "Admins cannot request technician access" → handled server-side, but UX can disable button

---

## Phase 6: Polish & Hardening (P3)
**Goal:** Production readiness.

6.1 Loading / Error UX
- Standardize loading spinners (terminal-style progress lines per DESIGN.md)
- Global error boundary + terminal-styled error view

6.2 Form Validation
- Client-side validation mirroring server constraints (wallet amount step/min/max, promo code length, etc.)

6.3 Route Guards
- `RequireAuth` wrapper for: `/cart`, `/orders`, `/orders/:id`, `/wallet`, `/wallet/transactions`, `/technician/request`

6.4 Mobile Responsive
- Test all new pages against design breakpoints (sm/md/lg)

---

## Execution Order Summary
| Phase | Priority | Depends On |
|-------|----------|------------|
| 1 — Foundation | P0 | None |
| 2 — Catalog | P1 | Phase 1 |
| 3 — Cart/Checkout | P1 | Phase 1 |
| 4 — Wallet/Payments | P2 | Phase 1, Phase 3 |
| 5 — Technician | P3 | Phase 1 |
| 6 — Polish | P3 | All prior |
