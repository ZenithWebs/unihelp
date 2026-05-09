import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Home,
  Users,
  ShieldAlert,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Ban,
  Settings2,
  Sparkles,
  Bell,
  ChevronDown,
} from "lucide-react";

import useAdmin from "../hooks/useAdmin";
import { db, auth } from "../../firebase/config";

import {
  collection,
  query,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import AdminWithdrawals from "./AdminWithdrawals";

export default function AdminPanel({ dark }) {

  /* ---------------- STATES ---------------- */
  const [tab, setTab] = useState("dashboard");
  const [hostels, setHostels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mobileMenu, setMobileMenu] = useState(false);

  /* ---------------- CUSTOM HOOK ---------------- */
  const isAdmin = useAdmin();

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      collection(db, "hostels"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setHostels(data);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setUsers(data);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  /* ---------------- MEMOS ---------------- */
  const filteredHostels = hostels
    .filter((h) =>
      h.title?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((h) =>
      filterStatus === "all"
        ? true
        : h.status === filterStatus
    );

  const stats = useMemo(
    () => ({
      total: hostels.length,
      pending: hostels.filter(
        (h) => h.status === "pending"
      ).length,
      approved: hostels.filter(
        (h) => h.status === "approved"
      ).length,
      users: users.length,
    }),
    [hostels, users]
  );

  /* ---------------- RETURNS ---------------- */
  if (!auth.currentUser)
    return <p>Login required</p>;

  if (isAdmin === null)
    return <p>Loading...</p>;

  if (!isAdmin)
    return <p>Access denied</p>;

  /* ---------------- FUNCTIONS ---------------- */
  const approveHostel = async (id) => {
    await updateDoc(doc(db, "hostels", id), {
      status: "approved",
      verified: true,
    });
  };

  const rejectHostel = async (id) => {
    await deleteDoc(doc(db, "hostels", id));
  };

  const toggleBanUser = async (user) => {
    await updateDoc(doc(db, "users", user.id), {
      banned: !user.banned,
    });
  };

  /* ---------------- TABS ---------------- */
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "hostels",
      label: "Hostels",
      icon: Home,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
    },
    {
      id: "reports",
      label: "Reports",
      icon: ShieldAlert,
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
    },
  ];

  /* ---------------- STYLES ---------------- */
  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f3f6ff] text-slate-900";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 backdrop-blur-xl";

  return (
    <div className={`min-h-screen w-full overflow-hidden ${bg}`}>
      {/* BACKGROUND GLOW */}
      <div className="fixed -top-50 -left-25 h-100 w-100 bg-indigo-500/20 blur-3xl rounded-full" />
      <div className="fixed -bottom-50 -right-25 h-100 w-100 bg-purple-500/20 blur-3xl rounded-full" />

      {/* TOP NAV */}
      <div
        className={`sticky top-0 z-40 w-full px-4 md:px-8 py-4 border-b ${
          dark
            ? "border-white/10 bg-[#050816]/70"
            : "border-slate-200 bg-white/70"
        } backdrop-blur-2xl`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Settings2 size={22} />
            </div>

            <div>
              <h1 className="font-black text-xl md:text-2xl">
                CampusFlow Admin
              </h1>

              <p className="text-xs opacity-70">
                Control Center
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`px-5 py-3 rounded-2xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold ${
                    tab === item.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : dark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-white hover:bg-slate-100"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className={`lg:hidden px-4 py-3 rounded-2xl ${glass}`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <ChevronDown
                size={18}
                className={`transition ${
                  mobileMenu ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* MOBILE NAV */}
        {mobileMenu && (
          <div className="lg:hidden mt-4 grid grid-cols-2 gap-3">
            {tabs.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileMenu(false);
                  }}
                  className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-2 ${
                    tab === item.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      : glass
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="p-4 md:p-8 space-y-8">
        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2
              size={40}
              className="animate-spin text-indigo-500"
            />
          </div>
        )}

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            {/* HERO */}
            <div
              className={`${glass} rounded-[30px] p-6 md:p-10 overflow-hidden relative`}
            >
              <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/20 blur-3xl rounded-full" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-400 mb-3">
                  <Sparkles size={18} />
                  <span className="font-semibold">
                    Admin Analytics
                  </span>
                </div>

                <h2 className="text-3xl md:text-5xl font-black leading-tight">
                  Welcome back,
                  <br />
                  Admin 🚀
                </h2>

                <p className="opacity-70 mt-4 max-w-xl">
                  Manage users, approve hostels, monitor
                  payments and keep CampusFlow running
                  smoothly.
                </p>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {[
                {
                  label: "Total Hostels",
                  value: stats.total,
                  color:
                    "from-indigo-500 to-indigo-700",
                },
                {
                  label: "Pending",
                  value: stats.pending,
                  color:
                    "from-yellow-500 to-orange-500",
                },
                {
                  label: "Approved",
                  value: stats.approved,
                  color:
                    "from-green-500 to-emerald-600",
                },
                {
                  label: "Users",
                  value: stats.users,
                  color:
                    "from-purple-500 to-fuchsia-600",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`${glass} rounded-[28px] p-6 relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${s.color} opacity-10`}
                  />

                  <div className="relative z-10">
                    <p className="opacity-70 text-sm">
                      {s.label}
                    </p>

                    <h3 className="text-4xl font-black mt-2">
                      {s.value}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* HOSTELS */}
        {tab === "hostels" && (
          <>
            {/* FILTER */}
            <div
              className={`${glass} rounded-[28px] p-4 md:p-5 flex flex-col lg:flex-row gap-4`}
            >
              <div
                className={`flex items-center gap-3 flex-1 rounded-2xl px-4 py-3 ${
                  dark
                    ? "bg-white/5"
                    : "bg-slate-100"
                }`}
              >
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search hostel..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="bg-transparent flex-1 outline-none"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value)
                }
                className={`rounded-2xl px-5 py-3 outline-none ${
                  dark
                    ? "bg-white/5"
                    : "bg-slate-100"
                }`}
              >
                <option value="all">All</option>
                <option value="pending">
                  Pending
                </option>
                <option value="approved">
                  Approved
                </option>
              </select>
            </div>

            {/* HOSTELS GRID */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredHostels.map((h) => (
                <div
                  key={h.id}
                  className={`${glass} rounded-[30px] overflow-hidden group`}
                >
                  {/* IMAGE */}
                  <div className="relative overflow-hidden">
                    <img
                      src={h.images?.[0]}
                      alt={h.title}
                      className="h-60 w-full object-cover group-hover:scale-110 transition duration-500"
                    />

                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold ${
                          h.status === "approved"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-black text-lg">
                          {h.title}
                        </h3>

                        <p className="opacity-60 text-sm">
                          {h.location}
                        </p>
                      </div>

                      <div className="text-indigo-500 font-black text-lg">
                        ₦{h.price}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    {h.status === "pending" && (
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() =>
                            approveHostel(h.id)
                          }
                          className="flex-1 py-3 rounded-2xl bg-green-500 hover:bg-green-600 transition text-white font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            rejectHostel(h.id)
                          }
                          className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 transition text-white font-semibold flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {users.map((u) => (
              <div
                key={u.id}
                className={`${glass} rounded-[28px] p-5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-black text-lg">
                      {u.username?.[0] || "U"}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">
                        {u.username || "No Name"}
                      </h3>

                      <p className="opacity-60 text-sm break-all">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <Bell
                    size={18}
                    className="text-yellow-400"
                  />
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => toggleBanUser(u)}
                    className={`w-full py-3 rounded-2xl font-semibold transition flex items-center justify-center gap-2 ${
                      u.banned
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : dark
                        ? "bg-white/10 hover:bg-white/20"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    <Ban size={18} />
                    {u.banned
                      ? "Unban User"
                      : "Ban User"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <div
            className={`${glass} rounded-[30px] p-10 text-center`}
          >
            <ShieldAlert
              size={60}
              className="mx-auto text-yellow-500"
            />

            <h2 className="text-3xl font-black mt-5">
              Reports Section
            </h2>

            <p className="opacity-70 mt-2">
              Reports & moderation tools coming soon 🚨
            </p>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <AdminWithdrawals/>
        )}
      </div>
    </div>
  );
}