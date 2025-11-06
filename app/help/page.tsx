"use client";

import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiHelpCircle,
  FiAlertTriangle,
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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 sticky top-0">
        <h2 className="text-xl font-semibold mb-6">Help Center</h2>
        <nav className="space-y-3 text-gray-700 dark:text-gray-200">
          <a href="#overview" className="block hover:text-blue-600">
            🧭 Overview
          </a>
          <a href="#manuals" className="block hover:text-blue-600">
            📘 User Manuals
          </a>
          <a href="#faq" className="block hover:text-blue-600">
            ❓ FAQs
          </a>
          <a href="#troubleshooting" className="block hover:text-blue-600">
            ⚙️ Troubleshooting
          </a>
          <a href="#support" className="block hover:text-blue-600">
            📞 Support Contacts
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto text-gray-800 dark:text-gray-100">
        <section id="overview" className="mb-12">
          <h1 className="text-3xl font-bold mb-4 flex items-center space-x-2">
            <FiHelpCircle className="w-7 h-7 text-blue-600" />
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

        <section id="manuals" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
            <FiFileText className="w-6 h-6 text-blue-500" />
            <span>User Manuals & Guides</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Below are the user manuals for each role in the Customer Service
            Application.
          </p>

          {/* Collapsible Sections */}
          {[
            { id: "admin", title: "Administrator Manual" },
            { id: "director", title: "Director Manual" },
            { id: "supervisor", title: "Supervisor Manual" },
            { id: "biller", title: "Biller Manual" },
          ].map((section) => (
            <div
              key={section.id}
              className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex justify-between items-center px-5 py-3 text-left text-lg font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-t-lg"
              >
                {section.title}
                {openSection === section.id ? (
                  <FiChevronUp className="w-5 h-5" />
                ) : (
                  <FiChevronDown className="w-5 h-5" />
                )}
              </button>
              {openSection === section.id && (
                <div className="p-5 bg-white dark:bg-gray-800 text-sm leading-relaxed space-y-4">
                  <p>
                    📄 <strong>Version:</strong> 1.0.2 | <strong>Date:</strong>{" "}
                    July 23, 2025
                  </p>
                  <div className="border-l-4 border-blue-400 pl-4 text-gray-700 dark:text-gray-300">
                    <p>
                      This manual covers step-by-step procedures for{" "}
                      {section.title.replace("Manual", "")} operations within
                      the Customer Service Application.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold mb-2">
                      📸 Placeholder for screenshots or diagrams
                    </p>
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 italic">
                      Image placeholder
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

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
              <h3 className="font-semibold">My export file won’t open.</h3>
              <p>
                Ensure Excel or other spreadsheet programs are closed, then try
                downloading again.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold">I can’t see some menu options.</h3>
              <p>
                Menu options depend on your assigned role. Contact your
                supervisor or administrator for role adjustments.
              </p>
            </div>
          </div>
        </section>

        <section id="troubleshooting" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">⚙️ Troubleshooting</h2>
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong>“Invalid Credentials”:</strong> Reset password or contact
              your supervisor.
            </li>
            <li>
              <strong>Daemon Processing Failures:</strong> Verify your API key
              and ensure invoice files are in correct format.
            </li>
            <li>
              <strong>Export File Corruption:</strong> Try exporting as CSV
              instead of Excel.
            </li>
          </ul>
        </section>

        <section id="support" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">📞 Support & Contacts</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p>
              <strong>Email:</strong> smartnairobi@gmail.com
            </p>
            <p>
              <strong>Phone:</strong> 07----------
            </p>
            <p>
              <strong>Team:</strong> Smart Nairobi Support Team
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
