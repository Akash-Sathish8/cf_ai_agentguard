import React from "react";
import type { AuditEntry } from "../../types";

const ACTION_ICONS: Record<string, string> = {
  http_request: "\uD83C\uDF10",
  file_write: "\uD83D\uDCC4",
  db_query: "\uD83D\uDDC4\uFE0F",
  api_call: "\uD83D\uDD0C",
  data_parse: "\uD83D\uDCCA",
  compute: "\u2699\uFE0F",
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
    <div className="w-96 flex-shrink-0 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Audit Log</h2>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50">
        {isEmpty ? (
          <p className="text-xs text-gray-400 text-center mt-8">
            No actions evaluated yet.
          </p>
        ) : (
          reversed.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-lg text-xs bg-white border shadow-sm"
              style={{
                borderLeftWidth: 3,
                borderLeftColor: entry.allowed ? "#10b981" : "#ef4444",
                borderTopColor: "#e5e7eb",
                borderRightColor: "#e5e7eb",
                borderBottomColor: "#e5e7eb",
              }}
            >
              {/* Top row: icon, type, badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{ACTION_ICONS[entry.action_type] ?? "\u2699\uFE0F"}</span>
                  <span className="font-mono text-gray-500 text-[11px]">
                    {entry.action_type}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    entry.allowed
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {entry.allowed ? "Allowed" : "Blocked"}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-1">{entry.description}</p>

              {/* Reason */}
              <p className="text-gray-500 mb-1">
                <span className="text-gray-400 font-medium">Reason:</span>{" "}
                {entry.reason}
              </p>

              {/* Matched policy (if blocked) */}
              {!entry.allowed && entry.matched_policy && (
                <p className="text-gray-500 mb-1">
                  <span className="text-gray-400 font-medium">Policy:</span>{" "}
                  {entry.matched_policy}
                </p>
              )}

              {/* Footer: timestamp + confidence */}
              <div className="flex justify-between mt-2 text-gray-400">
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
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2 bg-white">
        <button
          onClick={onExportJSON}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={onExportCSV}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={onClear}
          disabled={isEmpty}
          className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-600 disabled:opacity-30 hover:text-red-500 hover:border-red-300 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
