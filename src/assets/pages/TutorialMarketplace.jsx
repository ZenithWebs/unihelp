import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";

import {
  GraduationCap,
  Search,
  BookOpen,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function TutorialMarketplace({
  dark,
}) {
  const [tutorials, setTutorials] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("All");

  const [categories, setCategories] =
    useState(["All"]);

  const [loading, setLoading] =
    useState(true);

  const [purchasedIds, setPurchasedIds] =
    useState([]);

  // ============================
  // FETCH TUTORIALS
  // ============================
  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const snap = await getDocs(
          collection(db, "tutorials")
        );

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTutorials(data);
        setFiltered(data);

        const uniqueCategories = [
          "All",
          ...new Set(
            data
              .map((item) =>
                item.category?.trim()
              )
              .filter(Boolean)
          ),
        ];

        setCategories(uniqueCategories);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  // ============================
  // PURCHASES LISTENER
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "purchases"),
      where(
        "userId",
        "==",
        auth.currentUser.uid
      )
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs
        .filter(
          (doc) =>
            doc.data().status === "approved"
        )
        .map((doc) => doc.data().tutorialId);

      setPurchasedIds(ids);
    });

    return () => unsub();
  }, []);

  // ============================
  // FILTER
  // ============================
  useEffect(() => {
    let temp = [...tutorials];

    if (category !== "All") {
      temp = temp.filter(
        (item) =>
          item.category?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (search) {
      temp = temp.filter((item) =>
        item.title
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    setFiltered(temp);
  }, [search, category, tutorials]);

  // ============================
  // DELETE
  // ============================
  const handleDelete = async (
    tutorialId,
    tutorId
  ) => {
    try {
      if (
        auth.currentUser?.uid !== tutorId
      ) {
        alert(
          "You can only delete your tutorials"
        );
        return;
      }

      if (
        !window.confirm(
          "Delete tutorial permanently?"
        )
      ) {
        return;
      }

      await deleteDoc(
        doc(db, "tutorials", tutorialId)
      );

      setTutorials((prev) =>
        prev.filter(
          (item) => item.id !== tutorialId
        )
      );
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="text-blue-500" />
            Tutorial Marketplace
          </h1>

          <p className="opacity-70 mt-2">
            Discover premium tutorials from
            students and tutors.
          </p>
        </div>

        <Link
          to="/create-tutorial"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
        >
          Become a Tutor
        </Link>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* SEARCH */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-3.5 opacity-60"
            size={20}
          />

          <input
            type="text"
            placeholder="Search tutorials..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none border ${
              dark
                ? "bg-[#1e293b] border-gray-700"
                : "bg-white border-gray-300"
            }`}
          />
        </div>

        {/* CATEGORY */}
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className={`px-4 py-3 rounded-xl outline-none border ${
            dark
              ? "bg-[#1e293b] border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          {categories.map((cat) => (
            <option key={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center opacity-60">
          Loading tutorials...
        </div>
      )}

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <div className="text-center opacity-60">
          No tutorials found
        </div>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tutorial) => {
          const purchased =
            purchasedIds.includes(
              tutorial.id
            );

          return (
            <div
              key={tutorial.id}
              className={`rounded-2xl overflow-hidden shadow-lg transition hover:scale-[1.02] ${
                dark
                  ? "bg-[#1e293b]"
                  : "bg-white"
              }`}
            >
              {/* THUMBNAIL */}
              <div className="h-52 overflow-hidden relative">
                {tutorial.thumbnailUrl ? (
                  <img
                    src={
                      tutorial.thumbnailUrl
                    }
                    alt={tutorial.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    No Thumbnail
                  </div>
                )}

                {/* PURCHASED */}
                {purchased && (
                  <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                    Purchased
                  </div>
                )}

                {/* CATEGORY */}
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                  {tutorial.category}
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-5">
                <h2 className="text-xl font-bold line-clamp-1">
                  {tutorial.title}
                </h2>

                <p className="text-sm opacity-70 mt-2 line-clamp-2">
                  {tutorial.description}
                </p>

                {/* TUTOR */}
                <div className="flex items-center gap-2 mt-4 text-sm opacity-70">
                  <BookOpen size={16} />

                  {tutorial.tutorName}
                </div>

                {/* PRICE */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="text-blue-500 font-bold text-2xl">
                    ₦{tutorial.price}
                  </div>

                  <div className="text-xs opacity-60">
                    30 sec preview
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-3 mt-5">
                  {/* OPEN */}
                  <Link
                    to={`/tutorial/${tutorial.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-center"
                  >
                    Open
                  </Link>

                  {/* DELETE */}
                  {auth.currentUser?.uid ===
                    tutorial.tutorId && (
                    <button
                      onClick={() =>
                        handleDelete(
                          tutorial.id,
                          tutorial.tutorId
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-xl"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}