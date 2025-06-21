// components/settings/AddGroupModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import SubmitButton from "../ui/SubmitButton";
import { addSetting, getSubservices } from "@/app/lib/settingsActions";
import { SettingActionState } from "@/app/lib/definitions";
import { FiX, FiPlus, FiChevronDown } from "react-icons/fi";

interface Props {
  type: "shifts" | "counters" | "stations" | "services";
  label: string;
}

export default function AddGroupModal({ type, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const initial: SettingActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(addSetting, initial);

  // For services only:
  const [serviceName, setServiceName] = useState("");
  const [subservices, setSubservices] = useState<string[]>([""]);
  const [existingSubservices, setExistingSubservices] = useState<string[]>([]);

  useEffect(() => {
    if (type === "services" && serviceName) {
      getSubservices(serviceName).then(setExistingSubservices);
    }
  }, [serviceName, type]);

  // Auto‑close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setIsOpen(false), 1000);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow transition-all duration-300 hover:shadow-md"
      >
        <FiPlus className="text-lg" />
        <span>Add {label}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add {label}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {state.state_error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                  {state.state_error}
                </div>
              )}

              {state.message && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                  {state.message}
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="type" value={type} />

                {/* Common single‑value */}
                {type !== "services" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {label} name
                    </label>
                    <div className="relative">
                      <input
                        name="value"
                        required
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                    </div>
                    {state.errors?.value && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {state.errors.value[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* Services: name + subservices */}
                {type === "services" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Service name
                      </label>
                      <input
                        name="name"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      {state.errors?.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {state.errors.name[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Sub-services
                      </label>

                      <div className="space-y-2">
                        {subservices.map((_, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              name="subservices"
                              value={subservices[idx]}
                              onChange={(e) => {
                                const arr = [...subservices];
                                arr[idx] = e.target.value;
                                setSubservices(arr);
                              }}
                              placeholder={`Sub-service #${idx + 1}`}
                              required
                              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                            {subservices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const arr = [...subservices];
                                  arr.splice(idx, 1);
                                  setSubservices(arr);
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        onClick={() => setSubservices([...subservices, ""])}
                      >
                        <FiPlus className="text-base" />
                        <span>Add another sub-service</span>
                      </button>

                      {state.errors?.subservices && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {state.errors.subservices[0]}
                        </p>
                      )}
                    </div>

                    {existingSubservices.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Existing Sub-services
                          </span>
                          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {existingSubservices.map((sub, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <SubmitButton isPending={isPending} label="Add" />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
