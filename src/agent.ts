import { AIChatAgent } from "agents/ai-chat-agent";
import { unstable_callable } from "agents";
import { streamText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { simulateAgentActions } from "./agent-simulator";
import { evaluateAction } from "./policy-evaluator";
import type { AgentState, AuditEntry } from "./types";

type Env = {
  AI: Ai;
  AGENT: DurableObjectNamespace;
};

export class PolicyGuardAgent extends AIChatAgent<Env, AgentState> {
  initialState: AgentState = {
    policies: [],
    audit_log: [],
    current_task: null,
  };

  @unstable_callable()
  addPolicy(policy: string): string[] {
    const trimmed = policy.trim();
    if (!trimmed) throw new Error("Policy cannot be empty");
    const policies = [...this.state.policies, trimmed];
    this.setState({ ...this.state, policies });
    return policies;
  }

  @unstable_callable()
  removePolicy(index: number): string[] {
    const policies = this.state.policies.filter((_, i) => i !== index);
    this.setState({ ...this.state, policies });
    return policies;
  }

  @unstable_callable()
  getPolicies(): string[] {
    return this.state.policies;
  }

  @unstable_callable()
  getAuditLog(): AuditEntry[] {
    return this.state.audit_log;
  }

  @unstable_callable()
  clearAuditLog(): void {
    this.setState({ ...this.state, audit_log: [] });
  }

  @unstable_callable()
  exportAuditCSV(): string {
    const headers =
      "timestamp,action_type,description,params,allowed,reason,matched_policy,confidence";
    const rows = this.state.audit_log.map((entry) => {
      const params = JSON.stringify(entry.action_params).replace(/"/g, '""');
      const desc = entry.description.replace(/"/g, '""');
      const reason = entry.reason.replace(/"/g, '""');
      const policy = (entry.matched_policy ?? "").replace(/"/g, '""');
      return `${entry.timestamp},${entry.action_type},"${desc}","${params}",${entry.allowed},"${reason}","${policy}",${entry.confidence}`;
    });
    return [headers, ...rows].join("\n");
  }

  async onChatMessage(
    onFinish: Parameters<AIChatAgent<Env, AgentState>["onChatMessage"]>[0],
    options?: Parameters<AIChatAgent<Env, AgentState>["onChatMessage"]>[1]
  ) {
    const workersai = createWorkersAI({ binding: this.env.AI });
    const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");

    const userMessage =
      this.messages.at(-1)?.role === "user"
        ? (this.messages.at(-1)?.content as string)
        : "";

    if (this.state.policies.length === 0) {
      const result = streamText({
        model,
        prompt:
          "Respond with exactly: No policies defined. Add policies in the sidebar first.",
        onFinish: onFinish as any,
      });
      return result.toTextStreamResponse();
    }

    if (this.state.current_task !== null) {
      const result = streamText({
        model,
        prompt: "Respond with exactly: Evaluation already in progress.",
        onFinish: onFinish as any,
      });
      return result.toTextStreamResponse();
    }

    this.setState({ ...this.state, current_task: userMessage });

    let resultText = "";

    try {
      const actions = await simulateAgentActions(this.env.AI, userMessage);

      let allowed = 0;
      let blocked = 0;

      for (const action of actions) {
        const verdict = await evaluateAction(
          this.env.AI,
          action,
          this.state.policies
        );

        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action_type: action.type,
          action_params: action.params,
          description: action.description,
          allowed: verdict.allowed,
          reason: verdict.reason,
          matched_policy: verdict.matched_policy,
          confidence: verdict.confidence,
        };

        this.setState({
          ...this.state,
          audit_log: [...this.state.audit_log, entry],
        });

        if (verdict.allowed) {
          allowed++;
          resultText += `✅ ALLOWED: ${action.description} — ${verdict.reason}\n\n`;
        } else {
          blocked++;
          resultText += `❌ BLOCKED: ${action.description} — ${verdict.reason}\n\n`;
        }
      }

      resultText += `\n**Summary:** ${allowed} allowed, ${blocked} blocked out of ${actions.length} actions.`;
    } catch {
      resultText = "Something went wrong during evaluation.";
    } finally {
      this.setState({ ...this.state, current_task: null });
    }

    const result = streamText({
      model,
      prompt: `Respond with exactly the following text, do not modify it:\n\n${resultText}`,
      onFinish: onFinish as any,
    });
    return result.toTextStreamResponse();
  }
}
