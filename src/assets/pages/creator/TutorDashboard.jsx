import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "./../../../firebase/config";

import { Link } from "react-router-dom";

import {
  BookOpen,
  Trash2,
  Eye,
  PlusCircle,
  Wallet,
} from "lucide-react";

export default function TutorDashboard({ dark }) {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTutorials: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  // ============================
  // FETCH TUTORIALS
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "tutorials"),
      where(
        "tutorId",
        "==",
        auth.currentUser.uid
      )
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTutorials(data);

      setStats((prev) => ({
        ...prev,
        totalTutorials: data.length,
      }));

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ============================
  // FETCH SALES
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "tutorId",
        "==",
        auth.currentUser.uid
      ),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(q, (snap) => {
      const purchases = snap.docs.map((doc) =>
        doc.data()
      );

      const revenue = purchases.reduce(
        (acc, item) => acc + (item.amount || 0),
        0
      );

      setStats((prev) => ({
        ...prev,
        totalSales: purchases.length,
        totalRevenue: revenue,
      }));
    });

    return () => unsub();
  }, []);

  // ============================
  // DELETE TUTORIAL
  // ============================
  const handleDelete = async (id) => {
    try {
      if (
        !window.confirm(
          "Delete this tutorial permanently?"
        )
      ) {
        return;
      }

      await deleteDoc(doc(db, "tutorials", id));

      alert("Tutorial deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div
      className={`min-h-screen md:pt-20 p-6 ${
        dark
          ? "bg-[#0f172a] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Tutor Dashboard
          </h1>

          <p className="opacity-70 mt-1">
            Manage your tutorials and track
            earnings
          </p>
        </div>

        <Link
          to="/create-tutorial"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
        >
          <PlusCircle size={20} />
          Upload Tutorial
        </Link>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {/* TOTAL TUTORIALS */}
        <div
          className={`rounded-2xl p-5 shadow-md ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-70 text-sm">
                Total Tutorials
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {stats.totalTutorials}
              </h2>
            </div>

            <BookOpen
              size={35}
              className="text-blue-500"
            />
          </div>
        </div>

        {/* SALES */}
        <div
          className={`rounded-2xl p-5 shadow-md ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-70 text-sm">
                Total Sales
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {stats.totalSales}
              </h2>
            </div>

            <Eye
              size={35}
              className="text-green-500"
            />
          </div>
        </div>

        {/* REVENUE */}
        <div
          className={`rounded-2xl p-5 shadow-md ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-70 text-sm">
                Total Revenue
              </p>

              <h2 className="text-3xl font-bold mt-2">
                ₦{stats.totalRevenue}
              </h2>
            </div>

            <Wallet
              size={35}
              className="text-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center opacity-60">
          Loading tutorials...
        </div>
      )}

      {/* EMPTY */}
      {!loading && tutorials.length === 0 && (
        <div
          className={`rounded-2xl p-10 text-center ${
            dark
              ? "bg-[#1e293b]"
              : "bg-white"
          }`}
        >
          <h2 className="text-2xl font-bold mb-3">
            No Tutorials Yet
          </h2>

          <p className="opacity-70 mb-5">
            Upload your first tutorial and start
            earning.
          </p>

          <Link
            to="/create-tutorial"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
          >
            Upload Tutorial
          </Link>
        </div>
      )}

      {/* TUTORIAL LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className={`rounded-2xl overflow-hidden shadow-md ${
              dark
                ? "bg-[#1e293b]"
                : "bg-white"
            }`}
          >
            {/* THUMBNAIL */}
            <div className="h-52 bg-gray-200 overflow-hidden">
              {tutorial.thumbnailUrl ? (
                <img
                  src={tutorial.thumbnailUrl}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  No Thumbnail
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-5">
              <h2 className="text-xl font-semibold line-clamp-1">
                {tutorial.title}
              </h2>

              <p className="text-sm opacity-70 mt-2 line-clamp-2">
                {tutorial.description}
              </p>

              <div className="flex items-center justify-between mt-4">
                <div className="text-blue-500 font-bold text-lg">
                  ₦{tutorial.price}
                </div>

                <div className="text-xs opacity-60">
                  {tutorial.category}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 mt-5">
                {/* VIEW */}
                <a
                  href={tutorial.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl"
                >
                  <Eye size={18} />
                  View
                </a>

                {/* DELETE */}
                <button
                  onClick={() =>
                    handleDelete(tutorial.id)
                  }
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}