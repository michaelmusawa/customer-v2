// components/sidenav/nav-links.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  FiHome,
  FiUser,
  FiFileText,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiBell,
  FiChevronRight,
  FiExternalLink,
} from "react-icons/fi";

export default function NavLinks({ role }: { role?: string }) {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <FiHome className="text-lg" />,
      role: ["biller", "supervisor", "admin", "coordinator"],
    },
    {
      name: "Profile",
      href: `/dashboard/${role}/profile`,
      icon: <FiUser className="text-lg" />,
      role: ["biller", "supervisor", "admin", "coordinator"],
    },
    {
      name: "Records",
      href: `/dashboard/${role}/records`,
      icon: <FiFileText className="text-lg" />,
      role: ["biller", "supervisor", "coordinator"],
    },
    {
      name: "Directors",
      href: `/dashboard/${role}/coordinators`,
      icon: <FiUsers className="text-lg" />,
      role: ["admin"],
    },
    {
      name: "Supervisors",
      href: `/dashboard/${role}/supervisors`,
      icon: <FiUsers className="text-lg" />,
      role: ["coordinator"],
    },
    {
      name: "Billers",
      href: `/dashboard/${role}/billers`,
      icon: <FiUsers className="text-lg" />,
      role: ["supervisor"],
    },
    
    {
      name: "Settings",
      href: `/dashboard/${role}/settings`,
      icon: <FiSettings className="text-lg" />,
      role: ["admin", "supervisor"],
    },
    {
      name: "Reports",
      href: `/dashboard/${role}/report`,
      icon: <FiBarChart2 className="text-lg" />,
      role: ["coordinator"],
    },
    {
      name: "Edit Requests",
      href: `/dashboard/${role}/notifications`,
      icon: <FiBell className="text-lg" />,
      role: ["biller", "supervisor"],
    },
    {
      name: "Easy UBP",
      href: "https://easyubp.nairobi.go.ke", // ← fully qualified
      icon: <FiExternalLink className="text-lg" />,
      role: ["biller", "supervisor", "coordinator", "admin"],
      external: true, // ← mark it external
    },
  ];

  return (
    <>
      {links.map((link) => {
        if (role && link.role.includes(role)) {
          const isActive = pathname === link.href;

          // choose which component to render
          const Wrapper = link.external ? "a" : Link;
          const extraProps = link.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <Wrapper
              key={link.name}
              href={link.href}
              {...extraProps} // add target/rel for external
              className={clsx(
                "group flex h-14 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 md:justify-start bg-gray-100 dark:bg-gray-900",
                {
                  "bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400 text-white shadow-lg":
                    isActive,
                  "text-gray-500 hover:bg-gray-800 hover:text-white": !isActive,
                }
              )}
            >
              <span
                className={clsx({
                  "text-white": isActive,
                  "text-yellow-400 group-hover:text-white": !isActive,
                })}
              >
                {link.icon}
              </span>
              <span className="hidden md:block">{link.name}</span>
              <FiChevronRight className="ml-auto hidden text-gray-400 group-hover:text-white md:block" />
            </Wrapper>
          );
        }
      })}
    </>
  );
}
