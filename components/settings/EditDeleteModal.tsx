"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import SubmitButton from "../ui/SubmitButton";
import { updateSetting, deleteSetting } from "@/app/lib/settingsActions";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { initialSettingState, SettingActionState } from "@/app/lib/definitions";

interface EditDeleteModalProps {
  type: "stations" | "shifts" | "counters" | "services";
  id: number;
  currentName: string;
}

export function EditModal({ type, id, currentName }: EditDeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);

  const [state, formAction, isPending] = useActionState(
    updateSetting,
    initialSettingState
  );
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        router.refresh(); // Refresh page data instead of callback
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.message, router]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        aria-label={`Edit ${type}`}
      >
        <FiEdit className="text-lg" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit {type.slice(0, -1)}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {state?.error && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700/50">
                  {state.error}
                </div>
              )}
              {state?.message && (
                <div className="p-3 mb-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700/50">
                  {state.message}
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="id" value={id} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {type.slice(0, -1)} name
                  </label>
                  <input
                    name="newName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    label="Save Changes"
                    isPending={isPending}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow hover:shadow-md transition-all font-medium"
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

export function DeleteModal({ type, id, currentName }: EditDeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteSetting,
    initialSettingState
  );
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        router.refresh(); // Refresh page data instead of callback
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.message, router]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        aria-label={`Delete ${type}`}
      >
        <FiTrash2 className="text-lg" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete {type.slice(0, -1)}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {state?.error && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700/50">
                  {state.error}
                </div>
              )}
              {state?.message && (
                <div className="p-3 mb-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700/50">
                  {state.message}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{currentName}</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This action cannot be undone. Make sure this{" "}
                  {type.slice(0, -1)} is not in use.
                </p>
              </div>

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="id" value={id} />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label="Delete"
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow hover:shadow-md transition-all font-medium"
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
