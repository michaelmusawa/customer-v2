// app/dashboard/page.tsx
import React, { Suspense } from "react";
import ServiceBreakdown from "@/components/dashboard/ServiceBreakdown";
import ShiftDistribution from "@/components/dashboard/ShiftDistribution";
import ServiceBreakdownSkeleton from "@/components/dashboard/skeleton/ServiceBreakdownSkeleton";
import ShiftDistributionSkeleton from "@/components/dashboard/skeleton/ShiftDistributionSkeleton";
import SummarySectionSkeleton from "@/components/dashboard/skeleton/SummarySectionSkeleton";
import TimeSeriesChartSkeleton from "@/components/dashboard/skeleton/TimeSeriesChartSkeleton";
import TopBillersSkeleton from "@/components/dashboard/skeleton/TopBillersSkeleton";
import TopServicesSkeleton from "@/components/dashboard/skeleton/TopServicesSkeleton";
import SummarySection from "@/components/dashboard/SummarySection";
import TimeSeriesChart from "@/components/dashboard/TimeSeriesChart";
import TopBillers from "@/components/dashboard/TopBillers";
import TopServices from "@/components/dashboard/TopServices";
import StationFilter from "@/components/report/StationFilter";
import DateRangeFilter from "@/components/ui/dateRangeFilter";
import { auth } from "@/auth";
import { getUser } from "@/app/lib/loginActions";

const Page = async (props: {
  searchParams?: Promise<{
    station?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) => {
  const {
    station = "",
    startDate = "",
    endDate = "",
  } = (await props.searchParams) ?? {};

  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const role = user?.role;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}

        {/* Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Station
              </label>
              <StationFilter
                station={user?.station ? user.station : undefined}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <DateRangeFilter
                placeholderStart="Start Date"
                placeholderEnd="End Date"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <Suspense fallback={<SummarySectionSkeleton />}>
            <SummarySection
              startDate={startDate}
              endDate={endDate}
              station={station}
              userId={role === "biller" ? user?.id : undefined}
            />
          </Suspense>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Records Over Time
            </h3>
            <Suspense fallback={<TimeSeriesChartSkeleton />}>
              <TimeSeriesChart
                startDate={startDate}
                endDate={endDate}
                station={station}
                userId={role === "biller" ? user?.id : undefined}
              />
            </Suspense>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Service Breakdown
              </h3>
              <Suspense fallback={<ServiceBreakdownSkeleton />}>
                <ServiceBreakdown
                  startDate={startDate}
                  endDate={endDate}
                  station={station}
                  userId={role === "biller" ? user?.id : undefined}
                />
              </Suspense>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Shift Distribution
              </h3>
              <Suspense fallback={<ShiftDistributionSkeleton />}>
                <ShiftDistribution
                  startDate={startDate}
                  endDate={endDate}
                  station={station}
                  userId={role === "biller" ? user?.id : undefined}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Top Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Billers
            </h3>
            <Suspense fallback={<TopBillersSkeleton />}>
              <TopBillers
                startDate={startDate}
                endDate={endDate}
                station={station}
                userId={role === "biller" ? user?.id : undefined}
              />
            </Suspense>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Services
            </h3>
            <Suspense fallback={<TopServicesSkeleton />}>
              <TopServices
                startDate={startDate}
                endDate={endDate}
                station={station}
                userId={role === "biller" ? user?.id : undefined}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
