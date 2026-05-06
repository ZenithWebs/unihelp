import { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

import TutorialCard from "../components/TutorialCard";
import { GraduationCapIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function TutorialMarketplace({ dark }) {
  const [tutorials, setTutorials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // ============================
  // 📚 FETCH TUTORIALS
  // ============================
  const fetchTutorials = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "tutorials"));
    setTutorials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // ============================
  // 💰 FETCH USER PURCHASES (OPTIMIZED)
  // ============================
  const fetchPurchases = async () => {
    if (!auth.currentUser) return;

    const snap = await getDocs(collection(db, "purchases"));

    const userPurchases = snap.docs
      .filter(d => d.data().userId === auth.currentUser.uid)
      .map(d => d.data().tutorialId);

    setPurchases(userPurchases);
  };

  useEffect(() => {
    fetchTutorials();
    fetchPurchases();
  }, []);

  // ============================
  // 🔍 FILTERS
  // ============================
  const filtered = tutorials.filter(t =>
    (category === "All" || t.category === category) &&
    t.title?.toLowerCase().includes(search.toLowerCase())
  );

  // ============================
  // 🗑 DELETE
  // ============================
  const handleDelete = async (id, tutorId) => {
    if (auth.currentUser?.uid !== tutorId) {
      alert("You can only delete your own tutorial");
      return;
    }

    const confirmDelete = window.confirm("Delete this tutorial?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "tutorials", id));
    fetchTutorials();
  };

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen p-6`}>

      {/* HEADER LINK */}
      <Link
        to="/creatordashboard"
        className="flex justify-center items-center p-2.5 rounded-lg bg-indigo-500 text-white mb-3.5 w-40 h-10 cursor-pointer hover:bg-indigo-400 ml-auto"
      >
        Are you a Tutor?
      </Link>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <h1 className="text-3xl flex gap-1.5 items-center font-bold tracking-tight">
          <GraduationCapIcon size={35} className="text-indigo-500" />
          Explore Tutorials
        </h1>

        <input
          placeholder="Search tutorials..."
          className={`px-4 py-2 rounded-xl outline-none border ${
            dark ? "bg-[#1e293b] border-gray-700" : "bg-white border-gray-300"
          }`}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["All", "Programming", "Design", "Business"].map(cat => (
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
        <p className="text-center opacity-60">Loading tutorials...</p>
      )}

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <p className="text-center opacity-60">No tutorials found</p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map(tutorial => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            dark={dark}
            purchasedIds={purchases}   // ✅ FIXED
            onDelete={handleDelete}
            isOwner={auth.currentUser?.uid === tutorial.tutorId}
          />
        ))}
      </div>
    </div>
  );
}