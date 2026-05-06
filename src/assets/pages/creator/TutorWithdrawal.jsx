import { useEffect, useState } from "react";
import { db, auth } from "./../../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

export default function TutorWithdrawal({ dark }) {
  const [user, setUser] = useState(null);

  const [earnings, setEarnings] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const tutorId = user?.uid;

  // ===============================
  // AUTH LISTENER (FIXED)
  // ===============================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchData = async (uid) => {
    if (!uid) return;

    setFetching(true);

    try {
      // 🎓 Earnings
      const earnSnap = await getDocs(
        query(collection(db, "tutorEarnings"), where("tutorId", "==", uid))
      );

      let totalEarned = 0;

      earnSnap.forEach((doc) => {
        totalEarned += Number(doc.data().amount || 0);
      });

      // 💸 Withdrawals
      const withdrawSnap = await getDocs(
        query(collection(db, "withdrawals"), where("tutorId", "==", uid))
      );

      let totalWithdrawn = 0;
      const list = [];

      withdrawSnap.forEach((doc) => {
        const data = doc.data();

        if (data.status === "paid") {
          totalWithdrawn += Number(data.amount || 0);
        }

        list.push({ id: doc.id, ...data });
      });

      setEarnings(totalEarned);
      setWithdrawn(totalWithdrawn);
      setHistory(list);
    } catch (err) {
      console.log("Fetch error:", err);
    }

    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchData(user.uid);
  }, [user]);

  const availableBalance = earnings - withdrawn;

  // ===============================
  // WITHDRAW REQUEST
  // ===============================
  const requestWithdraw = async () => {
  const amt = Number(amount);

  setLoading(true);

  const res = await fetch(`${API_URL}/api/withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tutorId,
      amount: amt
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
  } else {
    alert("Request sent for approval");
    setAmount("");
  }

  setLoading(false);
};

  // ===============================
  // CARD UI
  // ===============================
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
    <div
      className={`${
        dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"
      } min-h-screen w-full p-6`}
    >
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">💸 Withdraw Earnings</h1>
        <p className="text-sm opacity-70">
          Manage your earnings and payouts
        </p>
      </div>

      {/* LOADING */}
      {fetching && (
        <p className="mb-4 opacity-70">Loading data...</p>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          title="Total Earned"
          value={`₦${earnings}`}
          color="text-green-500"
        />

        <Card
          title="Withdrawn"
          value={`₦${withdrawn}`}
          color="text-blue-500"
        />

        <Card
          title="Available"
          value={`₦${availableBalance}`}
          color="text-yellow-500"
        />
      </div>

      {/* WITHDRAW BOX */}
      <div
        className={`${
          dark ? "bg-[#1e293b]" : "bg-white"
        } p-5 rounded-2xl shadow mb-6`}
      >
        <h2 className="text-xl font-semibold mb-3">
          Request Withdrawal
        </h2>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount (₦)"
          className="w-full p-3 rounded-xl border bg-transparent mb-3 outline-none"
        />

        <button
          onClick={requestWithdraw}
          disabled={loading || availableBalance <= 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Processing..." : "Request Withdrawal"}
        </button>

        <p className="text-xs opacity-60 mt-2">
          Minimum withdrawal depends on platform rules
        </p>
      </div>

      {/* HISTORY */}
      <div
        className={`${
          dark ? "bg-[#1e293b]" : "bg-white"
        } p-5 rounded-2xl shadow`}
      >
        <h2 className="text-xl font-semibold mb-4">
          📜 Withdrawal History
        </h2>

        {history.length === 0 && (
          <p className="opacity-60">
            No withdrawal requests yet
          </p>
        )}

        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl flex justify-between items-center ${
                dark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <div>
                <p className="font-semibold">₦{item.amount}</p>
                <p className="text-xs opacity-70">
                  {item.status}
                </p>
              </div>

              <div>
                {item.status === "pending" && (
                  <span className="text-yellow-500 text-sm">
                    Pending
                  </span>
                )}

                {item.status === "paid" && (
                  <span className="text-green-500 text-sm">
                    Paid ✔
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