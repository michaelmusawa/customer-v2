// components/dashboard/TopServices.tsx
import React from "react";
import { fetchTopServices } from "@/app/lib/dashboardActions";
import { SimpleTable } from "./TopBillers";

export default async function TopServices({
  startDate,
  endDate,
  station,
  analysis,
}: {
  startDate: string;
  endDate: string;
  station: string;
  analysis: "invoice" | "receipt";
}) {
  const data = await fetchTopServices(startDate, endDate, station, analysis);

  return (
    <div>
      <SimpleTable
        headers={["Service", "Count", "Value"]}
        rows={data.map((s) => [
          s.name,
          s.count,
          `KES ${s.value.toLocaleString()}`,
        ])}
      />
    </div>
  );
}
