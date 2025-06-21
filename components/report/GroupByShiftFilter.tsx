// components/report/GroupByShiftFilter.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function GroupByShiftFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Initialize from URL
  const initial = searchParams.get("groupByShift") === "true";
  const [groupByShift, setGroupByShift] = useState(initial);

  // Sync URL whenever toggle changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (groupByShift) {
      params.set("groupByShift", "true");
    } else {
      params.delete("groupByShift");
    }
    replace(`${pathname}?${params.toString()}`);
  }, [groupByShift, pathname, replace, searchParams]);

  return (
    <button
      onClick={() => setGroupByShift(!groupByShift)}
      className={`px-3 py-2 rounded border transition text-sm ${
        groupByShift
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
      }`}
    >
      {groupByShift ? "Ungroup Shift" : "Group by Shift"}
    </button>
  );
}
