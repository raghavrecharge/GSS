# End-to-end runbook

## Start a new project

Prompt Codex:

> Use `$saas-reverse-engineering` to analyze and independently recreate this authorized SaaS product: [URL]. Scope: [pages/modules/roles]. Target stack: [stack or inspect and recommend]. Access scope: [public pages / authorized test account]. First complete discovery and produce the evidence-backed artifacts. Do not begin the full implementation until the discovery and architecture gates are reviewed.

## Run browser reconnaissance

> Use `$browser-recon` on the approved scope. Map every accessible route and critical workflow. Capture non-sensitive screenshots at 1440x900, 1024x768, and 390x844 where feasible. Do not bypass access controls or perform consequential production actions. Update the evidence ledger.

## Extract design system

> Use `$design-system-extractor` with the approved screenshots and observations. Distinguish measured values from estimates. Produce semantic tokens, component variants, and responsive behaviour. Use only original, licensed, or placeholder assets.

## Map architecture

> Use `$saas-architecture-mapper`. Map normal authorized UI-generated network behaviour and public documentation only. Propose an independent API contract and data model. Do not probe hidden endpoints or copy private data.

## Build

> Use `$saas-product-rebuilder` to implement the approved P0/P1 feature matrix in the existing repository. Implement complete frontend and backend flows, server-side authorization, synthetic data, error states, and tests. Keep a feature-by-feature progress log.

## Verify

> Use `$saas-quality-gate` to run all available checks, test critical user journeys, compare equivalent screenshots, and document defects. Do not claim unrun checks passed.

## Suggested milestone sequence
1. Scope approval and repository baseline.
2. Route and workflow inventory.
3. Design system and component inventory.
4. Architecture/API/data model review.
5. P0 implementation.
6. P0 test and visual review.
7. P1/P2 implementation.
8. Full quality gate and handoff.

## Practical browser tooling
The skill instructions do not install browser automation. Use the browser capability already available in the Codex environment, or configure a supported Playwright/browser MCP integration. If no browser tool is available, ask the user for screenshots/recordings or a supported browser session; do not pretend to have inspected the URL.
