// app/notifications/page.tsx
import { fetchEditedRecordsPages } from "@/app/lib/recordsActions";
import EditedRecordsTable from "@/components/records/EditedRecordsTable";
import DateRangeFilter from "@/components/ui/dateRangeFilter";
import Pagination from "@/components/ui/pagination";
import Search from "@/components/ui/search";
import TableSkeleton from "@/components/ui/TableSkeleton";
import React, { Suspense } from "react";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    deleted?: boolean;
    success?: boolean;
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
  const totalPages = await fetchEditedRecordsPages(
    query,
    startDate,
    endDate,
    role
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and approve pending record modifications
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-8">
          <div className="flex flex-wrap gap-3 w-full mb-6">
            <div className="flex-1 min-w-[200px]">
              <Search placeholder="Search requests..." />
            </div>
            <DateRangeFilter
              placeholderStart="Start Date"
              placeholderEnd="End Date"
            />
          </div>

          <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
            <EditedRecordsTable
              query={query}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              role={role}
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
