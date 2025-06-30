// components/AutoLogoutClient.tsx
"use client";

import { useAutoLogout } from "@/app/lib/useAutoLogout";

export default function AutoLogoutClient() {
  useAutoLogout();
  return null;
}
