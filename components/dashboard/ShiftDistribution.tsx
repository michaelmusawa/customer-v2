// components/dashboard/ShiftDistribution.tsx
import React from "react";
import { fetchShiftDistribution } from "@/app/lib/dashboardActions";
import ShiftDistributionComponent from "./ShiftDistributionComponent";

export default async function ShiftDistribution({
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
  const data = await fetchShiftDistribution(
    startDate,
    endDate,
    station,
    analysis
  );
  return <ShiftDistributionComponent data={data} />;
}
