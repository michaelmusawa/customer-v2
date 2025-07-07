"use client";

import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import SubmitButton from "../ui/SubmitButton";
import { addSetting, getSubservices } from "@/app/lib/settingsActions";
import type { SettingActionState } from "@/app/lib/definitions";
import { FiX, FiPlus } from "react-icons/fi";

interface Props {
  type: "services" | "shifts" | "counters" | "stations";
  label: string;
  station?: string;
}

interface Item {
  name: string;
  id: number;
}

export default function AddGroupModal({ type, label, station }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const initial: SettingActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(addSetting, initial);

  const [serviceName, setServiceName] = useState("");
  const [subservices, setSubservices] = useState<string[]>([""]);
  const [existingSubservices, setExistingSubservices] = useState<string[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [selectedShift, setSelectedShift] = useState("");

  useEffect(() => {
    if (isOpen && type === "counters" && station) {
      fetch(`/api/settings/shifts?station=${encodeURIComponent(station)}`)
        .then((r) => r.json())
        .then((data) =>
          setShifts(data.items.map((item: Item) => item.name as string))
        );
    }
  }, [isOpen, type, station]);

  useEffect(() => {
    if (type === "services" && serviceName) {
      getSubservices(serviceName).then(setExistingSubservices);
    }
  }, [type, serviceName]);

  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setIsOpen(false), 1000);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  // Add this useEffect to reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setServiceName("");
      setSubservices([""]);
      setSelectedShift("");
    }
  }, [isOpen]);

  const open = () => {
    setIsOpen(true);
    setServiceName("");
    setSubservices([""]);
    setSelectedShift("");
  };

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow hover:shadow-md transition-all duration-200 active:scale-[0.98]"
      >
        <FiPlus className="text-lg" /> Add {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add {label}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {state.state_error && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-700/50">
                  {state.state_error}
                </div>
              )}
              {state.message && (
                <div className="p-3 mb-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700/50">
                  {state.message}
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="type" value={type} />
                {station && (
                  <input type="hidden" name="station" value={station} />
                )}

                {/* SHIFT ADD */}
                {type === "shifts" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift name
                    </label>
                    <input
                      name="value"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Enter shift name"
                    />
                    {state.errors?.value && (
                      <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                        {state.errors.value[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* COUNTER ADD */}
                {type === "counters" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Shift
                      </label>
                      <select
                        name="shift"
                        required
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select shift</option>
                        {shifts.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {state.errors?.shift && (
                        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                          {state.errors.shift[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Counter name
                      </label>
                      <input
                        name="value"
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Enter counter name"
                      />
                      {state.errors?.value && (
                        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                          {state.errors.value[0]}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* STATION ADD */}
                {type === "stations" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Station name
                    </label>
                    <input
                      name="value"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Enter station name"
                    />
                    {state.errors?.value && (
                      <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                        {state.errors.value[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* SERVICES ADD */}
                {type === "services" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Service name
                      </label>
                      <input
                        name="name"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Enter service name"
                      />
                      {state.errors?.name && (
                        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                          {state.errors.name[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sub-services
                      </label>
                      <div className="space-y-3">
                        {subservices.map((_, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              name="subservices"
                              value={subservices[i]}
                              onChange={(e) => {
                                const arr = [...subservices];
                                arr[i] = e.target.value;
                                setSubservices(arr);
                              }}
                              required
                              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder={`Sub-service #${i + 1}`}
                            />
                            {subservices.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSubservices((s) =>
                                    s.filter((_, j) => j !== i)
                                  )
                                }
                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <FiX className="text-lg" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSubservices((s) => [...s, ""])}
                          className="mt-1 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-sm font-medium"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FiPlus className="text-xs" />
                          </div>
                          <span>Add another sub-service</span>
                        </button>
                        {state.errors?.subservices && (
                          <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                            {state.errors.subservices[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {existingSubservices.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Existing Sub-services
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {existingSubservices.map((sub) => (
                            <span
                              key={sub}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label="Add"
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow hover:shadow-md transition-all font-medium"
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
