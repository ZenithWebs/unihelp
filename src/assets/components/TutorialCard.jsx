import { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase/config";

export default function TutorialCard({
  tutorial,
  dark,
  onDelete,
  isOwner,
  purchasedIds = []
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerInstance = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================
  // 🔐 ACCESS CHECK
  // ============================
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const hasPurchased = purchasedIds.includes(tutorial.id);

    setHasAccess(hasPurchased);
    setLocked(!hasPurchased); // 🔥 reset lock properly
    setLoading(false);
  }, [tutorial.id, purchasedIds]);

  // ============================
  // 📺 LOAD YOUTUBE API
  // ============================
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  // ============================
  // 🎥 EXTRACT VIDEO ID
  // ============================
  const getVideoId = (url) => {
    if (!url) return null;

    if (url.includes("watch?v=")) {
      return url.split("watch?v=")[1].split("&")[0];
    }

    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }

    if (url.includes("embed/")) {
      return url.split("embed/")[1].split("?")[0];
    }

    return null;
  };

  // ============================
  // 🎬 PLAYER INIT
  // ============================
  useEffect(() => {
    if (loading) return;

    const videoId = getVideoId(tutorial.videoUrl);
    if (!videoId) return;

    const wait = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(wait);

        // destroy old player if exists
        if (playerInstance.current) {
          playerInstance.current.destroy();
        }

        const player = new window.YT.Player(playerRef.current, {
          height: "160",
          width: "100%",
          videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: (event) => {
              if (!hasAccess) {
                event.target.playVideo();

                intervalRef.current = setInterval(() => {
                  const time = event.target.getCurrentTime();

                  if (time >= 30) {
                    event.target.pauseVideo();
                    setLocked(true);
                    clearInterval(intervalRef.current);
                  }
                }, 1000);
              }
            }
          }
        });

        playerInstance.current = player;
      }
    }, 300);

    return () => {
      clearInterval(wait);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerInstance.current) {
        playerInstance.current.destroy();
      }
    };
  }, [tutorial.id, hasAccess, loading]);

  // ============================
  // 💳 BUY
  // ============================
  const handleBuy = async () => {
    try {
      if (!auth.currentUser) {
        alert("Login first");
        return;
      }

      setIsPaying(true);

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
        console.error(errText);
        alert("Payment failed");
        setIsPaying(false);
        return;
      }

      const data = await res.json();

      // redirect to payment
      window.location.href = data.data.link;
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setIsPaying(false);
    }
  };

  // ============================
  // ⏳ LOADING
  // ============================
  if (loading) {
    return (
      <div
        className={`p-4 rounded-2xl ${
          dark ? "bg-[#1e293b]" : "bg-white"
        }`}
      >
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
      {/* 🎥 VIDEO */}
      <div className="relative">
        <div ref={playerRef} className="w-full h-50 bg-black" />

        {/* 🔒 LOCKED AFTER PREVIEW */}
        {!hasAccess && locked && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-sm">
            ⏱ Preview ended

            <button
              onClick={handleBuy}
              disabled={isPaying}
              className={`mt-2 px-3 py-1 rounded text-white ${
                isPaying
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600"
              }`}
            >
              {isPaying
                ? "Processing..."
                : `Unlock for ₦${tutorial.price}`}
            </button>
          </div>
        )}

        {/* 🗑 DELETE */}
        {isOwner && (
          <button
            onClick={() => onDelete(tutorial.id, tutorial.tutorId)}
            className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
          >
            Delete
          </button>
        )}
      </div>

      {/* 📄 CONTENT */}
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-1 line-clamp-1">
          {tutorial.title}
        </h2>

        <p className="text-xs opacity-60 mt-1">
          By {tutorial.tutorName || "Unknown Tutor"}
        </p>

        <p className="text-sm opacity-70 line-clamp-2">
          {tutorial.description}
        </p>

        <div className="mt-3">
          {hasAccess ? (
            <span className="text-green-500 text-sm font-medium">
              ✅ Purchased
            </span>
          ) : (
            <button
              onClick={handleBuy}
              disabled={isPaying}
              className={`w-full mt-2 py-2 rounded-xl text-white transition ${
                isPaying
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPaying
                ? "Processing payment..."
                : `Buy for ₦${tutorial.price}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}