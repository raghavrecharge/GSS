# The Global School of Skills (GSS)

[![CI](https://github.com/raghavrecharge/GSS/actions/workflows/ci.yml/badge.svg)](https://github.com/raghavrecharge/GSS/actions/workflows/ci.yml)

Vite + React website for The Global School of Skills (GSS), built on the Marrky theme and interaction system. It includes programme catalogues, detailed course information, university partners, specializations, and country/regional study pages.

## Run locally

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm run lint
npm test
npm run build
```

The production output is generated in `dist/`.

## Routes

- `/`, `/online-learning`, `/for-business`
- `/about`, `/accreditation`, `/tuition`
- `/programmes`, `/programmes/:courseSlug`
- `/categories`, `/categories/:categorySlug`
- `/specializations`, `/specializations/:specializationSlug`
- `/universities`, `/universities/:universitySlug`
- `/countries`, `/countries/:countrySlug`
- `/locations/:locationSlug`
- `/learning`, `/student-stories`
- `/insights`, `/insights/online-learning`
- `/contact`, `/404`

Legacy `.html` and source programme URLs redirect to the corresponding clean React route. Unknown routes render the custom 404 page.

## Programme catalogue data

The catalogue holds 960 source-backed programmes across 11 categories, plus a few locally seeded examples.

- `src/data/msbmVerifiedCatalog.json` — 69 curated master’s and doctorate records with full detail, bundled into the client.
- `src/data/msbmProgrammeIndex.json` — card-level index for the remaining 891 programmes (certificates, executive masters, diplomas, bachelor’s degrees, free courses), bundled into the client.
- `public/data/programmes/<slug>.json` — full detail for each indexed programme (overview, curriculum, entry requirements, accreditation, tuition plan). The course page loads this on demand when the database API is unavailable or only returned a summary.
- `public/api/index.php` — `GET /api/courses` returns card-level summaries; `GET /api/courses/:slug` returns the full record. The build exports `dist/api/courses.seed.json` (full catalogue, used once to seed the database) and `dist/api/courses.versioned.seed.json` (records with a `seedRevision`, re-synced on every deployment).

To refresh the index and detail files from a new public-catalogue capture, place the raw JSON under `artifacts/msbm-scrape/` (ignored by git) and run:

```powershell
node scripts/import-msbm-programmes.mjs artifacts/msbm-scrape/<capture>.json
```

The importer keeps the verified catalogue as the source of precedence, rebrands visible text to GSS, maps categories and partners onto the existing taxonomy, and assigns local theme imagery. Source URLs are retained for provenance only.

## Brand system

- Primary blue: `#15519D`
- Accent orange: `#FFAD01`
- Shared GSS logo assets live in `public/assets/img/`

## Production deployment

Run `npm run build` and publish the contents of `dist/` to the web root. The bundled `.htaccess` provides the Apache fallback required for React Router deep links.
