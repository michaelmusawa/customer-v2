// components/settings/EditSubserviceModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiEdit, FiSave, FiX } from "react-icons/fi";
import { useActionState } from "react";
import { updateSubservice } from "@/app/lib/settingsActions";
import type { SettingActionState } from "@/app/lib/definitions";
import { initialSettingState } from "@/app/lib/definitions";
import SubmitButton from "../ui/SubmitButton";

interface Props {
  serviceId: number;
  oldName: string;
}

export default function EditSubserviceModal({ serviceId, oldName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(oldName);

  const [state, formAction, isLoading] = useActionState(
    updateSubservice,
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
        className="p-1.5 text-gray-500 hover:text-blue-600"
        aria-label="Edit subservice"
      >
        <FiEdit />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Sub-service</h3>
              <button onClick={() => setIsOpen(false)}>
                <FiX />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="serviceId" value={serviceId} />
              <input type="hidden" name="oldName" value={oldName} />

              <div>
                <label className="block text-sm font-medium mb-1">
                  New Name
                </label>
                <input
                  name="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border rounded"
                />
                {state.errors?.newName && (
                  <p className="text-red-600 text-sm mt-1">
                    {state.errors.newName[0]}
                  </p>
                )}
              </div>

              {state.state_error && (
                <p className="text-red-600 text-sm">{state.state_error}</p>
              )}
              {state.message && (
                <p className="text-green-600 text-sm">{state.message}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <SubmitButton
                  label={isLoading ? "Saving…" : "Save"}
                  isPending={isLoading}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
