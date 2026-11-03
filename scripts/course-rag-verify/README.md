# Course browser acceptance

Build and start `npm run preview -- --host 127.0.0.1 --port 4173` in a persistent terminal. Then run:

```powershell
npm run courses:acceptance -- --base-url http://127.0.0.1:4173 --php-preview
```

Every slug in `dist/api/courses.seed.json` is checked by default. The gate keeps one Chromium process with four reusable desktop/mobile context pairs. It reads the publisher's retained candidate history plus `artifacts/course-rag/candidates`, preferring the exact published revision. Use `--browser-path` for a different Chromium binary, `--catalogue` for a different exported catalogue, `--candidates` for additional approved source candidates, and `--out` to preserve separate runs. `--slugs a,b` is a development subset and is explicitly marked partial; run the full inventory for release acceptance.

The gate checks all 16 sections, generic replacement content, module and lesson ordering/descriptions, identity, anchors, accordion cycles, checkout identity, broken images, browser errors and responsive fit. Candidate integrity, independent approval, revision, evidence digest and country scope must match the published record. A page that only renders headings cannot pass.

`--php-preview` only reclassifies same-origin `/api/courses` HTTP 404/405/501 on a loopback host as environment warnings. Do not use this option to claim production PHP/database correctness. Live errors and unrelated missing assets remain failures.

Exit code 0 requires every inventoried page to pass. JSON, Markdown, progress and screenshots are written to `artifacts/course-acceptance`. Screenshots support a separate human visual review; automated overflow measurements alone do not certify appearance. Upstream sources are not recaptured by this gate.

The report includes the previous `artifacts/course-detail-audit/results.json` totals when available. Use `--baseline` to compare to a later run. The evaluator is stricter than the initial audit: generated count paragraphs, missing source paragraphs and omitted administrative fees now fail explicitly. Do not compare section counts without accounting for that methodology change.

Run evaluator regressions with `npx vitest run tests/course-rag/acceptance-evaluator.test.js --pool threads --environment node --maxWorkers 1`.
