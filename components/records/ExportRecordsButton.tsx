// components/records/ExportRecordsButton.tsx
"use client";

import React, { useState } from "react";
import { FiDownload, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  query: string;
  startDate: string;
  endDate: string;
  role: string;
}

const ExportRecordsButton = ({
  query,
  startDate,
  endDate,
  role,
}: ExportButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleExport = async () => {
    setIsLoading(true);
    setStatus("idle");

    try {
      const params = new URLSearchParams({
        query,
        startDate,
        endDate,
        role,
        noPagination: "true",
      }).toString();

      const response = await fetch(`/api/records?${params}`);
      if (!response.ok) throw new Error("Failed to fetch records");

      const records = await response.json();

      // Prepare worksheet
      interface Record {
        ticket: string;
        name: string;
        recordType: string;
        service: string;
        subService: string;
        value: number;
        createdAt: string;
      }

      const worksheetData = records.map((record: Record, index: number) => ({
        "#": index + 1,
        Ticket: record.ticket,
        Customer: record.name,
        "Record Type": record.recordType,
        Service: record.service,
        "Sub Service": record.subService,
        Value: `KES ${record.value.toLocaleString()}`,
        Date: new Date(record.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Style header row
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
      };

      const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = headerStyle;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Service Records");

      // Generate Excel file
      const fileName = `records_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setStatus("success");
    } catch (error) {
      console.error("Export error:", error);
      setStatus("error");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow transition-all hover:shadow-md ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        }`}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <FiDownload className="text-lg" />
        )}
        <span>Export to Excel</span>
      </button>

      {/* Status indicator */}
      {status !== "idle" && (
        <div
          className={`absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg animate-fade-in ${
            status === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {status === "success" ? (
            <>
              <FiCheckCircle />
              <span>Export successful!</span>
            </>
          ) : (
            <>
              <FiAlertCircle />
              <span>Export failed. Try again</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportRecordsButton;
