// components/auth/ResetPasswordForm.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import resetPasswordHandler from "@/app/lib/loginActions";
import SubmitButton from "../ui/SubmitButton";
import { ResetPasswordActionState } from "@/app/lib/definitions";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const initialState: ResetPasswordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(
    resetPasswordHandler,
    initialState
  );

  // on success, you could redirect to login
  React.useEffect(() => {
    if (state.message) {
      setTimeout(() => router.push("/login"), 1500);
    }
  }, [state.message, router]);

  return (
    <form
      action={formAction}
      className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg space-y-4 transition-colors"
    >
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Set Your Password
      </h1>

      {state.state_error && (
        <p className="text-red-600 dark:text-red-400">{state.state_error}</p>
      )}
      {state.message && (
        <p className="text-green-600 dark:text-green-400">{state.message}</p>
      )}

      <input type="hidden" name="token" value={token} />

      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          New Password
        </label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        {state.errors?.password && (
          <p className="text-red-600 text-sm mt-1">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
        {state.errors?.confirmPassword && (
          <p className="text-red-600 text-sm mt-1">
            {state.errors.confirmPassword[0]}
          </p>
        )}
      </div>

      <SubmitButton isPending={isPending} />
    </form>
  );
}
