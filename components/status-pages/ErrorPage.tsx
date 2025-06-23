// components/status-pages/ErrorPage.tsx
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import StatusPage from "./StatusPage";

const ErrorPage = () => {
  return (
    <StatusPage
      title="500"
      subtitle="Internal Server Error"
      description="Something went wrong on our end. Our team has been notified and we're working to fix it. Please try again later."
      icon={<FiAlertTriangle className="h-10 w-10" />}
    />
  );
};

export default ErrorPage;
