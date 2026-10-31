---
name: token-optimization
description: Reduce token and context consumption in Codex coding sessions without losing task-critical information. Use when exploring large repositories, reading files or logs, planning implementation, using tools, debugging, reviewing diffs, or maintaining long-running agent tasks.
---

# Token Optimization

Optimize for **minimum sufficient context**, not minimum words at any cost. Preserve correctness, security, maintainability, and the user's requested outcome.

## Operating rules

1. **Start with the goal.** Extract the requested outcome, constraints, relevant area, and acceptance criteria. Do not restate the whole request.
2. **Inspect narrowly, then expand.** Start with the most likely files, symbols, tests, and configuration. Search before reading large files. Expand scope only when evidence requires it.
3. **Never dump a repository.** Avoid unrestricted `find`, recursive `cat`, huge directory listings, and full dependency trees. Use targeted file discovery and filtered searches.
4. **Read only relevant ranges.** Prefer symbol lookup, `grep`/`rg`, line ranges, AST-aware tools, and focused diffs. Read surrounding code when needed to understand behavior.
5. **Summarize tool output immediately.** Retain findings, decisions, file paths, line references, and unresolved questions. Do not keep repeating raw logs or source excerpts.
6. **Use progressive disclosure.** Keep durable project-wide rules in `AGENTS.md`; keep repeatable workflows in skills; load detailed references only when relevant. Do not copy large documentation into prompts.
7. **Avoid redundant context.** Do not reread files, repeat searches, re-explain established architecture, or regenerate unchanged plans unless new evidence invalidates prior findings.
8. **Prefer precise edits.** Make the smallest coherent patch. Avoid rewriting entire files, unrelated formatting, or broad refactors for a narrow task.
9. **Validate proportionally.** Run the narrowest relevant test first, then broader checks when risk or acceptance criteria require them. Do not run expensive full suites without reason.
10. **Keep updates compact.** Report meaningful milestones, blockers, decisions, and verification. Do not narrate every command.
11. **Preserve critical detail.** Never omit security requirements, data migrations, edge cases, public API contracts, user constraints, or failure evidence merely to save tokens.
12. **Do not fabricate savings.** Never claim a token count, percentage reduction, or benchmark unless measured by an available tool.

## Repository exploration workflow

1. Identify repository root and working-tree state.
2. Read the nearest applicable `AGENTS.md` and relevant project instructions.
3. Identify stack and entry points from manifests/configuration; do not read every file.
4. Search for the requested feature, route, component, API, schema, or error string.
5. Inspect only the implementation path and its closest tests/dependencies.
6. Record a compact working summary:
   - relevant files and responsibilities
   - existing pattern to follow
   - constraints and risks
   - tests or checks to run
7. Stop exploring when evidence is sufficient to implement safely.

## Search and file-reading patterns

Prefer targeted commands such as:

```bash
rg -n "RelevantSymbol|error text" src tests
rg --files src | rg "auth|billing|route"
sed -n '80,160p' path/to/file
git diff -- path/to/file
```

Avoid:

```bash
cat package-lock.json
find . -type f
rg -n "." .
```

Use output limits when searching noisy repositories. Exclude generated and vendor directories where appropriate (`node_modules`, `dist`, `build`, `.next`, `coverage`, `.git`, vendor folders). Do not exclude them if the task specifically concerns generated output or dependencies.

## Tool-output compression

After each substantial tool call, extract only:

- **Finding:** what the output establishes.
- **Evidence:** relevant path, symbol, line, test result, or error.
- **Impact:** what this changes about the implementation.
- **Next step:** the next necessary action.

For long logs:
- Capture the first meaningful error and its surrounding lines.
- Group repeated errors by root cause.
- Preserve the final exit status and relevant command.
- Do not paste successful repetitive output into the conversation.
- Re-run with filters or verbose mode only when needed to diagnose ambiguity.

For browser or documentation research:
- Search official documentation first for API behavior and version-sensitive details.
- Open only relevant pages/sections.
- Summarize the exact rule and retain the source URL or citation.
- Do not retrieve multiple pages that repeat the same information.

## Planning and implementation

For small, clear tasks, proceed directly; do not create a lengthy plan.

For large or risky tasks, write a short plan containing:
1. target behavior
2. likely files/modules
3. implementation sequence
4. validation strategy
5. risks or assumptions

Keep the plan updated only when the approach changes. Do not preserve speculative alternatives after choosing a supported approach.

Before editing:
- Check whether an established pattern already exists.
- Reuse existing utilities, components, types, and tests.
- Confirm whether generated files should be edited at source instead.
- Confirm whether changes affect public interfaces, persisted data, permissions, or backward compatibility.

During editing:
- Batch related edits.
- Avoid repeated whole-file reads after a small patch.
- Inspect the final diff, not the entire repository again.
- Do not modify unrelated files.

## Debugging workflow

1. Reproduce or locate the exact failure.
2. Capture the smallest useful error excerpt.
3. Trace the failure to its source; do not read unrelated modules.
4. Form one testable hypothesis at a time.
5. Make a minimal fix.
6. Run the focused regression test.
7. Expand validation only if the focused test is insufficient.

Do not repeatedly retry the same failed command without changing inputs or investigating the cause.

## Long-running sessions and context handoff

When the task is likely to exceed one context window or involve multiple phases, maintain a concise handoff note in the task's existing notes location (or provide one in the final response). Include:

- objective and acceptance criteria
- completed work
- key decisions and rationale
- changed files
- commands/tests and their results
- known risks, blockers, and next actions

Do not include full transcripts, large code blocks, or facts recoverable cheaply from the repository. Update the handoff after meaningful milestones, not after every command.

## Response format

Keep the final response proportional to the task:

- **Done:** concise description of the delivered change.
- **Files:** only important changed paths.
- **Verification:** exact checks run and their outcomes.
- **Caveats:** only real limitations or unverified behavior.

If no files changed, say so. If a check was not run, state that plainly. Do not include a long recap of the exploration process.

## Safety and quality guardrails

- Token efficiency never overrides user instructions or repository safety rules.
- Do not skip tests that are required by the task or needed to validate a risky change.
- Do not hide uncertainty; state assumptions that materially affect correctness.
- Do not silently discard relevant context supplied by the user.
- Do not compress code, configuration, or logs in ways that change semantics.
- Do not expose secrets while summarizing environment files, logs, or tool output.

## Completion checklist

- [ ] Task and acceptance criteria are clear.
- [ ] Only relevant instructions and files were loaded.
- [ ] No large or redundant output was retained unnecessarily.
- [ ] Changes are focused and consistent with project patterns.
- [ ] Relevant tests/checks were run.
- [ ] Final summary reports evidence, not assumptions.
