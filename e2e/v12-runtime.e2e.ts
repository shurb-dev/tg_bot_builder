import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { expect, test } from "@playwright/test";
import {
  createDemoProject,
  createLogicNode,
  createReplyButton,
  createReplyKeyboardConfig,
  createReplyRow,
} from "../src/domain/project/defaults";
import type { Project } from "../src/domain/project/types";

const STORAGE_KEY = "telegram-bot-visual-builder:project:v1";
const PREFERENCES_KEY = "telegram-bot-visual-builder:preferences:v1";

function createLeadFlowProject(): Project {
  const project = createDemoProject();
  project.name = "V1.2 Lead Flow";
  project.variables.push({ id: crypto.randomUUID(), key: "lead_name", type: "string", defaultValue: "" });
  project.environmentVariables.push({ id: crypto.randomUUID(), key: "CRM_TOKEN" });

  const input = createLogicNode("input");
  const setVariable = createLogicNode("setVariable");
  const condition = createLogicNode("condition");
  const http = createLogicNode("http");
  const send = createLogicNode("sendMessage");
  if (input.type !== "input" || setVariable.type !== "setVariable" || condition.type !== "condition" || http.type !== "http" || send.type !== "sendMessage") throw new Error("logic fixture mismatch");

  input.name = "Ask lead name";
  input.prompt = "Your name?";
  input.variable = "input.name";
  input.inputType = "text";
  input.validation = { minLength: 2 };
  input.invalidMessage = "Name is too short";
  input.next = { type: "node", nodeId: setVariable.id };

  setVariable.name = "Save lead name";
  setVariable.variable = "vars.lead_name";
  setVariable.value = "{{input.name}}";
  setVariable.next = { type: "node", nodeId: condition.id };

  condition.name = "Has lead name";
  condition.rules = [{ id: crypto.randomUUID(), left: "{{vars.lead_name}}", operator: "exists", right: "" }];
  condition.trueTarget = { type: "node", nodeId: http.id };
  condition.falseTarget = { type: "screen", screenId: project.screens[2].id };

  http.name = "Create lead";
  http.method = "POST";
  http.url = "https://example.com/leads";
  http.headers = [{ id: crypto.randomUUID(), key: "Authorization", value: "Bearer {{env.CRM_TOKEN}}" }];
  http.body = { type: "json", value: "{\"name\":\"{{vars.lead_name}}\"}" };
  http.resultKey = "lead";
  http.mock = { enabled: true, status: 201, body: "{\"id\":123}" };
  http.successTarget = { type: "node", nodeId: send.id };
  http.errorTarget = { type: "screen", screenId: project.screens[2].id };

  send.name = "Confirm lead";
  send.text = "Saved {{vars.lead_name}} / {{http.lead.status}}";
  send.next = { type: "screen", screenId: project.screens[1].id };

  project.logicNodes.push(input, setVariable, condition, http, send);
  project.screens[0].inlineKeyboard[0].buttons[0].action = { type: "node", nodeId: input.id };

  const replyConfig = createReplyKeyboardConfig();
  replyConfig.inputFieldPlaceholder = "Choose an action";
  replyConfig.rows = [
    createReplyRow([
      createReplyButton("Profile reply", { type: "screen", screenId: project.screens[2].id }),
      createReplyButton("Support reply", { type: "screen", screenId: project.screens[3].id }),
    ]),
    createReplyRow([
      createReplyButton("Catalog reply", { type: "screen", screenId: project.screens[1].id }),
    ]),
  ];
  project.screens[0].replyKeyboard = { mode: "show", config: replyConfig };

  return project;
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

test("mandatory V1.2 runtime browser smoke", async ({ page }, testInfo) => {
  const project = createLeadFlowProject();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(({ projectKey, preferencesKey, seededProject }) => {
    window.localStorage.setItem(projectKey, JSON.stringify(seededProject));
    window.localStorage.setItem(preferencesKey, JSON.stringify({ locale: "en" }));
  }, { projectKey: STORAGE_KEY, preferencesKey: PREFERENCES_KEY, seededProject: project });

  const response = await page.goto("/editor", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue("V1.2 Lead Flow");

  // Flow V2 renders all logic nodes and their canonical derived edges.
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await expect(page.locator(".react-flow")).toBeVisible();
  for (const name of ["Ask lead name", "Save lead name", "Has lead name", "Create lead", "Confirm lead"]) {
    await expect(page.locator(".react-flow__node").filter({ hasText: name })).toHaveCount(1);
  }
  expect(await page.locator(".react-flow__edge").count()).toBeGreaterThanOrEqual(14);

  // Test Mode executes a realistic lead flow through Input → Set Variable → Condition → HTTP mock → Send Message.
  await page.getByRole("button", { name: "Test", exact: true }).click();
  await expect(page.getByText("Test simulator", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start /start", exact: true }).click();
  await expect(page.getByText("Добро пожаловать!", { exact: false })).toBeVisible();

  // Simulator must preserve Telegram row geometry instead of flattening rows into full-width buttons.
  const inlineKeyboard = page.getByTestId("test-inline-keyboard");
  await expect(inlineKeyboard).toBeVisible();
  const inlineRows = inlineKeyboard.locator(":scope > div");
  await expect(inlineRows).toHaveCount(2);
  await expect(inlineRows.nth(0).getByRole("button")).toHaveCount(2);
  await expect(inlineRows.nth(1).getByRole("button")).toHaveCount(1);

  const replyKeyboard = page.getByTestId("test-reply-keyboard");
  await expect(replyKeyboard).toBeVisible();
  const replyRows = replyKeyboard.locator(":scope > div");
  await expect(replyRows).toHaveCount(2);
  await expect(replyRows.nth(0).getByRole("button")).toHaveCount(2);
  await expect(replyRows.nth(1).getByRole("button")).toHaveCount(1);
  await expect(page.getByPlaceholder("Choose an action", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "🛒 Каталог", exact: true }).click();
  await expect(page.getByText("Your name?", { exact: true })).toBeVisible();

  const messageInput = page.getByLabel("Type a message...", { exact: true });
  await messageInput.fill("Z");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Name is too short", { exact: true })).toBeVisible();
  await messageInput.fill("Zakhar");
  await page.getByRole("button", { name: "Send", exact: true }).click();

  await expect(page.getByText("Saved Zakhar / 201", { exact: true })).toBeVisible();
  await expect(page.getByText("Каталог", { exact: false }).last()).toBeVisible();
  const runtimeInspector = page.locator("aside").last();
  await expect(runtimeInspector).toContainText('"lead_name": "Zakhar"');
  await expect(runtimeInspector).toContainText('"status": 201');
  await expect(runtimeInspector).toContainText('"id": 123');

  // New UI has RU/EN parity for Test Mode.
  await page.getByLabel("Application language", { exact: true }).selectOption("ru");
  await expect(page.getByRole("button", { name: "Тест", exact: true })).toBeVisible();
  await expect(page.getByText("Тестовый симулятор", { exact: true })).toBeVisible();
  await page.getByLabel("Язык приложения", { exact: true }).selectOption("en");

  // Code Mode and ZIP are the same V1.2 virtual source tree.
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await page.getByRole("button", { name: "runtime/flow.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("MAX_FLOW_STEPS = 100");
  await expect(page.locator("pre code")).toContainText("FlowState.waiting_for_input");
  await page.getByRole("button", { name: "runtime/http.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("aiohttp.ClientSession");
  await page.getByRole("button", { name: "states/flow.py", exact: true }).click();
  await expect(page.locator("pre code")).toContainText("waiting_for_input = State()");

  const [zipDownload] = await Promise.all([page.waitForEvent("download"), page.getByTitle("Export aiogram ZIP").click()]);
  const zipPath = await zipDownload.path();
  if (!zipPath) throw new Error("ZIP download did not produce a file");
  const extractDir = testInfo.outputPath("generated-v12-aiogram");
  const zip = await extractZip(zipPath, extractDir);
  expect(zip.file("generated_bot/runtime/flow.py")).toBeTruthy();
  expect(zip.file("generated_bot/runtime/http.py")).toBeTruthy();
  expect(zip.file("generated_bot/runtime/templates.py")).toBeTruthy();
  expect(zip.file("generated_bot/states/flow.py")).toBeTruthy();
  const envExample = await zip.file("generated_bot/.env.example")?.async("string");
  const requirements = await zip.file("generated_bot/requirements.txt")?.async("string");
  expect(envExample).toContain("CRM_TOKEN=");
  expect(requirements).toContain("aiohttp>=3,<4");
  expect(requirements).toContain("python-dotenv>=1,<2");
  const textFiles = await Promise.all(Object.values(zip.files).filter((entry) => !entry.dir).map((entry) => entry.async("string")));
  expect(textFiles.join("\n")).not.toMatch(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/);
  const compile = spawnSync("python3", ["-m", "compileall", join(extractDir, "generated_bot")], { encoding: "utf8" });
  expect(compile.status, `${compile.stdout}\n${compile.stderr}`).toBe(0);
  expect(pageErrors).toEqual([]);
});
