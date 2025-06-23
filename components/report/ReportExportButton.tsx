// components/ReportExportButton.server.tsx

import React from "react";

import {
  fetchSummaryStats,
  fetchShiftSummaryData,
  fetchRankingData,
  fetchServiceRankingData,
} from "@/app/lib/reportActions";
import { ReportData } from "./ReportPdfDocument";
import ReportExportButtonClient from "./ReportExportButton.client";

interface props {
  startDate?: string | undefined;
  endDate?: string;
  station?: string;
  rankBy?: boolean;
  groupByShift?: boolean;
}

const ReportExportButton = async ({
  startDate,
  endDate,
  station,
  rankBy,
  groupByShift,
}: props) => {
  // 1) fetch all data
  const [summary, shiftSummary, billerData, serviceData] = await Promise.all([
    fetchSummaryStats(startDate, endDate, station),
    fetchShiftSummaryData(startDate, endDate, station),
    fetchRankingData(startDate, endDate, station, rankBy, groupByShift),
    fetchServiceRankingData(startDate, endDate, station, rankBy, groupByShift),
  ]);

  // 2) prepare props
  const docProps: ReportData = {
    startDate,
    endDate,
    station,
    rankBy,
    groupByShift,
    summary,
    shiftSummary,
    billerData,
    serviceData,
  };

  return <ReportExportButtonClient docProps={docProps} />;
};
export default ReportExportButton;
