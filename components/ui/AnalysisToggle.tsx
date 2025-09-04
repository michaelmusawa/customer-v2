// components/ui/AnalysisToggle.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface AnalysisToggleProps {
  className?: string;
}

const AnalysisToggle = ({ className = "" }: AnalysisToggleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get("analysis") || "invoice";
  const [analysisType, setAnalysisType] = useState(initialType);

  useEffect(() => {
    setAnalysisType(initialType);
  }, [initialType]);

  const handleToggle = (type: "invoice" | "receipt") => {
    setAnalysisType(type);

    const params = new URLSearchParams(searchParams.toString());
    params.set("analysis", type);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={`flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800 ${className}`}
    >
      <button
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          analysisType === "invoice"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
        onClick={() => handleToggle("invoice")}
      >
        Invoices
      </button>
      <button
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          analysisType === "receipt"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
        onClick={() => handleToggle("receipt")}
      >
        Receipts
      </button>
    </div>
  );
};

export default AnalysisToggle;
