// components/dashboard/TimeSeriesChart.tsx
import React from "react";

import { fetchTimeSeries } from "@/app/lib/dashboardActions";
import TimeSeriesChartComponent from "./TimeSeriesChartComponent";

export default async function TimeSeriesChart({
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
  const data = await fetchTimeSeries(startDate, endDate, station, analysis);
  return <TimeSeriesChartComponent data={data} />;
}
