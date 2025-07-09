// components/records/RecordsTable.tsx
import { fetchFilteredRecords } from "@/app/lib/recordsActions";
import React from "react";
import AddRecordModal from "./AddRecordModal";
import { FiClipboard, FiEye } from "react-icons/fi";
import EditTicketModal from "./EditTicketModal";

const PAGE_SIZE = 10;

const RecordsTable = async ({
  query,
  startDate,
  endDate,
  currentPage,
  role,
}: {
  query: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  role: string;
}) => {
  const records = await fetchFilteredRecords(
    query,
    startDate,
    endDate,
    role,
    currentPage
  );

  const offset = (currentPage - 1) * PAGE_SIZE;

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
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
            {role === "biller" && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {records.map((r, i) => (
            <tr
              key={r.id}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {offset + i + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {r.ticket}
                  </span>
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
              {role === "biller" && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <AddRecordModal record={r} />
                  </div>
                </td>
              )}
            </tr>
          ))}
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
