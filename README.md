# TFlow — Telegram Bot Visual Builder

A local-first visual IDE for Telegram bots.

**Design → Flow → Code → Export**

TFlow lets you design Telegram message screens, inline keyboards and bottom reply keyboards, inspect conversation transitions, validate the project, inspect generated source, and export a runnable **Python + aiogram 3** project.

## What is included

### Visual bot design

- Telegram-inspired live preview
- Screen create / rename / duplicate / delete
- Message text, command trigger, parse mode and photo URL properties
- Inline keyboard builder
- Bottom Reply Keyboard builder
- Cross-row drag & drop for both keyboard types
- Undo / redo history
- localStorage autosave and corrupted-data recovery

### Inline Keyboard

Supported actions:

- Open screen
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

### Flow

- Flow graph is derived from screen actions; edges are never persisted as a competing source of truth
- Inline and Reply Keyboard screen actions both create derived flow edges
- Node positions are persisted as editor metadata
- Nodes can be moved and retain their positions after reload and JSON round-trip

### Application languages

The editor UI supports:

- English
- Русский

Language changes apply immediately without a reload and the preference persists locally. Project content such as screen names, message text and button text is **never automatically translated**.

### Validation and export

- Project validation with localized messages
- JSON import / export
- Backward-compatible migration from schema v1 to schema v2
- aiogram 3 generator
- Code viewer
- ZIP export
- Generated Python secret scan in CI
- Generated Python `compileall` verification

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

The Playwright smoke test runs against `next start` and exercises the full Design → Flow → Code → JSON/ZIP export path.

After exporting an aiogram project manually:

```bash
python -m compileall generated_bot
```

## Architecture

`Project` is the canonical product model.

```text
React UI
   ↓
Zustand actions/state
   ↓
Canonical Project (schema v2)
   ├── Telegram Preview
   ├── Validation
   ├── Flow projection
   └── aiogram Generator
          ↓
      Virtual Files
       ├── Code Mode
       └── ZIP Export
```

Application preferences such as editor locale are intentionally stored separately from project data.

Flow edges are **derived from button actions** and are never persisted as a second transition model. Code Mode and ZIP export consume the **same generated virtual files**.

## Project data compatibility

Current project schema:

```text
schemaVersion = 2
```

Legacy schema v1 projects are migrated on load/import:

```text
v1 keyboard
   ↓
v2 inlineKeyboard
v2 replyKeyboard = inherit
v2 botSettings defaults
```

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
├── .env.example
├── requirements.txt
└── README.md
```

The generated source never contains a real bot token. Add `BOT_TOKEN` to a local `.env` only after export.

## Repository documents

- `AGENTS.md` — repository working agreement
- `MVP_PLAN.md` — original MVP implementation specification
- `PROGRESS.md` — actual implementation and verification state
