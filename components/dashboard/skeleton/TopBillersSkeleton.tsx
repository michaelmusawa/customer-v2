// components/dashboard/TopBillersSkeleton.tsx
import React from "react";

export default function TopBillersSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
    </div>
  );
}
