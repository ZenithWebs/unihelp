import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export default function AdminPayments({ dark }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH PAYMENTS
  // ============================
  useEffect(() => {
    const q = query(
      collection(db, "purchases"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPayments(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ============================
  // APPROVE PAYMENT
  // ============================
  const approvePayment = async (id) => {
    try {
      await updateDoc(doc(db, "purchases", id), {
        status: "approved",
      });

      alert("Payment approved");
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    }
  };

  // ============================
  // REJECT PAYMENT
  // ============================
  const rejectPayment = async (id) => {
    try {
      if (!window.confirm("Reject this payment?")) return;

      await deleteDoc(doc(db, "purchases", id));

      alert("Payment rejected");
    } catch (err) {
      console.error(err);
      alert("Rejection failed");
    }
  };

  return (
    <div
      className={`min-h-screen w-full p-6 ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Payment Approvals
        </h1>

        <p className="opacity-70 mt-1">
          Approve or reject tutorial payments
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center opacity-60">
          Loading payments...
        </div>
      )}

      {/* EMPTY */}
      {!loading && payments.length === 0 && (
        <div className="text-center opacity-60">
          No payments found
        </div>
      )}

      {/* PAYMENTS */}
      <div className="grid gap-5">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={`rounded-2xl overflow-hidden shadow-md ${
              dark
                ? "bg-[#1e293b]"
                : "bg-white"
            }`}
          >
            <div className="p-5">
              {/* TOP */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {payment.tutorialTitle}
                  </h2>

                  <p className="text-sm opacity-70 mt-1">
                    {payment.userEmail}
                  </p>

                  <p className="text-sm opacity-70">
                    User ID: {payment.userId}
                  </p>
                </div>

                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    ₦{payment.amount}
                  </div>

                  <div
                    className={`text-sm mt-2 px-3 py-1 rounded-full inline-block ${
                      payment.status === "approved"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-yellow-500/20 text-yellow-500"
                    }`}
                  >
                    {payment.status}
                  </div>
                </div>
              </div>

              {/* SCREENSHOT */}
              <div className="mt-5">
                <p className="font-medium mb-2">
                  Payment Screenshot
                </p>

                <img
                  src={payment.proofUrl}
                  alt="payment proof"
                  className="w-full max-w-md rounded-xl border"
                />
              </div>

              {/* ACTIONS */}
              {payment.status !== "approved" && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() =>
                      approvePayment(payment.id)
                    }
                    className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      rejectPayment(payment.id)
                    }
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}