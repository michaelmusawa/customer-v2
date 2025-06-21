// components/dashboard/ShiftDistribution.tsx
import React from "react";
import { fetchShiftDistribution } from "@/app/lib/dashboardActions";
import ShiftDistributionComponent from "./ShiftDistributionComponent";

export default async function ShiftDistribution({
  startDate,
  endDate,
  station,
}: {
  startDate: string;
  endDate: string;
  station: string;
}) {
  const data = await fetchShiftDistribution(startDate, endDate, station);
  return <ShiftDistributionComponent data={data} />;
}
