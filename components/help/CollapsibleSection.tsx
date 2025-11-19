// components/help/CollapsibleSection.tsx
import { useState, ReactNode } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: string;
  children: ReactNode;
  defaultOpen?: boolean;
  actionButton?: ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  icon,
  children,
  defaultOpen = false,
  actionButton,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  console.log(`CollapsibleSection (${id}) isOpen:`, isOpen);

  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-5 py-4 text-left text-lg font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-t-lg transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">{icon}</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center space-x-3">
          {actionButton}
          {isOpen ? (
            <FiChevronUp className="w-5 h-5" />
          ) : (
            <FiChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-5 bg-white dark:bg-gray-800 text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
};
