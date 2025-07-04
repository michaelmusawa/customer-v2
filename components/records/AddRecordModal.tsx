// components/records/AddRecordModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";
import { addRecord, editRecord } from "@/app/lib/recordsActions";
import type { RecordActionState } from "@/app/lib/definitions";
import {
  FiX,
  FiPlus,
  FiMinus,
  FiTag,
  FiUser,
  FiClipboard,
  FiDollarSign,
  FiChevronDown,
  FiSettings,
} from "react-icons/fi";

interface AddRecordModalProps {
  record?: {
    id?: number;
    ticket?: string;
    name?: string;
    service?: string | null;
    subService?: string | null;
    value?: number | null;
    recordNumber?: string | null;
  };
}

type Row = {
  service: string;
  subService: string;
  value: string;
  recordNumber: string;
};

export default function AddRecordModal({ record }: AddRecordModalProps) {
  const isEdit = Boolean(record);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // services & subservices
  const [services, setServices] = useState<string[]>([]);
  const [subservicesMap, setSubservicesMap] = useState<
    Record<string, string[]>
  >({});

  // Rows state
  const [rows, setRows] = useState<Row[]>(() =>
    isEdit
      ? [
          {
            service: record?.service || "",
            subService: record?.subService || "",
            value: record?.value?.toString() || "0",
            recordNumber: record?.recordNumber || "",
          },
        ]
      : [{ service: "", subService: "", value: "", recordNumber: "" }]
  );

  const initialState: RecordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const action = isEdit ? editRecord : addRecord;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    // Fetch services
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/settings/services");
        const data = await response.json();
        setServices(data.items || []);

        // Prefetch subservices
        const map: Record<string, string[]> = {};
        await Promise.all(
          (data.items || []).map(async (svc: string) => {
            const subRes = await fetch(
              `/api/settings/services/${encodeURIComponent(svc)}/subservices`
            );
            const subData = await subRes.json();
            map[svc] = subData.items || [];
          })
        );
        setSubservicesMap(map);
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    if (isOpen) fetchServices();
  }, [isOpen]);

  // Close on success
  useEffect(() => {
    if (state.message) {
      const t = setTimeout(() => close(), 1500);
      return () => clearTimeout(t);
    }
  }, [state.message]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  // Row management
  const addRow = () =>
    setRows((r) => [
      ...r,
      { service: "", subService: "", value: "", recordNumber: "" },
    ]);

  const removeRow = (i: number) =>
    setRows((r) => r.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof Row, val: string) =>
    setRows((r) =>
      r.map((row, idx) => (i === idx ? { ...row, [field]: val } : row))
    );

  return (
    <>
      <button
        onClick={open}
        className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-xl shadow-lg transition-all hover:shadow-xl ${
          isEdit
            ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        }`}
      >
        {isEdit ? (
          <FiTag className="text-lg" />
        ) : (
          <FiPlus className="text-lg" />
        )}
        <span className="font-medium">
          {isEdit ? "Edit Record" : "New Records"}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-auto max-h-[90vh] animate-scaleIn">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? "Edit Record" : "Create Records"}
                </h2>
                <button
                  onClick={close}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Status Messages */}
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

              {/* FORM */}
              <form action={formAction} className="space-y-6">
                {/* Hidden ID for edit mode */}
                {isEdit && <input type="hidden" name="id" value={record!.id} />}
                <input type="hidden" name="recordType" value="invoice" />
                {/* Ticket + Customer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FiTag className="text-gray-500" /> Ticket Number
                    </label>
                    <div className="relative">
                      <input
                        name="ticket"
                        defaultValue={record?.ticket || ""}
                        required
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Ticket #"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FiUser className="text-gray-500" /> Customer Name
                    </label>
                    <div className="relative">
                      <input
                        name="name"
                        defaultValue={record?.name || ""}
                        required
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Customer name"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Rows */}
                <div className="space-y-5">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Service */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Service
                          </label>
                          <div className="relative">
                            <select
                              name="service"
                              required
                              value={row.service}
                              onChange={(e) =>
                                updateRow(idx, "service", e.target.value)
                              }
                              className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                              <option value="">Select service</option>
                              {isLoadingServices ? (
                                <option value="" disabled>
                                  Loading services...
                                </option>
                              ) : (
                                services.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))
                              )}
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Sub-service */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Sub-service
                          </label>
                          <div className="relative">
                            <select
                              name="subService"
                              required
                              value={row.subService}
                              onChange={(e) =>
                                updateRow(idx, "subService", e.target.value)
                              }
                              disabled={!row.service || isLoadingServices}
                              className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                            >
                              <option value="">
                                {row.service
                                  ? "Select"
                                  : "Select service first"}
                              </option>
                              {(subservicesMap[row.service] || []).map((ss) => (
                                <option key={ss} value={ss}>
                                  {ss}
                                </option>
                              ))}
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Value */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Value (KES)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiDollarSign className="text-gray-400" />
                            </div>
                            <input
                              name="value"
                              type="number"
                              value={row.value}
                              onChange={(e) =>
                                updateRow(idx, "value", e.target.value)
                              }
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {/* Record # + Remove */}
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Record #
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiClipboard className="text-gray-400" />
                              </div>
                              <input
                                name="recordNumber"
                                value={row.recordNumber}
                                onChange={(e) =>
                                  updateRow(idx, "recordNumber", e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mb-[9px]"
                              aria-label="Remove row"
                            >
                              <FiMinus size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Row Button */}
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={addRow}
                      className="flex items-center gap-2 px-4 py-2.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium rounded-lg border border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                    >
                      <FiPlus className="text-lg" />
                      <span>Add another record</span>
                    </button>
                  )}
                </div>
                {/* Reason for Record */}

                {isEdit && (
                  <div className="mt-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FiSettings className="text-gray-500" /> Reason
                      </label>
                      <div className="relative">
                        <textarea
                          name="reason"
                          rows={2}
                          required
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="Reason for editing this record"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={close}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    isPending={isPending}
                    label={isEdit ? "Update Record" : "Submit Records"}
                    className="px-6 py-3 rounded-xl font-medium"
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
