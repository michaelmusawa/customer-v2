// components/ui/ArchiveUserForm.tsx
"use client";

import React from "react";
import { useActionState } from "react";
import {
  ArchiveActionState,
  initialUserActionState,
} from "@/app/lib/definitions";
import SubmitButton from "../ui/SubmitButton";
import { FiTrash2 } from "react-icons/fi";
import { archiveUser } from "@/app/lib/usersAction";

interface ArchiveUserFormProps {
  userId: number;
}

export default function ArchiveUserForm({ userId }: ArchiveUserFormProps) {
  const [open, setOpen] = React.useState(false);

  // useActionState gives us state, the formAction to pass to <form>, and isLoading
  const [state, formAction, isLoading] = useActionState<
    typeof archiveUser,
    ArchiveActionState
  >(archiveUser, initialUserActionState);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-900"
      >
        <FiTrash2 />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Archive User?
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Are you sure you want to archive this user? They will no longer be
              able to log in.
            </p>

            {/* Render any errors */}
            {state.state_error && (
              <div className="mb-4 text-red-600 text-sm">
                {state.state_error}
              </div>
            )}

            {/* Render success message */}
            {state.message && (
              <div className="mb-4 text-green-600 text-sm">{state.message}</div>
            )}

            <form action={formAction} className="flex justify-end space-x-3">
              {/* hidden input so server action can read userId */}
              <input type="hidden" name="userId" value={userId} />

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <SubmitButton
                isPending={isLoading}
                label="Archive"
                className="px-4 py-2 bg-red-600 text-white rounded"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
