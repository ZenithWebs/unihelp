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
        {
          to: "/GPA",
          label: "GPA Calculator",
          icon: <CalculatorIcon size={18} />,
        },
        {
          to: "/CGPA",
          label: "CGPA Tracking",
          icon: <ChartAreaIcon size={18} />,
        },
        {
          to: "/questions",
          label: "Past Questions",
          icon: <File size={18} />,
        },
      ],
    },

    {
      title: "Learning Resources",
      icon: <BookOpen size={20} />,
      links: [
        {
          to: "/tutorials",
          label: "Browse YT Videos",
          icon: <PlaySquareIcon size={18} />,
        },
        {
          to: "/tutorialmarketplace",
          label: "Find Tutorials",
          icon: <Video size={18} />,
        },
        {
          to: "/lecturenotesmarketplace",
          label: "Lecture Notes",
          icon: <NotebookPenIcon size={18} />,
        },
      ],
    },

    {
      title: "Student Marketplace",
      icon: <LayoutDashboard size={20} />,
      links: [
        {
          to: "/hostelmarketplace",
          label: "Find Hostel",
          icon: <HouseIcon size={18} />,
        },
        {
            to: '/studentmarketplace',
            label: 'Student Marketplace',
            icon: <BadgeDollarSign size={18}/>
        },
      ],
    },

    {
      title: "Smart Features",
      icon: <Brain size={20} />,
      links: [
        {
          to: "/newsfeed",
          label: "Smart Feeds",
          icon: <NewspaperIcon size={18} />,
        },
        {
          to: "/ai",
          label: "AI Assistance",
          icon: <Brain size={18} />,
        },
      ],
    },

    {
      title: "Support",
      icon: <PhoneCall size={20} />,
      links: [
        {
          to: "/report",
          label: "Report",
          icon: <FileWarning size={18} />,
        },
        {
          to: "/contact",
          label: "Contact Us",
          icon: <PhoneCall size={18} />,
        },
      ],
    },
  ];

  return (
    <div className="flex gap-0.5">
      <div>
        <SideBar dark={dark} />
        <BottomBar dark={dark} />

        {menuOpen && (
          <div
            className={`fixed md:hidden pb-38 py-10 px-5 left-0 top-10 h-screen w-[85%] z-20 overflow-y-auto no-scrollbar flex flex-col ${
              dark ? "bg-slate-900 text-white" : "bg-slate-100 text-black"
            }`}
          >
            {/* MENU CATEGORIES */}
            <div className="flex flex-col gap-3">
              {menuCategories.map((category, index) => (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden ${
                    dark ? "bg-slate-800" : "bg-white"
                  }`}
                >
                  {/* CATEGORY HEADER */}
                  <button
                    onClick={() => toggleDropdown(category.title)}
                    className={`w-full flex items-center justify-between px-4 py-3 font-semibold ${
                      dark
                        ? "hover:bg-slate-700"
                        : "hover:bg-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span>{category.title}</span>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`transition-all duration-300 ${
                        openDropdown === category.title
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {/* DROPDOWN LINKS */}
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      openDropdown === category.title
                        ? "max-h-125 py-2"
                        : "max-h-0"
                    }`}
                  >
                    <div className="flex flex-col gap-1 px-2 pb-2">
                      {category.links.map((link, i) => (
                        <NavLink
                          key={i}
                          to={link.to}
                          onClick={() => setMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? dark
                                  ? "bg-purple-700 text-white"
                                  : "bg-slate-300 text-black"
                                : dark
                                ? "hover:bg-slate-700"
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
            </div>

            {/* PROFILE */}
            <div
              onClick={() => setMenuOpen(false)}
              className="flex flex-col shrink-0 mt-auto pt-5"
            >
              <Link
                to={"/profile"}
                className={`flex items-center relative p-3 rounded-xl ${
                  dark ? "bg-slate-800" : "bg-white"
                }`}
              >
                <ProfilePhoto user={user} />

                <ChevronRight
                  size={22}
                  className={`absolute right-3 ${
                    dark ? "text-white" : "text-black"
                  }`}
                />
              </Link>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className={`mt-3 flex items-center gap-2 p-3 rounded-xl font-medium ${
                  dark
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`h-screen max-md:mb-25 w-full pt-20 flex overflow-y-auto no-scrollbar ${
          dark
            ? "bg-[#0b0f1a] text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;