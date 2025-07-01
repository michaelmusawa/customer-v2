// components/settings/DeleteSubserviceModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import { useActionState } from "react";
import { deleteSubservice } from "@/app/lib/settingsActions";
import { initialSettingState } from "@/app/lib/definitions";
import SubmitButton from "../ui/SubmitButton";

interface Props {
  serviceId: number;
  name: string;
}

export default function DeleteSubserviceModal({ serviceId, name }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isLoading] = useActionState(
    deleteSubservice,
    initialSettingState
  );

  // auto-close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setIsOpen(false), 800);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-red-600 hover:text-red-800"
        aria-label="Delete subservice"
      >
        <FiTrash2 />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-600">
                Confirm Deletion
              </h3>
              <button onClick={() => setIsOpen(false)}>
                <FiX />
              </button>
            </div>

            <p>
              Are you sure you want to delete sub-service{" "}
              <strong>{name}</strong>?
            </p>

            {state.state_error && (
              <p className="text-red-600 text-sm">{state.state_error}</p>
            )}
            {state.message && (
              <p className="text-green-600 text-sm">{state.message}</p>
            )}

            <form action={formAction} className="flex justify-end gap-2">
              <input type="hidden" name="serviceId" value={serviceId} />
              <input type="hidden" name="name" value={name} />

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
                disabled={isLoading}
              >
                Cancel
              </button>
              <SubmitButton
                label={isLoading ? "Deleting…" : "Delete"}
                isPending={isLoading}
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
