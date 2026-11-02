# GSS data migration into Mindu

## Objective

Move the existing, public-source GSS/MSBM catalogue and content data from `Anima-react` into the Mindu public theme and Conca dashboard while keeping both themes' UI structure, class names, responsive layout, and image assets unchanged.

## Locked acceptance criteria

- Mindu and Conca image paths remain unchanged.
- Existing layout wrappers and CSS classes remain the visual source of truth.
- The public site and dashboard read from the same normalized data/API contract.
- Public routes expose published records only.
- Dashboard mutations require authenticated, authorized, CSRF-protected requests.
- Source URLs and evidence metadata remain available for review.
- No private MSBM portal data or personal student data is collected.

## Phase status

- [x] Phase 0: establish migration ledger and image-integrity baseline
- [x] Phase 1: import and normalize existing GSS datasets
- [x] Phase 2: public-source inventory/delta pipeline
- [x] Phase 3: Mindu content-binding layer
- [x] Phase 4: dynamic catalogue and course details
- [x] Phase 5: institutional and marketing content
- [x] Phase 6: country/location programme routes
- [x] Phase 7: shared database and API
- [x] Phase 8: connect Conca dashboard to shared services
- [x] Phase 9: cart/application/checkout data flow
- [x] Phase 10: full regression, security, and production-readiness verification

## Source inventory at migration start

- 69 verified programme records
- 249 country records
- 190 regional market records
- 43 institutional content pages
- 1 evidence-reviewed rich programme record

## Implementation decisions

1. Existing Anima data is the starting source of truth; future scraping is a delta process.
2. Theme HTML is adapted through explicit data bindings, never by replacing CSS or images.
3. Static JSON remains a resilient read fallback; the API/database is authoritative when available.
4. Conca dashboard demo data is replaced by the same course/content services used by Mindu.
5. Scraped changes enter review state and never auto-publish.

## Verification log

- Phase 0: recorded SHA-256 and byte-size fingerprints for 284 existing Mindu and Conca image assets.
- Phase 1: imported the verified catalogue, countries, regional markets, institutional pages, course enrichments, evidence-reviewed publication, PHP API, and database seed exporter from Anima.
- Phase 2: added a host-allowlisted, size-capped, timeout-bound, review-only MSBM delta audit. The live site currently returns a Cloudflare 403 challenge; the report records that state and never auto-publishes.
- Phases 3–4: bound 82 normalized GSS records into the unchanged Mindu card/detail markup with dynamic programme routes and original theme images.
- Phase 5: rendered and browser-verified all 43 institutional routes, including every imported structured table row.
- Phase 6: connected and verified the 249-country and 190-region datasets, country/location directories, published-course filtering, and localized detail routes.
- Phase 7: implemented shared SQLite/MySQL-backed course, content, geography, authentication, administrator, and application APIs. Course updates preserve rich payloads and administrator-managed publication state.
- Phase 8: connected Conca list/grid/detail/editor and application-administration screens to authenticated API services, including draft visibility, create/edit/unpublish, status changes, and deletion.
- Phase 9: persisted the selected programme across cart/checkout, bound fee totals, validated consent and required applicant fields, encrypted applicant PII at rest, and implemented applicant export/deletion plus administrator review/deletion.
- Phase 10: release gates pass for ESLint, production build/export (82 courses), PHP syntax, clean-install dry run, the 284-asset integrity lock, production dependency audit (0 vulnerabilities), static browser regression (desktop/mobile, 43 content routes, geography, cart/checkout, dashboard, and 404), and a real temporary PHP/SQLite full-stack browser flow covering login, draft editing, application submission, encryption, CSRF, rich-payload preservation, and cleanup.

Production hosting still requires the deployment environment values documented in `DEPLOYMENT.md` and a post-deploy smoke test against the chosen domain/database. No hosting target or production credentials are stored in this repository.
