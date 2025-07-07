// components/report/SummarySection.tsx
import React from "react";
import { FiActivity, FiDollarSign, FiLayers, FiUsers } from "react-icons/fi";
import { fetchSummaryStats } from "@/app/lib/reportActions";

interface SummarySectionProps {
  startDate: string;
  endDate: string;
  station: string;
}

export default async function SummarySection({
  startDate,
  endDate,
  station,
}: SummarySectionProps) {
  const { totalRecords, totalValue, totalServices, totalClients } =
    await fetchSummaryStats(startDate, endDate, station);

  const stats = [
    {
      title: "Total Records",
      value: totalRecords,
      icon: <FiActivity className="h-6 w-6" />,
      color: "bg-blue-500",
      text: "text-blue-500",
    },
    {
      title: "Total Value",
      value: `KES ${totalValue.toLocaleString()}`,
      icon: <FiDollarSign className="h-6 w-6" />,
      color: "bg-green-500",
      text: "text-green-500",
    },
    {
      title: "Services Used",
      value: totalServices,
      icon: <FiLayers className="h-6 w-6" />,
      color: "bg-purple-500",
      text: "text-purple-500",
    },
    {
      title: "Clients Served",
      value: totalClients,
      icon: <FiUsers className="h-6 w-6" />,
      color: "bg-amber-500",
      text: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <div className="flex items-start">
            <div
              className={`p-3 rounded-xl ${
                stat.color.replace("bg-", "bg-") + " bg-opacity-10"
              } mr-4 flex items-center justify-center`}
            >
              <div className={`${stat.text} text-xl`}>{stat.icon}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold dark:text-white tracking-tight">
                {stat.value}
              </p>
            </div>
          </div>
          <div
            className="
    mt-4 h-1 w-full
    bg-gradient-to-r
      from-green-800
      via-yellow-500
      to-yellow-300
    rounded-full
    opacity-20
  "
          ></div>
        </div>
      ))}
    </div>
  );
}
