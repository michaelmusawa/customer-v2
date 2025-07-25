import Logo from "@/components/logo";
import ArrowRightIcon from "@/components/icons/arrowRight";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <main className="flex flex-col p-6 min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500">
      {/* Header / Logo */}
      <div className="flex h-20 md:h-44 shrink-0 rounded-2xl bg-green-700 dark:bg-countyGreen-dark shadow-lg p-4">
        <Logo />
      </div>

      {/* Content Section */}
      <div className="mt-10 flex grow flex-col gap-6 md:flex-row max-md:flex-col-reverse">
        {/* Info Card */}
        <div className="flex flex-col justify-center m-auto gap-6 rounded-2xl bg-gray-100 dark:bg-gray-800 px-8 py-10 shadow-lg backdrop-blur-sm md:w-2/5 md:px-16">
          <p className="text-xl md:text-3xl md:leading-normal text-gray-900 dark:text-gray-100 text-center max-md:text-left">
            <strong className="text-yellow-400 dark:text-yellow-400">
              Nairobi City County.
            </strong>
            <br />
            Application for Customer Service Management.
          </p>

          <Link
            href="/login"
            className="flex items-center m-auto md:m-0 gap-4 self-center rounded-2xl bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400 transition-all duration-300 px-6 py-3 text-base font-semibold text-white shadow-md"
          >
            <span>Log in</span>
            <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>

        {/* Enhanced Hero Image */}
        <div className="relative w-full md:w-3/5 rounded-2xl shadow-lg overflow-hidden">
          {/* Background with gradient overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/images/nairobibackgroung.jpg')` }}
          >
            {/* Gradient overlay for light mode */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-white/10 dark:hidden"></div>

            {/* Gradient overlay for dark mode */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-gray-900/10 hidden dark:block"></div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-countyYellow/20 dark:bg-countyYellow-light/20 blur-xl"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full bg-countyGreen/30 dark:bg-countyGreen-dark/30 blur-xl"></div>

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4">
              <div className="inline-block p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
                <Image
                  src="/images/customerService.png"
                  width={800}
                  height={800}
                  alt="Customer service illustration"
                  className="max-h-64 w-auto transform scale-x-[-1]"
                />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-md">
              <h2 className="text-xl md:text-2xl font-bold text-countyGreen dark:text-countyGreen-light mb-2">
                Efficient Service Delivery
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                Transforming customer experience through digital innovation and
                streamlined processes
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
