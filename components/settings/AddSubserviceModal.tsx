// components/settings/AddSubserviceModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useActionState } from "react";
import { addSubservice } from "@/app/lib/settingsActions";
import { initialSettingState } from "@/app/lib/definitions";
import SubmitButton from "../ui/SubmitButton";

interface Props {
  serviceName: string;
}

export default function AddSubserviceModal({ serviceName }: Props) {
  const [open, setOpen] = useState(false);
  const [subName, setSubName] = useState("");

  const [state, formAction, isPending] = useActionState(
    addSubservice,
    initialSettingState
  );

  // auto-close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        <FiPlus /> Add Sub-service
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">New Sub-service</h4>
              <button onClick={() => setOpen(false)}>
                <FiX />
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              <input type="hidden" name="type" value="subservice" />
              <input type="hidden" name="serviceName" value={serviceName} />

              <div>
                <label className="block text-sm">Name</label>
                <input
                  name="subservice"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 border rounded"
                />
                {state.errors?.subservice && (
                  <p className="text-red-600 text-xs">
                    {state.errors.subservice[0]}
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
                  className="px-4 py-2 bg-gray-200 rounded"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <SubmitButton
                  label={isPending ? "Adding…" : "Add"}
                  isPending={isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
