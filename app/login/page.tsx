// Login Page: app/login/page.jsx
"use client";

import Logo from "@/components/logo";
import { Suspense } from "react";
import LoginForm from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('/images/nairobibackgroung.jpg')` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/30 dark:bg-gray-900/60 transition-colors duration-500" />

      <div className="relative z-10 mx-auto w-full max-w-md space-y-6 p-6">
        <div className="flex items-center justify-center h-16 rounded-2xl bg-gray-200 dark:bg-gray-900 shadow-lg p-4 my-12">
          <div className="w-32 text-white md:w-36">
            <Logo />
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
