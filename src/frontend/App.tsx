import React, { useState, useCallback, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { AgentState } from "../types";
import PolicySidebar from "./components/PolicySidebar";
import ChatPanel from "./components/ChatPanel";
import ActionFeed from "./components/ActionFeed";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: "#dc2626", padding: 40, fontFamily: "Inter, sans-serif" }}>
          <h1>Something went wrong</h1>
          <pre style={{ marginTop: 12, fontSize: 14 }}>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [agentState, setAgentState] = useState<AgentState>({
    policies: [],
    audit_log: [],
    current_task: null,
  });

  const agent = useAgent<AgentState>({
    agent: "PolicyGuardAgent",
    onStateUpdate: (state) => {
      setAgentState(state);
    },
  });

  const chat = useAgentChat({ agent });

  const handleExportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(agentState.audit_log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [agentState.audit_log]);

  const handleExportCSV = useCallback(async () => {
    const csv: string = await agent.call("exportAuditCSV");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [agent]);

  const handleClearLog = useCallback(async () => {
    await agent.call("clearAuditLog");
  }, [agent]);

  const connected = agent.readyState === WebSocket.OPEN;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AG</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">AgentGuard</h1>
            <p className="text-xs text-gray-400">AI Agent Security Monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 pulse-dot" : "bg-red-400"}`}
          />
          {connected ? "Connected" : "Disconnected"}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <PolicySidebar agent={agent} policies={agentState.policies} />
        <ChatPanel chat={chat} currentTask={agentState.current_task} />
        <ActionFeed
          auditLog={agentState.audit_log}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onClear={handleClearLog}
        />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
