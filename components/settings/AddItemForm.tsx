// components/settings/AddItemForm.tsx
"use client";

import React, { FormEvent, useState } from "react";

interface AddItemFormProps {
  type: "shifts" | "counters" | "stations";
  label: string;
  placeholder?: string;
  //   onSuccess?: () => void;
}

export default function AddItemForm({
  type,
  label,
  placeholder,
}: //   onSuccess,
AddItemFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/settings/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        // You could parse JSON for validation errors:
        // const errorBody = await res.json();
        // if (errorBody.code === "ValidationError") { ... }
        throw new Error("Request failed");
      }

      setValue("");
    } catch (err) {
      console.error("Error adding item:", err);

      let message = "Something went wrong";

      if (err instanceof Error) {
        if (err.message === "Request failed") {
          message = "Failed to add item. Please try again.";
        } else if (err instanceof TypeError) {
          // fetch throws TypeError for network failures
          message = "Network error. Please check your connection.";
        } else if (err.message.includes("ValidationError")) {
          message = "Invalid input. Please check your data.";
        }
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <label className="sr-only" htmlFor={type}>
        {label}
      </label>
      <input
        id={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || `Enter ${label}`}
        required
        className="flex-1 px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded transition disabled:opacity-50"
      >
        {submitting ? "Adding…" : `Add ${label}`}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
