const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 border-t-4 border-yellow-400 dark:border-yellow-500 text-white py-6 px-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            <div className="text-center md:text-left">
              <p className="font-bold text-lg tracking-wide">SMART NAIROBI</p>
              <p className="text-sm opacity-90">
                Digital Solutions for Nairobi
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <p className="font-semibold text-lg mb-1">
              LET&apos;S MAKE NAIROBI WORK
            </p>
            <div className="flex space-x-6 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all cursor-pointer"
                >
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-6 h-6" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} Nairobi City County. All rights
            reserved.
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span className="hover:underline cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:underline cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:underline cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
