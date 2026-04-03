import type { AgentAction } from "./types";

const SYSTEM_PROMPT = `You are an AI agent simulator. Given a task, break it down into 3-6 concrete actions the agent would take.

Return ONLY a JSON array of actions. Each action must have:
- "type": one of "http_request", "file_write", "db_query", "api_call", "data_parse", "compute"
- "params": an object with string key-value pairs relevant to the action
- "description": a short description of what the action does

Example:
[{"type":"http_request","params":{"url":"https://api.example.com/data","method":"GET"},"description":"Fetch data from external API"}]

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;

const RETRY_PROMPT = `Your last response was not valid JSON. Return ONLY a raw JSON array of action objects. No markdown, no code fences, no explanation. Each object must have "type", "params", and "description" fields.`;

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
}

function validateActions(parsed: unknown): AgentAction[] {
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  const validTypes = new Set([
    "http_request",
    "file_write",
    "db_query",
    "api_call",
    "data_parse",
    "compute",
  ]);
  for (const item of parsed) {
    if (!item.type || !item.params || !item.description) {
      throw new Error("Action missing required fields");
    }
    if (!validTypes.has(item.type)) {
      throw new Error(`Invalid action type: ${item.type}`);
    }
  }
  return parsed as AgentAction[];
}

export async function simulateAgentActions(
  ai: Ai,
  task: string
): Promise<AgentAction[]> {
  // First attempt
  try {
    const response = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: task },
      ],
    });
    const text = stripMarkdownFences(
      typeof response === "string"
        ? response
        : (response as { response?: string }).response ?? ""
    );
    return validateActions(JSON.parse(text));
  } catch {
    // Retry with stricter prompt
  }

  try {
    const response = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: RETRY_PROMPT },
        { role: "user", content: task },
      ],
    });
    const text = stripMarkdownFences(
      typeof response === "string"
        ? response
        : (response as { response?: string }).response ?? ""
    );
    return validateActions(JSON.parse(text));
  } catch (err) {
    return [
      {
        type: "compute",
        params: {
          error: err instanceof Error ? err.message : "Unknown parse error",
        },
        description: "Error: could not generate action plan",
      },
    ];
  }
}
