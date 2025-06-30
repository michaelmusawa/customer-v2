// Login Page: app/login/page.jsx

import Logo from "@/components/logo";
import { Suspense } from "react";
import LoginForm from "@/components/login/login-form";

export default async function LoginPage(props: {
  searchParams?: Promise<{
    reason?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const reason = searchParams?.reason;

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

        {/* Inactivity Banner */}
        {reason === "inactive" && (
          <div className="flex items-center space-x-2 p-4 mb-4 text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900/50 dark:text-yellow-200">
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.68-1.36 3.445 0l5.516 9.822c.75 1.335-.213 2.979-1.722 2.979H4.463c-1.509 0-2.472-1.644-1.722-2.979L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-6a1 1 0 00-.894.553l-.325.65a.5.5 0 00.447.747h1.644a.5.5 0 00.447-.747l-.325-.65A1 1 0 0010 7z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">
              You have been logged out due to inactivity. Please log in again.
            </p>
          </div>
        )}

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
