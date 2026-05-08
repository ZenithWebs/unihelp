import React, { useContext } from "react";
import { Images } from "./../data/data";
import { MenuIcon, MoonIcon, SunIcon, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = ({ dark, setDark, setMenuOpen, menuOpen }) => {
  const { user } = useContext(AuthContext);

  const toggleTheme = () => setDark(!dark);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-500 transition-all duration-300 border-b ${
        dark
          ? "bg-slate-950 text-white border-slate-800"
          : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between px-5 md:px-10 py-3">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center">
          <img
            src={dark ? Images.dark_logo : Images.light_logo}
            alt="unihelp.ng"
            className="w-28 md:w-36 transition-all"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all duration-300 hover:scale-105 ${
              dark
                ? "border-slate-700 hover:bg-slate-800"
                : "border-slate-300 hover:bg-slate-100"
            }`}
            aria-label="Toggle Theme"
          >
            {dark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>

          

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md transition hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;