const Footer = () => {
  return (
    <footer className="h-12 bg-[#006400] flex items-center justify-between px-4 md:px-8 border-t-2 border-[#FFD700]">
      {/* Left: Copyright */}
      <div className="text-gray-200 text-xs font-medium">
        © {new Date().getFullYear()} Nairobi City County
      </div>

      {/* Center: Department Motto */}
      <div className="hidden md:flex items-center">
        <div className="h-1 w-1 rounded-full bg-[#FFD700] mr-2"></div>
        <span className="text-gray-300 text-xs font-light italic">
          INCLUSIVITY • PUBLIC PARTICIPATION • CUSTOMER SERVICE
        </span>
        <div className="h-1 w-1 rounded-full bg-[#FFD700] ml-2"></div>
      </div>

      {/* Right: County Motto */}
      <div className="text-[#FFD700] font-semibold text-sm tracking-tight">
        LET&apos;S MAKE NAIROBI WORK
      </div>
    </footer>
  );
};

export default Footer;
