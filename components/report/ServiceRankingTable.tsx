// components/report/ServiceRankingTable.tsx
import {
  fetchServiceRankingData,
  ServiceRankingItem,
  ShiftServiceSection,
} from "@/app/lib/reportActions";
import React from "react";
import FullServiceRankingModal from "./FullServiceRankingModal";
import { FiAward } from "react-icons/fi";

interface ServiceRankingTableProps {
  startDate: string;
  endDate: string;
  station: string;
  rankBy: string;
  groupBy: boolean;
}

export default async function ServiceRankingTable({
  startDate,
  endDate,
  station,
  rankBy,
  groupBy,
}: ServiceRankingTableProps) {
  const allData = await fetchServiceRankingData(
    startDate,
    endDate,
    station,
    rankBy,
    groupBy
  );

  const isByShift =
    Array.isArray(allData) && !!(allData[0] as ShiftServiceSection)?.shift;

  // Render a snippet helper
  const columns = (
    <tr>
      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Rank
      </th>
      <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Service
      </th>
      <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md">
          Count
        </span>
      </th>
      <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Clients
      </th>
      <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-md">
          Value
        </span>
      </th>
    </tr>
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center dark:text-white">
          <FiAward className="mr-2 text-purple-500" />
          Service Ranking
        </h3>
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 px-3 py-1 rounded-full text-xs font-medium text-purple-600 dark:text-purple-300">
          {groupBy ? "Grouped by Shift" : "Overall"}
        </div>
      </div>

      <div className="space-y-4">
        {isByShift ? (
          (allData as ShiftServiceSection[]).map((section) => {
            const top2 = section.items.slice(0, 2);
            return (
              <div key={section.shift}>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Shift: {section.shift}
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      {columns}
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {top2.map((item, idx) => (
                        <tr
                          key={item.service}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                        >
                          <td className="py-4 px-5 whitespace-nowrap font-medium">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                              ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-medium text-gray-900 dark:text-gray-100">
                            {item.service}
                          </td>
                          <td className="py-4 px-5 text-right">{item.count}</td>
                          <td className="py-4 px-5 text-right">
                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                              {item.clients}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right font-bold text-green-600 dark:text-green-400">
                            KES {item.value.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                {columns}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(allData as ServiceRankingItem[])
                  .slice(0, 5)
                  .map((item, idx) => (
                    <tr
                      key={item.service}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="py-4 px-5 whitespace-nowrap font-medium">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                          ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                              : idx === 1
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                              : idx === 2
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-900 dark:text-gray-100">
                        {item.service}
                      </td>
                      <td className="py-4 px-5 text-right">{item.count}</td>
                      <td className="py-4 px-5 text-right">
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                          {item.clients}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-green-600 dark:text-green-400">
                        KES {item.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right">
          <FullServiceRankingModal
            items={allData as any}
            rankBy={rankBy}
            groupByShiftFlag={groupBy}
          />
        </div>
      </div>
    </div>
  );
}
