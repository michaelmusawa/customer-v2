// components/records/EditTicketModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FiEdit2, FiX } from "react-icons/fi";
import { useActionState } from "react";
import { updateTicket } from "@/app/lib/recordsActions";
import SubmitButton from "@/components/ui/SubmitButton";
import type { RecordActionState } from "@/app/lib/definitions";

export default function EditTicketModal({
  record,
}: {
  record: { id: number; ticket: string };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const initialState: RecordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };

  const [state, formAction, isPending] = useActionState(
    updateTicket,
    initialState
  );

  // Close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setIsOpen(false), 1500);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={open}
        className="p-2 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
        title="Edit ticket value"
      >
        <FiEdit2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 animate-scaleIn">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Ticket Value
              </h3>
              <button
                onClick={close}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {(state.state_error || state.message) && (
                <div
                  className={`mb-5 p-4 rounded-xl border ${
                    state.state_error
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  }`}
                >
                  {state.state_error || state.message}
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="id" value={record.id} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Ticket Value
                  </label>
                  <input
                    name="ticket"
                    defaultValue={record.ticket}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-describedby="ticket-error"
                  />
                  {state.errors?.ticket && (
                    <div
                      id="ticket-error"
                      className="pt-2 text-sm text-red-500 dark:text-red-400"
                    >
                      {state.errors.ticket.join(", ")}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={close}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label={isPending ? "Saving..." : "Save Changes"}
                    className="px-5 py-2.5 text-white rounded-lg shadow font-medium transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
