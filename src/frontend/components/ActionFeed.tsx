import React from "react";
import type { AuditEntry } from "../../types";

const ACTION_ICONS: Record<string, string> = {
  http_request: "🌐",
  file_write: "📄",
  db_query: "🗄️",
  api_call: "🔌",
  data_parse: "📊",
  compute: "⚙️",
};

interface ActionFeedProps {
  auditLog: AuditEntry[];
  onExportJSON: () => void;
  onExportCSV: () => void;
  onClear: () => void;
}

export default function ActionFeed({
  auditLog,
  onExportJSON,
  onExportCSV,
  onClear,
}: ActionFeedProps) {
  const reversed = [...auditLog].reverse();
  const isEmpty = auditLog.length === 0;

  return (
    <div
      className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: "#111118" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "#1e1e2e" }}>
        <h2 className="text-sm font-semibold text-white">Audit Log</h2>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {isEmpty ? (
          <p className="text-xs text-gray-600 text-center mt-8">
            No actions evaluated yet.
          </p>
        ) : (
          reversed.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-lg text-xs"
              style={{
                background: "#0a0a0f",
                borderLeft: `3px solid ${entry.allowed ? "#22c55e" : "#ef4444"}`,
              }}
            >
              {/* Top row: icon, type, badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{ACTION_ICONS[entry.action_type] ?? "⚙️"}</span>
                  <span className="font-mono text-gray-400">
                    {entry.action_type}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                  style={{
                    background: entry.allowed
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                    color: entry.allowed ? "#22c55e" : "#ef4444",
                  }}
                >
                  {entry.allowed ? "Allowed" : "Blocked"}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-1">{entry.description}</p>

              {/* Reason */}
              <p className="text-gray-500 mb-1">
                <span className="text-gray-600">Reason:</span> {entry.reason}
              </p>

              {/* Matched policy (if blocked) */}
              {!entry.allowed && entry.matched_policy && (
                <p className="text-gray-500 mb-1">
                  <span className="text-gray-600">Policy:</span>{" "}
                  {entry.matched_policy}
                </p>
              )}

              {/* Footer: timestamp + confidence */}
              <div className="flex justify-between mt-2 text-gray-600">
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span>
                  Confidence: {Math.round(entry.confidence * 100)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export / Clear buttons */}
      <div
        className="px-4 py-3 border-t flex gap-2"
        style={{ borderColor: "#1e1e2e" }}
      >
        <button
          onClick={onExportJSON}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium border disabled:opacity-30 hover:opacity-80"
          style={{ borderColor: "#1e1e2e", color: "#9ca3af" }}
        >
          Export JSON
        </button>
        <button
          onClick={onExportCSV}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium border disabled:opacity-30 hover:opacity-80"
          style={{ borderColor: "#1e1e2e", color: "#9ca3af" }}
        >
          Export CSV
        </button>
        <button
          onClick={onClear}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded text-xs font-medium border disabled:opacity-30 hover:text-red-400"
          style={{ borderColor: "#1e1e2e", color: "#9ca3af" }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
