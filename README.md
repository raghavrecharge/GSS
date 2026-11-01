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

## Brand system

- Primary blue: `#15519D`
- Accent orange: `#FFAD01`
- Shared GSS logo assets live in `public/assets/img/`

## Production deployment

Run `npm run build` and publish the contents of `dist/` to the web root. The bundled `.htaccess` provides the Apache fallback required for React Router deep links.
