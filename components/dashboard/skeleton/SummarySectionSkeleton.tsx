// components/dashboard/SummarySectionSkeleton.tsx
import React from "react";

export default function SummarySectionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
    </div>
  );
}
