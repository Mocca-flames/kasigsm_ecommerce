# PLAN.md — Client Application Master Plan

## Current State
- React 19 + Vite 8 + React Router 7
- Existing pages: ItemsPage, ItemDetailPage, LoginPage, RegisterPage, CartPage, OrdersPage
- API service (`src/services/api.js`) covers ~7 of 25 endpoints from ENDPOINTS.md
- Auth via localStorage JWT, minimal error handling
- Design system: "Diagnostic Terminal" aesthetic (cyber green-on-black, monospace, Lucide icons)

## Missing Capabilities from ENDPOINTS.md

### Auth (2 endpoints)
- `POST /auth/verify-otp` — email verification
- `POST /auth/resend-otp` — resend OTP

### Public Catalog (3 endpoints)
- `POST /search/validate` — advanced search validation
- `GET /banners` — active banners for hero/carousels
- `GET /media/{path}` — static file serving (handled by browser, but URLs need construction)

### Payments (2 endpoints)
- `POST /payments/verify` — webhook/callback verification
- `GET /payments/verify/{reference}` — browser redirect callback

### Wallet (4 endpoints)
- `GET /wallet/me` — wallet balance/status
- `POST /wallet/top-up` — request admin top-up
- `GET /wallet/transactions` — transaction history
- `POST /wallet/pay` — pay order with wallet balance

### Promo Codes (2 endpoints)
- `POST /promo-codes/validate` — validate code
- `POST /promo-codes/apply` — cart preview with discount

### Technician (1 endpoint)
- `POST /technician/technicians/request` — role upgrade request

## Architecture Decisions

1. **API Layer**: Expand `src/services/api.js` with all missing methods. Keep flat structure (no React Query yet).
2. **State Management**: Continue with React Context for auth. Add a simple CartContext if not already present (CartPage exists, needs verification).
3. **UI Components**: Build feature pages as standalone routes. Use existing router.
4. **Styling**: Follow DESIGN.md terminal aesthetic. No Tailwind (current codebase uses plain CSS modules / App.css).
5. **Error Handling**: Extend `handleResponse` to parse 429/403/400 consistently. Add toast/terminal-style notification pattern.

## Risk Areas
- Ngrok proxy rewrite rule: current `rewrite: path => path.replace(/^\/_?api/, '')` — verify it strips `/api` prefix correctly for all new routes.
- Order item `credentials` are encrypted server-side and only decrypted on `GET /orders/{id}` when PAID — OrderDetailPage needs to handle null vs populated credentials.

## Success Criteria
- All endpoints from ENDPOINTS.md have corresponding API methods.
- All user-facing flows have dedicated routes: `/login`, `/register`, `/verify-otp`, `/items`, `/items/:slug`, `/cart`, `/orders`, `/orders/:id`, `/wallet`, `/wallet/transactions`, `/technician/request`.
- Cart works end-to-end with promo code preview and wallet/wallet-less checkout.
