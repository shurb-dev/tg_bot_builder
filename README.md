# TFlow — Telegram Bot Visual Builder

A local-first visual IDE and low-code flow builder for Telegram bots.

**Design → Flow → Test → Code → Export**

TFlow lets you design Telegram message screens and keyboards, connect screens to runtime logic, simulate conversations locally, validate the complete project, inspect generated source, and export a runnable **Python + aiogram 3** bot.

## What is included

### Visual bot design

- Telegram-inspired live preview with native-style message buttons
- Screen create / rename / duplicate / delete
- Message text, command trigger, parse mode and photo URL properties
- Inline Keyboard builder
- Bottom Reply Keyboard builder
- Cross-row drag & drop for both keyboard types
- Undo / redo history
- localStorage autosave and corrupted-data recovery

### Inline Keyboard

Supported actions:

- Open screen
- Run logic node
- Custom callback
- HTTP/HTTPS URL

Telegram callback data is validated by **UTF-8 byte length** and must fit the Telegram 1–64 byte limit.

### Bottom Reply Keyboard

A screen can:

- keep the current bottom keyboard (`inherit`)
- show a new `ReplyKeyboardMarkup`
- remove the current keyboard with `ReplyKeyboardRemove`

Supported Reply Keyboard button actions:

- Open screen
- Run logic node
- Send text / custom text handler stub
- Request contact
- Request location
- Open HTTPS Web App

Supported keyboard options include resize, persistent, one-time, selective and input-field placeholder. Telegram-specific constraints are validated before export.

### Bot settings

Project-level Telegram settings include:

- Bot Commands (`set_my_commands`)
- Commands menu button
- Default menu button
- Web App menu button (`set_chat_menu_button`)
- project variables
- environment-variable definitions

Environment-variable definitions store **names only**. Secret values are never persisted in Project JSON.

## Runtime logic — V1.2

Flow Editor V2 supports five logic-node types:

- **Input** — asks for text, number, email or phone input, validates it and pauses the flow until a valid reply is received
- **Set Variable** — updates a project runtime variable
- **Condition** — evaluates one or more rules and routes through TRUE/FALSE outputs
- **HTTP Request** — performs GET/POST/PUT/PATCH/DELETE requests and routes through SUCCESS/ERROR outputs
- **Send Message** — renders a templated message and continues to the next target

Runtime transitions are canonical fields on screens and logic nodes. React Flow edges are always derived from those fields and are never persisted as a competing source of truth.

Deleting a screen or logic node reconciles references that pointed to it. Logic-node edits, movement and connections participate in normal undo/redo history.

### Templates and runtime namespaces

TFlow uses a small safe template syntax — no `eval` and no arbitrary JavaScript execution:

```text
{{user.first_name}}
{{input.email}}
{{vars.customer_name}}
{{http.create_order.status}}
{{http.create_order.json.id}}
{{env.CRM_TOKEN}}
```

Supported namespaces:

- `user.*` — Telegram user fields
- `input.*` — collected Input-node values
- `vars.*` — project runtime variables
- `http.<result>.*` — HTTP status/body/JSON data
- `env.*` — runtime environment values

## Test / Simulator mode

Test Mode executes the canonical project locally without a Telegram bot token.

It supports:

- `/start` and screen rendering
- inline/reply navigation into logic nodes
- Input pause/resume and validation errors
- Set Variable
- Condition branching
- HTTP mocks with status/body/JSON results
- Send Message
- runtime inspector for `user`, `input`, `vars`, `http` and `env`
- a 100-step automatic execution guard for accidental infinite loops

HTTP mocks make deterministic end-to-end flow testing possible without contacting external services.

## Flow Editor V2

- Screen and logic nodes share one graph
- Screen-button transitions are derived edges
- Input / Set Variable / Send Message expose NEXT
- Condition exposes TRUE / FALSE
- HTTP exposes SUCCESS / ERROR
- Connections update canonical project transitions
- Node positions are persisted as editor metadata
- Positions and transitions survive reload and JSON round-trip

## Application languages

The complete editor UI supports:

- English
- Русский

Language changes apply immediately without reload and the preference persists locally. Project-owned content such as screen names, message text and button text is **never automatically translated**.

Validation messages, including V1.2 runtime/HTTP/template errors, are localized in both languages.

## Validation and export

- schema v3 project validation
- localized validation messages
- template-path validation
- variable/environment definition validation
- logic target and branch validation
- Input validation configuration checks
- HTTP URL/body/timeout/mock validation
- reachability analysis across the combined screen + logic graph
- JSON import / export
- backward-compatible migration from schema v1 and schema v2 to schema v3
- deterministic aiogram 3 generator
- Code viewer
- ZIP export
- generated Python secret scan in CI
- generated Python `compileall` verification

The editor deliberately has no auth, backend, database, cloud sync, managed bot hosting, payments, analytics, AI builder, or Mini App designer.

## Run locally

Requirements:

- Node.js 22+
- pnpm 11+
- Python 3.11+ only for validating generated Python

```bash
corepack enable
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/editor
```

For a production-style local run:

```bash
pnpm build
pnpm start
```

## Verification

Run the complete application checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
```

The Playwright suite runs against `next start` and currently contains:

- the full legacy Design / keyboard / Flow / i18n / JSON / ZIP smoke scenario on schema v3
- a mandatory V1.2 runtime scenario that executes **Input → Set Variable → Condition → HTTP mock → Send Message** and inspects runtime values

Both ZIP scenarios extract the generated project, scan generated text for Telegram-token-shaped secrets and execute:

```bash
python3 -m compileall generated_bot
```

## Architecture

`Project` is the canonical product model.

```text
React UI
   ↓
Zustand actions/state
   ↓
Canonical Project (schema v3)
   ├── Telegram Preview
   ├── Validation
   ├── Flow projection
   ├── Test / Simulator runtime
   └── aiogram Generator
          ↓
      Virtual Files
       ├── Code Mode
       └── ZIP Export
```

Application preferences such as editor locale are intentionally stored separately from project data.

Flow edges are **derived from canonical transitions** and are never persisted as a second transition model. Code Mode and ZIP export call the same deterministic generator and therefore consume the same generated virtual-file model.

## Project data compatibility

Current project schema:

```text
schemaVersion = 3
```

Legacy projects are migrated automatically on load/import:

```text
v1
 ↓
v2 inlineKeyboard + replyKeyboard + botSettings
 ↓
v3 logicNodes + variables + environmentVariables
```

Existing screen, keyboard, bot-settings and editor-position data is preserved during migration. New V1.2 collections default safely to empty arrays for legacy projects.

## Generated aiogram project

ZIP export includes a structure similar to:

```text
generated_bot/
├── bot.py
├── config.py
├── handlers/
│   ├── __init__.py
│   └── screens.py
├── keyboards/
│   ├── __init__.py
│   ├── inline.py
│   └── reply.py
├── runtime/
│   ├── __init__.py
│   ├── templates.py
│   ├── http.py
│   └── flow.py
├── states/
│   ├── __init__.py
│   └── flow.py
├── .env.example
├── requirements.txt
└── README.md
```

Generated runtime uses:

- aiogram 3
- aiogram FSM + `MemoryStorage`
- aiohttp
- python-dotenv
- the same V1.2 template/flow semantics as the local simulator

The generated source never contains a real bot token or persisted integration secret. Add `BOT_TOKEN` and required integration values to a local `.env` only after export.

## Repository documents

- `AGENTS.md` — repository working agreement
- `MVP_PLAN.md` — original MVP implementation specification
- `V1_1_PLAN.md` — V1.1 keyboard/menu/i18n specification
- `V1_2_PLAN.md` — V1.2 runtime-logic/Test Mode specification and Definition of Done
- `PROGRESS.md` — current implementation and verification state
