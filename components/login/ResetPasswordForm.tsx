// components/auth/ResetPasswordForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import resetPasswordHandler from "@/app/lib/loginActions";
import SubmitButton from "../ui/SubmitButton";
import { ResetPasswordActionState } from "@/app/lib/definitions";
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

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

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect on success
  useEffect(() => {
    if (state.message) {
      setTimeout(() => router.push("/login"), 1500);
    }
  }, [state.message, router]);

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all transform hover:shadow-2xl">
        <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <FiLock className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Set New Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Create a strong, secure password
            </p>
          </div>

          {/* Status Messages */}
          {state.state_error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-3">
              <FiAlertCircle className="flex-shrink-0 w-6 h-6 text-red-500 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-700 dark:text-red-300">
                  Password Reset Failed
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {state.state_error}
                </p>
              </div>
            </div>
          )}

          {state.message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-start gap-3">
              <FiCheckCircle className="flex-shrink-0 w-6 h-6 text-green-500 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-700 dark:text-green-300">
                  Password Updated
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {state.message} Redirecting to login...
                </p>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {state.errors?.password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {state.errors?.confirmPassword && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {state.errors.confirmPassword[0]}
                </p>
              )}
            </div>

            <div className="mt-8">
              <SubmitButton
                isPending={isPending}
                label={isPending ? "Updating..." : "Reset Password"}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3.5 rounded-lg font-medium transition-all transform hover:-translate-y-0.5 focus:translate-y-0"
              />
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
