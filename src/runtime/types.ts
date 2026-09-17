import type { FlowTarget, HttpRequestNode, ProjectVariableValue } from "@/domain/project/types";

export type RuntimeUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export type HttpRuntimeResult = {
  status: number;
  ok: boolean;
  body: string;
  json?: unknown;
  error?: string;
};

export type RuntimeContext = {
  user: RuntimeUser;
  input: Record<string, unknown>;
  vars: Record<string, ProjectVariableValue | unknown>;
  http: Record<string, HttpRuntimeResult>;
  env: Record<string, string>;
};

export type SimulationMessage = {
  id: string;
  from: "bot" | "user" | "system";
  text: string;
};

export type SimulationStatus = "idle" | "running" | "waitingInput" | "finished" | "error";

export type SimulationState = {
  currentTarget: FlowTarget | null;
  context: RuntimeContext;
  waitingForInput: string | null;
  messages: SimulationMessage[];
  status: SimulationStatus;
  error: string | null;
  steps: number;
};

export type HttpAdapter = (node: HttpRequestNode, request: {
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string | null;
}) => Promise<HttpRuntimeResult>;
