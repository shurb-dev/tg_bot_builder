# TFlow Progress

## Current status

**V1.1 COMPLETE — Reply Keyboard, Bot Settings and RU/EN application i18n are implemented and the complete executable Definition of Done has passed in GitHub Actions.**

The original MVP remains complete. V1.1 extends the same local-first **Design → Flow → Code → Export** architecture without adding a backend, authentication, cloud state or managed bot runtime.

---

# V1.1 — Reply Keyboard + Bot Menu + Application i18n

## Final implementation verification evidence

GitHub Actions CI run **#38** (`35187668394`) for commit `b6eb7b60815bdf99c0b6c760501ffe23f67a81a1` completed successfully.

Executed gates:

- dependency installation — **PASS**
- `pnpm lint` — **PASS**
- `pnpm typecheck` — **PASS**
- `pnpm test` — **PASS**
  - 5 test files passed
  - 30 tests passed
- first `pnpm build` — **PASS**
- Playwright Chromium installation — **PASS**
- mandatory V1.1 browser smoke — **PASS**
- generated aiogram ZIP extraction — **PASS**
- generated secret scan — **PASS**
- `python3 -m compileall generated_bot` — **PASS**
- final `pnpm build` after browser smoke — **PASS**

## V1.1 browser smoke — PASS

The Playwright scenario runs against the production Next.js server (`next start`) and verifies the integrated product rather than isolated components.

Verified end to end:

1. A clean demo project opens.
2. Existing Inline Keyboard functionality still works.
3. Inline buttons can be created and edited.
4. Inline buttons can be reordered with real pointer drag-and-drop.
5. Inline buttons can be moved across rows.
6. URL and custom callback actions remain functional.
7. A new `Products` screen can be created.
8. Bottom Reply Keyboard can be switched to `show` mode.
9. Reply rows and buttons can be created.
10. Reply buttons can be moved across rows with real pointer drag-and-drop.
11. A Reply button can navigate to another screen.
12. Contact-request action can be configured.
13. Location-request action can be configured.
14. HTTPS Web App action can be configured.
15. Telegram preview renders the Reply Keyboard row layout.
16. Schema v2 data is persisted to localStorage.
17. Bot Commands can be added and edited.
18. Telegram Menu Button can be configured as a Web App.
19. Reply screen navigation appears as a derived Flow edge.
20. A Flow node can be dragged with real pointer interaction.
21. The moved Flow position is persisted.
22. `remove` mode for the bottom keyboard is persisted.
23. The application language can switch English → Russian without reload.
24. Russian UI labels render immediately.
25. Browser reload preserves the Russian locale.
26. Browser reload preserves the project and Flow node position.
27. User project content such as `Catalog` is not translated by UI locale changes.
28. The application can switch Russian → English without reload.
29. Code mode contains generated `ReplyKeyboardMarkup`.
30. Generated reply keyboard code includes contact, location and Web App button types.
31. Generated handlers contain `F.text` Reply navigation.
32. Generated handlers contain `ReplyKeyboardRemove()`.
33. Generated handlers contain contact and location handling.
34. Generated `bot.py` contains `set_my_commands`.
35. Generated `bot.py` contains Web App Menu Button configuration.
36. Project JSON export succeeds.
37. Demo reset/replacement succeeds.
38. Exported schema v2 JSON imports again.
39. Reply Keyboard data survives JSON round-trip.
40. Flow position survives JSON round-trip.
41. Bottom keyboard `remove` mode survives JSON round-trip.
42. Bot Menu settings survive JSON round-trip.
43. aiogram ZIP export succeeds.
44. Expected `bot.py`, handlers and separate inline/reply keyboard files exist.
45. `requirements.txt` targets aiogram 3.
46. `.env.example` contains only the token placeholder.
47. Generated output is scanned for Telegram-token-shaped secrets.
48. Exported generated Python passes `python3 -m compileall`.
49. No uncaught browser page errors occur during the scenario.
50. A fresh final production build succeeds after the smoke test.

---

## Milestone 1 — Schema v2 and migration
Status: **COMPLETE**

- `schemaVersion` advanced from 1 to 2.
- `keyboard` migrated to `inlineKeyboard`.
- `replyKeyboard` added with `inherit`, `show` and `remove` states.
- Project-level `botSettings` added.
- Zod validates schema v2 and persistent UUID uniqueness.
- Legacy schema v1 JSON automatically migrates to v2.
- Existing v1 inline keyboard data is preserved.
- Migrated projects default Reply Keyboard to `inherit` and Bot Settings to safe defaults.

Verification: migration and persistence tests — **PASS**.

## Milestone 2 — Reply Keyboard domain and store
Status: **COMPLETE**

Implemented:

- Reply keyboard rows and buttons.
- `screen` action.
- `text` action.
- `requestContact` action.
- `requestLocation` action.
- `webApp` action.
- Store CRUD actions.
- Reply option updates.
- Selection coherence.
- Undo/redo integration.
- One drag/replacement transaction = one undo operation.

Verification: domain/store tests — **PASS**.

## Milestone 3 — Bottom Keyboard UI
Status: **COMPLETE**

Design mode now exposes:

- Message
- Inline Keyboard
- Bottom Keyboard

Bottom Keyboard supports:

- Keep current keyboard
- Show keyboard
- Hide keyboard
- Resize keyboard
- Persistent keyboard
- One-time keyboard
- Selective keyboard
- Input placeholder
- Row/button editing
- Per-button action properties

## Milestone 4 — Reply Keyboard DnD
Status: **COMPLETE**

- Same-row reorder.
- Cross-row movement.
- Empty-row drop target.
- Row reordering domain support.
- No button duplication/loss.
- Cancel-safe draft state.
- Undo-safe drag commit.

Verification: domain tests + real Playwright pointer DnD — **PASS**.

## Milestone 5 — Telegram Preview
Status: **COMPLETE**

- Bottom keyboard is rendered beneath the conversation.
- Exact project row/button order is preserved.
- Contact/location/Web App actions receive visual indicators.
- Input placeholder is rendered.
- `remove` mode is represented.
- Preview button selection drives the properties editor.

## Milestone 6 — Flow
Status: **COMPLETE**

- Inline and Reply `screen` actions project into Flow edges.
- Edges remain derived data and are never persisted independently.
- Edge metadata distinguishes inline and reply sources.
- Node positions remain editor metadata.
- Controlled React Flow drag uses the final draft position when committing.
- Browser smoke confirms drag/reload persistence.

## Milestone 7 — aiogram 3 generator
Status: **COMPLETE**

Generated project now includes separate:

```text
generated_bot/keyboards/inline.py
generated_bot/keyboards/reply.py
generated_bot/handlers/screens.py
```

Generator supports:

- `ReplyKeyboardMarkup`.
- `ReplyKeyboardRemove`.
- `KeyboardButton`.
- screen navigation through `F.text`.
- text-action TODO stubs.
- `request_contact=True`.
- `request_location=True`.
- `WebAppInfo`.
- deterministic generation from canonical Project data.

Code Mode and ZIP export still consume the exact same generated virtual files.

Verification: generator tests + browser Code inspection + ZIP `compileall` — **PASS**.

## Milestone 8 — Bot Settings
Status: **COMPLETE**

- Project-level Bot Commands editor.
- Commands/default/Web App Menu Button modes.
- `set_my_commands()` generation.
- `set_chat_menu_button()` generation.
- Telegram BotCommand names are normalized to lowercase in the UI.
- Validation enforces 1–32 lowercase ASCII letters/digits/underscore.
- Command description length is validated to 1–256 characters.
- Web App Menu Button requires HTTPS.

## Milestone 9 — i18n foundation
Status: **COMPLETE**

- English and Russian dictionaries.
- Separate application-preferences Zustand store.
- Locale is not stored in Project JSON.
- Browser language is used only as the initial default when no saved preference exists.
- Explicit user locale selection persists in localStorage.
- Locale changes update the app without `location.reload()`.

## Milestone 10 — Full UI translation
Status: **COMPLETE**

System UI strings were moved into the application translation layer across:

- header/navigation
- Design
- Flow
- Code
- screen sidebar
- message editor
- keyboard editors
- properties panel
- Bot Settings
- preview states
- validation UI
- dialogs/toasts/actions
- accessibility labels

Project-owned content is intentionally opaque and is never automatically translated.

## Milestone 11 — Validation i18n and Telegram constraints
Status: **COMPLETE**

Validation now carries codes/parameters instead of baked-in English messages and renders localized messages in the UI.

V1.1 validation additionally covers:

- missing Reply button text
- missing Reply screen target
- ambiguous duplicate Reply text routes
- Reply Web App HTTPS
- Inline/Reply same-message conflict
- empty enabled Reply Keyboard warning
- one-time/persistent option conflict
- Reply input placeholder 1–64 characters
- invalid Bot Commands
- Bot Command description limits
- duplicate Bot Commands
- Menu Button text/HTTPS requirements

## Milestone 12 — Convergence / Definition of Done
Status: **COMPLETE**

Executable gates from the V1.1 plan:

```text
Install                    PASS
Lint                       PASS
Typecheck                  PASS
Vitest                     PASS (5 files / 30 tests)
Production build           PASS
Mandatory V1.1 smoke       PASS
Schema v1 -> v2 migration  PASS
JSON v2 round-trip         PASS
Reply DnD                  PASS
Flow persistence           PASS
RU/EN persistence          PASS
Generated ZIP              PASS
Secret scan                PASS
Python compileall          PASS
Final production build     PASS
```

V1.1 meets the requested Definition of Done.

---

# Original MVP baseline

The original inline-keyboard MVP was previously completed and verified in GitHub Actions run **#19** with 19 tests and the original mandatory browser smoke. V1.1 preserves that functionality and exercises the legacy Inline Keyboard workflow at the beginning of its own production browser smoke.

Core MVP capabilities retained:

- canonical local Project model
- Design / Flow / Code
- Inline Keyboard editor and DnD
- screen/callback/URL actions
- localStorage recovery
- undo/redo
- derived Flow graph
- localized validation layer in V1.1
- JSON import/export
- deterministic aiogram generator
- Code Mode
- ZIP export

---

## Non-blocking maintenance notes

Current successful CI still reports tooling/dependency notices that do not fail the Definition of Done:

- GitHub JavaScript actions emit a Node-runtime deprecation notice while the project verification itself explicitly runs on Node.js 22.
- Vitest/Vite reports a future config-loader warning for ESM syntax in `vitest.config.ts`.
- Some package versions emit upstream deprecation/update notices.
- Next.js reports that no CI build cache is configured and prints its standard anonymous telemetry notice.

These are maintenance items, not V1.1 functional blockers.
