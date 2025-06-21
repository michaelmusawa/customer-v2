// components/settings/SettingList.tsx
import React from "react";
import { getSettings, getSubservices } from "@/app/lib/settingsActions";
import { FiChevronDown } from "react-icons/fi";

interface Props {
  type: "shifts" | "counters" | "stations" | "services";
}

export default async function SettingList({ type }: Props) {
  try {
    if (type === "services") {
      // 1. Fetch all services
      const services = await getSettings("services");
      // 2. In parallel, fetch subservices for each
      const subservicesList = await Promise.all(
        services.map((svc) => getSubservices(svc))
      );

      return (
        <div className="mt-4 space-y-3">
          {services.map((svc, i) => (
            <div
              key={svc}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:border-blue-300 dark:hover:border-indigo-500"
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  {svc}
                </span>
                <FiChevronDown className="text-gray-500" />
              </div>

              <div className="p-3 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {subservicesList[i].map((sub) => (
                    <div
                      key={sub}
                      className="px-3 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg"
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      const items = await getSettings(type);
      if (!items.length)
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No {type} added yet
            </p>
          </div>
        );

      return (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((i) => (
            <div
              key={i}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/70"
            >
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-3"></div>
                <span className="text-gray-800 dark:text-gray-200">{i}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
  } catch (err) {
    console.error(err);
    return (
      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
        Failed to load {type}
      </div>
    );
  }
}
