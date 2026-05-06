import { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import TutorialCard from "../components/TutorialCard";
import { GraduationCapIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function TutorialMarketplace({ dark }) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [purchasedIds, setPurchasedIds] = useState([]);

  // ============================
  // 📚 FETCH TUTORIALS
  // ============================
  const fetchTutorials = async () => {
    setLoading(true);

    const snap = await getDocs(collection(db, "tutorials"));

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setTutorials(data);

    // ✅ Dynamic categories
    const uniqueCategories = [
      "All",
      ...new Set(
        data
          .map(t => t.category?.trim())
          .filter(Boolean)
      )
    ];

    setCategories(uniqueCategories);

    setLoading(false);
  };

  // ============================
  // 🔥 REAL-TIME PURCHASE LISTENER
  // ============================
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "purchases"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs.map(doc => doc.data().tutorialId);
      setPurchasedIds(ids);
    });

    return () => unsub();
  }, []);

  // ============================
  // 🔁 HANDLE PAYMENT REDIRECT
  // ============================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("status") === "successful") {
      console.log("✅ Payment successful, waiting for unlock...");
    }
  }, []);

  // ============================
  // 🚀 INITIAL LOAD
  // ============================
  useEffect(() => {
    fetchTutorials();
  }, []);

  // ============================
  // 🔍 FILTER
  // ============================
  const filtered = tutorials.filter(t => {
    const matchesCategory =
      category === "All" ||
      t.category?.toLowerCase() === category.toLowerCase();

    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ============================
  // 🗑 DELETE
  // ============================
  const handleDelete = async (id, tutorId) => {
    if (auth.currentUser?.uid !== tutorId) {
      alert("You can only delete your own tutorial");
      return;
    }

    if (!window.confirm("Delete this tutorial?")) return;

    await deleteDoc(doc(db, "tutorials", id));
    fetchTutorials();
  };

  return (
    <div
      className={`${
        dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"
      } min-h-screen w-full p-6`}
    >
      {/* HEADER LINK */}
      <Link
        to="/creatordashboard"
        className="flex justify-center items-center p-2.5 rounded-lg bg-indigo-500 text-white mb-3.5 w-44 h-10 hover:bg-indigo-400 ml-auto"
      >
        Become a Tutor
      </Link>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <h1 className="text-3xl flex gap-2 items-center font-bold">
          <GraduationCapIcon size={32} className="text-indigo-500" />
          Explore Tutorials
        </h1>

        <input
          placeholder="Search tutorials..."
          className={`px-4 py-2 rounded-xl outline-none border ${
            dark
              ? "bg-[#1e293b] border-gray-700"
              : "bg-white border-gray-300"
          }`}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1 rounded-full text-sm transition ${
              category === cat
                ? "bg-blue-600 text-white"
                : dark
                ? "bg-[#1e293b]"
                : "bg-white border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center opacity-60">
          Loading tutorials...
        </p>
      )}

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <p className="text-center opacity-60">
          No tutorials found
        </p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map(tutorial => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            purchasedIds={purchasedIds}
            dark={dark}
            onDelete={handleDelete}
            isOwner={auth.currentUser?.uid === tutorial.tutorId}
          />
        ))}
      </div>
    </div>
  );
}