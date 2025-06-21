// components/dashboard/TopBillers.tsx
import React from "react";
import { fetchTopBillers } from "@/app/lib/dashboardActions";

export default async function TopBillers({
  startDate,
  endDate,
  station,
}: {
  startDate: string;
  endDate: string;
  station: string;
}) {
  const data = await fetchTopBillers(startDate, endDate, station);
  return (
    <div>
      <SimpleTable
        headers={["Biller", "Count", "Value"]}
        rows={data.map((b, i) => [
          b.name,
          b.count,
          `KES ${b.value.toLocaleString()}`,
        ])}
      />
    </div>
  );
}

export function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50">
            {headers.map((h, i) => (
              <th
                key={h}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  i === 0 ? "rounded-tl-lg" : ""
                } ${i === headers.length - 1 ? "rounded-tr-lg" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`transition-colors ${
                i % 2 === 0
                  ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70"
                  : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 text-sm ${
                    j === 0
                      ? "font-medium text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
