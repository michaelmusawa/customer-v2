// components/dashboard/ServiceBreakdown.tsx
import React from "react";
import { fetchServiceBreakdown } from "@/app/lib/dashboardActions";
import ServiceBreakdownComponent from "./ServiceBreakdownComponent";

export default async function ServiceBreakdown({
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
  const data = await fetchServiceBreakdown(
    startDate,
    endDate,
    station,
    analysis
  );
  const colors = ["#68d391", "#63b3ed", "#f6ad55", "#ed64a6", "#9f7aea"];
  return <ServiceBreakdownComponent data={data} colors={colors} />;
}
