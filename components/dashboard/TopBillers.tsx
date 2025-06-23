// components/dashboard/TopBillers.tsx
import React from "react";
import {
  fetchTopBillers,
  fetchUserNameById,
  TopPerformer,
} from "@/app/lib/dashboardActions";

export default async function TopBillers({
  startDate,
  endDate,
  station,
  userId,
}: {
  startDate: string;
  endDate: string;
  station: string;
  userId?: number | undefined;
}) {
  // 1. Pull the “full” ranking (or at least top 100)
  const fullList = await fetchTopBillers(startDate, endDate, station);

  let displayList: TopPerformer[];

  if (userId != null) {
    // 2. Look up this user’s name
    const myName = await fetchUserNameById(userId);

    // 3. Find their position in the ranking
    const idx = fullList.findIndex((row) => row.name === myName);

    if (idx >= 0) {
      // center that user ±2
      const start = Math.max(0, idx - 2);
      displayList = fullList.slice(start, start + 5);
    } else {
      // if not found (e.g. brand‐new user), fall back to top 5
      displayList = fullList.slice(0, 5);
    }
  } else {
    // no userId: just show global top 5
    displayList = fullList.slice(0, 5);
  }
  return (
    <div>
      <SimpleTable
        headers={["#", "Biller", "Count", "Value"]}
        rows={displayList.map((b, i) => [
          i + 1,
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
