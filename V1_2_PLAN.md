# TFlow V1.2 — Runtime Logic & Test Mode

Source of truth for V1.2 implementation.

## Status

**COMPLETE.** The full V1.2 Definition of Done passed in GitHub Actions CI run **#55** (`35213402470`) for feature commit `e3b1bce1292d4de62a0796f256f4978121e6ba3b`.

Verification evidence from that run:

- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS: **6 files / 60 tests**
- first `pnpm build` — PASS
- Playwright Chromium install — PASS
- mandatory browser smoke — PASS: **2/2 production tests**
- generated ZIP secret scans — PASS
- generated Python `compileall` inside the smoke scenarios — PASS
- final `pnpm build` — PASS

## Goal

Turn TFlow from a screen/keyboards editor into a local-first low-code Telegram bot flow builder while preserving the canonical Project → derived projections architecture.

V1.2 includes:

- schema v3 with backward v1/v2 migration
- project variables and environment-variable definitions
- safe `{{namespace.path}}` templates without eval
- Input nodes with validation and generated FSM
- Set Variable nodes
- Condition nodes with TRUE/FALSE branches
- HTTP Request nodes with SUCCESS/ERROR branches and simulator mocks
- Send Message nodes
- Flow Editor V2 with logic-node creation, derived edges and connections
- Test/Simulator mode with runtime inspector and infinite-loop protection
- aiogram 3 runtime generation using MemoryStorage and aiohttp
- RU/EN for all V1.2 UI and validation messages
- JSON round-trip, Code/ZIP parity and generated Python compile verification

## Runtime namespaces

- `{{user.id}}`, `{{user.first_name}}`, `{{user.last_name}}`, `{{user.username}}`
- `{{input.*}}`
- `{{vars.*}}`
- `{{http.<result>.status}}`, `body`, `json.*`
- `{{env.*}}`

Environment definitions store names only; secret values are never persisted to Project JSON.

## Logic nodes

- Input
- Set Variable
- Condition
- HTTP Request
- Send Message

Transitions remain canonical fields on screens/nodes. React Flow edges are derived and never persisted independently.

## Definition of Done

All V1.2 gates are complete:

- [x] v1/v2 projects migrate to schema v3 without semantic loss
- [x] Variables/templates/Input/Set Variable/Condition/HTTP/Send Message work
- [x] Input pause/resume and validation work in simulator and generated aiogram FSM
- [x] HTTP mock and success/error routing work
- [x] Flow node connections work and deleted targets are reconciled
- [x] Test Mode runs a realistic lead-form flow and exposes runtime values
- [x] automatic-step infinite-loop protection works
- [x] undo/redo includes logic-node edits/moves/connections
- [x] RU/EN covers all new UI and validation messages and locale persistence remains intact
- [x] JSON v3 round-trip works
- [x] Code Mode and ZIP use the same deterministic generator / virtual-file model
- [x] generated Python contains no real secrets and passes `python3 -m compileall`
- [x] `pnpm lint` PASS
- [x] `pnpm typecheck` PASS
- [x] `pnpm test` PASS
- [x] `pnpm build` PASS
- [x] mandatory legacy schema-v3 Playwright smoke PASS
- [x] mandatory V1.2 runtime Playwright smoke PASS
- [x] final `pnpm build` PASS

## Mandatory V1.2 browser scenario

The production Playwright scenario runs against `next start` and verifies a realistic flow:

```text
/start
  ↓
Main screen
  ↓
Input (name)
  ↓
Set Variable
  ↓
Condition
  ↓ TRUE
HTTP mock (201 + JSON)
  ↓ SUCCESS
Send Message
  ↓
Catalog screen
```

The scenario also checks Flow V2 nodes/edges, invalid Input handling, runtime inspector values, RU/EN switching, generated runtime/state files, `.env.example`, requirements, secret scanning and Python compilation.

## Out of scope

Auth, backend SaaS, cloud sync, managed hosting, payments, analytics, AI builder, Mini App designer, Redis runtime and live Telegram polling from the browser remain outside V1.2.
