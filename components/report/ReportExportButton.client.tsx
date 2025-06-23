"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReportPdfDocument, { ReportData } from "./ReportPdfDocument";

interface Props {
  docProps: ReportData;
}

export default function ReportExportButtonClient({ docProps }: Props) {
  const filename = `service-report-${new Date()
    ?.toISOString()
    ?.slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
      document={<ReportPdfDocument {...docProps} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Preparing...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                ></path>
              </svg>
              Export to PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
