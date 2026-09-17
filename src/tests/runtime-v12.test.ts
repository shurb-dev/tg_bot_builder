import { describe, expect, it } from "vitest";
import { createDemoProject, createLogicNode } from "@/domain/project/defaults";
import type { ConditionNode, ConditionOperator, InputNode } from "@/domain/project/types";
import { evaluateCondition, evaluateConditionRule } from "@/runtime/condition";
import { createRuntimeContext, createSimulationState, runSimulation, submitSimulationInput } from "@/runtime/engine";
import { validateInputValue } from "@/runtime/input";
import { extractTemplatePaths, getPathValue, isKnownTemplatePath, resolveTemplate } from "@/runtime/templates";
import type { HttpAdapter, RuntimeContext } from "@/runtime/types";

function context(): RuntimeContext {
  return {
    user: { id: 42, first_name: "Zakhar", last_name: "Test", username: "zakhar" },
    input: { name: "Zakhar", age: 20 },
    vars: { total: 1500, vip: true, city: "Moscow" },
    http: { order: { status: 201, ok: true, body: "{\"id\":123}", json: { id: 123 } } },
    env: { CRM_TOKEN: "secret-in-runtime-only" },
  };
}

function inputNode(type: InputNode["inputType"]): InputNode {
  const node = createLogicNode("input");
  if (node.type !== "input") throw new Error("input fixture mismatch");
  node.inputType = type;
  node.next = { type: "screen", screenId: crypto.randomUUID() };
  node.invalidMessage = "invalid";
  return node;
}

describe("V1.2 template runtime", () => {
  it("resolves user, input, vars, HTTP and env namespaces", () => {
    const value = resolveTemplate(
      "{{user.first_name}}/{{input.name}}/{{vars.total}}/{{http.order.json.id}}/{{env.CRM_TOKEN}}",
      context(),
    );
    expect(value).toBe("Zakhar/Zakhar/1500/123/secret-in-runtime-only");
    expect(getPathValue(context(), "http.order.status")).toBe(201);
  });

  it("extracts and classifies template paths without eval", () => {
    expect(extractTemplatePaths("A {{vars.total}} B {{http.order.json.id}}")).toEqual(["vars.total", "http.order.json.id"]);
    expect(isKnownTemplatePath("vars.total", new Set(["total"]), new Set())).toBe(true);
    expect(isKnownTemplatePath("vars.missing", new Set(["total"]), new Set())).toBe(false);
    expect(isKnownTemplatePath("http.anything.json.id", new Set(), new Set())).toBe("dynamic");
  });
});

describe("V1.2 input validation", () => {
  it("validates required text and length/regexp constraints", () => {
    const node = inputNode("text");
    node.validation = { minLength: 3, maxLength: 5, pattern: "^[A-Z]+$" };
    expect(validateInputValue(node, "")).toEqual({ ok: false, error: "invalid" });
    expect(validateInputValue(node, "AB").ok).toBe(false);
    expect(validateInputValue(node, "abcdef").ok).toBe(false);
    expect(validateInputValue(node, "Abc").ok).toBe(false);
    expect(validateInputValue(node, "ABC")).toEqual({ ok: true, value: "ABC" });
  });

  it("validates email and phone input", () => {
    const email = inputNode("email");
    const phone = inputNode("phone");
    expect(validateInputValue(email, "bad").ok).toBe(false);
    expect(validateInputValue(email, "a@example.com").ok).toBe(true);
    expect(validateInputValue(phone, "123").ok).toBe(false);
    expect(validateInputValue(phone, "+7 999 123-45-67").ok).toBe(true);
  });

  it("parses numbers and enforces numeric bounds", () => {
    const node = inputNode("number");
    node.validation = { min: 10, max: 20 };
    expect(validateInputValue(node, "abc").ok).toBe(false);
    expect(validateInputValue(node, "9").ok).toBe(false);
    expect(validateInputValue(node, "21").ok).toBe(false);
    expect(validateInputValue(node, "15")).toEqual({ ok: true, value: 15 });
  });
});

describe("V1.2 conditions", () => {
  const cases: Array<[ConditionOperator, string, string, boolean]> = [
    ["equals", "{{vars.total}}", "1500", true],
    ["notEquals", "{{vars.city}}", "London", true],
    ["contains", "{{vars.city}}", "osc", true],
    ["notContains", "{{vars.city}}", "York", true],
    ["greaterThan", "{{vars.total}}", "1000", true],
    ["greaterThanOrEqual", "{{vars.total}}", "1500", true],
    ["lessThan", "{{input.age}}", "21", true],
    ["lessThanOrEqual", "{{input.age}}", "20", true],
    ["exists", "{{input.name}}", "", true],
    ["notExists", "{{input.missing}}", "", true],
  ];

  it.each(cases)("evaluates %s", (operator, left, right, expected) => {
    expect(evaluateConditionRule({ id: crypto.randomUUID(), left, operator, right }, context())).toBe(expected);
  });

  it("supports AND and OR composition", () => {
    const base = createLogicNode("condition");
    if (base.type !== "condition") throw new Error("condition fixture mismatch");
    const node: ConditionNode = {
      ...base,
      combinator: "and",
      rules: [
        { id: crypto.randomUUID(), left: "{{vars.total}}", operator: "greaterThan", right: "1000" },
        { id: crypto.randomUUID(), left: "{{vars.city}}", operator: "equals", right: "Moscow" },
      ],
    };
    expect(evaluateCondition(node, context())).toBe(true);
    node.rules[1].right = "London";
    expect(evaluateCondition(node, context())).toBe(false);
    node.combinator = "or";
    expect(evaluateCondition(node, context())).toBe(true);
  });
});

describe("V1.2 simulator engine", () => {
  it("runs Set Variable → Condition → Screen", async () => {
    const project = createDemoProject();
    project.variables.push({ id: crypto.randomUUID(), key: "score", type: "number", defaultValue: 0 });
    const setNode = createLogicNode("setVariable");
    const condition = createLogicNode("condition");
    if (setNode.type !== "setVariable" || condition.type !== "condition") throw new Error("logic fixture mismatch");
    setNode.variable = "vars.score";
    setNode.value = "10";
    setNode.next = { type: "node", nodeId: condition.id };
    condition.rules = [{ id: crypto.randomUUID(), left: "{{vars.score}}", operator: "greaterThan", right: "5" }];
    condition.trueTarget = { type: "screen", screenId: project.screens[1].id };
    condition.falseTarget = { type: "screen", screenId: project.screens[2].id };
    project.logicNodes.push(setNode, condition);

    const state = await runSimulation(project, createSimulationState(project, { type: "node", nodeId: setNode.id }));
    expect(state.context.vars.score).toBe(10);
    expect(state.status).toBe("idle");
    expect(state.messages.at(-1)?.text).toContain("Каталог");
  });

  it("pauses for input, rejects invalid value, then resumes", async () => {
    const project = createDemoProject();
    const node = createLogicNode("input");
    if (node.type !== "input") throw new Error("input fixture mismatch");
    node.inputType = "email";
    node.variable = "input.email";
    node.prompt = "Email?";
    node.invalidMessage = "Bad email";
    node.next = { type: "screen", screenId: project.screens[1].id };
    project.logicNodes.push(node);

    const waiting = await runSimulation(project, createSimulationState(project, { type: "node", nodeId: node.id }));
    expect(waiting.status).toBe("waitingInput");
    expect(waiting.waitingForInput).toBe(node.id);
    expect(waiting.messages.at(-1)?.text).toBe("Email?");

    const invalid = await submitSimulationInput(project, waiting, "bad");
    expect(invalid.status).toBe("waitingInput");
    expect(invalid.messages.at(-1)?.text).toBe("Bad email");

    const resumed = await submitSimulationInput(project, invalid, "user@example.com");
    expect(resumed.context.input.email).toBe("user@example.com");
    expect(resumed.status).toBe("idle");
    expect(resumed.messages.at(-1)?.text).toContain("Каталог");
  });

  it("templates HTTP request data and stores a successful response", async () => {
    const project = createDemoProject();
    project.variables.push({ id: crypto.randomUUID(), key: "order_id", type: "string", defaultValue: "A-7" });
    project.environmentVariables.push({ id: crypto.randomUUID(), key: "CRM_TOKEN" });
    const node = createLogicNode("http");
    if (node.type !== "http") throw new Error("HTTP fixture mismatch");
    node.method = "POST";
    node.url = "https://api.example.com/orders/{{vars.order_id}}";
    node.headers = [{ id: crypto.randomUUID(), key: "Authorization", value: "Bearer {{env.CRM_TOKEN}}" }];
    node.query = [{ id: crypto.randomUUID(), key: "source", value: "telegram" }];
    node.body = { type: "json", value: "{\"order\":\"{{vars.order_id}}\"}" };
    node.resultKey = "create_order";
    node.successTarget = { type: "screen", screenId: project.screens[1].id };
    node.errorTarget = { type: "screen", screenId: project.screens[2].id };
    project.logicNodes.push(node);

    const adapter: HttpAdapter = async (_node, request) => {
      expect(request.url).toBe("https://api.example.com/orders/A-7");
      expect(request.query).toEqual({ source: "telegram" });
      expect(request.body).toBe('{"order":"A-7"}');
      return { status: 201, ok: true, body: '{"id":123}', json: { id: 123 } };
    };
    const initial = createSimulationState(project, { type: "node", nodeId: node.id });
    initial.context.env.CRM_TOKEN = "runtime-secret";
    const result = await runSimulation(project, initial, adapter);
    expect(result.context.http.create_order.status).toBe(201);
    expect(result.context.http.create_order.json).toEqual({ id: 123 });
    expect(result.messages.at(-1)?.text).toContain("Каталог");
  });

  it("uses HTTP error branch", async () => {
    const project = createDemoProject();
    const node = createLogicNode("http");
    if (node.type !== "http") throw new Error("HTTP fixture mismatch");
    node.successTarget = { type: "screen", screenId: project.screens[1].id };
    node.errorTarget = { type: "screen", screenId: project.screens[2].id };
    project.logicNodes.push(node);
    const adapter: HttpAdapter = async () => ({ status: 500, ok: false, body: "error" });
    const result = await runSimulation(project, createSimulationState(project, { type: "node", nodeId: node.id }), adapter);
    expect(result.context.http.request.status).toBe(500);
    expect(result.messages.at(-1)?.text).toContain("Профиль");
  });

  it("stops automatic infinite loops after the configured guard", async () => {
    const project = createDemoProject();
    const node = createLogicNode("sendMessage");
    if (node.type !== "sendMessage") throw new Error("send fixture mismatch");
    node.text = "loop";
    node.next = { type: "node", nodeId: node.id };
    project.logicNodes.push(node);
    const result = await runSimulation(project, createSimulationState(project, { type: "node", nodeId: node.id }));
    expect(result.status).toBe("error");
    expect(result.error).toContain("Possible infinite loop");
    expect(result.steps).toBe(100);
  });
});
