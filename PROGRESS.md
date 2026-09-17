# TFlow Progress

## Current status

**V1.2 COMPLETE — Runtime Logic, Flow Editor V2 and Test/Simulator Mode are implemented and the executable Definition of Done is green.**

The project remains local-first. V1.2 extends the existing visual Telegram editor to:

**Design → Flow → Test → Code → Export**

No backend, auth, cloud project state or managed Telegram runtime was added.

---

# V1.2 — Runtime Logic & Test Mode

## Verification evidence

GitHub Actions CI run **#55** (`35213402470`) for feature commit `e3b1bce1292d4de62a0796f256f4978121e6ba3b` completed successfully.

Executed gates:

```text
Install dependencies          PASS
pnpm lint                     PASS
pnpm typecheck                PASS
pnpm test                     PASS (6 files / 60 tests)
Production build              PASS
Install Playwright Chromium   PASS
Legacy schema-v3 smoke        PASS
Mandatory V1.2 runtime smoke  PASS
Generated ZIP secret scan     PASS
Python compileall             PASS
Final production build        PASS
```

Playwright result: **2/2 production browser tests passed** against `next start`.

## Schema v3 and compatibility

Status: **COMPLETE**

- Current canonical `Project` schema is v3.
- v1 projects migrate through v2 into v3.
- v2 projects migrate directly into v3.
- Existing screens, inline keyboards, reply keyboards, bot settings and editor positions survive migration.
- New V1.2 collections default safely for old projects:
  - `logicNodes: []`
  - `variables: []`
  - `environmentVariables: []`
- JSON v3 export/import round-trip is covered by tests and the browser smoke.

## Variables and templates

Status: **COMPLETE**

Project variables support string, number and boolean values. Environment definitions store names only.

Safe templates support:

- `user.*`
- `input.*`
- `vars.*`
- `http.*`
- `env.*`

Template resolution does not use `eval` or arbitrary JavaScript execution.

Validation covers unknown paths, invalid/duplicate variable keys, invalid/duplicate environment names and value/type mismatches.

## Logic nodes

Status: **COMPLETE**

Implemented nodes:

1. **Input**
   - text / number / email / phone
   - required/optional input
   - min/max length
   - numeric min/max
   - RegExp validation
   - custom invalid-input message
   - pause/resume semantics

2. **Set Variable**
   - writes to project runtime variables
   - templated values

3. **Condition**
   - AND / OR rule groups
   - equals / not equals
   - contains / not contains
   - numeric comparisons
   - exists / not exists
   - TRUE / FALSE outputs

4. **HTTP Request**
   - GET / POST / PUT / PATCH / DELETE
   - templated URL, headers, query and body
   - text or JSON body
   - configurable timeout
   - named result storage under `http.*`
   - SUCCESS / ERROR outputs
   - deterministic simulator mocks

5. **Send Message**
   - templated text
   - parse mode
   - NEXT output

## Flow Editor V2

Status: **COMPLETE**

- Screens and logic nodes share the same React Flow graph.
- Screen button → screen/node transitions appear as derived edges.
- Input / Set Variable / Send Message expose NEXT.
- Condition exposes TRUE / FALSE.
- HTTP exposes SUCCESS / ERROR.
- Connections update canonical Project transition fields.
- Edges are projections and are never persisted independently.
- Logic-node positions persist as editor metadata.
- Deleting a target reconciles references from screens and logic nodes.
- Undo/redo includes logic-node edits, connections and movement.

Store tests explicitly verify connection history and deleted screen/node reconciliation.

## Test / Simulator Mode

Status: **COMPLETE**

The local simulator executes the same canonical Project without requiring a Telegram token.

Verified behavior:

- command/screen entry
- inline/reply navigation into logic nodes
- Input wait state
- invalid Input response and retry
- Input resume after a valid response
- Set Variable mutation
- Condition branching
- HTTP success/error routing
- HTTP mock response status/body/JSON storage
- Send Message
- runtime inspector
- 100-step automatic execution guard for accidental infinite loops

### Mandatory V1.2 browser flow

The production smoke executes:

```text
/start
  ↓
Main screen
  ↓
Input: Your name?
  ↓
Set vars.lead_name
  ↓
Condition: name exists
  ↓ TRUE
HTTP mock: 201 {"id":123}
  ↓ SUCCESS
Send: Saved Zakhar / 201
  ↓
Catalog screen
```

It also confirms the runtime inspector contains the saved variable and HTTP result.

## RU/EN application i18n

Status: **COMPLETE**

- All V1.2 UI strings have English and Russian entries.
- V1.2 dictionary parity is unit-tested.
- Runtime/template/HTTP/logic validation errors have localized English and Russian messages.
- Validation-dictionary parity is unit-tested.
- Live language switching and persisted locale remain covered by the production browser smoke.
- Project-owned user content is never automatically translated.

## aiogram 3 generator

Status: **COMPLETE**

Generated V1.2 runtime adds:

```text
generated_bot/runtime/templates.py
generated_bot/runtime/http.py
generated_bot/runtime/flow.py
generated_bot/states/flow.py
```

Generated bot behavior includes:

- aiogram 3
- FSM wait/resume for Input nodes
- `MemoryStorage`
- deterministic flow execution
- condition branches
- runtime variables/templates
- aiohttp integrations
- HTTP success/error routing
- environment values loaded at runtime
- 100-step loop guard

`requirements.txt` includes aiogram, aiohttp and python-dotenv.

`.env.example` contains `BOT_TOKEN` placeholder and configured environment-variable **names only**.

Code Mode and ZIP export use the same deterministic generator/virtual-file model.

## Security / export verification

Status: **COMPLETE**

Both production browser smoke scenarios:

- export the generated aiogram ZIP
- extract it
- verify expected generated files
- scan generated text for Telegram-token-shaped secrets
- execute `python3 -m compileall generated_bot`

No real bot token or integration secret is stored in Project JSON or generated source.

## V1.2 unit coverage

CI #55 executed **60 passing tests** across 6 files:

- domain: 16
- V1.2 runtime: 21
- store: 10
- i18n: 5
- generator: 4
- persistence/migrations: 4

Coverage specifically includes templates, every condition operator, Input validation, simulator wait/resume, HTTP routing, infinite-loop protection, generated runtime files, schema migrations, undo/redo and target reconciliation.

---

# Previous completed releases

## V1.1

**COMPLETE.** Reply Keyboard, Bot Settings and application RU/EN i18n were completed before V1.2.

Final recorded V1.1 evidence: GitHub Actions CI **#38** (`35187668394`), commit `b6eb7b60815bdf99c0b6c760501ffe23f67a81a1` — PASS.

V1.2 preserves and re-tests the V1.1 keyboard/menu/i18n behavior in the legacy schema-v3 Playwright scenario.

## Original MVP

**COMPLETE.** The original inline-keyboard MVP was verified in GitHub Actions CI **#19** with 19 tests and the original mandatory browser smoke.

Core capabilities retained through V1.2:

- canonical local Project model
- Telegram preview
- screen editor
- Inline Keyboard editor and DnD
- Reply Keyboard editor and DnD
- callback / URL / screen actions
- Bot Commands and Menu Button
- localStorage recovery
- undo/redo
- derived Flow graph
- localized validation
- JSON import/export
- deterministic aiogram generator
- Code Mode
- ZIP export

---

## Non-blocking maintenance notes

Successful CI still reports tooling/dependency notices that do not fail the Definition of Done:

- GitHub JavaScript actions report the platform Node-runtime deprecation notice while project verification explicitly uses Node.js 22.
- Vitest/Vite reports a future config-loader warning for ESM syntax in `vitest.config.ts`.
- Some dependency versions emit upstream update/deprecation notices.
- Next.js reports that CI build caching is not configured and prints its standard anonymous telemetry notice.

These are maintenance items, not V1.2 functional blockers.
