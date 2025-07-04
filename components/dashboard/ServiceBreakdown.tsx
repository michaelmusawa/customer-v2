// components/dashboard/ServiceBreakdown.tsx
import React from "react";
import { fetchServiceBreakdown } from "@/app/lib/dashboardActions";
import ServiceBreakdownComponent from "./ServiceBreakdownComponent";

export default async function ServiceBreakdown({
  startDate,
  endDate,
  station,
}: {
  startDate: string;
  endDate: string;
  station: string;
}) {
  const data = await fetchServiceBreakdown(startDate, endDate, station);
  const colors = ["#68d391", "#63b3ed", "#f6ad55", "#ed64a6", "#9f7aea"];
  return <ServiceBreakdownComponent data={data} colors={colors} />;
}
