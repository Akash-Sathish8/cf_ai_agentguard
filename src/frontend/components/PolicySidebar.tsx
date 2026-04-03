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
    <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Policies</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {policies.length}
          </span>
        </div>
      </div>

      {/* Add policy */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a security policy..."
            className="flex-1 px-3 py-1.5 rounded-md text-sm text-gray-900 placeholder-gray-400 outline-none border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Policy list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {policies.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-8">
            No policies defined yet. Add security policies above to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {policies.map((policy, i) => (
              <li
                key={i}
                className="flex items-start gap-2 group text-sm p-2.5 rounded-md border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors"
              >
                <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0 font-medium">
                  {i + 1}.
                </span>
                <span className="flex-1 text-gray-700">{policy}</span>
                <button
                  onClick={() => handleRemove(i)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs flex-shrink-0 transition-opacity"
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
