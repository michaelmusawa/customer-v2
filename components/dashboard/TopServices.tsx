// components/dashboard/TopServices.tsx
import React from "react";
import { fetchTopServices } from "@/app/lib/dashboardActions";
import { SimpleTable } from "./TopBillers";

export default async function TopServices({
  startDate,
  endDate,
  station,
  userId,
}: {
  startDate: string;
  endDate: string;
  station: string;
  userId: number | undefined;
}) {
  const data = await fetchTopServices(startDate, endDate, station, userId);
  return (
    <div>
      <SimpleTable
        headers={["Service", "Count", "Value"]}
        rows={data.map((s, i) => [
          s.name,
          s.count,
          `KES ${parseInt(s.value).toLocaleString()}`,
        ])}
      />
    </div>
  );
}
