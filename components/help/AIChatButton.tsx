// components/help/AIChatButton.tsx
import { FiMessageSquare } from "react-icons/fi";

interface AIChatButtonProps {
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}

export const AIChatButton: React.FC<AIChatButtonProps> = ({
  variant = "secondary",
  className = "",
  onClick,
}) => {
  const baseStyles =
    "flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
    secondary:
      "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 shadow-md",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <FiMessageSquare className="w-5 h-5" />
      <span>Ask AI Assistant</span>
    </button>
  );
};
