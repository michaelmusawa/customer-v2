// components/records/RecordsTable.tsx
import { fetchFilteredRecords } from "@/app/lib/recordsActions";
import React from "react";
import AddRecordModal from "./AddRecordModal";
import { FiClipboard, FiAlertCircle } from "react-icons/fi";
import EditTicketModal from "./EditTicketModal";
import { RecordRow } from "@/app/lib/definitions";
import ViewRecordModal from "./ViewRecordModal";

const PAGE_SIZE = 10;

const RecordsTable = async ({
  query,
  startDate,
  endDate,
  currentPage,
  role,
  analysis,
}: {
  query: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  role: string;
  analysis: "invoice" | "receipt";
}) => {
  const records: RecordRow[] = await fetchFilteredRecords(
    query,
    startDate,
    endDate,
    role,
    currentPage,
    analysis
  );

  const offset = (currentPage - 1) * PAGE_SIZE;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ticket
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>

            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {records.map((r, i) => {
            // Choose a special style for pending edits
            const rowClass = r.hasEdits
              ? "bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400"
              : "transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30";

            return (
              <tr key={r.id} className={rowClass}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {offset + i + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        r.hasEdits
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {r.ticket}
                    </span>
                    {r.hasEdits && (
                      <FiAlertCircle
                        title="Pending edit approval"
                        className="w-4 h-4 text-yellow-500"
                      />
                    )}
                    {r.ticket === "T-DAEMON" && <EditTicketModal record={r} />}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {r.recordType}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white font-medium">
                    {r.service}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {r.subService}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                  KES {r.value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(r.createdAt)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <ViewRecordModal record={r} />
                    {r.hasEdits ? (
                      <button
                        className="flex p-2 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        title="Edit pending record"
                      >
                        <span className="text-xs font-medium mr-1">
                          Pending approval..
                        </span>
                        <FiAlertCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      role === "biller" && <AddRecordModal record={r} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {records.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
            <FiClipboard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No records found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search or filter to find what you&apos;re looking
            for.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecordsTable;
