// components/dashboard/TimeSeriesChart.tsx
import React from "react";

import { fetchTimeSeries } from "@/app/lib/dashboardActions";
import TimeSeriesChartComponent from "./TimeSeriesChartComponent";

export default async function TimeSeriesChart({
  startDate,
  endDate,
  station,
}: {
  startDate: string;
  endDate: string;
  station: string;
}) {
  const data = await fetchTimeSeries(startDate, endDate, station);
  return <TimeSeriesChartComponent data={data} />;
}
