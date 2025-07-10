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
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased flex flex-col min-h-screen`}
      >
        <AutoLogoutClient />
        <main className="flex-grow">{children}</main>

        {/* Modern Footer */}
        <Footer />
      </body>
    </html>
  );
}
