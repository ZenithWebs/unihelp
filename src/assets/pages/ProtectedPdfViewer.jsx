import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";

import {
  useParams,
  Navigate,
} from "react-router-dom";

import {
  Lock,
  Download,
  FileText,
} from "lucide-react";

export default function ProtectedPdfViewer({
  dark,
}) {
  const { tutorialId } = useParams();

  const [tutorial, setTutorial] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  // ============================
  // FETCH TUTORIAL
  // ============================
  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const snap = await getDoc(
          doc(
            db,
            "tutorials",
            tutorialId
          )
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
  }, [tutorialId]);

  // ============================
  // ACCESS CHECK
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

      where(
        "tutorialId",
        "==",
        tutorialId
      ),

      where(
        "status",
        "==",
        "approved"
      )
    );

    const unsub = onSnapshot(q, (snap) => {
      setHasAccess(!snap.empty);
    });

    return () => unsub();
  }, [tutorialId]);

  if (loading) {
    return (
      <div
        className={`min-h-screen md:pt-20 flex items-center justify-center ${
          dark
            ? "bg-[#0f172a] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        Loading PDF...
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

  // ============================
  // NO PDF
  // ============================
  if (!tutorial.pdfUrl) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          dark
            ? "bg-[#0f172a] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        No PDF attached
      </div>
    );
  }

  // ============================
  // BLOCK ACCESS
  // ============================
  if (!hasAccess) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-6 ${
          dark
            ? "bg-[#0f172a] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        <div
          className={`max-w-md w-full rounded-3xl p-8 text-center shadow-lg ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <Lock
            size={60}
            className="mx-auto text-red-500"
          />

          <h1 className="text-3xl font-bold mt-5">
            Access Denied
          </h1>

          <p className="opacity-70 mt-3">
            You need an approved purchase to
            access this PDF.
          </p>

          <Navigate
            to={`/tutorial/${tutorialId}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div
        className={`p-5 border-b ${
          dark
            ? "bg-[#1e293b] border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl font-bold">
              {tutorial.title}
            </h1>

            <p className="opacity-70 mt-1">
              Protected PDF Notes
            </p>
          </div>

          {/* DOWNLOAD */}
          <a
            href={tutorial.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
          >
            <Download size={20} />

            Download PDF
          </a>
        </div>
      </div>

      {/* PDF VIEWER */}
      <div className="p-5">
        <div className="max-w-7xl mx-auto">
          <div
            className={`rounded-3xl overflow-hidden shadow-lg ${
              dark
                ? "bg-[#1e293b]"
                : "bg-white"
            }`}
          >
            {/* TOP */}
            <div className="p-5 border-b flex items-center gap-3">
              <FileText className="text-blue-500" />

              <div>
                <h2 className="font-semibold">
                  PDF Viewer
                </h2>

                <p className="text-sm opacity-70">
                  Secure tutorial document
                </p>
              </div>
            </div>

            {/* IFRAME */}
            <iframe
              src={tutorial.pdfUrl}
              title="PDF Viewer"
              className="w-full h-[85vh]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}