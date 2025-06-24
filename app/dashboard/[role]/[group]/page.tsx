// app/dashboard/[role]/billers/page.tsx
import { requireRoleOrRedirect } from "@/app/lib/authHelpers";
import { getUser } from "@/app/lib/loginActions";
import { fetchUsersPages } from "@/app/lib/supervisorsActions";
import { getSubordinateRole } from "@/app/lib/utils";
import { auth } from "@/auth";
import AddUserModal from "@/components/dashboard/AddUserModal";
import DateRangeFilter from "@/components/ui/dateRangeFilter";
import Pagination from "@/components/ui/pagination";
import Search from "@/components/ui/search";
import TableSkeleton from "@/components/ui/TableSkeleton";
import UsersTable from "@/components/ui/usersTable";
import ToggleShowArchived from "@/components/users/ToggleShowArchived";
import React, { Suspense } from "react";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    deleted?: boolean;
    success?: boolean;
    showArchived?: string; // Add this line to handle showArchived
  }>;
  params?: Promise<{ role?: string }>;
}) => {
  // Ensure the user is logged in and has the correct role
  await requireRoleOrRedirect(["admin", "coordinator", "supervisor"]);

  let station;
  const searchParams = await props.searchParams;
  const params = await props.params;
  const userRole = params?.role || "";
  const query = searchParams?.query || "";
  const startDate = searchParams?.startDate || "";
  const endDate = searchParams?.endDate || "";
  const showArchived = searchParams?.showArchived === "true"; // Add this line
  const currentPage = Number(searchParams?.page) || 1;
  const role = getSubordinateRole(userRole);
  const totalPages = await fetchUsersPages(query, startDate, endDate, role);

  if (role === "biller") {
    const session = await auth();
    const userEmail = session?.user?.email || "";
    const user = await getUser(userEmail);
    if (user) {
      station = user.station;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage {role} accounts and permissions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="w-full md:w-auto">
              <AddUserModal role={role} station={station} />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* ... existing components */}
              <ToggleShowArchived /> {/* Add this component */}
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 min-w-[200px]">
                <Search placeholder="Search users..." />
              </div>
              <DateRangeFilter
                placeholderStart="Start Date"
                placeholderEnd="End Date"
              />
            </div>
          </div>

          <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
            <UsersTable
              query={query}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              role={role}
              showArchived={showArchived}
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
