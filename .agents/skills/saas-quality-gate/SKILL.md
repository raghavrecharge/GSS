---
name: saas-quality-gate
description: Verify a reconstructed SaaS/web application against documented requirements and authorized reference evidence. Use for functional testing, browser journeys, responsive checks, visual regression, accessibility, security basics, and release readiness assessment.
---

# SaaS quality gate

## Preconditions
Use the feature matrix, acceptance criteria, user flows, design system, and known limitations. Test against a local/staging build and safe synthetic data. Reference-site comparisons must remain within authorized access.

## 1. Static and automated checks
Inspect available project scripts and run appropriate:
- formatter check;
- lint;
- type check;
- unit tests;
- integration tests;
- production build;
- dependency/security audit if configured.

Do not invent test results. Record exact command and exit status.

## 2. Critical workflow tests
For each P0/P1 journey:
- preconditions and test data;
- steps and expected outcome;
- actual outcome;
- evidence/screenshot;
- pass/fail/blocked;
- defect ID.

Test positive, negative, boundary, permission-denied, and retry cases where relevant. Use synthetic accounts and data.

## 3. UI and responsive verification
- Match reference and recreation viewport dimensions.
- Compare the same route, content density, scroll position, and interaction state.
- Check typography, spacing, hierarchy, alignment, sizing, overflow, and component states.
- Test agreed desktop, tablet, and mobile widths.
- Use screenshot-diff tooling if available; inspect differences rather than relying only on a numeric score.
- Record differences caused by unavailable licensed assets or unobservable reference behaviour.

## 4. Accessibility basics
Check:
- semantic landmarks and heading structure;
- accessible names and form labels;
- keyboard navigation and visible focus;
- dialog focus handling;
- contrast and status communication;
- reduced motion where animation is present;
- errors associated with relevant inputs.

## 5. Security and data integrity
Review:
- server-side authorization on every protected operation;
- tenant/resource isolation;
- validation at API boundaries;
- safe query construction;
- secret handling and `.env` hygiene;
- upload validation if applicable;
- CSRF/CORS/session configuration as relevant;
- no sensitive data in logs or screenshots;
- safe defaults and synthetic fixtures.

This is a scoped engineering review, not a formal penetration test or security certification.

## 6. Defect severity
- Blocker: data exposure, authorization bypass, data loss, core app unusable.
- Critical: major P0 workflow broken.
- Major: important workflow or significant layout broken.
- Minor: limited visual or interaction defect.
- Cosmetic: low-impact polish.

## 7. Release gate
Do not mark ready if:
- any blocker or critical defect remains;
- core authorization or tenant isolation is unverified;
- P0 flows fail;
- build or required checks fail;
- migrations or required environment configuration are missing.

If a check cannot be run, mark it **Not verified**, not Passed.

## Deliverables
Produce `test-plan.md`, `test-results.md`, `visual-differences.md`, and update the feature matrix and known limitations. End with a clear release recommendation: Ready for next environment / Not ready / Not verified.
