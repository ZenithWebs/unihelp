import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Home,
  Users,
  ShieldAlert,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Ban,
  Settings2,
} from "lucide-react";

import useAdmin from "./../hooks/useAdmin";
import { db, auth } from "../../firebase/config";

import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

export default function AdminPanel({ dark }) {
  const [tab, setTab] = useState("dashboard");
  const [hostels, setHostels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAdmin = useAdmin();

  /* ---------------- REALTIME HOSTELS ---------------- */
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "hostels"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setHostels(data);
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin]);

  /* ---------------- REALTIME USERS ---------------- */
  useEffect(() => {
    if (!isAdmin) return;

    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setUsers(data);
    });

    return () => unsub();
  }, [isAdmin]);

  /* ---------------- SAFE RETURNS ---------------- */
  if (!auth.currentUser) return <p>Login required</p>;
  if (isAdmin === null) return <p>Loading...</p>;
  if (!isAdmin) return <p>Access denied</p>;

  /* ---------------- FILTERING ---------------- */
  const filteredHostels = hostels
    .filter((h) =>
      h.title?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((h) =>
      filterStatus === "all" ? true : h.status === filterStatus
    );

  /* ---------------- STATS ---------------- */
  const stats = {
    total: hostels.length,
    pending: hostels.filter((h) => h.status === "pending").length,
    approved: hostels.filter((h) => h.status === "approved").length,
    users: users.length,
  };

  /* ---------------- ACTIONS ---------------- */
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

  /* ---------------- UI ---------------- */
  const bg = dark ? "bg-[#0b0f1a] text-white" : "bg-slate-100";
  const card = dark
    ? "bg-white/5 border border-slate-600"
    : "bg-slate-200 border border-slate-400";

  return (
    <div className={`min-h-screen w-full flex ${bg}`}>
      <div className="felx flex-col p-2.5">
        <h2 className="text-xl font-bold shrink-0 flex items-center"><Settings2 className="text-indigo-500" size={30}/> Admin</h2>

        {/* SIDEBAR */}
      <div className="md:w-64 w-20 p-5 space-y-4 border-r border-white/10">
       {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "hostels", label: "Hostels", icon: Home },
          { id: "users", label: "Users", icon: Users },
          { id: "reports", label: "Reports", icon: ShieldAlert },
          { id: "payments", label: "Payments", icon: CreditCard },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 w-full p-2 rounded-lg ${
              tab === item.id ? "bg-indigo-600 text-white" : ""
            }`}
          >
            <item.icon size={18}/>
            <p className="md:flex hidden">  {item.label }</p>
          </button>
        ))}
      </div>
      </div>
      
      

      {/* MAIN */}
      <div className="md:flex-1 p-6 space-y-6">

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="grid md:grid-cols-4 grid-cols-1 gap-5">
            {[
              { label: "Total Hostels", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Approved", value: stats.approved },
              { label: "Users", value: stats.users },
            ].map((s, i) => (
              <div key={i} className={`${card} text-center p-5 rounded-xl`}>
                <h3>{s.label}</h3>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* HOSTELS */}
        {tab === "hostels" && (
          <>
            {/* FILTER BAR */}
            <div className={`flex flex-col md:flex-row p-3.5 rounded-lg gap-3 mb-4 ${dark ? 'bg-slate-700' : 'bg-white'} `}>
              <div className={`flex w-full items-center gap-2 border border-slate-400 p-2 rounded`}>
                <Search size={14} />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`flex-1 bg-transparent placeholder:text-slate-400 outline-none`}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`p-2 rounded border ${dark && 'text-slate-10 bg-slate-700'} border-slate-400`}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHostels.map((h) => (
                <div key={h.id} className={`${card} p-4 rounded-xl`}>
                  <img
                    src={h.images?.[0]}
                    className="h-40 w-full object-cover rounded"
                  />

                  <h3 className="font-bold mt-2">{h.title}</h3>

                  <p className="text-sm opacity-70">{h.location}</p>

                  <p className="text-indigo-500 font-bold">
                    ₦{h.price}
                  </p>

                  <p className="text-xs">
                    Status:{" "}
                    <span className="text-yellow-500">
                      {h.status}
                    </span>
                  </p>

                  {h.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approveHostel(h.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded"
                      >
                        <CheckCircle size={14} />
                      </button>

                      <button
                        onClick={() => rejectHostel(h.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className=" grid gap-2.5 grid-cols-1 md:grid-cols-3 space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className={`${card} relative p-3 rounded flex justify-between items-center`}
              >
                <div>
                  <p>{u.username || "No Name"}</p>
                  <p className="text-xs opacity-70">{u.email}</p>
                </div>

                <button
                  onClick={() => toggleBanUser(u)}
                  className={`px-3 py-1 rounded flex absolute top-1.5 right-1.5 ${
                    u.banned
                      ? "bg-red-600 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <Ban size={14} />
                  {u.banned ? "Unban" : "Ban"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <p className="opacity-70">Reports coming soon 🚨</p>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <p className="opacity-70">Payments coming soon 💰</p>
        )}

      </div>
    </div>
  );
}