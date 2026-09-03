// app/help/page.tsx
"use client";

import { useEffect, useState } from "react";
import { OverviewSection } from "@/components/help/sections/OverviewSection";
import { ComprehensiveManualSection } from "@/components/help/sections/ComprehensiveManualSection";
import { RoleManualsSection } from "@/components/help/sections/RoleManualsSection";
import Chat from "@/components/ui/ai";
import { HelpSidebar } from "@/components/help/HelpSidebar";

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

export default function HelpPage({ user }: { user: string }) {
  const [latest, setLatest] = useState<LatestJSON | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Fetch latest.json from the same origin
    fetch("/updates/latest.json")
      .then((res) => res.json())
      .then((data: LatestJSON) => setLatest(data))
      .catch((err) => console.error("Failed to fetch latest.json:", err));

    // Check installed app version (if in Tauri)
    if (typeof window !== "undefined" && window.__TAURI_APP_VERSION__) {
      setInstalledVersion(window.__TAURI_APP_VERSION__);
    }
  }, []);

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading help resources...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* AI Chat Modal */}
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Sidebar Navigation */}
      <HelpSidebar onChatOpen={() => setIsChatOpen(true)} user={user} />

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto text-gray-800 dark:text-gray-100">
        <OverviewSection installedVersion={installedVersion} latest={latest} />

        <ComprehensiveManualSection />

        <RoleManualsSection user={user} />

        {/* <FAQSection />

        <TroubleshootingSection />

        <SupportSection /> */}
      </main>
    </div>
  );
}
