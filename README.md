# TFlow — Telegram Bot Visual Builder

A local-first visual IDE for Telegram bots.

**Design → Flow → Code → Export**

The MVP lets you design Telegram message screens and inline keyboards, visually inspect screen transitions, validate the project, inspect generated source, and export a runnable **Python + aiogram 3** project.

## What is included

- Telegram-inspired live preview
- Screen CRUD
- Message / command / photo properties
- Inline keyboard builder
- Cross-row drag & drop
- Button actions: screen, callback, URL
- Undo / redo
- localStorage autosave and recovery
- Flow graph derived from button actions
- Project validation
- JSON import / export
- aiogram 3 generator
- Code viewer
- ZIP export

There is deliberately no auth, backend, database, cloud sync, bot hosting, payments, analytics, AI builder, or Mini App editor in this MVP.

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

Open the local Next.js URL shown in the terminal.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

After exporting an aiogram project:

```bash
python -m compileall generated_bot
```

## Architecture

`Project` is the only canonical product model.

```text
React UI
   ↓
Zustand actions/state
   ↓
Canonical Project
   ├── Telegram Preview
   ├── Validation
   ├── Flow projection
   └── aiogram Generator
          ↓
      Virtual Files
       ├── Code Mode
       └── ZIP Export
```

Flow edges are **derived from `button.action`** and are never persisted as a second transition model. Code Mode and ZIP export consume the **same generated virtual files**.

See:

- `AGENTS.md` — repository working agreement
- `MVP_PLAN.md` — complete implementation specification
- `PROGRESS.md` — actual implementation and verification state
