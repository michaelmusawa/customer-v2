// components/status-pages/NotFoundPage.tsx
import React from "react";
import { FiCompass } from "react-icons/fi";
import StatusPage from "./StatusPage";

const NotFoundPage = () => {
  return (
    <StatusPage
      title="404"
      subtitle="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved. Please check the URL and try again."
      icon={<FiCompass className="h-10 w-10" />}
    />
  );
};

export default NotFoundPage;
