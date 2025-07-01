// app/records/report/page.tsx
import React, { Suspense } from "react";
import SummarySection from "@/components/report/SummarySection";
import RankingTable from "@/components/report/RankingTable";
import ShiftSummary from "@/components/report/ShiftSummary";
import DateRangeFilter from "@/components/ui/dateRangeFilter";
import StationFilter from "@/components/report/StationFilter";
import GroupByShiftFilter from "@/components/report/GroupByShiftFilter";
import RankFilter from "@/components/report/RankFilter";
import SummarySectionSkeleton from "@/components/report/SummarySectionSkeleton";
import RankingTableSkeleton from "@/components/report/RankingTableSkeleton";
import ServiceRankingTableSkeleton from "@/components/report/ServiceRankingTableSkeleton";
import ServiceRankingTable from "@/components/report/ServiceRankingTable";
import ShiftSummarySkeleton from "@/components/report/ShiftSummarySkeleton";
import ReportExportButton from "@/components/report/ReportExportButton";
import { requireRoleOrRedirect } from "@/app/lib/authHelpers";

const Page = async (props: {
  searchParams?: Promise<{
    station?: string;
    startDate?: string;
    endDate?: string;
    groupByShift?: boolean;
    rankBy?: string;
  }>;
}) => {
  // Ensure the user is logged in and has the correct role
  await requireRoleOrRedirect(["coordinator"]);

  const {
    station = "",
    startDate = "",
    endDate = "",
    groupByShift = undefined,
    rankBy = "",
  } = (await props.searchParams) ?? {};

  return (
    <main className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 md:p-7 transition-all">
        {/* Filter Section */}
        <div className="mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Service Report Dashboard
            </h1>
            <ReportExportButton
              station={station}
              startDate={startDate}
              endDate={endDate}
              groupByShift={groupByShift}
              rankBy={rankBy}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
            <div className="md:col-span-2">
              <DateRangeFilter
                placeholderStart="Start Date"
                placeholderEnd="End Date"
              />
            </div>
            <div className="md:col-span-2">
              <StationFilter station={station} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <RankFilter />
              <GroupByShiftFilter />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <Suspense fallback={<SummarySectionSkeleton />}>
          <SummarySection
            startDate={startDate}
            endDate={endDate}
            station={station}
          />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biller Ranking */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-5 shadow-md">
            <Suspense fallback={<RankingTableSkeleton />}>
              <RankingTable
                startDate={startDate}
                endDate={endDate}
                station={station}
                rankBy={rankBy}
                groupBy={groupByShift}
              />
            </Suspense>
          </div>

          {/* Service Ranking */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-5 shadow-md">
            <Suspense fallback={<ServiceRankingTableSkeleton />}>
              <ServiceRankingTable
                startDate={startDate}
                endDate={endDate}
                station={station}
                rankBy={rankBy}
                groupBy={groupByShift}
              />
            </Suspense>
          </div>
        </div>

        {/* Shift Summary */}
        <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-5 shadow-md">
          <Suspense fallback={<ShiftSummarySkeleton />}>
            <ShiftSummary
              startDate={startDate}
              endDate={endDate}
              station={station}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default Page;
