import { describe, expect, it } from "vitest";
import { createDemoProject, createLogicNode, createReplyButton, createReplyKeyboardConfig, createReplyRow } from "@/domain/project/defaults";
import { generateAiogramProject } from "@/generators/aiogram";

describe("aiogram generator v1.2", () => {
  it("generates a deterministic runnable source tree", () => {
    const project = createDemoProject();
    const one = generateAiogramProject(project);
    const two = generateAiogramProject(project);
    expect(one).toEqual(two);
    expect(one.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      "generated_bot/bot.py",
      "generated_bot/config.py",
      "generated_bot/handlers/screens.py",
      "generated_bot/keyboards/inline.py",
      "generated_bot/keyboards/reply.py",
      "generated_bot/runtime/templates.py",
      "generated_bot/runtime/http.py",
      "generated_bot/runtime/flow.py",
      "generated_bot/states/flow.py",
      "generated_bot/requirements.txt",
      "generated_bot/.env.example",
      "generated_bot/README.md",
    ]));
    const handlers = one.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    const keyboards = one.files.find((file) => file.path.endsWith("keyboards/inline.py"))!.content;
    expect(handlers).toContain('Command("start")');
    expect(keyboards).toContain("InlineKeyboardButton");
    expect(keyboards).toContain("🛒 Каталог");
    expect(one.files.find((file) => file.path.endsWith(".env.example"))!.content).not.toMatch(/\d+:[A-Za-z0-9_-]{20,}/);
  });

  it("generates reply keyboard navigation, text actions, special buttons, remove markup and bot settings", () => {
    const project = createDemoProject();
    const main = project.screens[0]; const catalog = project.screens[1]; const profile = project.screens[2]; const support = project.screens[3];
    main.inlineKeyboard = [];
    main.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    main.replyKeyboard.config.rows = [
      createReplyRow([createReplyButton("Catalog", { type: "screen", screenId: catalog.id }), createReplyButton("Echo", { type: "text" }), createReplyButton("Phone", { type: "requestContact" })]),
      createReplyRow([createReplyButton("Location", { type: "requestLocation" }), createReplyButton("App", { type: "webApp", url: "https://example.com/app" })]),
    ];
    catalog.inlineKeyboard = [];
    catalog.replyKeyboard = { mode: "remove" };
    profile.inlineKeyboard = [];
    support.inlineKeyboard = [];
    project.botSettings.commands.push({ id: crypto.randomUUID(), command: "help", description: "Help" });
    project.botSettings.menuButton = { type: "webApp", text: "Open App", url: "https://example.com/app" };

    const generated = generateAiogramProject(project);
    const reply = generated.files.find((file) => file.path.endsWith("keyboards/reply.py"))!.content;
    const handlers = generated.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    const bot = generated.files.find((file) => file.path.endsWith("bot.py"))!.content;
    expect(reply).toContain("ReplyKeyboardMarkup");
    expect(reply).toContain("request_contact=True");
    expect(reply).toContain("request_location=True");
    expect(reply).toContain("WebAppInfo");
    expect(handlers).toContain('F.text == "Catalog"');
    expect(handlers).toContain('F.text == "Echo"');
    expect(handlers).toContain("reply_text_1");
    expect(handlers).toContain("ReplyKeyboardRemove()");
    expect(handlers).toContain("F.contact");
    expect(handlers).toContain("F.location");
    expect(bot).toContain('BotCommand(command="help", description="Help")');
    expect(bot).toContain("MenuButtonWebApp");
  });

  it("preserves URL and custom callback inline buttons", () => {
    const project = createDemoProject();
    project.screens[0].inlineKeyboard[0].buttons[0] = { ...project.screens[0].inlineKeyboard[0].buttons[0], action: { type: "url", url: "https://example.com" } };
    project.screens[0].inlineKeyboard[0].buttons[1] = { ...project.screens[0].inlineKeyboard[0].buttons[1], action: { type: "callback", callbackData: "custom_action" } };
    const generated = generateAiogramProject(project);
    const keyboards = generated.files.find((file) => file.path.endsWith("keyboards/inline.py"))!.content;
    const handlers = generated.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    expect(keyboards).toContain('url="https://example.com"');
    expect(keyboards).toContain('callback_data="custom_action"');
    expect(handlers).toContain('F.data == "custom_action"');
  });

  it("generates V1.2 FSM, templates, variables, HTTP runtime and secret-name-only env output", () => {
    const project = createDemoProject();
    project.variables.push({ id: crypto.randomUUID(), key: "lead_name", type: "string", defaultValue: "" });
    project.environmentVariables.push({ id: crypto.randomUUID(), key: "CRM_TOKEN" });

    const input = createLogicNode("input");
    const setVariable = createLogicNode("setVariable");
    const condition = createLogicNode("condition");
    const http = createLogicNode("http");
    const send = createLogicNode("sendMessage");
    if (input.type !== "input" || setVariable.type !== "setVariable" || condition.type !== "condition" || http.type !== "http" || send.type !== "sendMessage") throw new Error("logic fixture mismatch");

    input.prompt = "Your name?";
    input.variable = "input.name";
    input.next = { type: "node", nodeId: setVariable.id };
    setVariable.variable = "vars.lead_name";
    setVariable.value = "{{input.name}}";
    setVariable.next = { type: "node", nodeId: condition.id };
    condition.rules = [{ id: crypto.randomUUID(), left: "{{vars.lead_name}}", operator: "exists", right: "" }];
    condition.trueTarget = { type: "node", nodeId: http.id };
    condition.falseTarget = { type: "screen", screenId: project.screens[2].id };
    http.method = "POST";
    http.url = "https://example.com/leads";
    http.headers = [{ id: crypto.randomUUID(), key: "Authorization", value: "Bearer {{env.CRM_TOKEN}}" }];
    http.body = { type: "json", value: "{\"name\":\"{{vars.lead_name}}\"}" };
    http.resultKey = "lead";
    http.mock = { enabled: true, status: 201, body: "{\"ok\":true}" };
    http.successTarget = { type: "node", nodeId: send.id };
    http.errorTarget = { type: "screen", screenId: project.screens[2].id };
    send.text = "Saved {{vars.lead_name}} / {{http.lead.status}}";
    send.next = { type: "screen", screenId: project.screens[1].id };
    project.logicNodes.push(input, setVariable, condition, http, send);
    project.screens[0].inlineKeyboard[0].buttons[0].action = { type: "node", nodeId: input.id };

    const generated = generateAiogramProject(project);
    const files = new Map(generated.files.map((file) => [file.path, file.content]));
    const flow = files.get("generated_bot/runtime/flow.py")!;
    const httpRuntime = files.get("generated_bot/runtime/http.py")!;
    const handlers = files.get("generated_bot/handlers/screens.py")!;
    const states = files.get("generated_bot/states/flow.py")!;
    const envExample = files.get("generated_bot/.env.example")!;
    const requirements = files.get("generated_bot/requirements.txt")!;

    expect(flow).toContain("MAX_FLOW_STEPS = 100");
    expect(flow).toContain("FlowState.waiting_for_input");
    expect(flow).toContain("async def resume_input");
    expect(flow).toContain("execute_http");
    expect(flow).toContain("lead_name");
    expect(httpRuntime).toContain("aiohttp.ClientSession");
    expect(handlers).toContain("execute_target");
    expect(handlers).toContain("resume_input");
    expect(states).toContain("waiting_for_input = State()");
    expect(envExample).toContain("CRM_TOKEN=");
    expect(envExample).not.toContain("secret-in-runtime-only");
    expect(requirements).toContain("aiohttp>=3,<4");
    expect(requirements).toContain("python-dotenv>=1,<2");
    expect([...files.values()].join("\n")).not.toMatch(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/);
  });
});
