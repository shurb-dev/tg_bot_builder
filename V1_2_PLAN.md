# TFlow V1.2 — Runtime Logic & Test Mode

Source of truth for V1.2 implementation.

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
- RU/EN for all V1.2 UI
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

V1.2 is complete only when all of the following are true:

- v1/v2 projects migrate to schema v3 without semantic loss
- Variables/templates/Input/Set Variable/Condition/HTTP/Send Message work
- Input pause/resume and validation work in simulator and generated aiogram FSM
- HTTP mock and success/error routing work
- Flow node connections work and deleted targets are reconciled
- Test Mode runs a realistic lead-form flow and exposes runtime values
- automatic-step infinite-loop protection works
- undo/redo includes logic-node edits/moves/connections
- RU/EN covers all new UI and persists
- JSON v3 round-trip works
- Code Mode and ZIP use the same generated virtual files
- generated Python contains no real secrets and passes `python3 -m compileall`
- `pnpm lint` PASS
- `pnpm typecheck` PASS
- `pnpm test` PASS
- `pnpm build` PASS
- mandatory V1.2 Playwright smoke PASS
- final `pnpm build` PASS

Out of scope: auth, backend SaaS, cloud sync, managed hosting, payments, analytics, AI builder, Mini App designer, Redis runtime, live Telegram polling from the browser.
