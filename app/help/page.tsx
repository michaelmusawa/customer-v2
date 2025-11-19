import HelpPage from "@/components/help/HelpPage";
import React from "react";
import { auth } from "@/auth";
import { getUser } from "../lib/loginActions";

const Page = async () => {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.role || "";

  return <HelpPage user={userRole} />;
};

export default Page;
