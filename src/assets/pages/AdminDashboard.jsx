import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from "firebase/firestore";

export default function AdminDashboard({ dark }) {
  const [stats, setStats] = useState({
    revenue: 0,
    withdrawals: 0
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // FETCH PLATFORM STATS
  // ===============================
  const fetchStats = async () => {
    const statsSnap = await getDoc(doc(db, "platformStats", "main"));

    const withdrawSnap = await getDocs(collection(db, "withdrawals"));

    let totalWithdrawals = 0;

    const list = [];

    withdrawSnap.forEach(docu => {
      const data = docu.data();

      if (data.status === "paid") {
        totalWithdrawals += data.amount;
      }

      list.push({ id: docu.id, ...data });
    });

    setStats({
      revenue: statsSnap.data()?.totalRevenue || 0,
      withdrawals: totalWithdrawals
    });

    setWithdrawals(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ===============================
  // APPROVE WITHDRAWAL
  // ===============================
  const approveWithdrawal = async (id) => {
    const ref = doc(db, "withdrawals", id);

    await updateDoc(ref, {
      status: "paid",
      paidAt: new Date()
    });

    alert("Withdrawal approved ✅");
    fetchStats();
  };

  // ===============================
  // UI CARD COMPONENT
  // ===============================
  const Card = ({ title, value, color }) => (
    <div
      className={`p-5 rounded-2xl shadow-md ${
        dark ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      <p className="text-sm opacity-70">{title}</p>
      <h2 className={`text-2xl font-bold mt-1 ${color}`}>
        {value}
      </h2>
    </div>
  );

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen p-6 w-full mt-15`}>
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Admin Dashboard</h1>
        <p className="opacity-70 text-sm">
          Platform revenue & tutor payouts
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">

        <Card
          title="Total Revenue"
          value={`₦${stats.revenue}`}
          color="text-green-500"
        />

        <Card
          title="Paid Out"
          value={`₦${stats.withdrawals}`}
          color="text-blue-500"
        />

        <Card
          title="Net Profit"
          value={`₦${stats.revenue - stats.withdrawals}`}
          color="text-yellow-500"
        />

      </div>

      {/* WITHDRAWALS SECTION */}
      <div className={`${dark ? "bg-[#1e293b]" : "bg-white"} p-5 rounded-2xl shadow`}>
        
        <h2 className="text-xl font-semibold mb-4">
          💸 Withdrawal Requests
        </h2>

        {loading && <p>Loading...</p>}

        {!loading && withdrawals.length === 0 && (
          <p className="opacity-60">No withdrawals yet</p>
        )}

        {/* TABLE */}
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div
              key={w.id}
              className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                dark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >

              {/* INFO */}
              <div>
                <p className="font-semibold">
                  Tutor ID: {w.tutorId}
                </p>
                <p className="text-sm opacity-70">
                  ₦{w.amount} • {w.status}
                </p>
              </div>

              {/* STATUS / ACTION */}
              <div>
                {w.status === "pending" ? (
                  <button
                    onClick={() => approveWithdrawal(w.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Approve
                  </button>
                ) : (
                  <span className="text-green-500 font-medium">
                    ✔ Paid
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}