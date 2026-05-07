import { signOut } from "firebase/auth";
import {
  Brain,
  CalculatorIcon,
  ChevronDown,
  ChevronRight,
  File,
  HomeIcon,
  LayoutDashboardIcon,
  LogOut,
  MessageCircle,
  NotebookPenIcon,
  VideoIcon,
  YoutubeIcon,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Sparkles,
  BadgeDollarSign,
} from "lucide-react";

import React, { useContext, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import { auth } from "../../firebase/config";

import { AuthContext } from "../context/AuthContext";

import ProfilePhoto from "./ProfilePhoto.jsx";

const SideBar = ({ dark }) => {
  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [openDropdown, setOpenDropdown] = useState("Academic");

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const toggleDropdown = (title) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  /* ---------------- MENU ---------------- */

  const menuCategories = [
    {
      title: "Dashboard",
      icon: <LayoutDashboardIcon size={19} />,
      links: [
        {
          to: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboardIcon size={18} />,
        },
      ],
    },

    {
      title: "Academic",
      icon: <GraduationCap size={19} />,
      links: [
        {
          to: "/GPA",
          label: "GPA Calculator",
          icon: <CalculatorIcon size={18} />,
        },

        {
          to: "/CGPA",
          label: "CGPA Tracking",
          icon: <CalculatorIcon size={18} />,
        },

        {
          to: "/questions",
          label: "Past Questions",
          icon: <File size={18} />,
        },

        {
          to: "/lecturenotesmarketplace",
          label: "Lecture Notes",
          icon: <NotebookPenIcon size={18} />,
        },
      ],
    },

    {
      title: "Learning",
      icon: <BookOpen size={19} />,
      links: [
        {
          to: "/tutorials",
          label: "YT Videos",
          icon: <YoutubeIcon size={18} />,
        },

        {
          to: "/tutorialmarketplace",
          label: "Find Tutorials",
          icon: <VideoIcon size={18} />,
        },
      ],
    },

    {
      title: "Marketplace",
      icon: <ShoppingBag size={19} />,
      links: [
        {
          to: "/hostelmarketplace",
          label: "Find Hostel",
          icon: <HomeIcon size={18} />,
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
      icon: <Sparkles size={19} />,
      links: [
        {
          to: "/ai",
          label: "AI Assistance",
          icon: <Brain size={18} />,
        },

        {
          to: "/community",
          label: "Community",
          icon: <MessageCircle size={18} />,
        },
      ],
    },
  ];

  /* ---------------- UI ---------------- */

  return (
    <div
      className={`pt-22 flex flex-col w-72 h-screen max-md:hidden p-5 overflow-y-auto no-scrollbar ${
        dark
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-black"
      }`}
    >
      {/* MENU */}
      <div className="flex flex-col gap-3">

        {menuCategories.map((category, index) => (
          <div
            key={index}
            className={`rounded-2xl overflow-hidden transition ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* CATEGORY HEADER */}
            <button
              onClick={() => toggleDropdown(category.title)}
              className={`w-full flex items-center justify-between px-4 py-3 font-semibold transition ${
                dark
                  ? "hover:bg-white/5"
                  : "hover:bg-gray-100"
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
              className={`overflow-hidden transition-all duration-300 ${
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
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : dark
                          ? "hover:bg-white/10"
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
      <div className="mt-auto pt-5">
        <div
          className={`rounded-2xl p-3 ${
            dark
              ? "bg-white/5 border border-white/10"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="flex items-center relative">
            <ProfilePhoto user={user} />

            <ChevronRight
              size={22}
              className={`absolute right-1 ${
                dark ? "text-white" : "text-black"
              }`}
            />
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="mt-5 flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideBar;