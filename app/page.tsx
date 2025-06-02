import Logo from "@/components/logo";
import ArrowRightIcon from "@/components/icons/arrowRight";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <main className="flex flex-col p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500">
      {/* Header / Logo */}
      <div className="flex h-20 md:h-44 shrink-0 rounded-2xl bg-countyGreen dark:bg-countyGreen-dark shadow-lg p-4">
        <Logo />
      </div>

      {/* Content Section */}
      <div className="mt-10 flex grow flex-col gap-6 md:flex-row max-md:flex-col-reverse">
        {/* Info Card */}
        <div className="flex flex-col justify-center m-auto gap-6 rounded-2xl bg-gray-100 dark:bg-gray-800 px-8 py-10 shadow-lg backdrop-blur-sm md:w-2/5 md:px-16">
          <p className="text-xl md:text-3xl md:leading-normal text-gray-900 dark:text-gray-100 text-center max-md:text-left">
            <strong className="text-countyYellow dark:text-countyYellow-light">
              Nairobi City County.
            </strong>
            <br />
            Application for Customer Service Management.
          </p>

          <Link
            href="/login"
            className="flex items-center m-auto md:m-0 gap-4 self-center md:self-start rounded-2xl bg-gradient-to-r from-countyGreen to-green-500 hover:from-green-600 hover:to-green-400 transition-all duration-300 px-6 py-3 text-base font-semibold text-white shadow-md"
          >
            <span>Log in</span>
            <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>

        {/* Hero Image */}
        <div
          className="flex w-full md:w-3/5 items-center justify-center p-6 bg-cover bg-center rounded-2xl shadow-lg overflow-hidden"
          style={{ backgroundImage: `url('/images/nairobibackgroung.jpg')` }}
        >
          <Image
            src="/images/customerService.png"
            width={2000}
            height={2000}
            alt="customer service illustration"
            className="max-h-96 w-auto transform scale-x-[-1]"
          />
        </div>
      </div>
    </main>
  );
}
