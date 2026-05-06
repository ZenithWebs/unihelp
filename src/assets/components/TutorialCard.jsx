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
  }, [tutorial.id]);

  const handleBuy = async () => {
    localStorage.setItem("tutorialId", tutorial.id);
    const API_URL = import.meta.env.VITE_API_URL;

    const res = await fetch(`${API_URL}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: tutorial.price,
        email: auth.currentUser.email,
        subaccountId: tutorial.subaccountId,
        tx_ref: "tx_" + Date.now()
      })
    });

    const data = await res.json();
    window.location.href = data.data.link;
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

        {/* OWNER DELETE BUTTON */}
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

        {/* PRICE / ACTION */}
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