import ResetPasswordForm from "@/components/login/ResetPasswordForm";

const Page = async (props: {
  searchParams?: Promise<{
    token?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const token = searchParams?.token || "";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <ResetPasswordForm token={token} />
    </main>
  );
};

export default Page;
