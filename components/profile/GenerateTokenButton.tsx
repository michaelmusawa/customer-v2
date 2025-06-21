// components/profile/GenerateTokenButton.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

interface Props {
  email: string;
}

export default function GenerateTokenButton({ email }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Token generation failed");

      const data = await res.json();
      setToken(data.token);
    } catch (error) {
      console.error("Token generation error:", error);
      alert("Failed to generate token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);

      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // Set timeout to revert after 2 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center w-full ${
          loading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating Token...
          </>
        ) : (
          "Generate API Token"
        )}
      </button>

      {token && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Your API Token
              </p>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                {token}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`ml-3 p-2.5 rounded-lg transition-all duration-300 ${
                copied
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300"
                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50"
              }`}
              aria-label={copied ? "Copied!" : "Copy to clipboard"}
            >
              <div className="relative w-5 h-5">
                <FiCopy
                  className={`absolute top-0 left-0 transition-all duration-300 ${
                    copied ? "opacity-0 scale-90" : "opacity-100 scale-100"
                  }`}
                />
                <FiCheck
                  className={`absolute top-0 left-0 transition-all duration-300 ${
                    copied ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  }`}
                />
              </div>
            </button>
          </div>

          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center">
              <FiCheck className="mr-1" /> Copied to clipboard!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
