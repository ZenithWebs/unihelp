import { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase/config";

export default function TutorialCard({
  tutorial,
  dark,
  onDelete,
  isOwner,
  purchasedIds = [],
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const playerContainerRef = useRef(null);
  const playerInstance = useRef(null);
  const previewInterval = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================
  // 🔐 ACCESS CHECK
  // ============================
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setHasAccess(false);
      setLocked(true);
      setLoading(false);
      return;
    }

    const purchased = purchasedIds.includes(tutorial.id);

    setHasAccess(purchased);
    setLocked(!purchased);

    setLoading(false);
  }, [tutorial.id, purchasedIds]);

  // ============================
  // 🎥 GET VIDEO ID
  // ============================
  const getVideoId = (url) => {
    if (!url) return null;

    try {
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
    } catch {
      return null;
    }
  };

  // ============================
  // 📺 LOAD YOUTUBE API
  // ============================
  useEffect(() => {
    if (window.YT && window.YT.Player) return;

    const existingScript = document.getElementById("youtube-iframe-api");

    if (!existingScript) {
      const tag = document.createElement("script");

      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";

      document.body.appendChild(tag);
    }
  }, []);

  // ============================
  // 🎬 INIT PLAYER
  // ============================
  useEffect(() => {
    if (loading) return;

    const videoId = getVideoId(tutorial.videoUrl);

    if (!videoId) return;

    let mounted = true;

    const createPlayer = () => {
      if (
        !mounted ||
        !window.YT ||
        !window.YT.Player ||
        !playerContainerRef.current
      ) {
        return;
      }

      // destroy old player
      if (playerInstance.current) {
        playerInstance.current.destroy();
      }

      playerInstance.current = new window.YT.Player(
        playerContainerRef.current,
        {
          height: "220",
          width: "100%",
          videoId,

          playerVars: {
            autoplay: 0, // ✅ FIXED
            modestbranding: 1,
            rel: 0,
            controls: 1,
            playsinline: 1,
          },

          events: {
            onStateChange: (event) => {
              // only monitor preview users
              if (hasAccess) return;

              // PLAYING
              if (event.data === window.YT.PlayerState.PLAYING) {
                clearInterval(previewInterval.current);

                previewInterval.current = setInterval(() => {
                  const currentTime =
                    event.target.getCurrentTime();

                  // stop after 30 seconds
                  if (currentTime >= 30) {
                    event.target.pauseVideo();

                    setLocked(true);

                    clearInterval(previewInterval.current);
                  }
                }, 1000);
              }

              // STOP interval when paused
              if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.ENDED
              ) {
                clearInterval(previewInterval.current);
              }
            },
          },
        }
      );
    };

    // wait for API
    const waitForYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(waitForYT);

        createPlayer();
      }
    }, 300);

    return () => {
      mounted = false;

      clearInterval(waitForYT);

      clearInterval(previewInterval.current);

      if (playerInstance.current) {
        playerInstance.current.destroy();
      }
    };
  }, [tutorial.id, hasAccess, loading]);

  // ============================
  // 💳 HANDLE PAYMENT
  // ============================
  const handleBuy = async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login first");
        return;
      }

      setIsPaying(true);

      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_URL}/api/pay`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          amount: tutorial.price,
          email: auth.currentUser.email,
          tutorialId: tutorial.id,
          tutorId: tutorial.tutorId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();

        console.error(errText);

        alert("Payment failed");

        setIsPaying(false);

        return;
      }

      const data = await res.json();

      // redirect
      window.location.href = data.data.link;
    } catch (err) {
      console.error(err);

      alert("Payment failed");
    } finally {
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
      {/* ================= VIDEO ================= */}
      <div className="relative">
        <div
          ref={playerContainerRef}
          className="w-full h-55 bg-black"
        />

        {/* 🔒 PREVIEW LOCK */}
        {!hasAccess && locked && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white px-4 text-center">
            <p className="text-lg font-semibold">
              ⏱ Preview Ended
            </p>

            <p className="text-sm opacity-80 mt-1">
              Purchase this tutorial to continue watching
            </p>

            <button
              onClick={handleBuy}
              disabled={isPaying}
              className={`mt-4 px-5 py-2 rounded-xl text-white font-medium transition ${
                isPaying
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
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
            onClick={() =>
              onDelete(tutorial.id, tutorial.tutorId)
            }
            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg"
          >
            Delete
          </button>
        )}
      </div>

      {/* ================= CONTENT ================= */}
      <div className="p-4">
        <h2 className="font-semibold text-lg line-clamp-1">
          {tutorial.title}
        </h2>

        <p className="text-xs opacity-60 mt-1">
          By {tutorial.tutorName || "Unknown Tutor"}
        </p>

        <p className="text-sm opacity-70 mt-2 line-clamp-2">
          {tutorial.description}
        </p>

        <div className="mt-4">
          {hasAccess ? (
            <div className="text-green-500 font-medium text-sm">
              ✅ Purchased
            </div>
          ) : (
            <button
              onClick={handleBuy}
              disabled={isPaying}
              className={`w-full py-2 rounded-xl text-white font-medium transition ${
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