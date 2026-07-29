# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ShipTrack: a sea-freight LCL shipment tracking app (China → Jordan). React/Vite SPA + Express/MySQL API, bilingual Arabic (RTL, default) / English (LTR).

## Commands

```bash
# Backend (from backend/)
npm install
npm run dev          # nodemon server.js — http://localhost:5000
npm start             # node server.js (production)

# Frontend (from frontend/)
npm install
npm run dev           # vite — http://localhost:5173, proxies /api and /uploads to :5000 (see vite.config.js)
npm run build          # outputs frontend/dist/
npm run preview        # serve the built dist/ locally

# Database
mysql -u root -p < database/schema.sql   # creates tables + seeds one admin user
```

There are no lint or test scripts configured in this repo (root, frontend, or backend `package.json`).

## Deployment architecture (important — not obvious from the code alone)

The app currently runs as **three independently-deployed pieces**, not the single-server/Docker setup described in `README.md`'s "Quick Start":

1. **Backend** — deployed to **Render** as a web service. `render.yaml` at the repo root defines it (`rootDir: backend`, `npm install` / `npm start`). Render sits behind a reverse proxy, so `server.js` sets `app.set('trust proxy', 1)` — without it, `express-rate-limit` throws on every request and login/API calls 500.
2. **Frontend** — built locally (`npm run build` in `frontend/`) and the resulting `frontend/dist/` is **manually uploaded** to Hostinger's `public_html` (no CI, no git-based deploy on that side). After any frontend change, remember to rebuild and re-upload — pushing to GitHub alone does not update the live Hostinger site.
3. **Database** — MySQL hosted on Hostinger (shared hosting), accessed *remotely* by Render via `DB_HOST` (Hostinger's actual DB server hostname, e.g. `srv###.hstgr.io` — never `localhost`, since the API no longer runs on the same machine as the DB). Hostinger's **Remote MySQL** allow-list must include Render's traffic (`%`, since Render's free tier has no static IP).

Because frontend and backend are on different origins, `frontend/src/utils/api.js` builds its Axios `baseURL` from `import.meta.env.VITE_API_URL` (set in `frontend/.env.production`, currently the Render URL). The same file exports `resolveUploadUrl()`, used everywhere shipment images or QR codes are rendered (`TrackingPage.jsx`, `AdminShipmentDetail.jsx`), to turn the API's relative `/uploads/...` paths into absolute URLs against the backend origin — a plain `<img src="/uploads/...">` would otherwise resolve against the frontend's own domain and 404.

`server.js` still serves `backend/public/` as a static fallback and has a catch-all that returns `index.html` — this is a leftover from an earlier single-origin deployment and is not part of the current live topology (nobody reaches the backend's own root URL in normal use). Don't assume it's what's actually serving the frontend.

**`backend/uploads/` is not persistent on Render's free tier** — the filesystem is ephemeral and wiped on every restart/redeploy. Shipment images and generated QR codes will not survive a redeploy under the current setup.

## Request/data flow

- **Auth**: `POST /api/auth/login` checks the `users` table, issues a JWT (`backend/routes/auth.js`). The frontend stores it in `localStorage` under `shiptrack_token` and attaches it as `Authorization: Bearer <token>` via an Axios request interceptor (`frontend/src/utils/api.js`). `backend/middleware/auth.js` verifies the token on protected routes; a 401 response triggers the frontend interceptor to clear the token and redirect to `/admin/login` if currently under `/admin`.
- **CORS**: `server.js` restricts `origin` to `process.env.FRONTEND_URL` with `credentials: true` — this must exactly match the frontend's real origin (protocol + host, no trailing slash typos) or the browser will block every request even though the server itself is healthy.
- **Tracking numbers**: generated server-side by default in `backend/routes/shipments.js` (`generateTrackingNumber()` — 2 random letters + 5 digits, checked for uniqueness). Admins can also supply one explicitly when creating a shipment; the server validates it (`^[A-Z0-9-]{3,30}$`) and rejects duplicates with 409.
- **Images/QR**: uploaded via `multer` (`backend/middleware/upload.js`) into `UPLOAD_DIR`, processed with `sharp`; QR codes are generated per-shipment with the `qrcode` package and linked to `TRACKING_BASE_URL/<tracking_number>`. Both are served back as relative `/uploads/...` paths that the frontend must resolve against the API origin (see `resolveUploadUrl` above).
- **i18n**: `frontend/src/context/LangContext.jsx` holds AR/EN strings and toggles a `body.ltr` class for direction; most page components pull labels via a `t()` function from that context rather than hardcoding text.

## Things that have bitten this repo before

- `.gitignore` has previously been saved in UTF-16 with a BOM, which Git silently fails to apply — this let ~10k `node_modules` files (including Windows-only native binaries for `sharp` and `rollup`) get committed and broke deployment on Render's Linux build. If `git status` ever shows `node_modules/*` as untracked-but-not-ignored or `.gitignore` edits don't seem to take effect, check the file's encoding is plain UTF-8 before debugging anything else.
- `backend/.env` **is tracked in git** (despite `.gitignore` listing `.env`) and contains real database credentials. Don't assume secrets in this repo are safe to print, share, or leave anywhere the trust boundary is broader than this repo's own contributors.
- `frontend/dist/` and `backend/public/` (build output, not source) are committed to git — this is intentional given the manual-upload deploy process for the frontend, so don't gitignore or delete them without understanding that Hostinger has no other way to get a new build.
