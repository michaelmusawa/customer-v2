// components/report/RankFilter.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function RankFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Initialize from URL or default to "count"
  const initial = (searchParams.get("rankBy") as "count" | "value") || "count";
  const [selected, setSelected] = useState<"count" | "value">(initial);

  // Whenever `selected` changes, update the `rankBy` query param
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selected) {
      params.set("rankBy", selected);
    } else {
      params.delete("rankBy");
    }
    replace(`${pathname}?${params.toString()}`);
  }, [selected, pathname, replace, searchParams]);

  return (
    <select
      value={selected}
      onChange={(e) => setSelected(e.target.value as "count" | "value")}
      className="block rounded-md border border-gray-200 bg-gray-50 py-2 px-3 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondaryColor"
    >
      <option value="count">By Count</option>
      <option value="value">By Value</option>
    </select>
  );
}
