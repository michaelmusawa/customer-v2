import type { Metadata } from "next";
import "./globals.css";
import { poppins } from "@/public/fonts/fonts";
import AutoLogoutClient from "@/components/ui/AutoLogout";
import Footer from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Customer service app",
  description: "V2.0.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased flex flex-col min-h-screen`}
      >
        <AutoLogoutClient />

        {env !== "production" && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`
      px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm
      flex items-center space-x-1.5 ring-1 ring-inset
      ${
        env === "development"
          ? "bg-amber-500/10 text-amber-700 ring-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300"
          : env === "staging"
          ? "bg-purple-500/10 text-purple-700 ring-purple-400/30 dark:bg-purple-500/15 dark:text-purple-300"
          : "bg-rose-500/10 text-rose-700 ring-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300"
      }
    `}
            >
              <span className="flex w-1.5 h-1.5">
                <span
                  className={`
          absolute animate-ping rounded-full opacity-75
          ${
            env === "development"
              ? "bg-amber-500 dark:bg-amber-400"
              : env === "staging"
              ? "bg-purple-500 dark:bg-purple-400"
              : "bg-rose-500 dark:bg-rose-400"
          }
        `}
                ></span>
                <span
                  className={`
          relative rounded-full
          ${
            env === "development"
              ? "bg-amber-500 dark:bg-amber-400"
              : env === "staging"
              ? "bg-purple-500 dark:bg-purple-400"
              : "bg-rose-500 dark:bg-rose-400"
          }
        `}
                ></span>
              </span>
              <span>{env?.toUpperCase()} ENVIRONMENT</span>
            </div>
          </div>
        )}
        <main className="flex-grow">{children}</main>

        {/* Modern Footer */}
        <Footer />
      </body>
    </html>
  );
}
