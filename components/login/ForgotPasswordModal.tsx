"use client";

import React, { useState } from "react";
import { useActionState } from "react";
import { forgetPassword } from "@/app/lib/loginActions";
import SubmitButton from "../ui/SubmitButton";
import { ForgotPasswordActionState } from "@/app/lib/definitions";

export default function ForgotPasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const initialState: ForgotPasswordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(
    forgetPassword,
    initialState
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-countyGreen hover:underline dark:text-green-300"
      >
        Forgot your password?
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reset Password
            </h2>

            {state.state_error && (
              <p className="text-red-600 dark:text-red-400">
                {state.state_error}
              </p>
            )}
            {state.message && (
              <p className="text-green-600 dark:text-green-400">
                {state.message}
              </p>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
                {state.errors?.email && (
                  <p className="text-red-600 text-sm mt-1">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>
                <SubmitButton isPending={isPending} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
