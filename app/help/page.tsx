// pages/help.tsx or app/help/page.tsx

"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Fetch latest.json
    fetch("http://customerserviceapp.nairobi.go.ke/updates/latest.json")
      .then((res) => res.json())
      .then((data: LatestJSON) => setLatest(data))
      .catch((err) => console.error("Failed to fetch latest.json:", err));

    // Check installed app version (Tauri exposes it via window.__TAURI_APP_VERSION__)

    if (typeof window !== "undefined" && window.__TAURI_APP_VERSION__) {
      setInstalledVersion(window.__TAURI_APP_VERSION__);
    }
  }, []);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-800 p-6">
      <h1 className="text-3xl font-semibold mb-4">Help & Support</h1>

      {installedVersion && (
        <p className="mb-2 text-gray-600 dark:text-gray-50">
          Installed Version: <strong>{installedVersion}</strong>
        </p>
      )}

      <p className="mb-4 text-gray-700 dark:text-gray-50 text-center max-w-lg">
        Latest Version: <strong>{latest.version}</strong>
      </p>

      {isUpdateAvailable && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          ⚠️ A new version is available! Download it below.
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
  );
}
