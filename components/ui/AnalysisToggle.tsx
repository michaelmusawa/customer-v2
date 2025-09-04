// components/dashboard/AnalysisToggle.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const AnalysisToggle = () => {
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
    <div className="flex items-center gap-2">
      <button
        className="bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400"
        onClick={() => handleToggle("invoice")}
      >
        Invoices
      </button>
      <button
        className="bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400"
        onClick={() => handleToggle("receipt")}
      >
        Receipts
      </button>
    </div>
  );
};

export default AnalysisToggle;
