"use client";

import AtIcon from "@/components/icons/AtIcon";
import { useChat } from "@ai-sdk/react";
import { FiSend as SendIcon } from "react-icons/fi";

export default function AI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ maxSteps: 3 });

  return (
    <div className="flex flex-col w-full">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map(
          (message: { id: string; role: string; content: string }) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === "assistant"
                  ? "bg-blue-50 dark:bg-blue-900"
                  : "bg-gray-100 dark:bg-gray-700 ml-8"
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    AI
                  </div>
                )}
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-100">
                  {message.content}
                </p>
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
              <AtIcon className="w-8 h-8 animate-spin text-blue-500" />
              AI is thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-800 text-red-600 dark:text-red-300">
            Error: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex relative">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything about the form?"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 p-2 pr-12 transition-colors resize-none"
          disabled={isLoading}
          style={{ height: "8rem" }}
        />
        <button
          type="submit"
          className="absolute right-2 top-3/4 transform -translate-y-1/2 bg-transparent text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          disabled={isLoading}
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
