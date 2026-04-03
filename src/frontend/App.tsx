import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { AgentState } from "../types";
import PolicySidebar from "./components/PolicySidebar";
import ChatPanel from "./components/ChatPanel";
import ActionFeed from "./components/ActionFeed";

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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "#1e1e2e" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-lg font-semibold text-white">AgentGuard</h1>
            <p className="text-xs text-gray-500">AI Agent Security Monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 pulse-dot" : "bg-red-500"}`}
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
root.render(<App />);
