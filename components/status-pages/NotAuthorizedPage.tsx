// components/status-pages/NotAuthorizedPage.tsx
import React from "react";
import { FiLock } from "react-icons/fi";
import StatusPage from "./StatusPage";

const NotAuthorizedPage = () => {
  return (
    <StatusPage
      title="403"
      subtitle="Access Denied"
      description="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
      icon={<FiLock className="h-10 w-10" />}
    />
  );
};

export default NotAuthorizedPage;
