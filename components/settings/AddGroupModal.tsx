// components/settings/AddGroupModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useActionState } from "react";
import SubmitButton from "../ui/SubmitButton";
import {
  addSetting,
  getSubservices,
  getSettings,
} from "@/app/lib/settingsActions";
import type { SettingActionState } from "@/app/lib/definitions";
import { FiX, FiPlus } from "react-icons/fi";

interface Props {
  type: "services" | "shifts" | "counters" | "stations";
  label: string;
  /** for shift/counter adds, prefill the station */
  station?: string;
}

export default function AddGroupModal({ type, label, station }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const initial: SettingActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(addSetting, initial);

  // Only for services: manage sub-services inputs
  const [serviceName, setServiceName] = useState("");
  const [subservices, setSubservices] = useState<string[]>([""]);
  const [existingSubservices, setExistingSubservices] = useState<string[]>([]);

  // Only for counters: load available shifts for this station
  const [shifts, setShifts] = useState<string[]>([]);
  const [selectedShift, setSelectedShift] = useState("");

  // Fetch shifts when opening a counter modal
  useEffect(() => {
    if (isOpen && type === "counters" && station) {
      fetch(`/api/settings/shifts?station=${encodeURIComponent(station)}`)
        .then((r) => r.json())
        .then((data) => setShifts(data.items || []));
    }
  }, [isOpen, type, station]);

  // Load existing subservices when typing service name
  useEffect(() => {
    if (type === "services" && serviceName) {
      getSubservices(serviceName).then(setExistingSubservices);
    }
  }, [type, serviceName]);

  // auto‐close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => setIsOpen(false), 1000);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  const open = () => {
    setIsOpen(true);
    // reset dependent state
    setServiceName("");
    setSubservices([""]);
    setSelectedShift("");
  };

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        <FiPlus /> Add {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Add {label}</h3>
              <button onClick={() => setIsOpen(false)}>
                <FiX />
              </button>
            </div>

            {state.state_error && (
              <div className="p-2 bg-red-100 text-red-700 rounded">
                {state.state_error}
              </div>
            )}
            {state.message && (
              <div className="p-2 bg-green-100 text-green-700 rounded">
                {state.message}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              {station && (
                <input type="hidden" name="station" value={station} />
              )}
              {/* SHIFT ADD */}
              {type === "shifts" && (
                <div>
                  <label className="block text-sm font-medium">
                    Shift name
                  </label>
                  <input
                    name="value"
                    required
                    className="w-full border rounded px-2 py-1"
                  />
                  {state.errors?.value && (
                    <p className="text-red-600 text-sm">
                      {state.errors.value[0]}
                    </p>
                  )}
                </div>
              )}

              {/* COUNTER ADD */}
              {type === "counters" && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Shift</label>
                    <select
                      name="shift"
                      required
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Select shift</option>
                      {shifts.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {state.errors?.shift && (
                      <p className="text-red-600 text-sm">
                        {state.errors.shift[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Counter name
                    </label>
                    <input
                      name="value"
                      required
                      className="w-full border rounded px-2 py-1"
                    />
                    {state.errors?.value && (
                      <p className="text-red-600 text-sm">
                        {state.errors.value[0]}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* STATION ADD */}
              {type === "stations" && (
                <div>
                  <label className="block text-sm font-medium">
                    Station name
                  </label>
                  <input
                    name="value"
                    required
                    className="w-full border rounded px-2 py-1"
                  />
                  {state.errors?.value && (
                    <p className="text-red-600 text-sm">
                      {state.errors.value[0]}
                    </p>
                  )}
                </div>
              )}

              {/* SERVICES ADD */}
              {type === "services" && (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      Service name
                    </label>
                    <input
                      name="name"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      required
                      className="w-full border rounded px-2 py-1"
                    />
                    {state.errors?.name && (
                      <p className="text-red-600 text-sm">
                        {state.errors.name[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Sub-services
                    </label>
                    {subservices.map((_, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          name="subservices"
                          value={subservices[i]}
                          onChange={(e) => {
                            const arr = [...subservices];
                            arr[i] = e.target.value;
                            setSubservices(arr);
                          }}
                          required
                          className="flex-1 border rounded px-2 py-1"
                        />
                        {subservices.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSubservices((s) => s.filter((_, j) => j !== i))
                            }
                            className="text-red-600"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSubservices((s) => [...s, ""])}
                      className="text-blue-600 text-sm"
                    >
                      + Add another
                    </button>
                    {state.errors?.subservices && (
                      <p className="text-red-600 text-sm">
                        {state.errors.subservices[0]}
                      </p>
                    )}
                  </div>

                  {existingSubservices.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium">
                        Existing Sub-services
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {existingSubservices.map((sub) => (
                          <span
                            key={sub}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <SubmitButton isPending={isPending} label="Add" />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
