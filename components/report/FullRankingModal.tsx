// components/report/FullRankingModal.tsx
"use client";

import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import type {
  RankingDataItem,
  ShiftRankingSection,
} from "@/app/lib/reportActions";
import { computeTotals } from "@/app/lib/utils";

interface Props {
  items: RankingDataItem[] | ShiftRankingSection[];
  rankBy: string;
  groupBy?: boolean;
}

export default function FullRankingModal({ items, groupBy }: Props) {
  const [open, setOpen] = useState(false);

  // Determine if we're in "by shift" mode
  const isByShift =
    Array.isArray(items) &&
    (items as ShiftRankingSection[])[0]?.shift !== undefined;

  // Render a totals row for a flat list
  function renderTotalsRow(data: RankingDataItem[]) {
    const { count, clients, value } = computeTotals(data, {
      count: "int",
      clients: "int",
      value: "float2",
    });

    return (
      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 font-semibold">
        <td colSpan={2} className="py-3 px-4 text-right">
          Totals
        </td>
        <td className="py-3 px-4 text-right">{count}</td>
        <td className="py-3 px-4 text-right">{clients}</td>
        <td className="py-3 px-4 text-right">{`${value.toLocaleString()}`}</td>
      </tr>
    );
  }

  // Render a single table instance
  function renderTable(data: RankingDataItem[]) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-gray-800">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <tr>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Biller
              </th>
              <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Count
              </th>
              <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Clients
              </th>
              <th className="py-3 px-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.map((item, idx) => (
              <tr
                key={item.key}
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
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-gray-900 dark:text-gray-100">
                  {item.key}
                </td>
                <td className="py-4 px-5 text-right">{item.count}</td>
                <td className="py-4 px-5 text-right">
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                    {item.clients}
                  </span>
                </td>
                <td className="py-4 px-5 text-right font-bold text-green-600 dark:text-green-400">
                  {item.value.toLocaleString()}
                </td>
              </tr>
            ))}
            {renderTotalsRow(data)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-sm transition-all shadow-md hover:shadow-lg"
      >
        View Full Ranking
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center px-7 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-2xl font-bold dark:text-white">
                  Full Biller Ranking
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {groupBy ? "Grouped by shift" : "Overall performance"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {isByShift
                ? (items as ShiftRankingSection[]).map((section) => (
                    <div key={section.shift} className="mb-8">
                      <h4 className="text-lg font-medium mb-3 dark:text-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 py-2 px-4 rounded-lg inline-block">
                        Shift: {section.shift}
                      </h4>
                      {renderTable(section.items)}
                    </div>
                  ))
                : renderTable(items as RankingDataItem[])}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
