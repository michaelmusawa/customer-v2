// components/sidenav/sidenav.tsx
import Link from "next/link";
import { auth, signOut } from "@/auth";
import SignOutIcon from "@/components/icons/SignOutIcon";
import Logo from "../logo";
import NavLinks from "./nav-links";
import { getUser } from "@/app/lib/loginActions";
import Image from "next/image";

export default async function SideNav() {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const role = user?.role;

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-4 flex h-20 items-center justify-center rounded-xl bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400 p-4 shadow-lg md:h-28"
        href="/dashboard"
      >
        <div className="w-24 transition-transform duration-300 hover:scale-105">
          <Logo />
        </div>
      </Link>

      <div className="flex grow flex-col justify-between space-y-4 ">
        <div className="space-y-1">
          <NavLinks role={role} />
        </div>

        <div className="mt-auto">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-3 text-sm font-medium transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <SignOutIcon className="w-5 text-gray-600 group-hover:text-white group-hover:animate-pulse" />
                <span className="hidden text-gray-600 group-hover:text-white md:block">
                  Sign Out
                </span>
              </div>
            </button>
          </form>

          {/* User info */}
          <Link
            href={`/dashboard/${user?.role}/profile`}
            className="mt-4 hidden items-center gap-3 rounded-lg bg-gray-800 p-3 md:flex"
          >
            {user?.image ? (
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-yellow-500">
                <Image
                  src={user.image}
                  alt={`${user.name}'s avatar`}
                  width={459}
                  height={444}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-gray-400">
                {role === "coordinator"
                  ? "DIRECTOR"
                  : role?.toUpperCase() || "ROLE"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
