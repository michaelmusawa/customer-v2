// components/report/ShiftSummary.tsx
import { fetchShiftSummaryData } from "@/app/lib/reportActions";
import React from "react";
import { FiClock } from "react-icons/fi";

interface ShiftSummaryProps {
  startDate: string;
  endDate: string;
  station: string;
}

export default async function ShiftSummary({
  startDate,
  endDate,
  station,
}: ShiftSummaryProps) {
  const items = await fetchShiftSummaryData(startDate, endDate, station);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-5 flex items-center dark:text-white">
        <FiClock className="mr-2 text-amber-500" />
        Shift Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.shift}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 mr-3">
                <FiClock className="text-amber-500 dark:text-amber-400" />
              </div>
              <h4 className="font-bold text-lg dark:text-white">
                {item.shift} Shift
              </h4>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">
                  Transactions
                </span>
                <span className="text-lg font-bold dark:text-white">
                  {item.count}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">
                  Clients
                </span>
                <span className="text-lg font-bold dark:text-white">
                  {item.clients}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Value</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  KES {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
