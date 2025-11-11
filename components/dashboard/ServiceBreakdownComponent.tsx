// components/dashboard/ServiceBreakdownComponent.tsx
"use client";

import { Breakdown } from "@/app/lib/dashboardActions";
import React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const ServiceBreakdownComponent = ({
  data,
  colors,
}: {
  data: Breakdown[];
  colors: string[];
}) => {
  console.log("ServiceBreakdownComponent data:", data);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.map((d) => ({ ...d, value: Number(d.value) }))}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            label={({ name, percent }) =>
              percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} records`, "Count"]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "12px",
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{
              maxHeight: 200,
              maxWidth: 120,
              overflowY: "auto",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ServiceBreakdownComponent;
