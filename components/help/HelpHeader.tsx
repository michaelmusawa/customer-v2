// components/help/HelpHeader.tsx
import { FiHelpCircle } from "react-icons/fi";

interface HelpHeaderProps {
  title: string;
  description?: string;
}

export const HelpHeader: React.FC<HelpHeaderProps> = ({
  title,
  description,
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4 flex items-center space-x-2">
        <FiHelpCircle className="w-7 h-7 text-green-600" />
        <span>{title}</span>
      </h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {description}
        </p>
      )}
    </div>
  );
};
