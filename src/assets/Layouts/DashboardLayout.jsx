import React, { useState, useContext } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import BottomBar from "../components/BottomBar";
import { auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import ProfilePhoto from "../components/ProfilePhoto";

import {
  Brain,
  CalculatorIcon,
  ChartAreaIcon,
  ChevronDown,
  ChevronRight,
  File,
  FileWarning,
  GraduationCap,
  HouseIcon,
  NewspaperIcon,
  NotebookPenIcon,
  PhoneCall,
  PlaySquareIcon,
  Video,
  LogOut,
  BookOpen,
  LayoutDashboard,
  BadgeDollarSign,
} from "lucide-react";

const DashboardLayout = ({ dark, menuOpen, setMenuOpen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const menuCategories = [
    {
      title: "Academic Tools",
      icon: <GraduationCap size={20} />,
      links: [
        { to: "/GPA", label: "GPA Calculator", icon: <CalculatorIcon size={18} /> },
        { to: "/CGPA", label: "CGPA Tracking", icon: <ChartAreaIcon size={18} /> },
        { to: "/questions", label: "Past Questions", icon: <File size={18} /> },
      ],
    },
    {
      title: "Learning Resources",
      icon: <BookOpen size={20} />,
      links: [
        { to: "/tutorials", label: "Browse YT Videos", icon: <PlaySquareIcon size={18} /> },
        { to: "/tutorialmarketplace", label: "Find Tutorials", icon: <Video size={18} /> },
        { to: "/lecturenotesmarketplace", label: "Lecture Notes", icon: <NotebookPenIcon size={18} /> },
      ],
    },
    {
      title: "Student Marketplace",
      icon: <LayoutDashboard size={20} />,
      links: [
        { to: "/hostelmarketplace", label: "Find Hostel", icon: <HouseIcon size={18} /> },
        { to: "/studentmarketplace", label: "Student Marketplace", icon: <BadgeDollarSign size={18} /> },
      ],
    },
    {
      title: "Smart Features",
      icon: <Brain size={20} />,
      links: [
        { to: "/newsfeed", label: "Smart Feeds", icon: <NewspaperIcon size={18} /> },
        { to: "/ai", label: "AI Assistance", icon: <Brain size={18} /> },
      ],
    },
    {
      title: "Support",
      icon: <PhoneCall size={20} />,
      links: [
        { to: "/report", label: "Report", icon: <FileWarning size={18} /> },
        { to: "/contact", label: "Contact Us", icon: <PhoneCall size={18} /> },
      ],
    },
  ];

  return (
    <div className="h-dvh w-full flex overflow-hidden">

      {/* ================= MOBILE MENU OVERLAY ================= */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* ================= SIDEBAR AREA ================= */}
      <div className="relative z-50">
        <SideBar dark={dark} />
        <BottomBar dark={dark} />
      </div>

      {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div
          className={`fixed md:hidden top-0 left-0 h-dvh w-[85%] z-50 overflow-y-auto flex flex-col p-5 ${
            dark ? "bg-slate-900 text-white" : "bg-slate-100 text-black"
          }`}
        >
          {menuCategories.map((category, index) => (
            <div
              key={index}
              className={`rounded-xl overflow-hidden mb-3 ${
                dark ? "bg-slate-800" : "bg-white"
              }`}
            >
              <button
                onClick={() => toggleDropdown(category.title)}
                className="w-full flex items-center justify-between px-4 py-3 font-semibold"
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span>{category.title}</span>
                </div>

                <ChevronDown
                  size={18}
                  className={`transition-transform ${
                    openDropdown === category.title ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all ${
                  openDropdown === category.title
                    ? "max-h-96 py-2"
                    : "max-h-0"
                }`}
              >
                <div className="flex flex-col gap-1 px-2">
                  {category.links.map((link, i) => (
                    <NavLink
                      key={i}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2 rounded-lg text-sm ${
                          isActive
                            ? dark
                              ? "bg-purple-700"
                              : "bg-slate-300"
                            : "hover:bg-slate-200"
                        }`
                      }
                    >
                      {link.icon}
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* PROFILE */}
          <div className="mt-auto pt-5">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl ${
                dark ? "bg-slate-800" : "bg-white"
              }`}
            >
              <ProfilePhoto user={user} />
              <ChevronRight />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-600 text-white"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT (FIXED) ================= */}
      <main
        onClick={() => setMenuOpen(false)}
        className={`flex-1 h-full overflow-y-auto pb-22.5 md:pb-0 pt-20 md:pt-0 ${
          dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;