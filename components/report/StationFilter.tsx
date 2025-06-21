// components/report/StationFilter.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function StationFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Local state for stations list and selected station
  const [stations, setStations] = useState<string[]>([]);
  const initial = searchParams.get("station") || "";
  const [selected, setSelected] = useState(initial);

  // Fetch station options once
  useEffect(() => {
    fetch("/api/settings/stations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setStations(data.items);
        }
      });
  }, []);

  // Whenever `selected` changes, update URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selected) {
      params.set("station", selected);
    } else {
      params.delete("station");
    }

    replace(`${pathname}?${params.toString()}`);
  }, [selected, pathname, replace, searchParams]);

  return (
    <select
      value={selected}
      onChange={(e) => setSelected(e.target.value)}
      className="block rounded-md border border-gray-200 bg-gray-50 py-2 px-3 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondaryColor"
    >
      <option value="">All Stations</option>
      {stations.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
