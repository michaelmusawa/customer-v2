"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { FiMessageSquare, FiX } from "react-icons/fi";

export default function Chat({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex flex-col w-full max-w-2xl h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FiMessageSquare className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
              <p className="text-green-100 text-sm">
                Ask me anything about the application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-100 hover:text-white transition p-1 rounded-full hover:bg-green-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
              <FiMessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">How can I help you today?</p>
              <p className="text-sm mt-2">
                Ask about features, troubleshooting, or how to use the
                application
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium">💡 Quick Questions</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    &quot;How do I reset my password?&quot;
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium">🔧 Troubleshooting</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    &quot;Daemon app is not working&quot;
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium">📊 Features</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    &quot;How do I export records?&quot;
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium">👥 Roles</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    &quot;What can a supervisor do?&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  m.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {m.role === "user" ? "You" : "AI Assistant"}
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {m.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return <p key={i}>{part.text}</p>;
                      case "tool-addResource":
                      case "tool-getInformation":
                        return (
                          <div key={i} className="text-xs mt-2">
                            <span className="font-medium">
                              call
                              {part.state === "output-available"
                                ? "ed"
                                : "ing"}{" "}
                              tool: {part.type}
                            </span>
                            <pre className="mt-1 bg-black bg-opacity-20 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(part.input, null, 2)}
                            </pre>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="flex space-x-2">
            <input
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={input}
              placeholder="Ask a question about the application..."
              onChange={(e) => setInput(e.currentTarget.value)}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
