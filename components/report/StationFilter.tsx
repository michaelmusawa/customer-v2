// components/report/StationFilter.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

interface StationFilterProps {
  /** if provided, the filter is fixed to this station and cannot be changed */
  station?: string;
}

export default function StationFilter({ station }: StationFilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Local state for all station options
  const [stations, setStations] = useState<string[]>([]);

  // Determine initial selected value:
  //  - if prop `station` passed, trust that
  //  - otherwise use URL param (or "")
  const initial = station ?? searchParams.get("station") ?? "";
  const [selected, setSelected] = useState(initial);

  // Fetch available stations once
  useEffect(() => {
    fetch("/api/settings/stations")
      .then((res) => res.json())
      .then((data) => setStations(data.items.map((s: any) => s.name)));
  }, []);

  // Whenever `selected` changes—and only when it's _not_ forced via prop—
  // update the URL query string.
  useEffect(() => {
    if (station) return; // forced, do not push URL changes

    const params = new URLSearchParams(searchParams.toString());
    if (selected) {
      params.set("station", selected);
    } else {
      params.delete("station");
    }
    replace(`${pathname}?${params.toString()}`);
  }, [selected, station, pathname, replace, searchParams]);

  return (
    <select
      value={selected}
      onChange={(e) => {
        if (!station) {
          setSelected(e.target.value);
        }
      }}
      disabled={!!station}
      className="block rounded-md border border-gray-200 bg-gray-50 py-2 px-3 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondaryColor disabled:opacity-50"
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
