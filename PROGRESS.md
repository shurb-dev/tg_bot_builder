# MVP Progress

## MVP STATUS

**COMPLETE — the MVP implementation and the full Definition of Done verification have passed in GitHub Actions.**

The previous local execution-environment DNS blocker is no longer relevant: the project is now verified on a real GitHub-hosted Ubuntu runner with Node.js 22 and pnpm 11.24.0.

## Final verification evidence

GitHub Actions CI run **#19** (`433d5699f498e76b5b78cf5eda2fdf2cfcfeb2ba`) completed successfully.

Executed gates:

- `pnpm install --no-frozen-lockfile` — **PASS**
- `pnpm lint` — **PASS**
- `pnpm typecheck` — **PASS**
- `pnpm test` — **PASS**
  - 4 test files passed
  - 19 tests passed
- first `pnpm build` — **PASS**
- Playwright Chromium installation — **PASS**
- mandatory browser smoke from `MVP_PLAN.md` — **PASS**
- final `pnpm build` after browser smoke — **PASS**

The production build generated the expected static application routes, including `/` and `/editor`.

## Mandatory browser smoke — PASS

The Playwright smoke test runs against the production server (`next start`) and executes the required end-to-end MVP scenario rather than a shallow page-load check.

Verified in the browser:

1. Demo project opens and Main Menu preview renders.
2. A `Products` screen can be created.
3. Message text can be changed to `Наши товары`.
4. Two inline buttons can be created in one row.
5. Buttons can be reordered with real dnd-kit pointer interaction.
6. A second row can be created.
7. A button can be moved across rows with real drag-and-drop.
8. A button can navigate to the `Products` screen.
9. A URL button can be configured.
10. A custom callback button can be configured.
11. Flow mode opens and the derived screen-navigation edge is present.
12. The `Products` node can be dragged to a new position.
13. Browser reload preserves the edited project and flow-node position through localStorage.
14. Code mode renders generated `bot.py`.
15. Generated keyboard code is inspected.
16. Generated handler code is inspected, including the custom callback.
17. Project JSON export succeeds.
18. The active project can be reset/replaced.
19. Exported JSON can be imported again.
20. Meaningful project state round-trips through JSON, including keyboard layout and flow position.
21. aiogram ZIP export succeeds.
22. The ZIP is extracted to a temporary directory in CI.
23. Expected generated Python files are present.
24. `requirements.txt` and `.env.example` are present and valid for the generated template.
25. Generated output contains the Telegram token placeholder rather than a real token.
26. Generated output is scanned for Telegram-bot-token-shaped secrets.
27. `python3 -m compileall generated_bot` succeeds on the extracted ZIP.
28. No uncaught browser page errors are emitted during the scenario.
29. A fresh production build succeeds after the smoke test.

## Milestone 0 — Repository reconnaissance
Status: COMPLETE

- Repository structure and project constitution reviewed.
- `AGENTS.md` and `MVP_PLAN.md` used as implementation requirements.
- Runtime and package-manager behavior validated on GitHub Actions.

## Milestone 1 — Foundation and domain
Status: COMPLETE

- Canonical versioned `Project` domain model.
- UUID-based IDs.
- Zod schema and migration entry point.
- Demo project.
- Telegram UTF-8 callback byte helpers and limits.
- Zustand project/editor/history store.
- Explicit project mutation actions.
- localStorage persistence and corrupted-data recovery backup.
- Next.js App Router editor shell.

Verification: full TypeScript typecheck and domain tests — **PASS**.

## Milestone 2 — Screen and message design
Status: COMPLETE

- Screen sidebar and selection.
- Create, rename, duplicate and delete screen behavior.
- Referenced-screen deletion cleanup.
- Message text, command trigger, parse mode and photo URL editing.
- Telegram-inspired preview.
- Image failure state and empty states.

Verification: production browser smoke — **PASS**.

## Milestone 3 — Keyboard builder
Status: COMPLETE

- Add/remove rows and buttons.
- Button selection and property editing.
- Screen, callback and URL actions.
- dnd-kit row/button sorting.
- Cross-row button movement.
- Empty-row droppable handling.
- Ref-backed drag draft to prevent stale-state duplication/loss.

Verification: unit tests plus real Playwright pointer drag/reorder/cross-row movement — **PASS**.

## Milestone 4 — Undo/redo and editor reliability
Status: COMPLETE

- 30-state history.
- Undo/redo.
- Grouped history transactions.
- Drag transactions.
- Keyboard shortcuts and destructive-action safeguards.
- Toast notifications.

Verification: store tests, lint and typecheck — **PASS**.

## Milestone 5 — Flow mode
Status: COMPLETE

- XYFlow canvas and custom screen nodes.
- Edges derived exclusively from `button.action`.
- Pan/zoom/fit view/minimap.
- Persistent node positions.
- Double-click navigation back to Design mode.

Verification: derived-edge unit coverage plus browser node move/reload persistence — **PASS**.

## Milestone 6 — Full validation
Status: COMPLETE

- Invalid and duplicate command validation.
- Empty button validation.
- Missing target validation.
- 1–64 UTF-8 byte callback validation.
- Reserved callback namespace validation.
- HTTP/HTTPS URL and photo URL validation.
- `/start`, empty-content, no-buttons, reachability and entry warnings.
- Clickable validation UI.
- Blocking validation gates aiogram export.

Verification: domain validation tests — **PASS**.

## Milestone 7 — aiogram generator
Status: COMPLETE

- Single canonical generated virtual-file pipeline.
- Deterministic compact screen callback routes.
- Stable internal callback namespace.
- Exact keyboard row preservation.
- Command and screen-navigation handlers.
- URL buttons and custom callback stubs.
- Photo message generation.
- `bot.py`, `config.py`, handlers, keyboards, `.env.example`, requirements and README generation.
- No real bot token or machine-specific paths in generated output.

Verification:
- generator tests — **PASS**
- browser inspection of generated code — **PASS**
- exported ZIP extraction — **PASS**
- generated Python `compileall` — **PASS**
- token-shaped secret scan — **PASS**

## Milestone 8 — Code mode and exports
Status: COMPLETE

- Code file tree and read-only source view.
- Copy generated file.
- Code mode and ZIP export share the same virtual generated files.
- JSON export/import with schema/migration validation.
- JSZip aiogram export.
- Human-readable filenames.

Verification: JSON export/reset/import round-trip and ZIP export in Playwright — **PASS**.

## Milestone 9 — Final UX and recovery pass
Status: COMPLETE

- Desktop width warning.
- Corrupt local-data recovery messaging.
- Property-level and global validation feedback.
- Empty states and selection recovery.
- Accessible labels for icon controls.
- Focus treatment.
- Image, import and export failure handling.
- No backend/auth/cloud dependency added to MVP scope.

Verification: lint, typecheck, unit tests and production browser run — **PASS**.

## Milestone 10 — Convergence / Definition of Done
Status: COMPLETE

All required executable gates from `MVP_PLAN.md` now pass on a clean GitHub-hosted runner:

```text
Install                 PASS
Lint                    PASS
Typecheck               PASS
Vitest                  PASS (4 files / 19 tests)
Production build        PASS
Mandatory browser smoke PASS
Generated ZIP           PASS
Python compileall       PASS
Secret scan             PASS
Final production build  PASS
```

The MVP is no longer blocked by environment verification and can be treated as **Definition-of-Done complete** for the scope defined in `MVP_PLAN.md`.

## Non-blocking maintenance notes

The successful CI run still reports dependency/tooling warnings that do not fail the DoD:

- GitHub's current JavaScript actions emit a Node 20 deprecation notice while the workflow itself uses Node 22.
- Vitest/Vite reports a future config-loader warning for ESM syntax in `vitest.config.ts`.
- Some installed package versions report upstream deprecation/update notices.

These are maintenance items, not MVP blockers.
