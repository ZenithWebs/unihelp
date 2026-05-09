import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "./../../../firebase/config";

import {
  Wallet,
  TrendingUp,
  Clock,
  Send,
} from "lucide-react";

export default function TutorEarnings({ dark }) {
  const [earnings, setEarnings] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [account, setAccount] = useState("");

  const tutorId = auth.currentUser?.uid;

  // ============================
  // CALCULATE EARNINGS
  // ============================
  useEffect(() => {
    if (!tutorId) return;

    const q = query(
      collection(db, "purchases"),
      where("tutorId", "==", tutorId),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(q, (snap) => {
      let total = 0;

      snap.docs.forEach((doc) => {
        total += doc.data().amount || 0;
      });

      setEarnings(total);
      setLoading(false);
    });

    return () => unsub();
  }, [tutorId]);

  // ============================
  // FETCH WITHDRAWALS
  // ============================
  useEffect(() => {
    if (!tutorId) return;

    const q = query(
      collection(db, "withdrawals"),
      where("tutorId", "==", tutorId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setWithdrawals(data);
    });

    return () => unsub();
  }, [tutorId]);

  // ============================
  // REQUEST WITHDRAWAL
  // ============================
  const requestWithdrawal = async () => {
    if (!amount || !account) return alert("Fill all fields");

    if (Number(amount) > earnings)
      return alert("Insufficient balance");

    await addDoc(collection(db, "withdrawals"), {
      tutorId,
      amount: Number(amount),
      method,
      accountDetails: account,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    alert("Withdrawal request sent");

    setAmount("");
    setAccount("");
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
        Tutor Earnings Dashboard
      </h1>

      {/* ============================
          STATS
      ============================ */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div
          className={`p-5 rounded-2xl ${
            dark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-500"/>
            <p>Total Earnings</p>
          </div>

          <h2 className="text-3xl font-bold mt-2">
            ₦{earnings}
          </h2>
        </div>

        <div
          className={`p-5 rounded-2xl ${
            dark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Wallet className="text-yellow-500"/>
            <p>Available Balance</p>
          </div>

          <h2 className="text-3xl font-bold mt-2">
            ₦{earnings}
          </h2>
        </div>
      </div>

      {/* ============================
          WITHDRAWAL FORM
      ============================ */}
      <div
        className={`p-5 rounded-2xl mb-8 ${
          dark ? "bg-[#1e293b]" : "bg-white"
        }`}
      >
        <h2 className="text-xl font-bold mb-4">
          Request Withdrawal
        </h2>

        <div className="grid gap-3">
          <input
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            placeholder="Amount"
            type="number"
            className="p-3 rounded-xl text-black"
          />

          <select
            value={method}
            onChange={(e) =>
              setMethod(e.target.value)
            }
            className="p-3 rounded-xl text-black"
          >
            <option value="kuda">Kuda</option>
            <option value="opay">Opay</option>
            <option value="palmpay">PalmPay</option>
            <option value="moniepoint">MoniePoint</option>
          </select>

          <input
            value={account}
            onChange={(e) =>
              setAccount(e.target.value)
            }
            placeholder="Account Details"
            className="p-3 rounded-xl text-black"
          />

          <button
            onClick={requestWithdrawal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl"
          >
            <Send size={18} />
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* ============================
          WITHDRAWAL HISTORY
      ============================ */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Withdrawal History
        </h2>

        <div className="grid gap-4">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className={`p-4 rounded-xl flex justify-between items-center ${
                dark
                  ? "bg-[#1e293b]"
                  : "bg-white"
              }`}
            >
              <div>
                <p className="font-bold">
                  ₦{w.amount}
                </p>
                <p className="text-sm opacity-60">
                  {w.method} -{" "}
                  {w.accountDetails}
                </p>
              </div>

              <div
                className={`flex items-center gap-1 text-sm ${
                  w.status === "pending"
                    ? "text-yellow-500"
                    : w.status === "approved"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                <Clock size={16} />
                {w.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}