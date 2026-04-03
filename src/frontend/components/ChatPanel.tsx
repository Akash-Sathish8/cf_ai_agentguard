import React, { useRef, useEffect } from "react";

interface ChatPanelProps {
  chat: {
    messages: Array<{ id: string; role: string; content: string }>;
    input: string;
    handleInputChange: (e: any) => void;
    handleSubmit: (e?: { preventDefault?: () => void }) => void;
    isLoading: boolean;
  };
  currentTask: string | null;
}

export default function ChatPanel({ chat, currentTask }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const isEvaluating = currentTask !== null;

  return (
    <div
      className="flex-1 flex flex-col border-r overflow-hidden"
      style={{ borderColor: "#1e1e2e" }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-4">🛡️</span>
            <p className="text-gray-500 text-sm max-w-xs">
              Define security policies in the sidebar, then give the agent a
              task to evaluate.
            </p>
          </div>
        ) : (
          chat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-md px-4 py-2.5 rounded-lg text-sm whitespace-pre-wrap"
                style={{
                  background:
                    msg.role === "user"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "#111118",
                  color: msg.role === "user" ? "#93c5fd" : "#d1d5db",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Evaluating indicator */}
      {isEvaluating && (
        <div
          className="px-6 py-2 text-xs flex items-center gap-2"
          style={{ color: "#3b82f6" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
          Evaluating...
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "#1e1e2e" }}>
        <form
          onSubmit={chat.handleSubmit}
          className="flex gap-3"
        >
          <input
            type="text"
            value={chat.input}
            onChange={chat.handleInputChange}
            disabled={isEvaluating}
            placeholder={
              isEvaluating
                ? "Evaluation in progress..."
                : "Give the agent a task..."
            }
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:ring-1 disabled:opacity-50"
            style={{
              background: "#111118",
              border: "1px solid #1e1e2e",
            }}
          />
          <button
            type="submit"
            disabled={isEvaluating || !chat.input.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 hover:opacity-90"
            style={{ background: "#3b82f6" }}
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
}
