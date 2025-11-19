// components/help/sections/ComprehensiveManualSection.tsx
import { useState } from "react";
import { FiFileText } from "react-icons/fi";
// import { CollapsibleSection } from "../CollapsibleSection";

const manualFiles = {
  full: "/public/docs/user-manual-full.pdf",
};

export const ComprehensiveManualSection: React.FC = () => {
  const [openManualSection, setOpenManualSection] =
    useState<string>("overview");

  const toggleManualSection = (id: string) => {
    setOpenManualSection(openManualSection === id ? "" : id);
  };

  return (
    <section id="comprehensive-manual" className="mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center space-x-2 mb-4 md:mb-0">
          <FiFileText className="w-6 h-6 text-green-500" />
          <span>Comprehensive User Manual</span>
        </h2>
        <a
          href={manualFiles.full}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition transform hover:scale-105"
          download="Customer_Service_App_Full_Manual_v1.0.2.pdf"
        >
          <FiFileText className="w-4 h-4" />
          <span>Download Full Manual (PDF)</span>
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Manual content remains similar to original but more modular */}
        <div className="bg-green-600 text-white p-6">
          <h1 className="text-2xl font-bold">Customer Service Application</h1>
          <p className="text-green-100">User Manual | Version 1.0.2</p>
          <p className="text-green-100">Effective Date: July 23, 2025</p>
          <p className="text-green-100">© 2025 Smart Nairobi Team</p>
        </div>

        {/* Table of Contents */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Table of Contents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {[
              { id: "document-control", label: "1. Document Control" },
              { id: "introduction", label: "2. Introduction" },
              { id: "getting-started", label: "3. Getting Started" },
              { id: "general-features", label: "4. General Features" },
              { id: "role-workflows", label: "5. Role-Based Workflows" },
              { id: "data-governance", label: "6. Data Governance" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => toggleManualSection(item.id)}
                className={`text-left p-2 rounded transition ${
                  openManualSection === item.id
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual content sections would go here */}
        <div className="p-6">{/* Content based on openManualSection */}</div>
      </div>
    </section>
  );
};
