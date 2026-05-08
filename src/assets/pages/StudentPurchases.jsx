import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";

import {
  Clock,
  CheckCircle,
  BookOpen,
  Download,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function StudentPurchases({
  dark,
}) {
  const [purchases, setPurchases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  // ============================
  // FETCH PURCHASES
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "userId",
        "==",
        auth.currentUser.uid
      )
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPurchases(data);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div
      className={`min-h-screen p-6 ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            My Purchases
          </h1>

          <p className="opacity-70 mt-2">
            Access your purchased tutorials and
            pending approvals.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center opacity-60">
            Loading purchases...
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          purchases.length === 0 && (
            <div
              className={`rounded-3xl p-10 text-center ${
                dark
                  ? "bg-[#1e293b]"
                  : "bg-white"
              }`}
            >
              <h2 className="text-2xl font-bold mb-3">
                No Purchases Yet
              </h2>

              <p className="opacity-70 mb-5">
                You haven't purchased any
                tutorials yet.
              </p>

              <Link
                to="/tutorial-marketplace"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
              >
                Explore Tutorials
              </Link>
            </div>
          )}

        {/* PURCHASE GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => {
            const approved =
              purchase.status ===
              "approved";

            return (
              <div
                key={purchase.id}
                className={`rounded-3xl overflow-hidden shadow-lg ${
                  dark
                    ? "bg-[#1e293b]"
                    : "bg-white"
                }`}
              >
                {/* TOP */}
                <div className="p-5">
                  {/* STATUS */}
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        approved
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {approved ? (
                        <>
                          <CheckCircle
                            size={16}
                          />
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock
                            size={16}
                          />
                          Pending
                        </>
                      )}
                    </div>

                    <div className="font-bold text-blue-500">
                      ₦{purchase.amount}
                    </div>
                  </div>

                  {/* TITLE */}
                  <h2 className="text-2xl font-bold line-clamp-2">
                    {
                      purchase.tutorialTitle
                    }
                  </h2>

                  {/* EMAIL */}
                  <p className="opacity-60 text-sm mt-2">
                    {purchase.userEmail}
                  </p>

                  {/* ACTIONS */}
                  <div className="mt-6 space-y-3">
                    {/* OPEN */}
                    {approved && (
                      <Link
                        to={`/tutorial/${purchase.tutorialId}`}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
                      >
                        <BookOpen
                          size={18}
                        />
                        Open Tutorial
                      </Link>
                    )}

                    {/* PENDING */}
                    {!approved && (
                      <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-xl p-4 text-sm">
                        Your payment is awaiting
                        admin approval.
                      </div>
                    )}

                    {/* RECEIPT */}
                    <a
                      href={
                        purchase.proofUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl ${
                        dark
                          ? "bg-[#0f172a]"
                          : "bg-gray-100"
                      }`}
                    >
                      <Download
                        size={18}
                      />
                      View Payment Proof
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}