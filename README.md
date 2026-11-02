# Mindu React

React/Vite conversion of the complete Mindu education HTML theme. The app uses reusable React navigation, footer, search, mobile menu, route handling and interaction components while preserving every original theme page and bundled asset.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Client-side routes map all original `.html` pages to clean URLs. The original page markup is retained under `public/source` as the migration source, while React owns the application shell, navigation, routing and interactions.

The connected Conca learning/admin dashboard is available at `/dashboard`. Its 112 screens are mapped under `/dashboard/<original-file-name>` and reuse the same React navigation layer, with a persistent “View website” return action.

## GSS data and administration

- `/courses` serves the shared database-backed programme catalogue with static fallback.
- `/countries` exposes country and regional programme discovery.
- All imported institutional paths, including `/about-msbm`, render inside the Mindu theme.
- `/dashboard/login` authenticates administrators; programme create/edit/list screens use protected API mutations.
- `/dashboard/applications` provides the encrypted applicant review queue.
- `/checkout?course=<slug>` submits a minimized, consent-gated programme application.

Production PHP and privacy configuration is documented in [DEPLOYMENT.md](./DEPLOYMENT.md). Migration evidence and phase gates are recorded in [MIGRATION.md](./MIGRATION.md).
