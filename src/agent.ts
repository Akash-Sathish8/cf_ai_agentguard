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
    policies: [
      "Block all HTTP requests to domains not on the approved list (*.internal.co, api.stripe.com, api.github.com)",
      "Deny any file write operations outside of /tmp and /var/log directories",
      "Block database queries that contain DROP, TRUNCATE, or ALTER statements",
      "Reject API calls that transmit unencrypted PII (SSN, credit card numbers, email addresses)",
      "Deny any outbound requests to IP addresses in private ranges (10.x, 172.16-31.x, 192.168.x)",
    ],
    audit_log: [
      {
        id: "demo-1",
        timestamp: new Date(Date.now() - 180000).toISOString(),
        action_type: "http_request",
        action_params: { url: "https://api.github.com/repos/org/app/pulls", method: "GET" },
        description: "Fetch open pull requests from GitHub API",
        allowed: true,
        reason: "api.github.com is on the approved domain list",
        matched_policy: null,
        confidence: 0.95,
      },
      {
        id: "demo-2",
        timestamp: new Date(Date.now() - 150000).toISOString(),
        action_type: "db_query",
        action_params: { query: "SELECT * FROM users WHERE active = true", database: "production" },
        description: "Query active users from production database",
        allowed: true,
        reason: "Read-only SELECT query does not violate any policy",
        matched_policy: null,
        confidence: 0.92,
      },
      {
        id: "demo-3",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        action_type: "api_call",
        action_params: { endpoint: "https://webhook.site/abc123", payload: "user_email=john@example.com" },
        description: "Send user notification to external webhook",
        allowed: false,
        reason: "Payload contains unencrypted PII (email address) sent to an unapproved external endpoint",
        matched_policy: "Reject API calls that transmit unencrypted PII (SSN, credit card numbers, email addresses)",
        confidence: 0.97,
      },
      {
        id: "demo-4",
        timestamp: new Date(Date.now() - 90000).toISOString(),
        action_type: "file_write",
        action_params: { path: "/etc/nginx/nginx.conf", content: "upstream config..." },
        description: "Update nginx configuration file",
        allowed: false,
        reason: "Write target /etc/nginx/ is outside permitted directories (/tmp, /var/log)",
        matched_policy: "Deny any file write operations outside of /tmp and /var/log directories",
        confidence: 0.99,
      },
      {
        id: "demo-5",
        timestamp: new Date(Date.now() - 60000).toISOString(),
        action_type: "http_request",
        action_params: { url: "http://192.168.1.105:8080/internal-api", method: "POST" },
        description: "Send deployment status to internal monitoring service",
        allowed: false,
        reason: "Request targets a private IP range (192.168.x.x)",
        matched_policy: "Deny any outbound requests to IP addresses in private ranges (10.x, 172.16-31.x, 192.168.x)",
        confidence: 0.98,
      },
      {
        id: "demo-6",
        timestamp: new Date(Date.now() - 30000).toISOString(),
        action_type: "data_parse",
        action_params: { source: "csv_upload", rows: "2847" },
        description: "Parse uploaded CSV report and extract summary metrics",
        allowed: true,
        reason: "Data parsing operation does not violate any security policy",
        matched_policy: null,
        confidence: 0.94,
      },
      {
        id: "demo-7",
        timestamp: new Date(Date.now() - 10000).toISOString(),
        action_type: "db_query",
        action_params: { query: "DROP TABLE sessions;", database: "production" },
        description: "Clean up expired session records",
        allowed: false,
        reason: "Query contains a DROP statement which is explicitly blocked",
        matched_policy: "Block database queries that contain DROP, TRUNCATE, or ALTER statements",
        confidence: 1.0,
      },
    ],
    current_task: null,
  };

  onConnect() {
    if (this.state.policies.length === 0 && this.state.audit_log.length === 0) {
      this.setState(this.initialState);
    }
  }

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
