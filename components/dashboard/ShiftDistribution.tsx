// components/dashboard/ShiftDistribution.tsx
import React from "react";
import { fetchShiftDistribution } from "@/app/lib/dashboardActions";
import ShiftDistributionComponent from "./ShiftDistributionComponent";

export default async function ShiftDistribution({
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
  const data = await fetchShiftDistribution(
    startDate,
    endDate,
    station,
    userId
  );
  return <ShiftDistributionComponent data={data} />;
}
