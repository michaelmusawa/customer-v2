"use client";

import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiHelpCircle,
  FiAlertTriangle,
  FiUsers,
} from "react-icons/fi";

interface PlatformInfo {
  signature: string;
  url: string;
}

interface LatestJSON {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    "windows-x86_64": PlatformInfo;
  };
}

declare global {
  interface Window {
    __TAURI_APP_VERSION__?: string;
  }
}

export default function HelpPage() {
  const [latest, setLatest] = useState<LatestJSON | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openManualSection, setOpenManualSection] = useState<string | null>(
    "overview"
  );
  // Add this after your existing state declarations
  const [manualFiles] = useState({
    biller:
      "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
    supervisor:
      "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
    director:
      "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
    admin:
      "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
    full: "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
  });

  useEffect(() => {
    // Fetch latest.json
    fetch("http://customerserviceapp.nairobi.go.ke/updates/latest.json")
      .then((res) => res.json())
      .then((data: LatestJSON) => setLatest(data))
      .catch((err) => console.error("Failed to fetch latest.json:", err));

    // Check installed app version (if in Tauri)
    if (typeof window !== "undefined" && window.__TAURI_APP_VERSION__) {
      setInstalledVersion(window.__TAURI_APP_VERSION__);
    }
  }, []);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const toggleManualSection = (id: string) => {
    setOpenManualSection(openManualSection === id ? null : id);
  };

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading latest version...</p>
      </div>
    );
  }

  const downloadUrl = latest.platforms["windows-x86_64"].url;
  const filename = downloadUrl.split("/").pop();
  const isUpdateAvailable =
    installedVersion && installedVersion !== latest.version;

  // Role-based permissions matrix
  const roleMatrix = [
    { role: "Biller", permissions: "Add/Edit Records, Export Data" },
    {
      role: "Supervisor",
      permissions:
        "Manage Billers, Approve/Reject Edit Requests, Configure Shifts & Counters",
    },
    {
      role: "Director",
      permissions: "Manage Supervisors, Generate & Export Reports",
    },
    {
      role: "Administrator",
      permissions:
        "Manage Directors, Configure Stations, Services & Subservices",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Help Center</h2>
        <nav className="space-y-3 text-gray-700 dark:text-gray-200">
          <a href="#overview" className="block hover:text-green-600 py-2">
            🧭 Overview
          </a>
          <a
            href="#comprehensive-manual"
            className="block hover:text-green-600 py-2"
          >
            📚 Comprehensive Manual
          </a>
          <a href="#manuals" className="block hover:text-green-600 py-2">
            📘 Role Manuals
          </a>
          <a href="#faq" className="block hover:text-green-600 py-2">
            ❓ FAQs
          </a>
          <a
            href="#troubleshooting"
            className="block hover:text-green-600 py-2"
          >
            ⚙️ Troubleshooting
          </a>
          <a href="#support" className="block hover:text-green-600 py-2">
            📞 Support Contacts
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto text-gray-800 dark:text-gray-100">
        {/* Overview Section */}
        <section id="overview" className="mb-12">
          <h1 className="text-3xl font-bold mb-4 flex items-center space-x-2">
            <FiHelpCircle className="w-7 h-7 text-green-600" />
            <span>Help & Support</span>
          </h1>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            {installedVersion && (
              <p className="text-gray-700 dark:text-gray-200 mb-2">
                Installed Version: <strong>{installedVersion}</strong>
              </p>
            )}

            <p className="text-gray-700 dark:text-gray-200 mb-4">
              Latest Version: <strong>{latest.version}</strong>
            </p>

            {isUpdateAvailable && (
              <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
                <FiAlertTriangle className="inline mr-2 text-yellow-600" />A new
                version is available! Download it below.
              </div>
            )}

            <a
              href={downloadUrl}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition"
              download={filename}
            >
              💾 Download {filename}
            </a>
          </div>
        </section>

        {/* Comprehensive Manual Section */}
        <section id="comprehensive-manual" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center space-x-2">
              <FiFileText className="w-6 h-6 text-green-500" />
              <span>Comprehensive User Manual</span>
            </h2>
            <a
              href={manualFiles.full}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
              download="Customer_Service_App_Full_Manual_v1.0.2.pdf"
            >
              <FiFileText className="w-4 h-4" />
              <span>Download Full Manual (PDF)</span>
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Document Header */}
            <div className="bg-green-600 text-white p-6">
              <h1 className="text-2xl font-bold">
                Customer Service Application
              </h1>
              <p className="text-green-100">User Manual | Version 1.0.2</p>
              <p className="text-green-100">Effective Date: July 23, 2025</p>
              <p className="text-green-100">© 2025 Smart Nairobi Team</p>
            </div>

            {/* Table of Contents */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Table of Contents</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => toggleManualSection("document-control")}
                  className="text-left hover:text-green-600"
                >
                  1. Document Control
                </button>
                <button
                  onClick={() => toggleManualSection("introduction")}
                  className="text-left hover:text-green-600"
                >
                  2. Introduction
                </button>
                <button
                  onClick={() => toggleManualSection("getting-started")}
                  className="text-left hover:text-green-600"
                >
                  3. Getting Started
                </button>
                <button
                  onClick={() => toggleManualSection("general-features")}
                  className="text-left hover:text-green-600"
                >
                  4. General Features
                </button>
                <button
                  onClick={() => toggleManualSection("role-workflows")}
                  className="text-left hover:text-green-600"
                >
                  5. Role-Based Workflows
                </button>
                <button
                  onClick={() => toggleManualSection("data-governance")}
                  className="text-left hover:text-green-600"
                >
                  6. Data Governance
                </button>
              </div>
            </div>

            {/* Manual Content */}
            <div className="p-6 space-y-6">
              {/* Document Control */}
              {openManualSection === "document-control" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    1. Document Control
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-50 dark:bg-gray-700 rounded">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border">Revision</th>
                          <th className="px-4 py-2 border">Date</th>
                          <th className="px-4 py-2 border">Author</th>
                          <th className="px-4 py-2 border">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border">1.0</td>
                          <td className="px-4 py-2 border">July 23, 2025</td>
                          <td className="px-4 py-2 border">
                            Smart Nairobi Team
                          </td>
                          <td className="px-4 py-2 border">Initial release</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Introduction */}
              {openManualSection === "introduction" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    2. Introduction
                  </h3>
                  <p className="mb-4">
                    This User Manual provides comprehensive instructions for
                    installing, configuring, and operating the Customer Service
                    App and its accompanying Daemon component.
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold mb-2">
                      2.1 Purpose and Scope
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Installation & Startup</li>
                      <li>Authentication & Account Setup</li>
                      <li>Role-Based Workflows</li>
                      <li>Troubleshooting & FAQs</li>
                      <li>Support Contacts</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Getting Started */}
              {openManualSection === "getting-started" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    3. Getting Started
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        3.1 Application Launch
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          <strong>Daemon:</strong> Double-click the
                          &quot;Customer Service Agent&quot; icon
                        </li>
                        <li>
                          <strong>Web Client:</strong> Access via
                          http://customerserviceapp.nairobi.go.ke/
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">
                        3.2 User Authentication
                      </h4>
                      <p className="mb-2">
                        First-time users should contact their supervisor for
                        registration.
                      </p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
                        <strong>Note:</strong> Check your email for account
                        activation link after registration.
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">
                        3.3 Password Management
                      </h4>
                      <div className="ml-4">
                        <h5 className="font-medium mb-1">
                          3.3.1 Change Password
                        </h5>
                        <p>
                          Navigate to Profile → Edit Profile → Update password
                          fields
                        </p>

                        <h5 className="font-medium mt-3 mb-1">
                          3.3.2 Password Recovery
                        </h5>
                        <p>
                          Click &quot;Forgot your password?&quot; on login page
                          and follow email instructions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Features */}
              {openManualSection === "general-features" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    4. General Features (All Roles)
                  </h3>

                  <div className="grid gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <h4 className="font-semibold mb-2">
                        4.1 Dashboard Navigation
                      </h4>
                      <p>
                        Central hub for records and analytics with date
                        filtering capabilities.
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <h4 className="font-semibold mb-2">
                        4.2 Profile Management
                      </h4>
                      <p>
                        Update personal information, profile picture, and
                        password settings.
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <h4 className="font-semibold mb-2">
                        4.3 Records Management
                      </h4>
                      <p>
                        Search, filter by date, and export records to Excel
                        format.
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <h4 className="font-semibold mb-2">
                        4.4 Easy UBP Integration
                      </h4>
                      <p>
                        Quick access to Easy UBP website through sidebar
                        navigation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role-Based Workflows */}
              {openManualSection === "role-workflows" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    5. Role-Based Workflows
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold">Biller Operations</h4>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Add records manually or via Daemon app</li>
                        <li>Edit records with supervisor approval</li>
                        <li>Track edit request status</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold">Supervisor Operations</h4>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Manage biller accounts</li>
                        <li>Approve/reject record edit requests</li>
                        <li>Configure shifts and counters</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold">Director Operations</h4>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Manage supervisor accounts</li>
                        <li>Generate and export reports</li>
                        <li>Station-level oversight</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold">
                        Administrator Operations
                      </h4>
                      <ul className="list-disc pl-5 mt-2">
                        <li>Manage director accounts</li>
                        <li>Configure system settings</li>
                        <li>Manage stations, services, and subservices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Governance */}
              {openManualSection === "data-governance" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    6. Data Governance
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="mb-3">
                      Administrators maintain system integrity through
                      comprehensive data oversight capabilities:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Records retention policies</li>
                      <li>Monthly system review of eligible records</li>
                      <li>Secure encryption before archival</li>
                      <li>Read-only access to archived records</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Role Manuals Section */}
        <section id="manuals" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
            <FiUsers className="w-6 h-6 text-green-500" />
            <span>Role-Specific Manuals</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Detailed guides for each user role in the Customer Service
            Application.
          </p>

          {/* Role Matrix */}
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Role Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-50 dark:bg-gray-700 rounded">
                <thead>
                  <tr>
                    <th className="px-4 py-3 border text-left">Role</th>
                    <th className="px-4 py-3 border text-left">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roleMatrix.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 border font-medium">
                        {item.role}
                      </td>
                      <td className="px-4 py-3 border">{item.permissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              <strong>Note:</strong> Available menu options dynamically adjust
              based on assigned role.
            </p>
          </div>

          {/* Collapsible Role Manuals */}
          {[
            {
              id: "biller",
              title: "Biller Manual",
              icon: "👨‍💼",
              features: [
                "Record Management (Add/Edit)",
                "Daemon App Integration",
                "Edit Request Tracking",
                "Data Export Capabilities",
              ],
              filename:
                "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
            },
            {
              id: "supervisor",
              title: "Supervisor Manual",
              icon: "👨‍💼",
              features: [
                "Biller Account Management",
                "Edit Request Approval",
                "Shift & Counter Configuration",
                "Team Performance Monitoring",
              ],
              filename:
                "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
            },
            {
              id: "director",
              title: "Director Manual",
              icon: "👨‍💼",
              features: [
                "Supervisor Management",
                "Report Generation & Export",
                "Station-level Oversight",
                "Performance Analytics",
              ],
              filename:
                "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
            },
            {
              id: "admin",
              title: "Administrator Manual",
              icon: "🔧",
              features: [
                "System-wide User Management",
                "Station Configuration",
                "Service & Subservice Setup",
                "System Settings Management",
              ],
              filename:
                "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
            },
          ].map((section) => (
            <div
              key={section.id}
              className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex justify-between items-center px-5 py-4 text-left text-lg font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-t-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.title}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {/* ADD THIS DOWNLOAD BUTTON */}
                  <a
                    href={manualFiles[section.id as keyof typeof manualFiles]}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition"
                    download={section.filename}
                    onClick={(e) => e.stopPropagation()} // Prevent toggle when clicking download
                  >
                    <FiFileText className="w-3 h-3" />
                    <span>Download PDF</span>
                  </a>
                  {openSection === section.id ? (
                    <FiChevronUp className="w-5 h-5" />
                  ) : (
                    <FiChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>
              {openSection === section.id && (
                <div className="p-5 bg-white dark:bg-gray-800 text-sm leading-relaxed space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Features:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {section.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                      <h4 className="font-semibold mb-2">
                        Version Information
                      </h4>
                      <p>
                        <strong>Version:</strong> 1.0.2
                      </p>
                      <p>
                        <strong>Last Updated:</strong> July 23, 2025
                      </p>
                      <p>
                        <strong>Status:</strong> Current
                      </p>
                      <p>
                        <strong>File:</strong> {section.filename}
                      </p>
                      {/* ADD QUICK DOWNLOAD BUTTON INSIDE CONTENT TOO */}
                      <a
                        href={
                          manualFiles[section.id as keyof typeof manualFiles]
                        }
                        className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                        download={section.filename}
                      >
                        📥 Download Manual
                      </a>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Quick Start Guide</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                      <p className="font-semibold mb-2">
                        📋 Essential procedures for{" "}
                        {section.title.replace("Manual", "")}
                      </p>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        <p>
                          • Complete step-by-step instructions available in full
                          manual
                        </p>
                        <p>• Role-specific workflows and best practices</p>
                        <p>• Troubleshooting guides for common issues</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            ❓ Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold">How do I reset my password?</h3>
              <p>
                Click <em>Forgot Password?</em> on the login page, enter your
                registered email, and follow the instructions sent to your
                inbox.
              </p>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold">
                I can&apos;t see some menu options.
              </h3>
              <p>
                Menu options depend on your assigned role. Contact your
                supervisor or administrator for role adjustments.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold">
                Daemon app is not processing invoices.
              </h3>
              <p>
                Verify your API key is valid and correctly configured. Ensure
                Daemon app is running in the background.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section id="troubleshooting" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">⚙️ Troubleshooting</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Problem</th>
                    <th className="px-4 py-2 text-left border-b">Solution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border-b">
                      &quot;Invalid Credentials&quot; error
                    </td>
                    <td className="px-4 py-3 border-b">
                      Reset password or contact supervisor
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border-b">
                      Daemon Processing Failures
                    </td>
                    <td className="px-4 py-3 border-b">
                      Verify API key or generate a new one and configure
                    </td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 border-b">
                      Edit requests not appearing
                    </td>
                    <td className="px-4 py-3 border-b">
                      Check approval queue status and supervisor assignment
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">📞 Support & Contacts</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <p className="mb-2">
                  <strong>Email:</strong> smartnairobi@gmail.com
                </p>
                <p className="mb-2">
                  <strong>Phone:</strong> 07----------
                </p>
                <p>
                  <strong>Team:</strong> Smart Nairobi Support Team
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Support Hours</h3>
                <p className="mb-2">
                  <strong>Standard Support:</strong> Mon-Fri, 8:00 AM - 5:00 PM
                </p>
                <p>
                  <strong>Emergency Support:</strong> Available for critical
                  system issues
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
