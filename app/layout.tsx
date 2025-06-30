import type { Metadata } from "next";

import "./globals.css";
import { poppins } from "@/public/fonts/fonts";
import AutoLogoutClient from "@/components/ui/AutoLogout";

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
      <body className={`${poppins.variable} antialiased`}>
        {" "}
        <AutoLogoutClient />
        {children}
      </body>
    </html>
  );
}
