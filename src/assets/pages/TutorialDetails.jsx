import { useEffect, useRef, useState } from "react";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  db,
  auth,
  storage,
} from "../../firebase/config";

import { Link, useParams } from "react-router-dom";

import {
  BookOpen,
  Download,
  Lock,
} from "lucide-react";

export default function TutorialDetails({
  dark,
}) {
  const { id } = useParams();

  const [tutorial, setTutorial] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  const [locked, setLocked] =
    useState(false);

  const [proofImage, setProofImage] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const playerContainerRef = useRef(null);
  const playerInstance = useRef(null);
  const previewInterval = useRef(null);

  // ============================
  // FETCH TUTORIAL
  // ============================
  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const snap = await getDoc(
          doc(db, "tutorials", id)
        );

        if (snap.exists()) {
          setTutorial({
            id: snap.id,
            ...snap.data(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  // ============================
  // ACCESS LISTENER
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "userId",
        "==",
        auth.currentUser.uid
      ),
      where("tutorialId", "==", id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const approved =
        snap.docs.some(
          (doc) =>
            doc.data().status ===
            "approved"
        );

      const pending =
        snap.docs.some(
          (doc) =>
            doc.data().status ===
            "pending"
        );

      setHasAccess(approved);
      setSubmitted(pending);
    });

    return () => unsub();
  }, [id]);

  // ============================
  // GET YOUTUBE VIDEO ID
  // ============================
  const getVideoId = (url) => {
    if (!url) return null;

    try {
      if (url.includes("watch?v=")) {
        return url
          .split("watch?v=")[1]
          .split("&")[0];
      }

      if (url.includes("youtu.be/")) {
        return url
          .split("youtu.be/")[1]
          .split("?")[0];
      }

      if (url.includes("embed/")) {
        return url
          .split("embed/")[1]
          .split("?")[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  // ============================
  // LOAD YOUTUBE API
  // ============================
  useEffect(() => {
    if (window.YT?.Player) return;

    const existing = document.getElementById(
      "youtube-iframe-api"
    );

    if (!existing) {
      const tag =
        document.createElement("script");

      tag.id = "youtube-iframe-api";

      tag.src =
        "https://www.youtube.com/iframe_api";

      document.body.appendChild(tag);
    }
  }, []);

  // ============================
  // INIT PLAYER
  // ============================
  useEffect(() => {
    if (!tutorial) return;

    const videoId = getVideoId(
      tutorial.videoUrl
    );

    if (!videoId) return;

    let mounted = true;

    const initPlayer = () => {
      if (
        !mounted ||
        !window.YT?.Player ||
        !playerContainerRef.current
      ) {
        return;
      }

      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }

      playerInstance.current =
        new window.YT.Player(
          playerContainerRef.current,
          {
            height: "500",
            width: "100%",
            videoId,

            playerVars: {
              autoplay: 0,
              modestbranding: 1,
              rel: 0,
              controls: 1,
              playsinline: 1,
            },

            events: {
              onStateChange: (event) => {
                if (hasAccess) return;

                if (
                  event.data ===
                  window.YT.PlayerState
                    .PLAYING
                ) {
                  clearInterval(
                    previewInterval.current
                  );

                  previewInterval.current =
                    setInterval(() => {
                      const currentTime =
                        event.target.getCurrentTime();

                      if (
                        currentTime >= 30
                      ) {
                        event.target.pauseVideo();

                        setLocked(true);

                        clearInterval(
                          previewInterval.current
                        );
                      }
                    }, 1000);
                }

                if (
                  event.data ===
                    window.YT.PlayerState
                      .PAUSED ||
                  event.data ===
                    window.YT.PlayerState
                      .ENDED
                ) {
                  clearInterval(
                    previewInterval.current
                  );
                }
              },
            },
          }
        );
    };

    const wait = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(wait);
        initPlayer();
      }
    }, 300);

    return () => {
      mounted = false;

      clearInterval(wait);

      clearInterval(
        previewInterval.current
      );

      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [tutorial, hasAccess]);

  // ============================
  // SUBMIT PAYMENT
  // ============================
  const handlePaymentProof =
    async () => {
      try {
        if (!auth.currentUser) {
          alert("Please login");
          return;
        }

        if (!proofImage) {
          alert(
            "Upload payment screenshot"
          );
          return;
        }

        setUploading(true);

        const imageRef = ref(
          storage,
          `paymentProofs/${Date.now()}-${
            proofImage.name
          }`
        );

        await uploadBytes(
          imageRef,
          proofImage
        );

        const proofUrl =
          await getDownloadURL(imageRef);

        await addDoc(
          collection(db, "purchases"),
          {
            userId:
              auth.currentUser.uid,

            tutorialId: tutorial.id,

            tutorialTitle:
              tutorial.title,

            tutorId:
              tutorial.tutorId,

            userEmail:
              auth.currentUser.email,

            proofUrl,

            amount:
              tutorial.price,

            status: "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        setSubmitted(true);

        alert(
          "Payment submitted successfully"
        );
      } catch (err) {
        console.error(err);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };

  // ============================
  // LOADING
  // ============================
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          dark
            ? "bg-[#0f172a] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        Loading tutorial...
      </div>
    );
  }

  // ============================
  // NOT FOUND
  // ============================
  if (!tutorial) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          dark
            ? "bg-[#0f172a] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        Tutorial not found
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* TITLE */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {tutorial.title}
          </h1>

          <div className="flex items-center gap-2 mt-3 opacity-70">
            <BookOpen size={18} />

            {tutorial.tutorName}
          </div>
        </div>

        {/* VIDEO */}
        <div
          className={`rounded-3xl overflow-hidden shadow-lg ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <div className="relative">
            <div
              ref={playerContainerRef}
              className="w-full bg-black"
            />

            {!hasAccess &&
              locked && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center p-6">
                  <Lock size={50} />

                  <h2 className="text-2xl font-bold mt-4">
                    Preview Ended
                  </h2>

                  <p className="opacity-70 mt-2">
                    Purchase tutorial to
                    continue watching.
                  </p>
                </div>
              )}
          </div>

          {/* CONTENT */}
          <div className="p-6">
            {/* DESCRIPTION */}
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Description
              </h2>

              <p className="opacity-80 leading-relaxed">
                {
                  tutorial.description
                }
              </p>
            </div>

            {/* PRICE */}
            <div className="mt-8">
              <div className="text-4xl font-bold text-blue-500">
                ₦{tutorial.price}
              </div>
            </div>

            {/* PDF ACCESS */}
            {hasAccess &&
              tutorial.pdfUrl && (
                <Link to={`/pdf/${tutorial.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl"
                >
                  <Download size={20} />
                  Download PDF Notes
                </Link>
              )}

            {/* PAYMENT SECTION */}
            {!hasAccess && (
              <div className="mt-10">
                {submitted ? (
                  <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-2xl p-5">
                    Payment submitted successfully.
                    Awaiting admin approval.
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl p-6 ${
                      dark
                        ? "bg-[#0f172a]"
                        : "bg-gray-50"
                    }`}
                  >
                    <h2 className="text-2xl font-bold mb-5">
                      Manual Payment
                    </h2>

                    {/* ACCOUNT DETAILS */}
                    <div className="space-y-2 mb-6">
                      <p>
                        <strong>
                          Bank:
                        </strong>{" "}
                        Opay
                      </p>

                      <p>
                        <strong>
                          Account Name:
                        </strong>{" "}
                        Campus Flow
                      </p>

                      <p>
                        <strong>
                          Account Number:
                        </strong>{" "}
                        09012345678
                      </p>
                    </div>

                    {/* UPLOAD */}
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setProofImage(
                            e.target
                              .files[0]
                          )
                        }
                        className="w-full"
                      />

                      <button
                        onClick={
                          handlePaymentProof
                        }
                        disabled={
                          uploading
                        }
                        className={`w-full py-3 rounded-xl text-white font-semibold ${
                          uploading
                            ? "bg-gray-400"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {uploading
                          ? "Submitting..."
                          : "Submit Payment Proof"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}