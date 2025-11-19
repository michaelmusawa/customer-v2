// components/help/HelpSidebar.tsx
import { FiMessageSquare } from "react-icons/fi";

interface HelpSidebarProps {
  onChatOpen: () => void;
  user: string;
}

const sidebarSections = [
  {
    id: "overview",
    title: "🧭 Overview",
    roles: ["guest", "biller", "supervisor", "director", "admin"],
  },
  {
    id: "comprehensive-manual",
    title: "📚 Comprehensive Manual",
    roles: ["guest", "biller", "supervisor", "director", "admin"],
  },
  {
    id: "manuals",
    title: "📘 Role Manuals",
    roles: ["biller", "supervisor", "director", "admin"],
  },
  {
    id: "faq",
    title: "❓ FAQs",
    roles: ["guest", "biller", "supervisor", "director", "admin"],
  },
  {
    id: "troubleshooting",
    title: "⚙️ Troubleshooting",
    roles: ["guest", "biller", "supervisor", "director", "admin"],
  },
  {
    id: "support",
    title: "📞 Support Contacts",
    roles: ["guest", "biller", "supervisor", "director", "admin"],
  },
];

export const HelpSidebar: React.FC<HelpSidebarProps> = ({
  onChatOpen,
  user,
}) => {
  return (
    <aside className="w-full lg:w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 sticky top-0 h-screen overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
        Help Center
      </h2>

      <nav className="space-y-2">
        {sidebarSections.map(
          (section) =>
            section.roles &&
            section.roles.includes(user) && (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block py-3 px-4 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors text-gray-700 dark:text-gray-200"
              >
                {section.title}
              </a>
            )
        )}

        <button
          onClick={onChatOpen}
          className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-gray-700 dark:text-gray-200"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span>Ask AI Assistant</span>
        </button>
      </nav>
    </aside>
  );
};
