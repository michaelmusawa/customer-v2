// components/records/EditedRecordsTable.tsx
import { fetchFilteredEditedRecords } from "@/app/lib/recordsActions";
import React from "react";
import EditRecordModal from "./EditRecordModal";
import { FiEdit, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const EditedRecordsTable = async ({
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
  group?: string;
}) => {
  const records = await fetchFilteredEditedRecords(
    query,
    startDate,
    endDate,
    role,
    currentPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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
              Ticket
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Changes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requester
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
          {records.map((r, i) => (
            <tr
              key={r.id}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                {r.ticket}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {r.service}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {r.subService}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-1 rounded-full bg-yellow-100 text-yellow-600">
                    <FiEdit className="w-4 h-4" />
                  </div>
                  <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {r.changedFields?.length || 0} changes
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {r.editedBy}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FiClock className="mr-1 text-gray-400" />
                  {formatDate(r.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <EditRecordModal editedRecord={r}>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Review
                  </button>
                </EditRecordModal>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {records.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
            <FiCheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No pending requests
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            All edit requests have been reviewed and processed.
          </p>
        </div>
      )}
    </div>
  );
};

export default EditedRecordsTable;
