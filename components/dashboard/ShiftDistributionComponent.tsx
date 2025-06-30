// components/dashboard/ShiftDistributionComponent.tsx
"use client";

import { ShiftBreakdown } from "@/app/lib/dashboardActions";
import React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const ShiftDistributionComponent = ({ data }: { data: ShiftBreakdown[] }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "12px",
            }}
            formatter={(value) => [`${value} records`, "Count"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShiftDistributionComponent;
