// components/dashboard/TimeSeriesChart.tsx
import React from "react";

import { fetchTimeSeries } from "@/app/lib/dashboardActions";
import TimeSeriesChartComponent from "./TimeSeriesChartComponent";

export default async function TimeSeriesChart({
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
  const data = await fetchTimeSeries(startDate, endDate, station, userId);
  return <TimeSeriesChartComponent data={data} />;
}
