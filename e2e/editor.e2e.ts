import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Project } from "../src/domain/project/types";

const STORAGE_KEY = "telegram-bot-visual-builder:project:v1";

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
  await page.waitForTimeout(250);
}

async function selectBuilderButton(page: Page, label: string): Promise<void> {
  const handle = page.getByRole("button", { name: `Drag ${label}`, exact: true });
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
    if (entry.dir) {
      await mkdir(destination, { recursive: true });
      continue;
    }
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, await entry.async("nodebuffer"));
  }

  return zip;
}

test("mandatory MVP browser smoke scenario", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  // 1-2. Start from demo and verify Main Menu preview.
  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByRole("main").getByText("Добро пожаловать!", { exact: false })).toBeVisible();

  // 3-4. Create Products and set message text.
  await page.getByRole("button", { name: "Add screen", exact: true }).click();
  await page.getByLabel("Screen name").fill("Products");
  await page.getByLabel("Message text").fill("Наши товары");

  // 5. Add two buttons in one row.
  await page.getByRole("button", { name: "+ Add first button", exact: true }).click();
  await page.getByLabel("Button text").fill("First");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Second");

  // 6. Reorder them: First moves after Second.
  await pointerDrag(
    page,
    page.getByRole("button", { name: "Drag First", exact: true }),
    page.getByRole("button", { name: "Drag Second", exact: true }),
  );

  // 7-8. Create a second row and move First into it.
  await page.getByRole("button", { name: "Row", exact: true }).click();
  const emptyRow = page.getByText("Drop button here", { exact: true }).locator("..");
  await pointerDrag(page, page.getByRole("button", { name: "Drag First", exact: true }), emptyRow);

  // 10-11. Configure URL and custom callback actions on the Products buttons.
  await selectBuilderButton(page, "Second");
  await page.getByLabel("Action type").selectOption("url");
  await page.getByLabel("URL").fill("https://example.com");

  await selectBuilderButton(page, "First");
  await page.getByLabel("Action type").selectOption("callback");
  await page.getByLabel("Callback data").fill("custom_action");

  // 9. Configure a Main Menu button that navigates to Products.
  const screenSidebar = page.locator("aside").first();
  await screenSidebar.getByText("Main Menu", { exact: true }).click();
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByLabel("Button text").fill("Products");
  await page.getByLabel("Action type").selectOption("screen");
  await page.getByLabel("Target screen").selectOption({ label: "Products" });
  await page.getByTitle("Save now").click();

  const configuredProject = await readStoredProject(page);
  const products = configuredProject.screens.find((screen) => screen.name === "Products");
  const mainMenu = configuredProject.screens.find((screen) => screen.name === "Main Menu");
  expect(products).toBeTruthy();
  expect(mainMenu).toBeTruthy();
  expect(products?.message.text).toBe("Наши товары");
  expect(products?.keyboard.map((row) => row.buttons.map((button) => button.text))).toEqual([["Second"], ["First"]]);
  expect(products?.keyboard[0]?.buttons[0]?.action).toEqual({ type: "url", url: "https://example.com" });
  expect(products?.keyboard[1]?.buttons[0]?.action).toEqual({ type: "callback", callbackData: "custom_action" });
  expect(mainMenu?.keyboard.flatMap((row) => row.buttons).some((button) => button.text === "Products" && button.action.type === "screen" && button.action.screenId === products?.id)).toBe(true);

  // 12-13. Open Flow and confirm the new derived edge exists.
  await page.getByRole("button", { name: "flow", exact: true }).click();
  await expect(page.locator(".react-flow")).toBeVisible();
  expect(await page.locator(".react-flow__edge").count()).toBe(7);

  // 14. Move Products node and persist its position.
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
  expect(movedPosition).not.toEqual(products?.editor.flowPosition);

  // 15-16. Reload and confirm both project data and flow position survived.
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await readStoredProject(page);
  const reloadedProducts = afterReload.screens.find((screen) => screen.name === "Products");
  expect(reloadedProducts?.message.text).toBe("Наши товары");
  expect(reloadedProducts?.editor.flowPosition).toEqual(movedPosition);
  await page.getByRole("button", { name: "flow", exact: true }).click();
  await expect(page.locator(".react-flow__node").filter({ hasText: "Products" }).first()).toBeVisible();

  // 17-20. Open Code and inspect bot.py, keyboard and handler output.
  await page.getByRole("button", { name: "code", exact: true }).click();
  await expect(page.getByText("generated_bot/bot.py", { exact: true })).toBeVisible();
  await expect(page.locator("pre code")).toContainText("Dispatcher");

  await page.getByRole("button", { name: "keyboards/screens.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("InlineKeyboardButton");
  await expect(page.locator("pre code")).toContainText("Products");

  await page.getByRole("button", { name: "handlers/screens.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("callback_query");
  await expect(page.locator("pre code")).toContainText("custom_action");

  // 21. Export JSON.
  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTitle("Export JSON").click(),
  ]);
  const jsonPath = await jsonDownload.path();
  if (!jsonPath) throw new Error("JSON download did not produce a file");

  // 22. Reset the project.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTitle("Reset to demo").click();
  await expect(screenSidebar.getByText("Products", { exact: true })).toHaveCount(0);

  // 23-24. Import the JSON and confirm meaningful state round-tripped.
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(jsonPath);
  await expect(screenSidebar.getByText("Products", { exact: true })).toBeVisible();
  await screenSidebar.getByText("Products", { exact: true }).click();
  await expect(page.getByLabel("Message text")).toHaveValue("Наши товары");
  await page.getByTitle("Save now").click();

  const importedProject = await readStoredProject(page);
  const importedProducts = importedProject.screens.find((screen) => screen.name === "Products");
  expect(importedProducts?.keyboard.map((row) => row.buttons.map((button) => button.text))).toEqual([["Second"], ["First"]]);
  expect(importedProducts?.editor.flowPosition).toEqual(movedPosition);

  // 25. Export aiogram ZIP.
  const [zipDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTitle("Export aiogram ZIP").click(),
  ]);
  const zipPath = await zipDownload.path();
  if (!zipPath) throw new Error("ZIP download did not produce a file");

  // 26-28. Extract, inspect, compile Python, and verify no real Telegram secret exists.
  const extractDir = testInfo.outputPath("generated-aiogram");
  const zip = await extractZip(zipPath, extractDir);
  expect(zip.file("generated_bot/bot.py")).toBeTruthy();
  expect(zip.file("generated_bot/keyboards/screens.py")).toBeTruthy();
  expect(zip.file("generated_bot/handlers/screens.py")).toBeTruthy();

  const requirements = await zip.file("generated_bot/requirements.txt")?.async("string");
  const envExample = await zip.file("generated_bot/.env.example")?.async("string");
  expect(requirements).toContain("aiogram>=3,<4");
  expect(envExample).toContain("BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN");

  const textFiles = await Promise.all(
    Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.async("string")),
  );
  expect(textFiles.join("\n")).not.toMatch(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/);

  const compile = spawnSync("python3", ["-m", "compileall", join(extractDir, "generated_bot")], { encoding: "utf8" });
  expect(compile.status, `${compile.stdout}\n${compile.stderr}`).toBe(0);

  expect(pageErrors).toEqual([]);
});
