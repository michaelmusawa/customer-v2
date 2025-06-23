// components/status-pages/StatusPage.tsx
import React from "react";
import { FiHome } from "react-icons/fi";
import Link from "next/link";

interface StatusPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
}

const StatusPage: React.FC<StatusPageProps> = ({
  title,
  subtitle,
  description,
  icon,
  action,
  illustration,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all">
        <div className="p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
              {icon}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>

            <h2 className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-4">
              {subtitle}
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {description}
            </p>

            {illustration && (
              <div className="mb-8 mx-auto max-w-[200px]">{illustration}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {action || (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FiHome className="mr-2" />
                  Return Home
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
