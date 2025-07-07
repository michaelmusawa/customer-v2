// components/records/EditRecordModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import type { RecordActionState } from "@/app/lib/definitions";
import { decideEditedRecord } from "@/app/lib/recordsActions";
import {
  FiX,
  FiCheck,
  FiXCircle,
  FiAlertTriangle,
  FiEdit,
} from "react-icons/fi";
import SubmitButton from "../ui/SubmitButton";

interface Props {
  editedRecord: {
    id: number;
    recordId: number;
    ticket: string;
    recordType: string | null;
    name: string;
    service: string;
    subService: string | null;
    recordNumber: string | null;
    value: number;
  };
  role: string;
}

type RecordRow = {
  id: number;
  ticket: string;
  recordType: string | null;
  name: string;
  service: string;
  subService: string | null;
  recordNumber: string | null;
  value: number;
};

export default function EditRecordModal({
  editedRecord,
  role,
  children,
}: React.PropsWithChildren<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "accept" | "reject" | null
  >(null);
  const [original, setOriginal] = useState<RecordRow | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const initialState: RecordActionState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction, isPending] = useActionState(
    decideEditedRecord,
    initialState
  );

  // Fetch original record when opening
  useEffect(() => {
    if (!isOpen) return;
    setLoadingOriginal(true);
    fetch(`/api/records/${editedRecord.recordId}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error((await res.json()).error || "Failed to load");
        return res.json() as Promise<RecordRow>;
      })
      .then((data) => {
        setOriginal(data);
        setLoadError(null);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("Could not load original record.");
      })
      .finally(() => setLoadingOriginal(false));
  }, [isOpen, editedRecord.recordId]);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setConfirmAction(null);
    setOriginal(null);
    setLoadError(null);
    setComment("");
  };

  // Build a list of changed fields
  const diffs: {
    label: string;
    from: string | number | null;
    to: string | number | null;
  }[] = [];
  if (original) {
    const fields: [keyof RecordRow, string][] = [
      ["ticket", "Ticket"],
      ["recordType", "Type"],
      ["name", "Customer"],
      ["service", "Service"],
      ["subService", "Sub-Service"],
      ["recordNumber", "Record #"],
      ["value", "Value"],
    ];
    fields.forEach(([key, label]) => {
      const from = original[key];
      const to = editedRecord[key];
      if (`${from ?? ""}` !== `${to ?? ""}`) {
        diffs.push({ label, from, to });
      }
    });
  }

  return (
    <>
      <div onClick={open} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiEdit className="text-yellow-500" />
                  <span>Review Edit Request</span>
                </h2>
                <button
                  onClick={close}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {state.message && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                  {state.message}
                </div>
              )}

              {state.state_error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                  {state.state_error}
                </div>
              )}

              {/* Loading / Error */}
              {loadingOriginal ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Loading original record...
                  </p>
                </div>
              ) : loadError ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-300">
                  <div className="flex items-center gap-2 mb-1">
                    <FiAlertTriangle className="text-lg" />
                    <strong>Error loading data</strong>
                  </div>
                  <p>{loadError}</p>
                </div>
              ) : (
                original && (
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Ticket
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {original.ticket}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Customer
                        </div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {original.name}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Original Value
                        </div>
                        <div className="text-lg font-medium text-green-600 dark:text-green-400">
                          KES {original.value.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Changes Section */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Proposed Changes
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {diffs.length > 0 ? (
                            diffs.map((d) => (
                              <div key={d.label} className="flex items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {d.label}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-700 dark:text-red-300 line-through">
                                      {d.from ?? "—"}
                                    </div>
                                    <FiArrowRight className="text-gray-400" />
                                    <div className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-700 dark:text-green-300">
                                      {d.to ?? "—"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                              No changes detected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}

                    {role === "supervisor" && (
                      <form action={formAction} className="pt-4">
                        <input
                          type="hidden"
                          name="id"
                          value={editedRecord.id}
                        />
                        <input
                          type="hidden"
                          name="decision"
                          value={confirmAction ?? ""}
                        />

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setConfirmAction("reject")}
                            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                          >
                            <FiXCircle className="text-lg" />
                            <span>Reject Changes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction("accept")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow transition-all hover:shadow-md"
                          >
                            <FiCheck className="text-lg" />
                            <span>Approve Changes</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirm{" "}
                  {confirmAction === "accept" ? "Approval" : "Rejection"}
                </h3>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="text-lg text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-5">
                Are you sure you want to{" "}
                <strong className="text-gray-900 dark:text-white">
                  {confirmAction === "accept" ? "approve" : "reject"}
                </strong>{" "}
                these changes? This action cannot be undone.
              </p>

              {confirmAction === "reject" && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Please provide a reason for rejecting these changes..."
                  ></textarea>
                </div>
              )}

              <form action={formAction} className="flex justify-end gap-3">
                <input type="hidden" name="id" value={editedRecord.id} />
                <input type="hidden" name="decision" value={confirmAction} />
                <input type="hidden" name="comment" value={comment} />

                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <SubmitButton
                  isPending={isPending}
                  label={
                    confirmAction === "accept"
                      ? "Confirm Approval"
                      : "Confirm Rejection"
                  }
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const FiArrowRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 ${className || ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);
