// components/report/RankingTable.tsx
import React from "react";
import {
  fetchRankingData,
  RankingDataItem,
  ShiftRankingSection,
} from "@/app/lib/reportActions";
import FullRankingModal from "./FullRankingModal";
import { FiBarChart2 } from "react-icons/fi";

interface RankingTableProps {
  startDate: string;
  endDate: string;
  station: string;
  rankBy: string;
  groupBy: boolean;
}

export default async function RankingTable({
  startDate,
  endDate,
  station,
  rankBy,
  groupBy,
}: RankingTableProps) {
  const allData = await fetchRankingData(
    startDate,
    endDate,
    station,
    rankBy,
    groupBy
  );

  const isByShift =
    Array.isArray(allData) &&
    (allData as ShiftRankingSection[])[0]?.shift !== undefined;

  // Render a single table given items
  function renderTable(items: RankingDataItem[]) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Biller
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
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((item, i) => (
              <tr
                key={item.key}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
              >
                <td className="py-4 px-5 whitespace-nowrap font-medium">
                  <div className="flex items-center">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                      ${
                        i === 0
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          : i === 1
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-5 font-medium text-gray-900 dark:text-gray-100">
                  {item.key}
                </td>
                <td className="py-4 px-5 text-right font-semibold">
                  {item.count}
                </td>
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
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center dark:text-white">
          <FiBarChart2 className="mr-2 text-blue-500" />
          Biller Ranking
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-3 py-1 rounded-full text-xs font-medium text-blue-600 dark:text-blue-300">
          {groupBy ? "Grouped by Shift" : "Overall"}
        </div>
      </div>

      {isByShift
        ? (allData as ShiftRankingSection[]).map((section) => {
            const top2 = section.items.slice(0, 2);
            return (
              <div key={section.shift} className="mb-8">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Shift: {section.shift}
                </h4>
                {renderTable(top2)}
              </div>
            );
          })
        : renderTable(allData as RankingDataItem[])}

      <div className="mt-4 text-right">
        <FullRankingModal
          items={allData as any}
          rankBy={rankBy}
          groupBy={groupBy}
        />
      </div>
    </div>
  );
}
