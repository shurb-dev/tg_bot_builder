import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Project } from "../src/domain/project/types";

const STORAGE_KEY = "telegram-bot-visual-builder:project:v1";
const PREFERENCES_KEY = "telegram-bot-visual-builder:preferences:v1";

async function pointerDrag(page: Page, source: Locator, target: Locator): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("Drag source or target is not visible");
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 10, sourceY, { steps: 3 });
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

async function selectInlineBuilderButton(page: Page, label: string): Promise<void> {
  const handle = page.getByRole("button", { name: `Drag ${label}`, exact: true });
  await handle.locator("..").locator("button").nth(1).click();
}

async function selectReplyBuilderButton(page: Page, label: string): Promise<void> {
  const handle = page.getByRole("button", { name: `Drag reply ${label}`, exact: true });
  await handle.locator("..").locator("button").nth(1).click();
}

async function readStoredProject(page: Page): Promise<Project> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error("Expected persisted project in localStorage");
    return JSON.parse(raw) as Project;
  }, STORAGE_KEY);
}

async function extractZip(zipPath: string, targetDir: string): Promise<JSZip> {
  const zip = await JSZip.loadAsync(await readFile(zipPath));
  await mkdir(targetDir, { recursive: true });
  for (const [name, entry] of Object.entries(zip.files)) {
    const destination = join(targetDir, name);
    if (entry.dir) { await mkdir(destination, { recursive: true }); continue; }
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await entry.async("nodebuffer"));
  }
  return zip;
}

test("mandatory V1.1 browser smoke scenario", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  // Start clean in English so selectors and locale behavior are deterministic.
  await page.addInitScript(({ projectKey, preferencesKey }) => {
    window.localStorage.removeItem(projectKey);
    window.localStorage.setItem(preferencesKey, JSON.stringify({ locale: "en" }));
  }, { projectKey: STORAGE_KEY, preferencesKey: PREFERENCES_KEY });

  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByRole("main").getByText("Добро пожаловать!", { exact: false })).toBeVisible();
  const sidebar = page.locator("aside").first();

  // Preserve and verify the MVP inline-keyboard workflow: create, reorder, cross-row DnD, URL and callback.
  await page.getByRole("button", { name: "Add screen", exact: true }).click();
  await page.getByLabel("Screen name").fill("Inline QA");
  await page.getByLabel("Message text").fill("Inline actions");
  await page.getByRole("button", { name: "+ Add first button", exact: true }).click();
  await page.getByLabel("Button text").fill("First");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Second");
  await pointerDrag(page, page.getByRole("button", { name: "Drag First", exact: true }), page.getByRole("button", { name: "Drag Second", exact: true }));
  await page.getByRole("button", { name: "Row", exact: true }).click();
  await pointerDrag(page, page.getByRole("button", { name: "Drag First", exact: true }), page.getByText("Drop button here", { exact: true }).locator(".."));
  await selectInlineBuilderButton(page, "Second");
  await page.getByLabel("Action type").selectOption("url");
  await page.getByRole("textbox", { name: "URL", exact: true }).fill("https://example.com");
  await selectInlineBuilderButton(page, "First");
  await page.getByLabel("Action type").selectOption("callback");
  await page.getByLabel("Callback data").fill("custom_action");

  // V1.1 Reply Keyboard: Products with two buttons, second row and real cross-row DnD.
  await page.getByRole("button", { name: "Add screen", exact: true }).click();
  await page.getByLabel("Screen name").fill("Products");
  await page.getByLabel("Message text").fill("Наши товары");
  await page.getByRole("button", { name: "Bottom keyboard", exact: true }).click();
  await page.getByLabel("Bottom keyboard mode").selectOption("show");
  await page.getByRole("button", { name: "+ Add first bottom button", exact: true }).click();
  await page.getByLabel("Button text").fill("Catalog");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Profile");
  await page.getByRole("button", { name: "Row", exact: true }).click();
  await pointerDrag(page, page.getByRole("button", { name: "Drag reply Catalog", exact: true }), page.getByText("Drop button here", { exact: true }).locator(".."));
  await selectReplyBuilderButton(page, "Catalog");
  await page.getByLabel("Action type").selectOption("screen");
  await page.getByLabel("Target screen").selectOption({ label: "Catalog" });

  // Add special Telegram reply-button actions and verify HTTPS Web App configuration.
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Phone");
  await page.getByLabel("Action type").selectOption("requestContact");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Location");
  await page.getByLabel("Action type").selectOption("requestLocation");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Web App");
  await page.getByLabel("Action type").selectOption("webApp");
  await page.getByRole("textbox", { name: "URL", exact: true }).fill("https://example.com/app");

  await expect(page.getByTestId("reply-keyboard")).toContainText("Catalog");
  await expect(page.getByTestId("reply-keyboard")).toContainText("Profile");
  await page.getByTitle("Save now").click();

  const configured = await readStoredProject(page);
  expect(configured.schemaVersion).toBe(2);
  const products = configured.screens.find((screen) => screen.name === "Products");
  expect(products?.message.text).toBe("Наши товары");
  expect(products?.replyKeyboard.mode).toBe("show");
  if (!products || products.replyKeyboard.mode !== "show") throw new Error("Products reply keyboard missing");
  expect(products.replyKeyboard.config.rows[0]?.buttons.map((button) => button.text)).toEqual(["Profile"]);
  expect(products.replyKeyboard.config.rows[1]?.buttons.map((button) => button.text)).toEqual(["Catalog", "Phone", "Location", "Web App"]);
  expect(products.replyKeyboard.config.rows[1]?.buttons.find((button) => button.text === "Catalog")?.action).toMatchObject({ type: "screen" });
  expect(products.replyKeyboard.config.rows[1]?.buttons.find((button) => button.text === "Phone")?.action).toEqual({ type: "requestContact" });
  expect(products.replyKeyboard.config.rows[1]?.buttons.find((button) => button.text === "Location")?.action).toEqual({ type: "requestLocation" });
  expect(products.replyKeyboard.config.rows[1]?.buttons.find((button) => button.text === "Web App")?.action).toEqual({ type: "webApp", url: "https://example.com/app" });

  // Bot Commands and Telegram Menu Button settings.
  await page.getByRole("button", { name: "Bot settings", exact: true }).click();
  await page.getByRole("button", { name: "Add command", exact: true }).click();
  await page.getByLabel("Command").last().fill("help");
  await page.getByLabel("Description").last().fill("Help command");
  await page.getByLabel("Menu button").selectOption("webApp");
  await page.getByLabel("Button text").fill("Open Shop");
  await page.getByLabel("Web App URL").fill("https://example.com/shop");
  await page.getByTitle("Save now").click();
  const botSettingsProject = await readStoredProject(page);
  expect(botSettingsProject.botSettings.commands.some((command) => command.command === "help" && command.description === "Help command")).toBe(true);
  expect(botSettingsProject.botSettings.menuButton).toEqual({ type: "webApp", text: "Open Shop", url: "https://example.com/shop" });

  // Reply transition must be projected into Flow; move the Products node and persist its position.
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await expect(page.locator(".react-flow")).toBeVisible();
  expect(await page.locator(".react-flow__edge").count()).toBe(7);
  const productsNode = page.locator(".react-flow__node").filter({ hasText: "Products" }).first();
  const nodeBox = await productsNode.boundingBox();
  if (!nodeBox) throw new Error("Products flow node is not visible");
  await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(nodeBox.x + nodeBox.width / 2 + 140, nodeBox.y + nodeBox.height / 2 + 80, { steps: 14 });
  await page.mouse.up();
  await page.getByTitle("Save now").click();
  const afterMove = await readStoredProject(page);
  const movedPosition = afterMove.screens.find((screen) => screen.name === "Products")?.editor.flowPosition;
  expect(movedPosition).toBeTruthy();
  expect(movedPosition).not.toEqual(products.editor.flowPosition);

  // App i18n: switch without reload, persist across reload, and never translate project content.
  await page.getByLabel("Application language").selectOption("ru");
  await expect(page.getByRole("button", { name: "Дизайн", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Сценарий", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Дизайн", exact: true }).click();
  await sidebar.getByText("Products", { exact: true }).click();
  await expect(page.getByTestId("reply-keyboard")).toContainText("Catalog");
  await expect(page.getByRole("button", { name: "Нижняя клавиатура", exact: true })).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Дизайн", exact: true })).toBeVisible();
  expect(await page.getByLabel("Язык приложения").inputValue()).toBe("ru");
  const reloaded = await readStoredProject(page);
  expect(reloaded.screens.find((screen) => screen.name === "Products")?.editor.flowPosition).toEqual(movedPosition);
  await page.getByLabel("Язык приложения").selectOption("en");
  await expect(page.getByRole("button", { name: "Design", exact: true })).toBeVisible();
  await expect(page.getByTestId("reply-keyboard")).toContainText("Catalog");

  // Code mode reflects reply keyboards, F.text routing, special actions, commands and menu button.
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await page.getByRole("button", { name: "keyboards/reply.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("ReplyKeyboardMarkup");
  await expect(page.locator("pre code")).toContainText("request_contact=True");
  await expect(page.locator("pre code")).toContainText("WebAppInfo");
  await page.getByRole("button", { name: "handlers/screens.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText('F.text == "Catalog"');
  await expect(page.locator("pre code")).toContainText("F.contact");
  await expect(page.locator("pre code")).toContainText("F.location");
  await page.getByRole("button", { name: "bot.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("set_my_commands");
  await expect(page.locator("pre code")).toContainText("MenuButtonWebApp");

  // JSON export/reset/import semantic round trip.
  const [jsonDownload] = await Promise.all([page.waitForEvent("download"), page.getByTitle("Export JSON").click()]);
  const jsonPath = await jsonDownload.path();
  if (!jsonPath) throw new Error("JSON download did not produce a file");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTitle("Reset to demo").click();
  await expect(sidebar.getByText("Products", { exact: true })).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(jsonPath);
  await expect(sidebar.getByText("Products", { exact: true })).toBeVisible();
  await page.getByTitle("Save now").click();
  const imported = await readStoredProject(page);
  const importedProducts = imported.screens.find((screen) => screen.name === "Products");
  expect(importedProducts?.replyKeyboard).toEqual(products.replyKeyboard);
  expect(importedProducts?.editor.flowPosition).toEqual(movedPosition);
  expect(imported.botSettings.menuButton).toEqual({ type: "webApp", text: "Open Shop", url: "https://example.com/shop" });

  // ZIP must match Code pipeline, contain both keyboard modules, no secret, and compile as Python.
  const [zipDownload] = await Promise.all([page.waitForEvent("download"), page.getByTitle("Export aiogram ZIP").click()]);
  const zipPath = await zipDownload.path();
  if (!zipPath) throw new Error("ZIP download did not produce a file");
  const extractDir = testInfo.outputPath("generated-aiogram");
  const zip = await extractZip(zipPath, extractDir);
  expect(zip.file("generated_bot/bot.py")).toBeTruthy();
  expect(zip.file("generated_bot/keyboards/inline.py")).toBeTruthy();
  expect(zip.file("generated_bot/keyboards/reply.py")).toBeTruthy();
  expect(zip.file("generated_bot/handlers/screens.py")).toBeTruthy();
  const requirements = await zip.file("generated_bot/requirements.txt")?.async("string");
  const envExample = await zip.file("generated_bot/.env.example")?.async("string");
  expect(requirements).toContain("aiogram>=3,<4");
  expect(envExample).toContain("BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN");
  const textFiles = await Promise.all(Object.values(zip.files).filter((entry) => !entry.dir).map((entry) => entry.async("string")));
  expect(textFiles.join("\n")).not.toMatch(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/);
  const compile = spawnSync("python3", ["-m", "compileall", join(extractDir, "generated_bot")], { encoding: "utf8" });
  expect(compile.status, `${compile.stdout}\n${compile.stderr}`).toBe(0);
  expect(pageErrors).toEqual([]);
});
