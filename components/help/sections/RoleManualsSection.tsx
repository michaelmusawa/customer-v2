// components/help/sections/RoleManualsSection.tsx

import { FiUsers, FiFileText } from "react-icons/fi";
import { CollapsibleSection } from "../CollapsibleSection";

const roleManuals = [
  {
    id: "biller",
    title: "Biller Manual",
    icon: "👨‍💼",
    roles: ["biller", "supervisor", "director", "admin"],
    features: [
      "Record Management (Add/Edit)",
      "Daemon App Integration",
      "Edit Request Tracking",
      "Data Export Capabilities",
    ],
  },
  {
    id: "supervisor",
    title: "Supervisor Manual",
    icon: "👨‍💼",
    roles: ["supervisor", "director", "admin"],
    features: [
      "Biller Account Management",
      "Edit Request Approval",
      "Shift & Counter Configuration",
      "Team Performance Monitoring",
    ],
  },
  {
    id: "director",
    title: "Director Manual",
    icon: "👨‍💼",
    roles: ["director", "admin"],
    features: [
      "Supervisor Management",
      "Report Generation & Export",
      "Station-level Oversight",
      "Performance Analytics",
    ],
  },
  {
    id: "admin",
    title: "Administrator Manual",
    icon: "🔧",
    roles: ["admin"],
    features: [
      "System-wide User Management",
      "Station Configuration",
      "Service & Subservice Setup",
      "System Settings Management",
    ],
  },
];

const manualFiles = {
  biller:
    "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
  supervisor:
    "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
  director:
    "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
  admin:
    "https://docs.google.com/document/d/1QsJ5TolirXO0eisQ0CQinDfKDSzKHNCJZoc9is9CWBc/edit?tab=t.0",
};

export const RoleManualsSection: React.FC<{ user: string }> = ({ user }) => {
  // const [openSection, setOpenSection] = useState<string | null>(null);

  // const toggleSection = (id: string) => {
  //   setOpenSection(openSection === id ? null : id);
  // };

  const accessibleManuals = roleManuals.filter((manual) =>
    user ? manual.roles.includes(user) : false
  );

  if (accessibleManuals.length === 0) {
    return (
      <section id="manuals" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
          <FiUsers className="w-6 h-6 text-green-500" />
          <span>Role-Specific Manuals</span>
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200">
            Please log in to access role-specific manuals and features.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="manuals" className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
        <FiUsers className="w-6 h-6 text-green-500" />
        <span>Role-Specific Manuals</span>
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Detailed guides for your role and accessible roles in the Customer
        Service Application.
      </p>

      {accessibleManuals.map(
        (section) =>
          section.roles &&
          section.roles.includes(user) && (
            <CollapsibleSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              actionButton={
                <a
                  key={section.id}
                  href={manualFiles[section.id as keyof typeof manualFiles]}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition"
                  download={`${section.title.replace(" ", "_")}.pdf`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiFileText className="w-3 h-3" />
                  <span>Download PDF</span>
                </a>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Features:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {section.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                  <h4 className="font-semibold mb-2">Version Information</h4>
                  <p>
                    <strong>Version:</strong> 1.0.2
                  </p>
                  <p>
                    <strong>Last Updated:</strong> July 23, 2025
                  </p>
                  <p>
                    <strong>Status:</strong> Current
                  </p>
                  <a
                    href={manualFiles[section.id as keyof typeof manualFiles]}
                    className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                    download={`${section.title.replace(" ", "_")}.pdf`}
                  >
                    📥 Download Manual
                  </a>
                </div>
              </div>
            </CollapsibleSection>
          )
      )}
    </section>
  );
};
