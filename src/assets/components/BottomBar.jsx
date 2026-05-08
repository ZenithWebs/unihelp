import React from "react";

import {
  HomeIcon,
  MessageCircle,
  Video,
  WandSparklesIcon,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const BottomBar = ({ dark }) => {
  const navItems = [
    {
      name: "Home",
      icon: HomeIcon,
      path: "/dashboard",
    },

    {
      name: "Community",
      icon: MessageCircle,
      path: "/community",
    },

    {
      name: "Tutorials",
      icon: Video,
      path: "/tutorialmarketplace",
    },

    {
      name: "AI Help",
      icon: WandSparklesIcon,
      path: "/ai",
    },
  ];

  return (
    <>
      {/* =========================================================
         SAFE SPACING FOR MOBILE
      ========================================================= */}

      <div className="h-24 md:hidden" />

      {/* =========================================================
         BOTTOM NAVIGATION
      ========================================================= */}

      <div
        className={`md:hidden fixed bottom-0 left-0 w-full z-50 px-3 pb-3`}
      >
        <div
          className={`relative overflow-hidden rounded-[28px] border shadow-2xl backdrop-blur-2xl ${
            dark
              ? "bg-[#0f172acc] border-white/10"
              : "bg-white/90 border-gray-200"
          }`}
        >
          {/* BACKGROUND GLOW */}

          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />

          {/* NAV ITEMS */}

          <div className="relative flex items-center justify-between px-2 py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    group relative flex flex-col items-center justify-center
                    min-w-[70px]
                    py-2 px-3 rounded-2xl
                    transition-all duration-300
                    active:scale-95

                    ${
                      isActive
                        ? dark
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                        : dark
                        ? "text-slate-300 hover:bg-white/5"
                        : "text-slate-600 hover:bg-slate-100"
                    }
                  `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* ACTIVE INDICATOR */}

                      {isActive && (
                        <span className="absolute -top-1 w-8 h-1 rounded-full bg-white/90" />
                      )}

                      {/* ICON */}

                      <Icon
                        size={20}
                        className={`transition-all duration-300 ${
                          isActive
                            ? "scale-110"
                            : "group-hover:scale-105"
                        }`}
                      />

                      {/* LABEL */}

                      <span
                        className={`mt-1 text-[11px] font-semibold tracking-wide ${
                          isActive
                            ? "opacity-100"
                            : "opacity-80"
                        }`}
                      >
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomBar;