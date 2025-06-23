// components/status-pages/SuccessPage.tsx
import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import StatusPage from "./StatusPage";

interface SuccessPageProps {
  title?: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  title = "Success!",
  subtitle = "Operation Completed",
  description = "Your action was completed successfully. You can now continue using the application.",
  action,
}) => {
  return (
    <StatusPage
      title={title}
      subtitle={subtitle}
      description={description}
      icon={<FiCheckCircle className="h-10 w-10" />}
      action={action}
    />
  );
};

export default SuccessPage;
