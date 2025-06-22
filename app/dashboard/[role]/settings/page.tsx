import React, { Suspense } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AddGroupModal from "@/components/settings/AddGroupModal";
import SettingList from "@/components/settings/SettingList";
import { auth } from "@/auth";
import { getUser } from "@/app/lib/loginActions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email;
  const user = await getUser(email ?? "");

  const allTypes = ["shifts", "counters", "stations"] as const;
  const listTypes: ("shifts" | "counters" | "stations")[] = allTypes.filter(
    (t) => (t === "stations" ? user?.role === "admin" : true)
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-3xl">
            Manage system configurations and service options
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {listTypes.map((type) => {
            const canAdd =
              type === "stations"
                ? user?.role === "admin"
                : ["shifts", "counters"].includes(type)
                ? user?.role === "supervisor"
                : false;

            return (
              <section
                key={type}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {type[0].toUpperCase() + type.slice(1)}
                  </h2>
                  {canAdd && (
                    <AddGroupModal
                      type={type}
                      label={type.slice(0, -1)}
                      station={type !== "stations" ? user?.station : undefined}
                    />
                  )}
                </div>
                <Suspense fallback={<TableSkeleton />}>
                  <SettingList type={type} />
                </Suspense>
              </section>
            );
          })}

          {user?.role === "admin" && (
            <section className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Services
                </h2>
                <AddGroupModal type="services" label="Service" />
              </div>
              <Suspense fallback={<TableSkeleton />}>
                <SettingList type="services" />
              </Suspense>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
