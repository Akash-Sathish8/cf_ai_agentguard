import { PolicyVerdictSchema, type AgentAction, type PolicyVerdict } from "./types";

const SYSTEM_PROMPT = `You are a strict security policy evaluator. You receive an action and a list of policies. Your job is to determine if the action violates ANY policy.

If the action could plausibly violate ANY policy, block it. Err on the side of caution.

Return ONLY JSON with this exact structure:
{"allowed": boolean, "reason": "string", "matched_policy": "string or null", "confidence": number between 0 and 1}

No markdown. No code fences. No explanation outside the JSON.`;

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function evaluateAction(
  ai: Ai,
  action: AgentAction,
  policies: string[]
): Promise<PolicyVerdict> {
  const policyList = policies
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n");

  const userMessage = `Action to evaluate:
Type: ${action.type}
Description: ${action.description}
Parameters: ${JSON.stringify(action.params)}

Security policies:
${policyList}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 500 * Math.pow(2, attempt - 1) + Math.random() * 200;
        await sleep(delay);
      }

      const response = await ai.run(
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        {
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }
      );

      const text = stripMarkdownFences(
        typeof response === "string"
          ? response
          : (response as { response?: string }).response ?? ""
      );

      const parsed = JSON.parse(text);
      const result = PolicyVerdictSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      // retry
    }
  }

  return {
    allowed: false,
    reason: "Policy evaluation failed. Defaulting to block.",
    matched_policy: null,
    confidence: 0,
  };
}
