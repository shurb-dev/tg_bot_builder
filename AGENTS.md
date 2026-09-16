AGENTS.md

1. Project Mission

This repository contains a visual IDE for designing Telegram bots.

Core workflow: Design → Flow → Code → Export.

The MVP lets users create Telegram screens and inline keyboards, connect screens, preview the bot, persist the project locally, inspect generated code, and export a runnable aiogram 3 project.

The source of truth for MVP requirements is MVP_PLAN.md.

2. Source of Truth

Instruction priority:

1.  AGENTS.md

2.  MVP_PLAN.md

3.  Existing architecture and established patterns

4.  README.md

5.  Agent assumptions

Rules:

Do not invent product requirements.

If something is not required by MVP_PLAN.md, do not add it merely because it seems useful.

Prefer existing project patterns over new abstractions.

Stop and surface decisions that materially change architecture or product direction.

3. MVP Scope

IN SCOPE: Design, Flow, Code, Export, Persistence, Validation, Undo/Redo, Tests.

OUT OF SCOPE: Auth, backend, database, AI, bot hosting, payments, analytics, user accounts, cloud sync, collaboration, Mini Apps.

Do not implement out-of-scope features “while we’re here”.

4. Tech Stack

Use: Next.js, React, TypeScript strict, Tailwind CSS, shadcn/ui, Zustand, @xyflow/react, dnd-kit, Zod, JSZip, Vitest, pnpm.

Do not replace an established library without concrete technical necessity.

Do not introduce another state manager, build system, router, or UI framework.

5. Architecture Rules

React UI
   ↓
Zustand Store
   ↓
Project Domain Model
   ↓
Validation / Generators

React components render UI and dispatch actions.

Components must not directly mutate the project model.

Business logic must not live inside JSX.

Domain, validation, and generator layers must not depend on React.

aiogram generation must operate on the project domain model.

Do not duplicate domain rules across layers.

Prefer boring, explicit code over clever abstractions.

6. Data Model Rules

The project model is the canonical source of truth.

button.action is the source of truth for screen transitions.

Flow edges are derived from button actions and must never diverge from them.

Persistent IDs use UUIDs.

Persisted data has a schema version and is validated with Zod.

Migrations are explicit and should remain backward-compatible where practical.

Do not silently discard invalid critical project data.

7. Coding Standards

Keep TypeScript strict; avoid any.

No @ts-ignore without explanation.

Do not disable ESLint rules to hide errors.

No dead code, commented-out implementations, duplicated domain logic, or silent catch {}.

Keep naming consistent with the existing codebase.

Prefer small, testable functions and existing abstractions.

Do not refactor unrelated code while implementing a feature.

If unrelated technical debt is found, report it instead of fixing it incidentally.

8. Component Rules

A component should have one clear responsibility.

Prefer components such as EditorLayout, ScreenSidebar, TelegramPreview, KeyboardBuilder, ButtonProperties, FlowEditor, and CodeViewer.

Avoid giant multi-thousand-line components.

Do not extract a component merely to wrap a few trivial lines of JSX.

9. State Management Rules

Zustand owns application-level editor state: project, selection, editorMode, history.

Short-lived UI-only state may stay local: dialogs, dropdowns, hover, focus.

Project changes go through explicit actions:

createScreen()
deleteScreen()
updateScreen()
addButton()
updateButton()
deleteButton()
moveButton()
setNodePosition()
undo()
redo()

Components must never mutate project directly.

Derived state should be computed instead of persisted twice when practical.

10. Persistence Rules

localStorage
    ↓
Zod validation
    ↓
migration
    ↓
store

Validate before loading data into the store.

Migrate older schema versions before use.

Corrupted localStorage must not crash the app.

If data cannot be safely recovered, show a warning and load a safe default project.

JSON export/import must round-trip without semantic data loss.

11. Telegram Rules

callback_data must be <= 64 bytes.

URL buttons must use valid HTTP/HTTPS URLs.

Screen targets must exist.

Generated callback identifiers must remain stable.

Do not invent keyboard behavior Telegram does not support.

Keyboard layout is row-based, e.g.:

ROW 1  [A] [B]
ROW 2  [C]

Do not model arbitrary pixel positions for Telegram keyboard buttons.

12. Generator Rules

Generated code is part of the product.

Use one canonical pipeline:

Project Domain Model
        ↓
Generator
        ↓
Virtual Files
      ↙     ↘
Code Viewer  ZIP Export

Code Viewer and ZIP export must consume the same generated files.

Do not create separate generators for viewer and export.

Generation must be deterministic for the same project state.

Keep generator logic testable without React.

13. Generated Python Quality

Generated projects must use aiogram 3.x and contain readable Python, .env.example, requirements.txt, and README.md.

They must contain no real tokens, secrets, absolute paths, or machine-specific config.

Verify generated Python with:

python -m compileall .

If Python is unavailable, report that verification as not run.

14. Testing Policy

Add meaningful tests for new domain behavior when reasonably testable.

Prioritize store actions, undo/redo, validation, serialization, migrations, generator output, callback generation, derived flow edges, and persistence recovery.

Test UI where important behavior cannot be verified below the UI layer.

Do not add trivial snapshot tests merely to increase coverage.

Do not weaken or delete valid tests just to make the suite pass.

15. Mandatory Verification

After significant changes run:

pnpm lint
pnpm typecheck
pnpm test

Before completing a milestone run:

pnpm lint
pnpm typecheck
pnpm test
pnpm build

Never claim work is complete while required checks are red.

If a check cannot run, state exactly which check and why.

16. Browser Verification

For meaningful editor changes, smoke-test:

Create screen
→ Edit text
→ Add button
→ Drag/reorder button
→ Connect screen
→ Open Flow
→ Reload
→ Verify persistence
→ Open Code
→ Export ZIP

Also verify selection coherence, correct keyboard rows, Flow matching button actions, no dangling deleted targets, and Code Viewer matching exported files.

17. Bug Fix Policy

Fix root causes, not symptoms.

Do not hide state bugs behind setTimeout, delayed regeneration, or similar timing hacks.

For non-trivial bugs: reproduce → identify owning layer → find root cause → add regression test when practical → fix the smallest correct boundary → rerun relevant checks.

Do not remove working behavior merely to make tests pass.

18. Dependency Policy

Before `pnpm add`:

1.  Check whether an existing dependency already solves the problem.

2.  Check whether the existing stack is sufficient.

3.  Justify the long-term maintenance cost.

Do not install a library for a trivial helper.

19. Git Rules

No force push.

No git reset --hard unless explicitly necessary and safe.

Do not delete, overwrite, or modify unrelated work.

Keep commits focused when commits are requested.

Preferred commit style:

feat(editor): add keyboard drag and drop
fix(flow): persist node positions
test(generator): validate aiogram callbacks

20. Autonomous Work Policy

Do not ask the user to decide routine engineering details.

Decide autonomously on small naming choices, helper placement, debounce values, and equivalent implementation details inside the established architecture.

Stop and surface decisions that would replace Next.js/Zustand, introduce backend/database/auth, fundamentally change the domain model, change Telegram interaction semantics, or replace the generator architecture.

21. Anti-Scope-Creep

Do NOT implement “while we’re here”: authentication, backend services, PostgreSQL, AI features, Telegram hosting, analytics, payments, user accounts, cloud sync, collaboration, Mini Apps, or unrelated refactors.

Mention out-of-scope ideas separately and continue with the requested MVP work.

22. Progress Tracking

Maintain:

AGENTS.md
MVP_PLAN.md
PROGRESS.md
README.md

Responsibilities:

AGENTS.md — how agents must work.

MVP_PLAN.md — what must be built.

PROGRESS.md — what is completed and verified.

README.md — how humans run and use the project.

PROGRESS.md should track milestone tasks plus lint/typecheck/test/build verification.

Only mark work complete when it is actually complete.

23. Definition of Done

The MVP is not done until:

Design works.

Flow works.

Persistence works.

JSON round-trip works.

Code generation works.

ZIP export works.

Generated Python compiles.

Undo/Redo works.

Validation prevents invalid project states.

pnpm lint passes.

pnpm typecheck passes.

pnpm test passes.

pnpm build passes.

Browser smoke test passes.

A feature is not complete merely because its isolated component works; integration behavior matters.

Working Principle

Keep this file short, stable, and enforceable.

Detailed acceptance criteria, field definitions, deletion behavior, ZIP structure, and milestone requirements belong in MVP_PLAN.md.

AGENTS.md = project constitution.

MVP_PLAN.md = technical specification.

PROGRESS.md = execution state.

README.md = human usage guide.
