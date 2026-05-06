import { useState, useEffect } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

export default function TutorialCard({
  tutorial,
  dark,
  onDelete,
  isOwner,
  purchasedIds = [] // ✅ passed from parent (OPTIMIZED)
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================
  // 🔐 CHECK ACCESS (FAST VERSION)
  // ============================
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // ✅ FAST CHECK (NO FIRESTORE QUERY PER CARD)
    const access = purchasedIds.includes(tutorial.id);
    setHasAccess(access);
    setLoading(false);
  }, [tutorial.id, purchasedIds]);

  // ============================
  // 💳 HANDLE BUY
  // ============================
  const handleBuy = async () => {
    try {
      if (!auth.currentUser) {
        alert("Login first");
        return;
      }

      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_URL}/api/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: tutorial.price,
          email: auth.currentUser.email,
          tutorialId: tutorial.id,
          tutorId: tutorial.tutorId
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("PAY ERROR:", errText);
        alert("Payment request failed");
        return;
      }

      const data = await res.json();

      if (!data?.data?.link) {
        alert("Payment link not received");
        return;
      }

      window.location.href = data.data.link;
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  // ============================
  // ⏳ LOADING STATE
  // ============================
  if (loading) {
    return (
      <div className={`p-4 rounded-2xl ${dark ? "bg-[#1e293b]" : "bg-white"}`}>
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg transition hover:scale-[1.02] ${
        dark ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      {/* ============================ */}
      {/* 🎥 VIDEO / PREVIEW */}
      {/* ============================ */}
      <div className="relative">
        <iframe
          src={hasAccess ? tutorial.videoUrl : tutorial.previewUrl}
          className="w-full h-40"
          allowFullScreen
        />

        {/* OWNER DELETE */}
        {isOwner && (
          <button
            onClick={() => onDelete(tutorial.id, tutorial.tutorId)}
            className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
          >
            Delete
          </button>
        )}
      </div>

      {/* ============================ */}
      {/* 📄 CONTENT */}
      {/* ============================ */}
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-1 line-clamp-1">
          {tutorial.title}
        </h2>

        <p className="text-sm opacity-70 line-clamp-2">
          {tutorial.description}
        </p>

        {/* ============================ */}
        {/* 💰 ACTION */}
        {/* ============================ */}
        <div className="mt-3">
          {hasAccess ? (
            <span className="text-green-500 text-sm font-medium">
              ✅ Purchased
            </span>
          ) : (
            <button
              onClick={handleBuy}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition"
            >
              Buy for ₦{tutorial.price}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}