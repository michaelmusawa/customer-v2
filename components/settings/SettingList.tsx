import React from "react";
import {
  getSettings,
  getSubservices,
  getGroupedCounters,
} from "@/app/lib/settingsActions";
import { FiChevronDown } from "react-icons/fi";
import { EditModal, DeleteModal } from "./EditDeleteModal";
import { SubserviceItem } from "./SubserviceItem";
import AddSubserviceModal from "./AddSubserviceModal";

interface Props {
  type: "shifts" | "counters" | "stations" | "services";
}

export default async function SettingList({ type }: Props) {
  try {
    if (type === "services") {
      const services = await getSettings("services");
      const subservicesList = await Promise.all(
        services.map((svc) => getSubservices(svc.name))
      );

      return (
        <div className="p-5">
          <div className="space-y-4">
            {services.map((svc, i) => {
              const hasSubservices = subservicesList[i].length > 0;
              return (
                <div
                  key={svc.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:border-blue-300 dark:hover:border-indigo-500"
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {svc.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <EditModal
                        type="services"
                        id={svc.id}
                        currentName={svc.name}
                      />
                      <DeleteModal
                        type="services"
                        id={svc.id}
                        currentName={svc.name}
                      />
                      {hasSubservices && (
                        <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                      )}
                      <AddSubserviceModal serviceName={svc.name} />
                    </div>
                  </div>

                  {hasSubservices && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {subservicesList[i].map((sub) => (
                          <SubserviceItem
                            key={sub}
                            serviceId={svc.id}
                            name={sub}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (type === "counters") {
      const groupedCounters = await getGroupedCounters();

      if (!groupedCounters.length) {
        return (
          <div className="p-5">
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">
                No counters added yet
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="p-5">
          <div className="space-y-6">
            {groupedCounters.map((group) => (
              <div key={group.shift.id} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {group.shift.name} Shift
                  </h3>
                  <div className="flex gap-1">
                    <EditModal
                      type="shifts"
                      id={group.shift.id}
                      currentName={group.shift.name}
                    />
                    <DeleteModal
                      type="shifts"
                      id={group.shift.id}
                      currentName={group.shift.name}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.counters.map((counter) => (
                    <div
                      key={counter.id}
                      className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">
                          {counter.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <EditModal
                          type="counters"
                          id={counter.id}
                          currentName={counter.name}
                        />
                        <DeleteModal
                          type="counters"
                          id={counter.id}
                          currentName={counter.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const items = await getSettings(type);
      if (!items.length) {
        return (
          <div className="p-5">
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">
                No {type} added yet
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm flex justify-between items-center"
              >
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <EditModal type={type} id={item.id} currentName={item.name} />
                  <DeleteModal
                    type={type}
                    id={item.id}
                    currentName={item.name}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  } catch (err) {
    console.error(err);
    return (
      <div className="p-5">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-700/50">
          Failed to load {type}
        </div>
      </div>
    );
  }
}
