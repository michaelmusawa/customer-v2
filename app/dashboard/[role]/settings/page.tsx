// app/settings/page.tsx
import React, { Suspense } from "react";

import TableSkeleton from "@/components/ui/TableSkeleton";
import AddGroupModal from "@/components/settings/AddGroupModal";
import SettingList from "@/components/settings/SettingList";
import { auth } from "@/auth";
import { getUser } from "@/app/lib/loginActions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth(); // returns { user: { role, station, … } }
  const email = session?.user?.email;
  const user = await getUser(email ?? "");

  // we’ll render all lists, but only show the “Add” buttons when allowed
  const listTypes = ["shifts", "counters", "stations"] as const;

  return (
    <main className="…">
      <div className="…">
        <header className="…">
          <h1>Settings</h1>
          <p>Manage system configurations and service options</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {listTypes.map((type) => {
            // only supervisors can add shifts & counters
            // only admins can add stations
            const canAdd =
              type === "stations"
                ? user?.role === "admin"
                : ["shifts", "counters"].includes(type)
                ? user?.role === "supervisor"
                : false;

            return (
              <section key={type} className="…">
                <div className="…">
                  <h2>{type[0].toUpperCase() + type.slice(1)}</h2>
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

          {/* services remain open to all */}
          <section className="col-span-full …">
            <div className="…">
              <h2>Services</h2>
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
