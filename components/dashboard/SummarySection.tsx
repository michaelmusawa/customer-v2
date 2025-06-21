// components/dashboard/SummarySection.tsx
import React from "react";
import { fetchSummaryStats } from "@/app/lib/dashboardActions";
import {
  FiFileText,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";

export default async function SummarySection({
  startDate,
  endDate,
  station,
}: {
  startDate: string;
  endDate: string;
  station: string;
}) {
  const { totalRecords, totalValue, totalServices, errorRate } =
    await fetchSummaryStats(startDate, endDate, station);

  const cards = [
    {
      label: "Total Records",
      value: totalRecords,
      icon: <FiFileText className="text-xl" />,
      color: "bg-blue-100 text-blue-600",
      darkColor: "dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      label: "Total Value (KES)",
      value: `KES ${totalValue.toLocaleString()}`,
      icon: <FiDollarSign className="text-xl" />,
      color: "bg-green-100 text-green-600",
      darkColor: "dark:bg-green-900/30 dark:text-green-300",
    },
    {
      label: "Avg. Time (min)",
      value: `${totalServices.toFixed(1)}`,
      icon: <FiClock className="text-xl" />,
      color: "bg-amber-100 text-amber-600",
      darkColor: "dark:bg-amber-900/30 dark:text-amber-300",
    },
    {
      label: "Error Rate (%)",
      value: `${errorRate.toFixed(1)}%`,
      icon: <FiAlertCircle className="text-xl" />,
      color: "bg-red-100 text-red-600",
      darkColor: "dark:bg-red-900/30 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md ${card.color} ${card.darkColor}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {card.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${card.color} ${card.darkColor}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
