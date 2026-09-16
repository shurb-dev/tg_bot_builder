# Telegram Bot Visual Builder --- MVP Execution Plan

> **Document type:** executable MVP specification for a coding agent\
> **Primary agent target:** GPT-5.6 Sol / Codex-style autonomous coding
> agent\
> **Status:** implementation-ready\
> **Product principle:** **Design → Flow → Code → Export**\
> **MVP boundary:** local-first visual designer and aiogram 3 code
> generator; **not** a bot hosting/runtime platform.

------------------------------------------------------------------------

## 0. How the coding agent must use this document

This file is the implementation source of truth for the MVP. Read it
completely before making architectural changes.

Before coding:

1.  Read `AGENTS.md`.
2.  Read this file completely.
3.  Inspect the current repository, package manager, existing
    components, tests, and configuration.
4.  Compare the repository state against the milestones in this
    document.
5.  Continue from the first incomplete milestone. Do not rebuild working
    functionality without a concrete reason.
6.  Record material progress and verification evidence in `PROGRESS.md`.

For a large milestone, work in this loop:

**Explore → Plan the concrete diff → Implement → Verify → Fix →
Re-verify → Record progress**

Do not declare a milestone complete from code inspection alone. Execute
its required verification.

If this document conflicts with a speculative implementation idea, this
document wins unless the implementation is impossible or demonstrably
unsafe. If a requirement is ambiguous but the choice is local and
reversible, make the simplest reasonable engineering decision and record
it. Escalate only decisions that materially change product scope, public
data format, core architecture, or technology stack.

------------------------------------------------------------------------

# 1. Product definition

## 1.1 Problem

Designing Telegram bot conversations is currently split across code,
screenshots, documents, JSON, and hand-written callback mappings. This
makes it unnecessarily difficult to:

-   see the final inline keyboard layout;
-   reorder buttons quickly;
-   understand transitions between bot screens;
-   catch broken screen links and invalid callback data before runtime;
-   hand a visual bot design to a developer;
-   generate a clean implementation from the design.

## 1.2 MVP solution

Build a desktop-first web application that lets a user visually design
Telegram bot screens and inline keyboards, connect screens into a flow,
preview the result, validate it, and export a runnable **Python +
aiogram 3** project.

The application itself does **not** execute or host Telegram bots in the
MVP.

## 1.3 Core user journey

``` text
Open app
  ↓
Create / open project
  ↓
Create screens
  ↓
Edit message + keyboard
  ↓
Drag buttons into desired rows
  ↓
Connect buttons to screens
  ↓
Inspect flow graph
  ↓
Validate project
  ↓
Inspect generated code
  ↓
Export JSON or aiogram ZIP
```

## 1.4 Product promise

A user should be able to build a small multi-screen Telegram bot without
manually writing keyboard or routing boilerplate, then receive source
code that can be opened in an IDE and extended normally.

------------------------------------------------------------------------

# 2. Research-derived product decisions

The MVP deliberately combines the strongest ideas from existing
open-source approaches without copying their full scope.

## 2.1 Telegram UI Builder --- design layer

Adopt these ideas:

-   Telegram-like live preview;
-   inline keyboard visual editing;
-   multiple conversation screens;
-   flow visualization;
-   pre-runtime validation;
-   JSON as a portable design contract;
-   clear separation between design tool and actual bot runtime.

Do **not** require Supabase or any hosted backend for the MVP.

## 2.2 Telegram Bot Builder --- code generation

Adopt these ideas:

-   visual model can generate aiogram 3 code;
-   generated source should be downloadable and editable;
-   keyboard and routing boilerplate should be generated automatically.

Do **not** adopt for MVP:

-   PostgreSQL;
-   Redis;
-   bot process manager;
-   analytics;
-   broadcasts;
-   runtime hosting;
-   user accounts;
-   HTTP/DB logic nodes.

## 2.3 dev\>nulll --- flow UX

Adopt conceptually:

-   visual flow as a first-class representation;
-   local-first project editing;
-   portable project data;
-   strong visual distinction between nodes and connections.

Do **not** adopt its runtime, bot-token management, payments, Mini App
designer, analytics, or desktop wrapper.

Its archived AGPL code is a reference only. Do not copy AGPL
implementation into this project unless the repository license and
product licensing strategy explicitly allow it.

## 2.4 Blockly-style builders

Do not use Blockly for the MVP. Hundreds of programming blocks solve a
broader low-code programming problem than the MVP needs. The MVP is
screen/keyboard-centric, not a general visual programming environment.

## 2.5 React Flow / XYFlow

Use a node graph only for the conversation topology. Node positions are
editor metadata; transitions remain domain data.

## 2.6 dnd-kit

Use sortable multi-container drag-and-drop for inline keyboard rows.
Each keyboard row acts as a sortable container. Empty rows must remain
droppable while a drag is active.

## 2.7 Telegram Bot API constraints

The editor must model actual Telegram constraints rather than arbitrary
canvas positioning.

For MVP inline buttons:

-   button text is required;
-   callback data is measured in **UTF-8 bytes**, not JavaScript string
    length;
-   callback data must be 1--64 bytes when explicitly used;
-   URL actions must use a supported URL scheme accepted by the MVP;
-   a Telegram inline button has one action, not multiple actions;
-   keyboard layout is row-based, not pixel-positioned.

------------------------------------------------------------------------

# 3. Success criteria

The MVP is successful when a new user can complete the following without
editing application source code:

1.  Open the editor.
2.  See a valid demo project.
3.  Create a new screen.
4.  Rename it.
5.  Edit its message.
6.  Add an inline keyboard row.
7.  Add multiple buttons.
8.  Reorder buttons in one row.
9.  Move a button to another row.
10. Configure a button to open another screen.
11. Configure a URL button.
12. Configure a custom callback button.
13. See changes immediately in Telegram preview.
14. Open Flow mode and see screen transitions.
15. Move flow nodes and retain positions after reload.
16. Open Code mode and inspect generated files.
17. Export project JSON.
18. Import the exported JSON and preserve the project.
19. Export a ZIP containing an aiogram 3 project.
20. Add `BOT_TOKEN`, install dependencies, and run the generated bot.
21. Pass all mandatory application validation and build checks.

------------------------------------------------------------------------

# 4. Explicit non-goals

Do **not** implement these in the MVP:

-   authentication;
-   registration;
-   cloud accounts;
-   teams;
-   collaboration;
-   backend API;
-   PostgreSQL;
-   Redis;
-   Supabase;
-   cloud synchronization;
-   bot token storage;
-   Telegram polling from the builder;
-   Telegram webhook runtime;
-   managed hosting;
-   deployment;
-   analytics;
-   broadcasts;
-   CRM;
-   payments;
-   subscriptions;
-   AI generation;
-   AI chat;
-   arbitrary Python blocks;
-   arbitrary JavaScript blocks;
-   HTTP request nodes;
-   database nodes;
-   variables;
-   conditions;
-   loops;
-   delays;
-   user-input state machines;
-   Telegram Stars;
-   Mini App designer;
-   reply keyboard builder;
-   inline-mode builder;
-   group/forum automation;
-   multi-user editing;
-   plugin marketplace;
-   mobile editor;
-   exact pixel-perfect Telegram clone.

If a requested implementation is not necessary for **Design → Flow →
Code → Export**, assume it is out of scope unless this document
explicitly includes it.

------------------------------------------------------------------------

# 5. Technology decisions

Use stable versions compatible with the repository at implementation
time.

## 5.1 Required stack

-   **Next.js** with App Router
-   **React**
-   **TypeScript** with strict mode
-   **pnpm**
-   **Tailwind CSS**
-   **shadcn/ui** or its underlying Radix primitives where appropriate
-   **Zustand**
-   **@xyflow/react**
-   **dnd-kit**
-   **Zod**
-   **JSZip**
-   **Lucide**
-   **Vitest**
-   **React Testing Library**

## 5.2 Avoid unless already justified

Do not introduce:

-   Redux;
-   MobX;
-   GraphQL;
-   tRPC;
-   Prisma;
-   database drivers;
-   server actions for project state;
-   a custom backend;
-   Electron/Wails/Tauri;
-   Monaco Editor solely for MVP code viewing if a lightweight read-only
    code renderer is sufficient.

## 5.3 Runtime model

The editor is a client-side application for MVP.

``` text
Browser
  ├── Project state (Zustand)
  ├── Persistence (localStorage)
  ├── Validation (Zod + domain validator)
  ├── Telegram preview
  ├── Flow projection
  └── aiogram generator
         ↓
      virtual file map
       ├── Code viewer
       └── ZIP exporter
```

There is no authoritative server state.

------------------------------------------------------------------------

# 6. Repository architecture

Prefer feature/domain boundaries over one giant component tree.

Recommended structure:

``` text
src/
├── app/
│   ├── page.tsx
│   └── editor/
│       └── page.tsx
├── components/
│   ├── editor/
│   │   ├── EditorShell.tsx
│   │   ├── EditorHeader.tsx
│   │   ├── ScreenSidebar.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── ValidationPanel.tsx
│   ├── telegram/
│   │   ├── TelegramPreview.tsx
│   │   ├── TelegramMessage.tsx
│   │   ├── KeyboardBuilder.tsx
│   │   ├── KeyboardRow.tsx
│   │   └── TelegramButton.tsx
│   ├── flow/
│   │   ├── FlowEditor.tsx
│   │   ├── ScreenNode.tsx
│   │   └── FlowToolbar.tsx
│   └── code/
│       ├── CodeWorkspace.tsx
│       ├── FileTree.tsx
│       └── CodeViewer.tsx
├── domain/
│   ├── project/
│   │   ├── types.ts
│   │   ├── schema.ts
│   │   ├── defaults.ts
│   │   ├── validation.ts
│   │   ├── migrations.ts
│   │   └── selectors.ts
│   └── telegram/
│       ├── limits.ts
│       └── utf8.ts
├── store/
│   ├── project-store.ts
│   └── history.ts
├── persistence/
│   └── local-project.ts
├── generators/
│   └── aiogram/
│       ├── index.ts
│       ├── callbacks.ts
│       ├── handlers.ts
│       ├── keyboards.ts
│       ├── project-files.ts
│       └── templates.ts
├── export/
│   ├── json.ts
│   └── zip.ts
└── tests/
```

This is guidance, not a requirement to create empty files prematurely.

------------------------------------------------------------------------

# 7. Domain model

## 7.1 Core principle

The saved project domain must not store two competing representations of
the same transition.

**`button.action` is the source of truth for screen-to-screen
transitions.**

Flow edges are derived from screen actions.

Flow node positions are stored as editor metadata.

## 7.2 Types

Use branded/clear string IDs where practical, but do not over-engineer.

``` ts
export type Project = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  screens: Screen[];
};

export type Screen = {
  id: string;
  name: string;
  trigger: ScreenTrigger | null;
  message: TelegramMessage;
  keyboard: KeyboardRow[];
  editor: {
    flowPosition: {
      x: number;
      y: number;
    };
  };
};

export type ScreenTrigger =
  | {
      type: "command";
      command: string;
    };

export type TelegramMessage = {
  text: string;
  parseMode: "none" | "HTML" | "MarkdownV2";
  media:
    | null
    | {
        type: "photo";
        url: string;
      };
};

export type KeyboardRow = {
  id: string;
  buttons: InlineButton[];
};

export type InlineButton = {
  id: string;
  text: string;
  action: ButtonAction;
};

export type ButtonAction =
  | {
      type: "screen";
      screenId: string;
    }
  | {
      type: "callback";
      callbackData: string;
    }
  | {
      type: "url";
      url: string;
    };
```

## 7.3 Why edges are not persisted

Persisting both:

``` text
button.action.screenId
```

and:

``` text
edges[]
```

creates synchronization bugs.

Instead:

``` text
Project
  ↓
deriveFlowEdges(project)
  ↓
React Flow edges
```

The graph is a projection of the domain model.

## 7.4 IDs

Use `crypto.randomUUID()` where supported.

Never use array indexes as persistent IDs.

## 7.5 Timestamps

Use ISO 8601 strings.

Updating editor-only selections must not mutate `updatedAt`; meaningful
project changes should.

------------------------------------------------------------------------

# 8. Project schema and migration policy

All imported and persisted data must pass through Zod.

Current schema:

``` text
schemaVersion = 1
```

Loading pipeline:

``` text
raw JSON
  ↓
parse
  ↓
detect schemaVersion
  ↓
migrate if necessary
  ↓
Zod validate
  ↓
normalize
  ↓
load into store
```

For MVP, only version 1 needs to exist, but build the loader so adding
migrations later does not require replacing persistence architecture.

Never trust localStorage or imported files.

------------------------------------------------------------------------

# 9. Default demo project

On a clean first launch, create:

``` text
/start
  ↓
Main Menu
 ├── Catalog
 ├── Profile
 └── Support
```

Main Menu message:

``` text
Добро пожаловать!

Выберите раздел:
```

Keyboard:

``` text
[ 🛒 Каталог ] [ 👤 Профиль ]
[       💬 Поддержка        ]
```

Catalog, Profile, and Support must contain simple messages and a
`← Назад` button to Main Menu.

The demo must itself pass validation.

Do not hardcode demo rendering in React components. Generate it through
the normal project model.

------------------------------------------------------------------------

# 10. Application shell

## 10.1 Desktop-first layout

Target comfortable use at widths \>= 1280px.

``` text
┌─────────────────────────────────────────────────────────────┐
│ Brand | Project | Design | Flow | Code | Validate | Export │
├─────────────┬─────────────────────────────┬─────────────────┤
│ Screens     │                             │ Properties      │
│             │        Workspace            │                 │
│ Main        │                             │                 │
│ Catalog     │                             │                 │
│ Profile     │                             │                 │
│ Support     │                             │                 │
│             │                             │                 │
│ + Screen    │                             │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

## 10.2 Modes

Exactly three primary workspace modes:

-   **Design**
-   **Flow**
-   **Code**

Validation and Export are actions/panels, not additional primary
editors.

## 10.3 Minimum-width behavior

Below the supported editor width, show a clear non-blocking or blocking
desktop recommendation rather than attempting a broken mobile layout.

Mobile editing is not part of MVP.

------------------------------------------------------------------------

# 11. Project management in MVP

Support one active project persisted locally.

Required actions:

-   New project
-   Rename project
-   Reset to demo
-   Export JSON
-   Import JSON

A multi-project dashboard is not required for MVP.

Before replacing the active project with an imported/new project,
protect unsaved/non-exported work with an appropriate confirmation if
needed.

Because local autosave exists, "Save" means force-persist current state
and show confirmation; it is not the only persistence mechanism.

------------------------------------------------------------------------

# 12. Screen sidebar

The sidebar must support:

-   select screen;
-   create screen;
-   rename screen;
-   duplicate screen;
-   delete screen.

## 12.1 Create

New screen defaults:

-   unique ID;
-   `New Screen` or unique incremented name;
-   no trigger;
-   empty/default message;
-   one keyboard row or no rows, whichever produces the cleaner UX;
-   flow position offset from existing nodes.

## 12.2 Duplicate

Duplicate:

-   message;
-   keyboard;
-   actions;
-   media;
-   parse mode.

Generate new IDs for:

-   screen;
-   rows;
-   buttons.

Do not duplicate command trigger automatically if that would create
duplicate triggers. Prefer `trigger: null`.

## 12.3 Delete

Never allow deleting the last remaining screen.

Before deleting a referenced screen:

1.  determine inbound screen actions;
2.  show a confirmation explaining how many buttons reference it;
3.  on confirmation, remove the screen;
4.  convert/remove broken referencing actions using one deterministic
    policy.

Preferred MVP policy: delete referencing buttons only after explicit
confirmation because the current union type has no "unconfigured"
action. If a cleaner explicit `unconfigured` state is introduced, it
must be represented in schema and validation consistently.

Do not leave hidden dangling references.

------------------------------------------------------------------------

# 13. Design mode

Design mode is the MVP's primary editor.

It contains:

-   screen sidebar;
-   Telegram preview / keyboard workspace;
-   contextual properties panel.

The user must be able to understand the current screen without opening
Flow mode.

------------------------------------------------------------------------

# 14. Message editor

Editable properties:

-   screen name;
-   optional command trigger;
-   message text;
-   parse mode;
-   optional photo URL.

## 14.1 Command rules

Normalize user input:

``` text
/start → start
start  → start
```

Generated aiogram uses the normalized command.

Command must be non-empty after normalization and contain only a safe
Telegram-compatible command subset selected by the implementation.

Duplicate command triggers are validation errors.

## 14.2 Message text

Use a multiline textarea.

Preview updates immediately.

For MVP, the preview may display text rather than fully implementing
HTML/MarkdownV2 rendering. Generated code must preserve the selected
parse mode correctly.

## 14.3 Photo

MVP accepts a URL string; no uploads.

Validate before export.

Preview:

-   show image if loadable;
-   show graceful placeholder/error state if not;
-   never crash the editor.

------------------------------------------------------------------------

# 15. Telegram preview

Build a Telegram-inspired preview, not a trademark/pixel-perfect clone.

Show:

-   bot header;
-   message bubble;
-   optional photo;
-   message text;
-   inline keyboard.

Preview must use the same project state as the editor.

Do not maintain a second "preview model".

The inline keyboard preview must accurately reflect row grouping and
button order.

------------------------------------------------------------------------

# 16. Keyboard builder

This is a critical MVP subsystem.

## 16.1 Required operations

The user can:

-   add row;
-   remove row;
-   reorder rows;
-   add button;
-   remove button;
-   reorder button within row;
-   move button between rows;
-   select button;
-   edit selected button properties.

## 16.2 Drag-and-drop

Use dnd-kit.

Requirements:

-   row is a droppable container;
-   buttons are sortable;
-   cross-row movement works;
-   empty rows remain valid drop targets during drag;
-   visual insertion feedback exists;
-   cancel restores the previous valid state;
-   keyboard state commits deterministically on drop;
-   keyboard cannot accidentally duplicate a dragged button;
-   drag operation must not corrupt undo history.

## 16.3 Empty rows

Outside an active drag, normalize unnecessary empty rows.

However, do not immediately remove an empty row if doing so makes
cross-container drag impossible.

Implement normalization at a safe point such as drag completion or
explicit edit completion.

## 16.4 Row reorder

Provide a dedicated drag handle so clicking a button does not
accidentally drag the whole row.

------------------------------------------------------------------------

# 17. Button properties

Selecting a button opens its properties.

Fields:

-   text;
-   action type;
-   action-specific fields.

Supported action types:

### Go to screen

``` text
Target screen: [ Catalog ▼ ]
```

### Callback

``` text
Callback data: [ catalog_open ]
```

### URL

``` text
URL: [ https://example.com ]
```

## 17.1 Validation

Button text:

-   required;
-   trimmed validation, but do not unexpectedly rewrite intentional
    spaces in stored text.

Callback:

-   required;
-   count UTF-8 bytes with `TextEncoder`;
-   1--64 bytes.

URL:

-   required;
-   MVP accepts `http:` and `https:` for predictable safe export;
-   reject malformed values.

Screen:

-   target must exist;
-   self-links are allowed.

Show errors near fields and in global validation.

------------------------------------------------------------------------

# 18. Selection model

Store editor selection separately from the persisted project.

Example:

``` ts
type EditorSelection =
  | { type: "screen"; screenId: string }
  | { type: "button"; screenId: string; rowId: string; buttonId: string }
  | null;
```

Do not persist transient hover/focus state.

On deleting a selected entity, clear or move selection predictably.

------------------------------------------------------------------------

# 19. Flow mode

Use `@xyflow/react`.

## 19.1 Node projection

Each screen becomes one node.

Node displays:

-   screen name;
-   command trigger if present;
-   short message excerpt;
-   button count.

## 19.2 Edge projection

For every button where:

``` ts
button.action.type === "screen"
```

derive an edge:

``` text
source = containing screen
target = button.action.screenId
```

Use stable derived edge IDs based on button IDs.

Do not persist these edges separately.

## 19.3 Required interactions

-   pan;
-   zoom;
-   fit view;
-   minimap;
-   move node;
-   persist node position;
-   select node;
-   double-click node → switch to Design mode and select screen.

## 19.4 Editing connections

For MVP, Flow mode is **read-only for topology**.

Users create/delete screen transitions through button properties in
Design mode.

This is an intentional scope decision. Direct edge creation introduces
ambiguous semantics: every Telegram transition requires a concrete
button with text and action. Add graph-based edge creation after MVP.

## 19.5 Position persistence

Persist only:

``` text
screen.editor.flowPosition
```

React Flow viewport persistence is optional.

------------------------------------------------------------------------

# 20. Validation engine

Validation is domain logic and must not depend on React.

Return structured issues:

``` ts
type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  code: string;
  message: string;
  screenId?: string;
  buttonId?: string;
};
```

## 20.1 Blocking errors

At minimum:

-   zero screens;
-   duplicate command triggers;
-   invalid command trigger;
-   button without text;
-   screen action targeting missing screen;
-   callback data outside 1--64 UTF-8 bytes;
-   malformed/unsupported URL;
-   invalid project schema;
-   generator invariant violation.

## 20.2 Warnings

At minimum:

-   no `/start` trigger;
-   unreachable screen from any command-trigger entry;
-   empty message and no meaningful content;
-   screen has no keyboard/buttons;
-   screen with no incoming transition and no trigger.

Warnings do not block export.

## 20.3 Reachability

Build graph from valid screen actions.

Roots are screens with command triggers.

If `/start` exists, use it as the primary reachability root while still
treating other command screens as valid entry points.

Avoid false positives when multiple commands intentionally create
separate flows.

## 20.4 Validation UI

Provide:

-   error/warning count;
-   issue list;
-   click issue → navigate to relevant screen/button when possible;
-   export button disabled or guarded when blocking errors exist.

------------------------------------------------------------------------

# 21. State management

Use Zustand for domain/editor state.

Recommended conceptual state:

``` ts
type AppStore = {
  project: Project;
  mode: "design" | "flow" | "code";
  selectedScreenId: string | null;
  selection: EditorSelection;

  createScreen(): void;
  duplicateScreen(id: string): void;
  renameScreen(id: string, name: string): void;
  deleteScreen(id: string): void;

  updateMessage(...): void;
  updateTrigger(...): void;

  addRow(...): void;
  removeRow(...): void;
  moveRow(...): void;

  addButton(...): void;
  updateButton(...): void;
  removeButton(...): void;
  moveButton(...): void;

  setFlowPosition(...): void;

  undo(): void;
  redo(): void;
};
```

Exact signatures are implementation details.

## 21.1 Mutation rules

Components call domain/store actions.

Do not mutate nested project arrays directly inside UI components.

Use immutable updates.

## 21.2 Selectors

Use narrow selectors to avoid re-rendering the entire editor for every
keystroke where practical.

Do not prematurely build a complex state framework.

------------------------------------------------------------------------

# 22. Undo / redo

Required for MVP.

Support at least 30 meaningful history states.

Keyboard shortcuts:

-   `Ctrl/Cmd + Z` → undo
-   `Ctrl/Cmd + Shift + Z` → redo

Do not record:

-   hover;
-   selection;
-   open dialog;
-   every flow viewport pan;
-   transient drag frames.

For text editing, avoid one history entry per character. Group/debounce
text edits into meaningful transactions.

A drag operation should become one history action.

------------------------------------------------------------------------

# 23. Persistence

Use localStorage.

Suggested key:

``` text
telegram-bot-visual-builder:project:v1
```

## 23.1 Autosave

Debounce meaningful project persistence approximately 300--500 ms.

## 23.2 Load

On startup:

``` text
localStorage
  ↓
JSON.parse
  ↓
migration
  ↓
Zod
  ├── valid → load
  └── invalid → recovery UI + safe demo
```

Never crash because persisted data is corrupted.

## 23.3 Recovery

If stored data is invalid:

-   preserve the raw invalid value until the user chooses to reset if
    feasible;
-   show a useful warning;
-   allow reset to demo;
-   do not silently destroy recoverable user data.

------------------------------------------------------------------------

# 24. JSON import/export

## 24.1 Export

Export the canonical project model only.

Filename:

``` text
<slug>.tgbot.json
```

Validate before export.

Pretty-print JSON for portability.

## 24.2 Import

Accept:

-   `.json`
-   `.tgbot.json`

Pipeline:

``` text
File
 ↓
read text
 ↓
JSON parse
 ↓
migrate
 ↓
Zod validate
 ↓
domain validate
 ↓
confirmation
 ↓
replace active project
```

Malformed files must produce actionable errors, never uncaught
exceptions.

## 24.3 Round-trip invariant

For a valid project:

``` text
project
 → export JSON
 → import JSON
 → normalized project
```

must preserve all meaningful domain state and flow positions.

Timestamps may change only if explicitly designed to.

Add a test for this.

------------------------------------------------------------------------

# 25. aiogram generator architecture

The generator is a first-class domain subsystem.

It must not depend on React or browser DOM APIs.

## 25.1 Single generator output

Use one canonical virtual file representation:

``` ts
type GeneratedFile = {
  path: string;
  content: string;
};

type GeneratedProject = {
  files: GeneratedFile[];
};
```

Pipeline:

``` text
Project
  ↓
validate
  ↓
generateAiogramProject(project)
  ↓
GeneratedProject
   ├── Code mode
   └── ZIP export
```

Code mode and ZIP export must never use separate generation logic.

## 25.2 Generated project

Target structure:

``` text
generated_bot/
├── bot.py
├── config.py
├── handlers/
│   ├── __init__.py
│   └── screens.py
├── keyboards/
│   ├── __init__.py
│   └── screens.py
├── requirements.txt
├── .env.example
└── README.md
```

The exact number of generated Python modules can change if needed for
clean code, but avoid one enormous generated file.

------------------------------------------------------------------------

# 26. Callback strategy

Screen navigation needs deterministic callback data.

Do not put raw UUIDs into callback data if they create unnecessary
length or instability.

Create a deterministic compact route key.

Recommended approach:

``` text
screen:<stable-short-id>
```

Maintain an internal generator mapping:

``` text
route key → screen
```

Requirements:

-   \<= 64 UTF-8 bytes;
-   deterministic for a given project;
-   collision checked;
-   generated keyboard and handler use the same mapping.

Custom callback actions use the exact validated callback data supplied
by the user.

------------------------------------------------------------------------

# 27. Generated keyboard behavior

For each screen, generate an `InlineKeyboardMarkup` preserving rows
exactly.

Conceptually:

``` python
InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🛒 Каталог",
                callback_data="screen:catalog_key",
            ),
            InlineKeyboardButton(
                text="👤 Профиль",
                callback_data="screen:profile_key",
            ),
        ],
        [
            InlineKeyboardButton(
                text="Website",
                url="https://example.com",
            )
        ],
    ]
)
```

Do not flatten keyboard rows.

------------------------------------------------------------------------

# 28. Generated navigation handlers

A command-trigger screen generates a command handler.

Example concept:

``` python
@router.message(Command("start"))
async def start_handler(message: Message) -> None:
    await message.answer(
        "...",
        reply_markup=main_keyboard(),
    )
```

Screen-navigation callbacks generate callback handlers that render the
target screen.

Prefer editing the current bot message for callback navigation where
safe and straightforward, or consistently send a new message if that
produces a more reliable MVP. Pick one documented behavior and test it.

Always answer callback queries appropriately to avoid Telegram loading
state.

------------------------------------------------------------------------

# 29. Generated media behavior

If a screen has photo media:

-   generate the appropriate aiogram send/edit behavior;
-   keep caption/text within the selected parse mode;
-   if Telegram API limitations make seamless message editing across
    text/photo types complex, use a consistent safe strategy such as
    sending the target screen as a new message.

Do not fake support in the UI if generated code cannot execute it.

------------------------------------------------------------------------

# 30. Custom callback behavior

A custom callback action has no visual logic destination in MVP.

Generated project must therefore make this explicit.

Preferred implementation:

-   generate a centralized custom callback handler stub;
-   include callback values in readable code/comments;
-   answer the callback query;
-   leave a clear `TODO` only for the user's intentional custom business
    logic.

This is the one acceptable product-level TODO because the user
explicitly requested an external/custom action that the visual MVP
cannot define.

Do not generate crashing handlers.

------------------------------------------------------------------------

# 31. Generated configuration

`.env.example`:

``` env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

Never export real secrets.

`config.py` should read the environment variable and fail with a clear
error when absent.

Use a minimal dependency such as `python-dotenv` only if required by the
chosen implementation.

------------------------------------------------------------------------

# 32. Generated requirements

Pin compatible major/minor constraints reasonably rather than relying on
an unspecified future breaking version.

At minimum include:

``` text
aiogram>=3,<4
```

and environment dependency if used.

------------------------------------------------------------------------

# 33. Generated README

Generated bot README must include:

-   Python requirement;
-   virtual environment creation;
-   dependency installation;
-   copying `.env.example` to `.env`;
-   adding `BOT_TOKEN`;
-   running `python bot.py`;
-   explanation that custom callback handlers require user business
    logic;
-   project was generated by the visual builder.

Keep it concise and executable.

------------------------------------------------------------------------

# 34. Code mode

Code mode displays the exact `GeneratedProject`.

Layout:

``` text
┌──────────────────┬──────────────────────────────────────┐
│ generated_bot/   │                                      │
│  bot.py          │  selected file contents              │
│  config.py       │                                      │
│  handlers/       │                                      │
│  keyboards/      │                                      │
│  requirements    │                                      │
└──────────────────┴──────────────────────────────────────┘
```

Required:

-   file tree/list;
-   select file;
-   read-only code view;
-   copy file contents;
-   refresh automatically after project changes.

Syntax highlighting is desirable but not worth a heavyweight editor
dependency by itself.

------------------------------------------------------------------------

# 35. ZIP export

Use JSZip.

Filename:

``` text
<project-slug>-aiogram.zip
```

ZIP contents must exactly correspond to Code mode output.

Do not regenerate through a second path.

Before export:

1.  run domain validation;
2.  block on errors;
3.  generate virtual files;
4.  create ZIP;
5.  download.

Catch ZIP generation failures and show an actionable error.

------------------------------------------------------------------------

# 36. Keyboard shortcuts

Required:

  Shortcut               Action
  ---------------------- -----------------------------------
  Ctrl/Cmd + S           force local save
  Ctrl/Cmd + Z           undo
  Ctrl/Cmd + Shift + Z   redo
  Esc                    clear contextual selection
  Delete/Backspace       delete selected button where safe

Never intercept Delete/Backspace while typing in:

-   input;
-   textarea;
-   contenteditable.

Do not create destructive shortcuts without clear selection state.

------------------------------------------------------------------------

# 37. Destructive actions

Use confirmation dialogs for:

-   reset project;
-   replace project via import;
-   delete referenced screen;
-   other operations that can remove substantial work.

Deleting a single button does not necessarily require confirmation if
undo works.

------------------------------------------------------------------------

# 38. Notifications

Use restrained toast notifications for meaningful events:

-   project saved;
-   project imported;
-   JSON exported;
-   aiogram ZIP exported;
-   recovery/reset;
-   validation prevented export.

Do not toast every keystroke or trivial selection.

------------------------------------------------------------------------

# 39. Error handling

The editor must fail gracefully for:

-   corrupted localStorage;
-   malformed imported JSON;
-   unsupported schema version;
-   missing screen target;
-   invalid callback data;
-   invalid URL;
-   failed image load;
-   failed ZIP generation;
-   unexpected generator invariant.

Add an application-level error boundary for unexpected UI failures where
appropriate.

Do not use empty `catch {}` blocks.

------------------------------------------------------------------------

# 40. Accessibility baseline

MVP must have a reasonable desktop accessibility baseline:

-   buttons have accessible names;
-   icon-only controls have labels/tooltips;
-   inputs have labels;
-   focus indicators remain visible;
-   dialogs are keyboard accessible;
-   selected state is not conveyed only by color;
-   drag actions should have non-drag alternatives for essential editing
    where practical.

Do not postpone all accessibility because the UI is developer-facing.

------------------------------------------------------------------------

# 41. Performance expectations

MVP target:

-   dozens of screens should remain responsive;
-   text edits should not re-render the entire application
    unnecessarily;
-   Flow mode should handle at least \~100 screens reasonably on a
    normal desktop;
-   autosave should be debounced;
-   generator should be deterministic and fast enough to refresh Code
    mode interactively.

Do not optimize for thousands of nodes in MVP.

------------------------------------------------------------------------

# 42. Testing strategy

Prioritize domain behavior over superficial snapshots.

## 42.1 Unit tests --- required

### Project operations

Test:

-   create screen;
-   duplicate screen generates fresh nested IDs;
-   delete unreferenced screen;
-   delete referenced screen policy;
-   cannot delete last screen;
-   update message;
-   add/remove row;
-   add/remove button;
-   reorder button;
-   move button across rows;
-   reorder rows;
-   set flow position.

### Validation

Test:

-   callback ASCII byte length;
-   callback multibyte UTF-8 length;
-   empty callback;
-   malformed URL;
-   missing screen target;
-   duplicate command;
-   no `/start` warning;
-   unreachable screen;
-   valid demo has no blocking errors.

### Persistence

Test:

-   valid serialization;
-   invalid JSON recovery;
-   invalid schema rejection;
-   JSON export/import round trip.

### Generator

Given a known fixture, verify:

-   expected file paths;
-   `Command("start")` exists;
-   inline keyboard rows preserved;
-   URL button generated correctly;
-   screen callback route generated;
-   custom callback stub generated;
-   no token embedded;
-   callback route length \<= 64 bytes;
-   deterministic output for same normalized input.

## 42.2 Component/integration tests --- targeted

Test high-value interactions:

-   selecting screen changes editor;
-   editing text updates preview;
-   selecting button opens correct properties;
-   action type switches fields;
-   validation issue navigation selects relevant entity.

Avoid brittle full-app snapshots.

## 42.3 Drag-and-drop

If DOM simulation makes full DnD tests brittle, extract the pure state
transformation:

``` text
moveButton(source, destination)
```

and test it exhaustively.

Then manually/browser verify the DnD wiring.

------------------------------------------------------------------------

# 43. Mandatory browser smoke test

Before final completion, execute this exact scenario in the running app:

1.  Start from demo project.
2.  Verify Main Menu preview.
3.  Create `Products`.
4.  Set text to `Наши товары`.
5.  Add two buttons in one row.
6.  Reorder them.
7.  Create another row.
8.  Move one button into the new row.
9.  Configure one button to navigate to `Products`.
10. Configure one URL button.
11. Configure one custom callback button.
12. Open Flow.
13. Confirm derived edge exists.
14. Move `Products` node.
15. Reload browser.
16. Confirm project and node position survived.
17. Open Code.
18. Inspect `bot.py`.
19. Inspect generated keyboard.
20. Inspect generated handler.
21. Export JSON.
22. Reset/replace project.
23. Import JSON.
24. Confirm meaningful state round-tripped.
25. Export aiogram ZIP.
26. Extract ZIP in a temporary directory.
27. Compile all generated Python files.
28. Confirm no real secret exists in output.
29. Run application production build.

Record observed results in `PROGRESS.md`.

------------------------------------------------------------------------

# 44. Verification commands

Use repository scripts, but ensure equivalent scripts exist for:

``` bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Before a milestone is marked complete, all relevant checks must pass.

Before MVP completion, all four must pass.

For generated Python:

``` bash
python -m compileall <extracted-generated-project>
```

If Python is unavailable in the execution environment, do not falsely
mark it passed. Record the environment limitation and use the strongest
available static checks.

------------------------------------------------------------------------

# 45. Implementation milestones

Do not implement the entire product as one undifferentiated change.

## Milestone 0 --- Repository reconnaissance

### Goal

Understand the actual repository before modifying it.

### Tasks

-   inspect file tree;
-   inspect `package.json`;
-   inspect existing styling;
-   inspect existing tests;
-   inspect `AGENTS.md`;
-   inspect existing project docs;
-   identify reusable code;
-   identify conflicts with this plan;
-   update `PROGRESS.md` with baseline.

### Exit criteria

Agent can name:

-   current stack;
-   current entry points;
-   current test commands;
-   what already exists;
-   first implementation diff.

No product code is required if repository is empty, but reconnaissance
must happen first.

------------------------------------------------------------------------

## Milestone 1 --- Foundation and domain

### Goal

Create a reliable domain before building complex UI.

### Implement

-   project TypeScript types;
-   Zod schema;
-   default demo project;
-   UUID creation helper;
-   UTF-8 callback byte helper;
-   domain validation skeleton;
-   Zustand store;
-   core screen/message/button actions;
-   localStorage persistence;
-   safe load/recovery;
-   base editor shell.

### Tests

-   demo schema validation;
-   store CRUD;
-   persistence parse/recovery;
-   UTF-8 byte helper.

### Exit criteria

-   app loads demo;
-   reload preserves changes;
-   invalid persisted data does not crash;
-   lint/typecheck/tests/build pass.

------------------------------------------------------------------------

## Milestone 2 --- Screen and message design

### Goal

Make a complete single-screen editing loop.

### Implement

-   screen sidebar;
-   create;
-   rename;
-   duplicate;
-   delete;
-   screen selection;
-   message properties;
-   trigger properties;
-   photo URL;
-   parse mode;
-   Telegram preview;
-   empty states.

### Exit criteria

User can create and edit multiple screens and immediately see preview
changes.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 3 --- Keyboard builder

### Goal

Deliver the core visual keyboard editing experience.

### Implement

-   rows;
-   add/delete row;
-   buttons;
-   add/delete button;
-   button selection;
-   button properties;
-   action type switching;
-   dnd-kit row reorder;
-   dnd-kit button reorder;
-   cross-row button movement;
-   empty-row drop handling;
-   validation feedback.

### Required manual verification

Test:

``` text
[A][B][C]
[D]

→ move B after C
→ move A into second row
→ move all buttons out of a row
→ drag back into an empty row
→ cancel drag
```

No duplicates or lost buttons.

### Exit criteria

Keyboard editing is stable enough to be the main product interaction.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 4 --- Undo/redo and editor reliability

### Goal

Make destructive visual editing recoverable.

### Implement

-   history;
-   grouped text transactions;
-   one history entry per completed drag;
-   undo/redo shortcuts;
-   delete shortcut safety;
-   save shortcut;
-   confirmation dialogs;
-   meaningful toasts.

### Exit criteria

At least 30 meaningful actions can be traversed without corrupting
project state.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 5 --- Flow mode

### Goal

Visualize conversation topology without introducing a second graph
model.

### Implement

-   XYFlow canvas;
-   custom ScreenNode;
-   derive nodes from screens;
-   derive edges from screen actions;
-   node drag;
-   persist position;
-   pan/zoom;
-   fit view;
-   minimap;
-   double-click navigation to Design.

### Tests

Unit-test edge derivation.

### Exit criteria

Changing a button's target immediately changes the graph. Reload
preserves node positions.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 6 --- Full validation

### Goal

Prevent invalid exports and expose design problems.

### Implement

-   structured validation issues;
-   all blocking errors;
-   warnings;
-   reachability;
-   issue navigation;
-   validation summary;
-   export gating.

### Exit criteria

Known-invalid fixtures produce expected issues. Demo project exports
without blocking errors.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 7 --- aiogram generator

### Goal

Convert valid project state into a deterministic runnable source tree.

### Implement

-   virtual file model;
-   route-key generation;
-   keyboard generation;
-   command handlers;
-   screen callback handlers;
-   custom callback stubs;
-   photo behavior;
-   config;
-   `.env.example`;
-   requirements;
-   generated README.

### Tests

Use deterministic fixtures.

Verify Python syntax as strongly as environment allows.

### Exit criteria

A fixture with `/start → Main → Catalog` produces readable, coherent
aiogram 3 source with matching callbacks and keyboards.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 8 --- Code mode and exports

### Goal

Expose the generator output and make projects portable.

### Implement

-   Code mode;
-   file tree;
-   read-only viewer;
-   copy;
-   JSON export;
-   JSON import;
-   round-trip tests;
-   JSZip export;
-   exact reuse of virtual files.

### Exit criteria

Code mode and ZIP contain the same generated files. JSON round trip
preserves the project.

Run all verification commands.

------------------------------------------------------------------------

## Milestone 9 --- Final UX and recovery pass

### Goal

Remove MVP-breaking rough edges.

### Review

-   empty states;
-   error states;
-   loading/transition states;
-   image failures;
-   corrupted storage;
-   destructive actions;
-   keyboard accessibility;
-   narrow viewport;
-   long screen names;
-   long button labels;
-   many buttons;
-   many screens;
-   missing target after edge cases.

Do not add new product scope.

### Exit criteria

No known blocker in the core user journey.

------------------------------------------------------------------------

## Milestone 10 --- Convergence / Definition of Done

### Goal

Prove implementation matches this plan.

### Execute

-   re-read this document;
-   compare every success criterion;
-   compare every non-goal;
-   run full test suite;
-   run lint;
-   run typecheck;
-   run production build;
-   run browser smoke test;
-   export ZIP;
-   compile generated Python;
-   inspect generated files;
-   update `PROGRESS.md`.

If gaps exist, create concrete remaining tasks and implement them.
Repeat verification until converged.

------------------------------------------------------------------------

# 46. Definition of Done

MVP is **not done** until all of these are true:

### Product

-   [ ] Demo project loads.
-   [ ] Screen CRUD works.
-   [ ] Message editing works.
-   [ ] Telegram preview works.
-   [ ] Keyboard rows work.
-   [ ] Button CRUD works.
-   [ ] Button reorder works.
-   [ ] Cross-row drag works.
-   [ ] Screen actions work.
-   [ ] Callback actions work.
-   [ ] URL actions work.
-   [ ] Undo/redo works.
-   [ ] Autosave works.
-   [ ] Reload restores project.
-   [ ] Flow graph works.
-   [ ] Flow positions persist.
-   [ ] Validation works.
-   [ ] Code mode works.
-   [ ] JSON export works.
-   [ ] JSON import works.
-   [ ] JSON round trip works.
-   [ ] aiogram ZIP export works.

### Generated bot

-   [ ] Has no real token.
-   [ ] Uses aiogram 3.
-   [ ] Has `/start` command when project defines it.
-   [ ] Preserves keyboard rows.
-   [ ] Handles screen callbacks.
-   [ ] Handles URL buttons.
-   [ ] Safely stubs custom callbacks.
-   [ ] Has requirements.
-   [ ] Has `.env.example`.
-   [ ] Has runnable instructions.
-   [ ] Python source compiles.

### Engineering

-   [ ] TypeScript strict remains enabled.
-   [ ] No unexplained `any` proliferation.
-   [ ] No hidden second transition model.
-   [ ] No backend introduced.
-   [ ] No unrelated scope introduced.
-   [ ] Unit tests pass.
-   [ ] Integration tests pass.
-   [ ] `pnpm lint` passes.
-   [ ] `pnpm typecheck` passes.
-   [ ] `pnpm test` passes.
-   [ ] `pnpm build` passes.
-   [ ] Browser smoke test passes.

------------------------------------------------------------------------

# 47. Agent execution rules

These rules are intentionally concise; durable repository-wide
conventions should also live in `AGENTS.md`.

1.  **Explore before editing.** Never assume the repository matches this
    plan.
2.  **Prefer the smallest coherent diff.**
3.  **Do not rewrite working modules without evidence.**
4.  **Do not broaden MVP scope.**
5.  **Do not substitute mock UI for required functionality.**
6.  **Do not mark unexecuted checks as passed.**
7.  **Do not hide errors by weakening TypeScript, ESLint, or tests.**
8.  **Do not delete failing tests merely to obtain green CI.**
9.  **Do not create parallel sources of truth.**
10. **Do not generate code through two separate pipelines.**
11. **Keep domain logic outside React components.**
12. **Keep generator logic independent of UI.**
13. **Prefer explicit code over speculative abstractions.**
14. **Use existing dependencies before adding new ones.**
15. **When blocked, investigate root cause before applying timing hacks
    or remount hacks.**
16. **After material changes, verify immediately rather than deferring
    all testing to the end.**
17. **Record discoveries that materially affect future work in
    `PROGRESS.md`.**
18. **If context is compacted or a new agent continues work, re-read
    `AGENTS.md`, this plan, and `PROGRESS.md` before modifying code.**

## 47.1 Autonomous execution policy — mandatory

The coding agent must work **autonomously by default**.

The user does not want to be asked to approve routine implementation
decisions, architecture details, naming, file placement, UI
micro-decisions, refactors required to complete the MVP, test fixes, or
other normal engineering work.

### Core rule

**Do not ask the user what to do when a reasonable engineering decision
can be made from the repository, this document, `AGENTS.md`, tests,
existing conventions, or standard engineering judgment. Decide and
continue.**

The agent is expected to:

- choose sensible implementation details independently;
- resolve minor ambiguities independently;
- select the simplest maintainable solution;
- inspect documentation or source code when uncertain;
- fix bugs encountered during implementation;
- refactor code when needed to complete the milestone safely;
- add or adjust tests as needed;
- install a necessary dependency if the approved stack clearly requires
  it;
- resolve lint, typecheck, test, and build failures without asking;
- make UX decisions consistent with this plan;
- continue from milestone to milestone without waiting for user
  confirmation;
- keep working until the Definition of Done is reached or a genuine hard
  blocker makes progress impossible.

### Questions the agent must not ask

Do not stop to ask questions such as:

``` text
Should I use component A or B?
Should this file live in folder X or Y?
Should debounce be 300 ms or 500 ms?
Should I name this function X or Y?
Should I refactor this module first?
Should I continue to the next milestone?
Should I fix these failing tests?
Should I install the already-required dependency?
Should I use a dialog or popover for this minor UI choice?
Should I proceed?
```

Make the decision yourself and proceed.

### Decision hierarchy

When multiple valid solutions exist, choose in this order:

1. Existing repository conventions.
2. Requirements in `AGENTS.md`.
3. Requirements and invariants in `MVP_PLAN.md`.
4. Simplicity.
5. Maintainability.
6. Type safety.
7. Testability.
8. Minimal dependency count.
9. Minimal scope.
10. Performance where materially relevant.

### Ambiguity rule

If a requirement is ambiguous:

- infer the intended behavior from surrounding requirements;
- choose the smallest reversible implementation;
- document the decision in `PROGRESS.md` if it may matter later;
- continue working.

Do not convert ordinary ambiguity into a user question.

### Bug policy

When the agent encounters a bug, it must:

1. reproduce or understand the issue;
2. identify the root cause;
3. implement the fix;
4. add or update a regression test when practical;
5. run relevant verification;
6. continue the plan.

Do not ask whether a bug should be fixed when it blocks or degrades the
MVP.

### Missing infrastructure policy

If required project infrastructure is absent, create it.

Examples:

- missing test script;
- missing typecheck script;
- missing folder;
- missing `PROGRESS.md`;
- missing base configuration;
- missing generated fixture;
- missing localStorage recovery layer.

Do not ask the user to create these manually.

### Scope policy

If an implementation idea exceeds MVP scope, reject it yourself and stay
within this document.

Do not ask whether to add optional features "while here."

### Hard-blocker exception

The agent may stop and report a blocker only when progress is genuinely
impossible without external information or authorization, for example:

- a required secret or credential that cannot be generated or mocked
  safely;
- an inaccessible private service essential to a required acceptance
  test;
- a missing external artifact that cannot be reconstructed;
- permissions prevent repository or file access;
- a destructive action outside the repository requires explicit
  authorization;
- two requirements are fundamentally contradictory and no safe
  interpretation exists.

Before declaring a blocker, exhaust reasonable local alternatives.

A blocker report must contain:

``` text
BLOCKER
- What is blocked
- Why it cannot be resolved autonomously
- What alternatives were tried
- Exact information/action required from the user
- What work was completed despite the blocker
```

### No permission-seeking progress updates

Progress updates are allowed, but they must be informational rather than
permission-seeking.

Good:

``` text
Milestone 3 is complete. DnD and cross-row movement pass tests. Continuing with Flow mode.
```

Bad:

``` text
Milestone 3 is complete. Should I continue to Flow mode?
```

### Completion behavior

The agent must continue working until:

- all milestones are complete;
- all required verification passes;
- the smoke test passes;
- generated Python validation passes where the environment permits;
- `PROGRESS.md` is current;
- the Definition of Done is satisfied.

Do not stop merely because one milestone is complete.

------------------------------------------------------------------------

# 48. Suggested PROGRESS.md format

``` md
# MVP Progress

## Repository baseline
- Stack:
- Existing functionality:
- Known constraints:

## Milestone 1 — Foundation
Status: COMPLETE / IN PROGRESS / BLOCKED

Implemented:
- ...

Verification:
- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS (42 tests)
- `pnpm build` — PASS

Decisions:
- ...

Known issues:
- ...

## Milestone 2 — ...
...
```

Only record a PASS when the command was actually executed successfully.

------------------------------------------------------------------------

# 49. Recommended first prompt to the coding agent

Use this after `AGENTS.md`, this file, and `PROGRESS.md` are in the
repository:

``` text
Read AGENTS.md and MVP_PLAN.md completely, then inspect the repository before changing code.

Treat MVP_PLAN.md as the implementation source of truth and AGENTS.md as the repository working agreement.

Work autonomously. Do not ask me to approve routine engineering decisions, implementation details, refactors, naming, library usage within the approved stack, UI micro-decisions, bug fixes, tests, or progression between milestones. Make reasonable decisions yourself, document material decisions in PROGRESS.md, and continue.

Determine the first incomplete milestone from the actual repository state and PROGRESS.md. Implement it fully. Explore before editing, keep the diff within MVP scope, run the milestone's required verification, fix failures, and update PROGRESS.md with observed evidence.

Continue milestone by milestone without waiting for confirmation. If something is ambiguous, choose the simplest reversible solution consistent with the plan and continue. Stop only for a genuine hard blocker that cannot be resolved locally or safely.

Do not claim completion until the Definition of Done and final smoke test have been executed.
```

------------------------------------------------------------------------

# 50. Future work after MVP --- explicitly deferred

Keep these out of current implementation, but preserve architecture so
they are not impossible later:

### V1.1

-   direct edge creation from Flow with "create button" dialog;
-   multiple local projects;
-   Web App button;
-   copy-text button;
-   richer Telegram preview;
-   import/export individual screens;
-   auto-layout;
-   framework exports beyond aiogram.

### V1.2

-   test bot sandbox;
-   optional bot-token connection;
-   Telegram live test mode;
-   variables;
-   conditions;
-   HTTP requests;
-   input collection.

### V2

-   backend;
-   accounts;
-   cloud projects;
-   collaboration;
-   version history;
-   managed execution/hosting;
-   analytics;
-   AI generation;
-   import existing aiogram project;
-   Mini App designer.

Do not implement future-work items merely because an architectural hook
exists.

------------------------------------------------------------------------

# 51. Final architectural invariant

At every stage, preserve this direction of dependency:

``` text
                 ┌─────────────────┐
                 │   React UI      │
                 └────────┬────────┘
                          │ actions/selectors
                          ▼
                 ┌─────────────────┐
                 │ Zustand / State │
                 └────────┬────────┘
                          │ canonical Project
                          ▼
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 ┌────────────┐    ┌────────────┐    ┌────────────┐
 │ Validation │    │ Flow       │    │ Generator  │
 │            │    │ Projection │    │            │
 └────────────┘    └────────────┘    └─────┬──────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │ Virtual Files  │
                                  └───────┬────────┘
                                          │
                               ┌──────────┴─────────┐
                               ▼                    ▼
                         ┌───────────┐        ┌──────────┐
                         │ Code Mode │        │ ZIP      │
                         └───────────┘        └──────────┘
```

**Canonical Project is the source of truth.**

-   Preview is a projection.
-   Flow edges are a projection.
-   Validation is a projection/check.
-   Generated code is a projection.
-   ZIP is a serialization of generated virtual files.

Do not allow any projection to become a competing authoritative model.

------------------------------------------------------------------------

# 52. MVP completion statement

When all Definition of Done items pass, the coding agent should finish
with a factual report:

``` text
MVP STATUS: COMPLETE

Implemented:
- ...

Verification actually executed:
- pnpm lint: PASS
- pnpm typecheck: PASS
- pnpm test: PASS — <count>
- pnpm build: PASS
- browser smoke test: PASS
- generated Python compileall: PASS

Generated bot:
- aiogram version constraint:
- files generated:
- fixture tested:

Known non-blocking limitations:
- ...

Deferred by scope:
- ...

Files materially changed:
- ...
```

If any required verification was not run or failed, use:

``` text
MVP STATUS: NOT COMPLETE
```

and state exactly what remains.
