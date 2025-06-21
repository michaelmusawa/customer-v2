// app/settings/page.tsx
import React, { Suspense } from "react";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AddGroupModal from "@/components/settings/AddGroupModal";
import SettingList from "@/components/settings/SettingList";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system configurations and service options
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(["shifts", "counters", "stations"] as const).map((type) => (
            <section
              key={type}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {type[0].toUpperCase() + type.slice(1)}
                </h2>
                <AddGroupModal type={type} label={type.slice(0, -1)} />
              </div>
              <Suspense fallback={<TableSkeleton />}>
                <SettingList type={type} />
              </Suspense>
            </section>
          ))}

          {/* Services section - full width */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 col-span-full transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Services
              </h2>
              <AddGroupModal type="services" label="Service" />
            </div>
            <Suspense fallback={<TableSkeleton />}>
              <SettingList type="services" />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}
