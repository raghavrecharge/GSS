# Course evidence and review pipeline

This pipeline retrieves the public programme page, keeps its source evidence, indexes every extracted section, and assembles a deterministic candidate for review. It uses local lexical retrieval with exact course, section and country scope. It needs no model provider, API key or paid vector database. Optional model-assisted rewriting can consume retrieved chunks later, but the current output boundary is an evidence-bound candidate, never an unattended production overwrite.

## Run

```powershell
npm run course-rag:inventory
npm run course-rag:run -- --limit 1
# Capture rendered source with Playwright and expanded course tabs/modules:
npm run course-rag:run -- --mode browser --browser-path "C:/Program Files/Google/Chrome/Application/chrome.exe" --limit 1
# Reproduce from an already supplied local HTML snapshot:
npm run course-rag:run -- --source https://msbm.org.uk/programme/executive-master-of-business-administration-4 --slug executive-master-of-business-administration-4 --html path/to/capture.html
```

The inventory includes every catalogue course and explicitly lists records without source URLs. It does not equate a source URL, a previous `sourceCoverage` flag, or a nonempty module list with completeness. The public source hosts and `/programme/` paths are allowlisted. Capture is sequential and delayed; an access-control or rate-limit response stops the run. No credentials, authenticated portal pages, or private learner endpoints are accessed.

`artifacts/course-rag/` receives a manifest, run report, sanitized source snapshots and a candidate per course. A failed capture stays visible in the report. There is no silent skip or automatic fallback to another course. Country URLs remain separate evidence scopes.

## Retrieve, challenge, repair and gate

```powershell
npm run course-rag:query -- --candidate artifacts/course-rag/candidates/example.json --section modules --query "research methods"
npm run course-rag:review -- --candidate artifacts/course-rag/candidates/example.json --review path/to/verifier-decision.json
npm run course-rag:gate -- --candidate artifacts/course-rag/candidates/example.json
# Publish only after a successful independent review and gate:
node scripts/course-rag/publish.mjs --candidate artifacts/course-rag/candidates/example.json
# Replacing an earlier approved revision requires its current content hash:
node scripts/course-rag/publish.mjs --candidate reviewed-update.json --expected-revision CURRENT_CONTENT_HASH
```

A review decision contains `actor`, `role` (`verifier` or `challenger`), `verdict` (`approve` or `reject`), `candidateRevision`, `evidenceDigest` and `reasons` for a rejection. The verifier identity must differ from the builder run. The CLI recomputes SHA-256 digests before accepting a decision. The browser CMS uses the same pure contract and can call `verifyCandidateIntegrity` before staging. Review decisions bind the entire content and evidence payload; changing it invalidates prior approval.

The intended agent loop is:

1. Retriever captures source plus a digest and expansion-action log.
2. Builder projects factual fields from exact source blocks and emits a candidate.
3. Independent challenger checks source section counts, individual module summaries, every lesson description, tuition facts, country scope and actual rendered content. It records an actionable rejection.
4. Builder fixes extraction or rendering and recaptures. A fresh revision invalidates earlier review decisions. Carry the previous `review.rounds` and rejection history into the next cycle; stop after three rejected rounds and report the unresolved evidence.
5. An independent verifier approves only a valid candidate with every required section either observed or explicitly resolved as absent at source, and with no omissions or conflicts. The publication gate exits nonzero for every unresolved or unreviewed candidate.

The 16 required sections are identity, programme details, course details, learning outcomes, accreditation, modules, university progression, entry requirements, workshops, visa, tuition, about, library, getting started, certificate and testimonials. Each contains typed blocks, exact cited chunk IDs, source and extracted item counts, and explicit omissions. Tables, source media references, module summaries, lesson descriptions, lecture/quiz counts and shared-source scope are retained.

An inspected source section with only a heading is `source_absent`; an unlocated selector is `missing`. A rigorously evidenced `source_absent` section counts as resolved for review, but never as reproduced content: it requires a successful exact-course snapshot, checked selectors, an explicit reason, and zero source items or citations. For example, the public Executive MBA listing currently has an empty University Progression body, so the pipeline records that absence rather than inventing a progression route.

The builder cannot self-approve, resolve a conflict by majority vote, or substitute a generic passage from a different programme. Source HTML is inert data: scripts, forms, event handlers, script URLs and embedded `srcdoc` are stripped. Page instructions never execute as agent instructions.

## Output contract and production boundary

The shared contract lives in `src/data/course-rag/contract.js`; `scripts/course-rag/contract.mjs` re-exports it. `core.mjs` owns source extraction, scoped retrieval, candidate sealing and Node integrity checks. `record.detailSections` contains all extracted rich content; legacy factual fields are a canonical projection and cannot diverge from cited evidence. Unknown details remain unknown.

The publisher consumes only an independently approved candidate after recomputing its content and evidence digests. It writes `src/data/course-rag/publishedCourses.json`, keyed by exact course slug and country scope. Replays are idempotent; replacement requires the previous revision to prevent a stale reviewer overwriting a newer publication. A single-writer lock, atomic file replacement, retained complete candidate and prior catalogue under `.history/` make a failed write recoverable. A failed gate leaves the catalogue unchanged. The output parent directory must already exist under the project root, and symlink targets are refused.

The React catalogue overlays these approved records while retaining only presentation fields from older entries. All rich `detailSections`, module summaries, lesson descriptions/types/counts and absence metadata survive the generated API seed. Each publication has a `seedRevision` derived from its content revision, allowing the existing cPanel seed synchronizer to apply it once. Country-specific evidence never upgrades the global record, and a global approval does not mark country-specific tuition complete. Restore a prior catalogue snapshot through a reviewed local change if rollback is required; no rollback runs automatically.

No command modifies `msbmVerifiedCatalog.json`, a database, or a live site. Build and deployment remain separate steps. The deployed API revision and rendered source parity still require verification after publication. A successful HTTP request or visible heading alone is not acceptance evidence for full details.

Run targeted checks with `npm run course-rag:test`. Live capture and production-browser checks require network access and a permitted Playwright browser executable. A browser capture proves what the source exposed; independent source comparison and visual checks remain required before final approval.
