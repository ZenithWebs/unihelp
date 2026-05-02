import { useEffect, useState } from "react";
import {
  Newspaper,
  Bookmark,
  Search,
  TrendingUp,
  ExternalLink,
  Loader2,
  PinIcon,
} from "lucide-react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";

export default function SmartFeed({ dark }) {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [trending, setTrending] = useState([]);
const [savedPosts, setSavedPosts] = useState([]);
const [activeTag, setActiveTag] = useState("All");

  // ---------------- FETCH POSTS ----------------
  const fetchFeed = async () => {
    setLoading(true);

    const snap = await getDocs(collection(db, "feed"));

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // ---------------- FILTER ----------------
  const filtered = posts.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- BOOKMARK ----------------
  const toggleBookmark = async (id) => {
    if (!auth.currentUser) return alert("Login required");

    const refDoc = doc(db, "users", auth.currentUser.uid);

    await updateDoc(refDoc, {
      bookmarks: arrayUnion(id),
    });

    setBookmarks((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };
  const computeTrending = (posts) => {
  const sorted = [...posts].sort((a, b) => {
    const scoreA = (a.views || 0) + (a.likes || 0);
    const scoreB = (b.views || 0) + (b.likes || 0);
    return scoreB - scoreA;
  });

  setTrending(sorted.slice(0, 5)); // top 5
};

const fetchPosts = async () => {
  setLoading(true);

  const snap = await getDocs(collection(db, "smartFeed"));
  const data = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  setPosts(data);
  computeTrending(data);

  // 💾 Save locally (cache)
  localStorage.setItem("campusFeedCache", JSON.stringify(data));

  setLoading(false);
};

useEffect(() => {
  const cache = localStorage.getItem("campusFeedCache");

  if (cache) {
    const parsed = JSON.parse(cache);
    setPosts(parsed);
    computeTrending(parsed);
  }

  fetchPosts();
}, []);


const tags = ["All", "Scholarship", "Education", "Tech"];

const filteredPosts = posts.filter((post) => {
  const matchSearch =
    post.title?.toLowerCase().includes(search.toLowerCase()) ||
    post.content?.toLowerCase().includes(search.toLowerCase());

  const matchTag =
    activeTag === "All" || post.tag === activeTag;

  return matchSearch && matchTag;
});
const toggleSave = async (postId) => {
  if (!auth.currentUser) return;

  const refDoc = doc(db, "users", auth.currentUser.uid);

  await updateDoc(refDoc, {
    savedPosts: arrayUnion(postId),
  });

  setSavedPosts((prev) =>
    prev.includes(postId)
      ? prev.filter((id) => id !== postId)
      : [...prev, postId]
  );
};

  return (
    <div className={`${dark ? "bg-[#0b0f19] text-white" : "bg-gray-100"} min-h-screen py-6`}>

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500 rounded-xl text-white">
          <Newspaper />
        </div>

        <div>
          <h1 className="text-2xl font-bold">CampusFlow Smart Feed</h1>
          <p className="text-sm opacity-70">
            News, scholarships, and opportunities curated for you
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <Search size={18} />
        <input
          placeholder="Search news, scholarships..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full"
        />
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
  {tags.map((tag) => (
    <button
      key={tag}
      onClick={() => setActiveTag(tag)}
      className={`px-3 py-1 rounded-full text-sm ${
        activeTag === tag
          ? "bg-indigo-500 text-white"
          : dark
          ? "bg-gray-800"
          : "bg-gray-200"
      }`}
    >
      {tag}
    </button>
  ))}
</div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center mt-10">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {/* FEED */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((post) => (
          <div
            key={post.id}
            className={`p-4 rounded-2xl border ${
              dark ? "border-white/10 bg-white/5" : "bg-white"
            }`}
          >
            <h3 className="font-bold text-lg">{post.title}</h3>

            <p className="text-sm opacity-70 mt-2">
              {post.description?.slice(0, 120)}...
            </p>

            <div className="flex items-center justify-between mt-4">

              {/* TYPE */}
              <span className="text-xs bg-indigo-500 px-2 py-1 rounded">
                {post.type}
              </span>

              {/* TREND */}
              <div className="flex items-center gap-1 text-orange-400">
                <TrendingUp size={14} /> Trending
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-4">
              <a
                href={post.link}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white"
              >
                <ExternalLink size={16} />
                Open
              </a>

              <button
                onClick={() => toggleBookmark(post.id)}
                className="px-3 py-2 rounded-xl bg-gray-700 text-white"
              >
                <Bookmark size={16} />
              </button>

              <button onClick={() => toggleSave(post.id)}
                className="text-xs px-3 py-1 rounded bg-yellow-500 text-white">
                <PinIcon/> Save
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}