import React, { useState } from "react";

interface PolicySidebarProps {
  agent: { call: (method: string, args?: unknown[]) => Promise<unknown> };
  policies: string[];
}

export default function PolicySidebar({
  agent,
  policies,
}: PolicySidebarProps) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    await agent.call("addPolicy", [trimmed]);
    setInput("");
  };

  const handleRemove = async (index: number) => {
    await agent.call("removePolicy", [index]);
  };

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col border-r overflow-hidden"
      style={{ borderColor: "#1e1e2e", background: "#111118" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#1e1e2e" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Policies</h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#1e1e2e", color: "#9ca3af" }}
          >
            {policies.length}
          </span>
        </div>
      </div>

      {/* Add policy */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#1e1e2e" }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a security policy..."
            className="flex-1 px-3 py-1.5 rounded text-sm text-white placeholder-gray-600 outline-none focus:ring-1"
            style={{
              background: "#0a0a0f",
              borderColor: "#1e1e2e",
              border: "1px solid #1e1e2e",
            }}
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded text-sm font-medium text-white hover:opacity-90"
            style={{ background: "#3b82f6" }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Policy list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {policies.length === 0 ? (
          <p className="text-xs text-gray-600 text-center mt-8">
            No policies defined yet. Add security policies above to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {policies.map((policy, i) => (
              <li
                key={i}
                className="flex items-start gap-2 group text-sm p-2 rounded"
                style={{ background: "#0a0a0f" }}
              >
                <span className="text-xs text-gray-600 mt-0.5 flex-shrink-0">
                  {i + 1}.
                </span>
                <span className="flex-1 text-gray-300">{policy}</span>
                <button
                  onClick={() => handleRemove(i)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs flex-shrink-0 transition-opacity"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
