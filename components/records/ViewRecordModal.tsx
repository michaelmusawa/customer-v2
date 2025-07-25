// components/records/ViewRecordModal.tsx
"use client";

import React, { useState } from "react";
import { FiEye, FiX } from "react-icons/fi";
import { RecordRow } from "@/app/lib/definitions";

interface ViewRecordModalProps {
  record: RecordRow;
}

export default function ViewRecordModal({ record }: ViewRecordModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title="View details"
      >
        {/* Eye icon passed down or imported here */}
        <FiEye className="w-4 h-4 transform rotate-45" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Record Details
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <dl className="grid grid-cols-2 gap-4">
              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Ticket
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {record.ticket}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Name
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {record.name}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Type
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {record.recordType ?? "-"}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Service
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {record.service}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Sub-Service
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {record.subService ?? "-"}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Value
              </dt>
              <dd className="text-green-600 dark:text-green-400">
                KES {record.value.toLocaleString()}
              </dd>

              <dt className="font-medium text-gray-700 dark:text-gray-300">
                Created At
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(record.createdAt).toLocaleString()}
              </dd>
            </dl>

            {/* Footer / Actions */}
            <div className="mt-6 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
