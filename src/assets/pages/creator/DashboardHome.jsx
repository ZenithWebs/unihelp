import { useEffect, useState } from "react";
import { db, auth } from "./../../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { Link } from "react-router-dom";

export default function DashboardHome({ dark }) {
  const [stats, setStats] = useState({
    earnings: 0,
    tutorials: 0,
    withdrawn: 0
  });

  const [recentEarnings, setRecentEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const tutorId = auth.currentUser?.uid;

  // ===============================
  // FETCH DASHBOARD DATA
  // ===============================
  const fetchData = async () => {
    if (!tutorId) return;

    // 🎓 Tutorials
    const tutorialsSnap = await getDocs(
      query(collection(db, "tutorials"), where("tutorId", "==", tutorId))
    );

    // 💰 Earnings
    const earningsSnap = await getDocs(
      query(collection(db, "tutorEarnings"), where("tutorId", "==", tutorId))
    );

    // 💸 Withdrawals
    const withdrawSnap = await getDocs(
      query(collection(db, "withdrawals"), where("tutorId", "==", tutorId))
    );

    let totalEarnings = 0;
    let totalWithdrawn = 0;

    const earningsList = [];

    earningsSnap.forEach(doc => {
      const data = doc.data();
      totalEarnings += data.amount || 0;

      earningsList.push({
        id: doc.id,
        amount: data.amount,
        tutorialId: data.tutorialId,
        date: data.createdAt
      });
    });

    withdrawSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === "paid") {
        totalWithdrawn += data.amount;
      }
    });

    setStats({
      earnings: totalEarnings,
      tutorials: tutorialsSnap.size,
      withdrawn: totalWithdrawn
    });

    setRecentEarnings(earningsList.slice(-5).reverse());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const available = stats.earnings - stats.withdrawn;

  const Card = ({ title, value, color }) => (
    <div
      className={`p-5 rounded-2xl shadow ${
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
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen p-6`}>
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🎓 Tutor Dashboard</h1>
        <p className="text-sm opacity-70">
          Track your earnings and performance
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <Card
          title="Total Earnings"
          value={`₦${stats.earnings}`}
          color="text-green-500"
        />

        <Card
          title="Available Balance"
          value={`₦${available}`}
          color="text-yellow-500"
        />

        <Card
          title="Tutorials"
          value={stats.tutorials}
          color="text-blue-500"
        />

      </div>


      {/* RECENT EARNINGS */}
      <div className={`${dark ? "bg-[#1e293b]" : "bg-white"} p-5 rounded-2xl shadow`}>
        
        <h2 className="text-xl font-semibold mb-4">
          📈 Recent Earnings
        </h2>

        {loading && <p>Loading...</p>}

        {!loading && recentEarnings.length === 0 && (
          <p className="opacity-60">No earnings yet</p>
        )}

        <div className="space-y-3">
          {recentEarnings.map(item => (
            <div
              key={item.id}
              className={`flex justify-between p-3 rounded-xl ${
                dark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <div>
                <p className="font-semibold">
                  Tutorial ID: {item.tutorialId}
                </p>
                <p className="text-xs opacity-60">
                  {item.date?.toDate?.().toLocaleDateString?.() || "recent"}
                </p>
              </div>

              <div className="text-green-500 font-bold">
                +₦{item.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}