# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**RIDEON FOTO DEPORTIVA** is a dynamic sports-photography commerce platform (Argentina, content in Spanish): athletes search their event by bib number ("dorsal"), browse a watermarked preview gallery, buy the photos they want via Mercado Pago, and get a time-limited download link by email once payment is approved. It is no longer a static brochure site — it's a premium HTML/Tailwind frontend backed by a real Node.js/Express API with PostgreSQL, S3-compatible object storage, and a photographer-only admin dashboard.

## Architecture

**Frontend — repository root.** Plain HTML pages (`index.html`, `galeria.html`, `nosotros.html`, `contacto.html`, `dashboard.html`), still hand-authored with no JS framework or templating language, but no longer static content. `galeria.html` (renamed from `coberturas.html`) is the sales-critical page: dorsal search, results grid, lightbox, cart. `nosotros.html` covers both the "about us" copy and the static portfolio grid (merged from the now-removed `mejoresfotos.html`) since neither needs a purchase flow.
- `components/layout.js` renders the shared header/nav and footer into two empty slots (`<header id="site-header">`, `<footer id="site-footer">`) that every page declares, and fires a `layout:ready` custom event once injected. **This is the single source of truth for nav links and footer content — never copy/paste header or footer markup into a page again.** Each `<body>` sets `data-page="..."` so `layout.js` knows which nav link to highlight.
- `js/cart.js` owns the floating cart drawer (`window.RideonCart`), persists it to `localStorage`, and drives the Mercado Pago checkout handoff (`POST /api/ordenes` → redirect to the returned `checkoutUrl`). It waits for `layout:ready` before wiring the cart button in the injected header.
- Inline `<script>` blocks per page talk directly to the API (`/api/eventos`, `/api/fotos/buscar`, `/api/contacto`) — there are no shared JS modules for page-specific logic, only `layout.js`/`cart.js`.
- `css/tailwind.css` is a **compiled, checked-in build output** (Tailwind CLI v4, source at `src/input.css`, config at `tailwind.config.js`). Brand colors, the brand font, and animation keyframes are defined as `@theme` tokens in `src/input.css`; custom utilities (`.masonry` for the Pinterest-style CSS multi-column grid, `.watermark-diagonal` for the CSS-only diagonal watermark overlay, `.scrollbar-none`) live there too, under `@layer utilities`.

**Backend — `/server`.** A layered Express API, independent `package.json`/`node_modules`:
- `src/config/` — env loading (`env.js`, throws on missing required vars), Sequelize/DB, S3, Mercado Pago, mailer config.
- `src/models/` — Sequelize models: `Usuario`, `Evento`, `Foto`, `Orden`, `OrdenItem`, `DescargaToken`, `Configuracion`, `Mensaje`.
- `src/migrations/` + `src/seeders/` — schema and seed data (default admin user, default configuraciones), run via `sequelize-cli`.
- `src/controllers/`, `src/routes/` — one pair per resource (`auth`, `eventos`, `fotos`, `ordenes`, `pagos`, `descargas`, `contacto`, `configuraciones`).
- `src/middlewares/` — `auth.middleware.js` (`protegerRuta` validates the JWT bearer token, `requerirRol` gate for admin-only actions), `upload.middleware.js` (multer), `error.middleware.js`.
- `src/services/` — business logic: `watermark.service.js` (sharp, burns the watermark into preview images at upload time), `storage.service.js` (S3: private bucket for originals, public bucket/CDN for previews), `mercadopago.service.js` (preference creation + webhook signature validation), `descarga.service.js` (issues/resolves single-use, expiring download tokens), `email.service.js` (nodemailer), `auth.service.js`.
- Persistence is PostgreSQL via Sequelize. File storage is S3-compatible (works with AWS S3, Cloudflare R2, Backblaze B2, etc. — see `server/.env.example`).

## Running / developing

**Frontend (Tailwind CLI build)**, from the repository root:
```bash
npm run build:css   # one-shot minified build -> css/tailwind.css
npm run watch:css    # rebuild on change, for active frontend work
```
There is no dev server for the frontend alone — the pages call `/api/*` endpoints (event dropdowns, photo search, cart checkout, contact form), so for the site to actually work you need the backend running (see below); it serves both the API and the whitelisted static files on the same port. `npm run serve` (`npx serve .`) still exists in the root `package.json` but only renders pages with dead API calls — don't recommend it as "the way to preview the site."

**Backend**, from `server/`:
```bash
npm install
npm run db:migrate   # apply migrations
npm run db:seed      # seed default admin user + configuraciones
npm start             # node src/server.js
npm run dev           # nodemon src/server.js, for active backend work
```
Needs a populated `server/.env` (see `server/.env.example` for every required variable: DB connection, `JWT_SECRET`, S3 credentials, Mercado Pago tokens, SMTP). `src/config/env.js` throws immediately on startup if a required variable is missing — that's intentional fail-fast behavior, not a bug to "fix" with a fallback.

Once the backend is running (default `http://localhost:4000`), it serves the frontend pages too — that's the way to preview the full, working site.

## API surface (selected)

- `GET /api/eventos?activo=true` — public, populates the competition dropdown on `index.html`/`galeria.html`.
- `GET /api/fotos/buscar?eventoId=&dorsal=` — public, the actual photo search used by `galeria.html`. There is no client-side/hardcoded photo data anywhere; every gallery result comes from this endpoint.
- `POST /api/fotos/upload`, `DELETE /api/fotos/:id`, `POST/PUT/DELETE /api/eventos*`, `PUT /api/configuraciones/*` — photographer-only, require `Authorization: Bearer <JWT>` (`protegerRuta`, some also `requerirRol('admin')`).
- `POST /api/ordenes` — public, creates an order from cart `fotoIds` and returns a Mercado Pago `checkoutUrl`. Prices are always re-read from the DB server-side; the client-submitted cart is never trusted for pricing.
- `POST /api/pagos/webhook` — Mercado Pago webhook; validates the signature, marks the order approved/rejected, and on approval issues a download token and emails it.
- `GET /api/descargas/:token` — public but token-gated; resolves a single-use, time-limited download link (`DOWNLOAD_TOKEN_EXPIRATION_HOURS`) to the paid originals.
- `POST /api/auth/login` — issues the JWT used by `dashboard.html`.

## Static file serving is an explicit whitelist — do not widen it

`server/src/app.js` serves the frontend via a hardcoded whitelist: the 5 `.html` files by name (`res.sendFile`) plus exactly `css/`, `js/`, `components/`, `img/`, `img iconos/`, `img logos/` (`express.static` per folder), all resolved from the repo root via `path.join(__dirname, '..', '..')`. **Never replace this with `express.static(repoRoot)`** — the repo root also contains `server/` (source code, models, migrations, `package.json`), and serving the whole tree makes all of that downloadable by anyone. If a new public asset folder is added, add it explicitly to the `CARPETAS_PUBLICAS` list in `app.js`, don't broaden the mount.

## Repo / secrets hygiene

- Git is scoped to this project folder (`radeon/`), not the user's home directory — keep it that way.
- `.env` (root and `server/.env`) and `node_modules/` are gitignored at both the root `.gitignore` and `server/.gitignore`. Never commit real credentials; `server/.env.example` documents every variable with placeholder values only.

## Styling conventions

- Tailwind is compiled via the **Tailwind CLI** (`@tailwindcss/cli`), not the browser/Play CDN. If you see a `<script src="...tailwindcss/browser...">` tag anywhere, it's a leftover from the pre-migration static-site era and should be removed, not treated as how styling works now — editing `css/tailwind.css` directly is also wrong, it's a build artifact regenerated by `npm run build:css`/`watch:css`.
- Brand tokens are defined once in `src/input.css` under `@theme` (`--color-brand-red: #8C0303`, `--color-brand-red-dark`, `--color-brand-yellow: #F2B705`, `--color-brand-light: #F2F2F2`, `--font-brand: 'Bahnschrift', sans-serif`) and consumed as Tailwind classes (`bg-brand-red`, `text-brand-yellow`, `font-brand`, etc.) — prefer these over hand-rolled arbitrary-value classes like `bg-[#8C0303]` now that the token exists (older/admin markup such as `dashboard.html` still uses the raw arbitrary-value form in places; matching the surrounding file's existing pattern is fine, don't mass-migrate it unasked).
- `.masonry` (CSS multi-column gallery grid) and `.watermark-diagonal` (CSS-only diagonal watermark via `::after` + `data-watermark="..."` attribute) are custom utilities defined in `src/input.css`, not Tailwind built-ins — reuse them for any new photo grid/preview instead of reinventing.
- Folder names contain spaces (`img iconos/`, `img logos/`); follow the existing convention of unencoded spaces in `src=`/mount paths rather than `%20`.
- Mobile-first breakpoints throughout: unprefixed classes are the mobile layout, `sm:`/`md:`/`lg:` progressively adjust for wider screens — match that pattern rather than designing desktop-first.

## Guardrails for Claude Code

- Don't reintroduce the Tailwind CDN `<script>` tag or suggest editing `css/tailwind.css` by hand — this project builds Tailwind via the CLI now.
- Don't hand-duplicate header/nav/footer markup into a page — that's `components/layout.js`'s job; edit it once there.
- Don't hardcode or stub photo results — search results always come from `GET /api/fotos/buscar`.
- Don't widen the static file whitelist in `server/src/app.js` back to serving the whole repo root; extend the explicit list instead.
- Treat any route that creates/deletes/uploads/edits business data as needing `protegerRuta` (and `requerirRol('admin')` where applicable) — check `server/src/middlewares/auth.middleware.js` and the existing routes for the pattern before adding a new mutating endpoint.
- Never commit `.env`, hardcode secrets, or weaken `.gitignore`'s `.env`/`node_modules/` entries.
