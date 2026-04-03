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
    <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-indigo-600 text-xl">&#x1f6e1;</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
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
                className={`max-w-md px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
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
        <div className="px-6 py-2 text-xs flex items-center gap-2 text-indigo-600">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 pulse-dot" />
          Evaluating...
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <form onSubmit={chat.handleSubmit} className="flex gap-3">
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
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isEvaluating || !chat.input.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
}
