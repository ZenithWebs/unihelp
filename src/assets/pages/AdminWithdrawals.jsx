import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Wallet,
} from "lucide-react";

export default function AdminWithdrawals({ dark }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH WITHDRAWALS
  // ============================
  useEffect(() => {
    const q = query(collection(db, "withdrawals"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWithdrawals(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ============================
  // APPROVE WITHDRAWAL
  // ============================
  const approveWithdrawal = async (id) => {
    await updateDoc(doc(db, "withdrawals", id), {
      status: "approved",
      processedAt: new Date(),
    });
  };

  // ============================
  // REJECT WITHDRAWAL
  // ============================
  const rejectWithdrawal = async (id) => {
    await updateDoc(doc(db, "withdrawals", id), {
      status: "rejected",
    });
  };

  return (
    <div
      className={`min-h-screen md:pt-20 p-6 ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <h1 className="text-3xl font-bold mb-6">
        Admin Withdrawal Approvals
      </h1>

      {loading && (
        <p className="opacity-60">
          Loading withdrawals...
        </p>
      )}

      {!loading && withdrawals.length === 0 && (
        <p className="opacity-60">
          No withdrawal requests
        </p>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {withdrawals.map((w) => (
          <div
            key={w.id}
            className={`p-5 rounded-2xl shadow-lg ${
              dark
                ? "bg-[#1e293b]"
                : "bg-white"
            }`}
          >
            {/* STATUS */}
            <div className="flex justify-between items-center mb-3">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  w.status === "approved"
                    ? "bg-green-500/20 text-green-500"
                    : w.status === "rejected"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {w.status === "approved" ? (
                  <CheckCircle size={16} />
                ) : w.status === "rejected" ? (
                  <XCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}

                {w.status || "pending"}
              </div>

              <div className="text-blue-500 font-bold flex items-center gap-1">
                <Wallet size={16} />
                ₦{w.amount}
              </div>
            </div>

            {/* TUTOR */}
            <div className="flex items-center gap-2 text-sm mb-2 opacity-80">
              <User size={16} />
              Tutor ID: {w.tutorId}
            </div>

            {/* METHOD */}
            <div className="text-sm mb-2 opacity-80">
              Method: {w.method}
            </div>

            {/* ACCOUNT */}
            <div className="text-sm mb-4 opacity-80">
              Account: {w.accountDetails}
            </div>

            {/* ACTIONS */}
            {w.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    approveWithdrawal(w.id)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    rejectWithdrawal(w.id)
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}