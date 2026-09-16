# MVP Progress

## MVP STATUS

**NOT COMPLETE — implementation is present, but final dependency-backed verification is blocked by the execution environment's DNS/network access to `registry.npmjs.org`.**

Per `AGENTS.md` and `MVP_PLAN.md`, required checks are not marked PASS unless they were actually executed.

## Repository baseline

- Started from an empty repository.
- Imported `AGENTS.md` from the user-provided project constitution.
- Imported `MVP_PLAN.md` as the implementation source of truth.
- Runtime available: Node.js 22.16.0, global TypeScript 5.8.3, Python 3.13.5.
- npm registry access is unavailable in the current container (`getaddrinfo EAI_AGAIN registry.npmjs.org`).
- Current app manifest targets Next.js 16.3.3, React 19.3, Zustand 5.0.15, XYFlow 12.11.5, Zod 4.6.4 and Vitest 5.

## Milestone 0 — Repository reconnaissance
Status: COMPLETE

Implemented:
- Confirmed no existing code repository was available.
- Read project constitution and complete MVP plan.
- Established repository structure and execution state tracking.

Verification:
- Repository inspection — PASS
- Node/Python availability — PASS
- npm registry connectivity — BLOCKED by environment DNS

---

## Milestone 1 — Foundation and domain
Status: IMPLEMENTED / FINAL VERIFICATION BLOCKED

Implemented:
- Canonical versioned `Project` domain model.
- UUID-based IDs.
- Zod schema and versioned migration entry point.
- Demo project.
- Telegram UTF-8 callback byte helper and limits.
- Zustand project/editor/history store.
- Explicit store actions; no component-level direct project mutation.
- localStorage persistence and corrupted-data recovery backup.
- Base Next.js App Router editor shell.

Offline verification:
- Domain/generator strict TypeScript subset compilation — PASS
- TypeScript syntax transpile across all TS/TSX — PASS

---

## Milestone 2 — Screen and message design
Status: IMPLEMENTED / BROWSER VERIFICATION BLOCKED

Implemented:
- Screen sidebar and selection.
- Create, rename, duplicate and delete.
- Referenced-screen deletion removes referring transition buttons after confirmation.
- Message text, command trigger, parse mode and photo URL editing.
- Telegram-inspired preview.
- Graceful image load failure state.
- Empty editor state.

---

## Milestone 3 — Keyboard builder
Status: IMPLEMENTED / BROWSER VERIFICATION BLOCKED

Implemented:
- Add/remove rows.
- Add/remove buttons.
- Button selection.
- Button text/action editing.
- `screen`, `callback`, and `url` actions.
- dnd-kit sortable rows.
- dnd-kit sortable buttons.
- Cross-row movement.
- Empty-row droppable handling during drag.
- Ref-backed drag draft to avoid stale-state duplication/loss.
- Pure `moveButtonInKeyboard` transformation for testability.

Offline verification:
- Cross-row pure transformation keeps exactly one copy of dragged button — PASS

---

## Milestone 4 — Undo/redo and editor reliability
Status: IMPLEMENTED / PACKAGE TEST VERIFICATION BLOCKED

Implemented:
- 30-state history.
- Undo/redo.
- Grouped text/action history transactions.
- Drag commits as project-level transactions.
- Ctrl/Cmd+S, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Escape, Delete/Backspace safety.
- Destructive confirmations.
- Toast notifications.

---

## Milestone 5 — Flow mode
Status: IMPLEMENTED / BROWSER VERIFICATION BLOCKED

Implemented:
- XYFlow canvas.
- Custom screen nodes.
- Flow edges derived exclusively from `button.action`.
- No persisted duplicate edge model.
- Pan/zoom/fit view/minimap.
- Node drag with persisted position.
- Double-click navigation back to Design mode.

Offline verification:
- Demo derives 6 expected screen-transition edges — PASS

---

## Milestone 6 — Full validation
Status: IMPLEMENTED / PACKAGE TEST VERIFICATION BLOCKED

Implemented:
- Structured error/warning model.
- Invalid command validation.
- Duplicate command validation.
- Empty button validation.
- Missing screen target validation.
- 1–64 UTF-8 byte callback validation.
- Reserved internal callback namespace validation.
- HTTP/HTTPS URL validation.
- Photo URL validation.
- `/start` warning.
- Empty-content warning.
- No-buttons warning.
- Reachability and no-entry warnings.
- Clickable validation UI that navigates to relevant screen/button.
- Blocking validation gates aiogram export.

Offline assertions:
- UTF-8 emoji byte count — PASS
- >64-byte callback detection — PASS
- invalid URL detection — PASS
- duplicate command detection — PASS
- unreachable screen detection — PASS
- reserved generated callback prefix detection — PASS
- default demo has no blocking errors — PASS

---

## Milestone 7 — aiogram generator
Status: IMPLEMENTED / OFFLINE CORE VERIFIED

Implemented:
- Single canonical `GeneratedProject` virtual-file pipeline.
- Deterministic compact screen callback routes.
- Stable internal `__tflow:` callback namespace.
- Exact inline keyboard row preservation.
- Command handlers.
- Screen navigation callback handlers.
- URL buttons.
- Custom callback safe stubs.
- Photo message generation.
- `bot.py`, `config.py`, handlers, keyboards, `.env.example`, requirements and README.
- No real tokens or machine-specific paths.

Offline verification:
- Strict TypeScript compilation of domain + generator subset — PASS
- Deterministic repeated generator output — PASS
- Demo generator output — PASS (9 files)
- `/start` handler present — PASS
- keyboard code present — PASS
- URL/custom callback/photo generation assertions — PASS
- `python -m compileall` on generated demo project — PASS

---

## Milestone 8 — Code mode and exports
Status: IMPLEMENTED / BROWSER VERIFICATION BLOCKED

Implemented:
- Code file tree.
- Read-only code view.
- Copy selected generated file.
- Code mode consumes exact same virtual files as ZIP export.
- JSON export.
- JSON import through schema/migration/domain validation.
- JSZip export.
- Human-readable project filenames.

Tests authored:
- JSON semantic round-trip.
- corrupted localStorage backup/recovery.
- generator file set and output behavior.

These Vitest tests cannot execute until dependencies can be installed.

---

## Milestone 9 — Final UX and recovery pass
Status: IMPLEMENTED / BROWSER VERIFICATION BLOCKED

Implemented/reviewed:
- Desktop width warning.
- Recovery message for corrupt local data.
- Validation errors near properties plus global panel.
- Empty states.
- Selection recovery after screen removal/undo.
- Accessible labels for icon controls.
- Visible focus treatment.
- Image error state.
- Export error handling.
- Import malformed-data handling.
- ZIP error handling.
- Application avoids backend/auth/cloud scope.

---

## Milestone 10 — Convergence / Definition of Done
Status: BLOCKED BY ENVIRONMENT VERIFICATION

Checks actually executed:
- TypeScript syntax transpile across 40 `.ts`/`.tsx` files — PASS
- Strict TypeScript compile of dependency-independent domain/generator core — PASS
- Offline domain acceptance assertions — PASS
- Offline generator acceptance assertions — PASS
- Generated Python `compileall` — PASS

Required checks not executable in the current environment:
- `pnpm lint` — NOT RUN; Corepack cannot download pnpm because npm registry DNS resolution fails.
- `pnpm typecheck` — NOT RUN for full app; dependencies are unavailable. Core dependency-independent subset typecheck passed.
- `pnpm test` — NOT RUN; Vitest/Zustand/Zod/React dependencies cannot be installed.
- `pnpm build` — NOT RUN; Next.js/React dependencies cannot be installed.
- Browser smoke test — NOT RUN; app cannot start without dependencies.

Observed package-manager blocker:

```text
getaddrinfo EAI_AGAIN registry.npmjs.org
```

No user input is required to resolve an application decision. The remaining blocker is purely execution-environment network access.

## Next verification when registry access is available

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Then execute the exact browser smoke test in `MVP_PLAN.md`, export an aiogram ZIP, extract it, and run:

```bash
python -m compileall generated_bot
```

Do not mark MVP COMPLETE until those checks pass.
