// app/records/page.tsx
import { fetchRecordsPages } from "@/app/lib/recordsActions";
import AddRecordModal from "@/components/records/AddRecordModal";
import ExportRecordsButton from "@/components/records/ExportRecordsButton";
import RecordsTable from "@/components/records/RecordsTable";
import DateRangeFilter from "@/components/ui/dateRangeFilter";
import Pagination from "@/components/ui/pagination";
import Search from "@/components/ui/search";
import TableSkeleton from "@/components/ui/TableSkeleton";
import React, { Suspense } from "react";
import AnalysisToggle from "@/components/ui/AnalysisToggle";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    deleted?: boolean;
    success?: boolean;
    analysis?: "invoice" | "receipt";
  }>;
  params?: Promise<{ role?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const role = params?.role || "";
  const query = searchParams?.query || "";
  const startDate = searchParams?.startDate || "";
  const endDate = searchParams?.endDate || "";
  const currentPage = Number(searchParams?.page) || 1;
  const analysis = searchParams?.analysis || "invoice";
  const totalPages = await fetchRecordsPages(
    query,
    startDate,
    endDate,
    role,
    analysis
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Records Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and manage all service records
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              {role === "biller" && (
                <div className="w-full md:w-auto">
                  <AddRecordModal />
                </div>
              )}
              <ExportRecordsButton
                query={query}
                startDate={startDate}
                endDate={endDate}
                role={role}
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 min-w-[200px]">
                <Search placeholder="Search records..." />
              </div>
              <DateRangeFilter
                placeholderStart="Start Date"
                placeholderEnd="End Date"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Type
              </label>
              <AnalysisToggle />
            </div>
          </div>

          <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
            <RecordsTable
              query={query}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              role={role}
              analysis={analysis}
            />
          </Suspense>

          <div className="mt-6 flex justify-center">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
