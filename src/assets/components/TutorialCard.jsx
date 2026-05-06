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
  isOwner
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
  const checkAccess = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where("userId", "==", auth.currentUser.uid),
      where("tutorialId", "==", tutorial.id)
    );

    const snap = await getDocs(q);
    setHasAccess(!snap.empty);
  };

  checkAccess();
}, [tutorial.id, auth.currentUser]);

  // ============================
  // 💳 HANDLE BUY
  // ============================
 const handleBuy = async () => {
  try {
    if (!auth.currentUser) return alert("Login first");

    const token = await auth.currentUser.getIdToken();

    const res = await fetch(`${API_URL}/api/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` // ✅ THIS WAS MISSING
      },
      body: JSON.stringify({
        amount: tutorial.price,
        email: auth.currentUser.email,
        tutorialId: tutorial.id,
        tutorId: tutorial.tutorId
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      return alert("Request failed");
    }

    const data = await res.json();

    if (!data.data?.link) {
      return alert("Payment error");
    }

    window.location.href = data.data.link;
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
};

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg transition hover:scale-[1.02] ${
        dark ? "bg-[#1e293b]" : "bg-white"
      }`}
    >
      {/* VIDEO / PREVIEW */}
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

      {/* CONTENT */}
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-1 line-clamp-1">
          {tutorial.title}
        </h2>

        <p className="text-sm opacity-70 line-clamp-2">
          {tutorial.description}
        </p>

        {/* ACTION */}
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