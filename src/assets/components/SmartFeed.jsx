import { useEffect, useState } from "react";
import {
  Newspaper,
  Bookmark,
  Search,
  TrendingUp,
  ExternalLink,
  Loader2,
  PinIcon,
  Heart,
  X,
  NewspaperIcon,
} from "lucide-react";
import { db, auth } from "../../firebase/config";
import {
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { fetchNigeriaNews } from "../service/newsService";

export default function SmartFeed({ dark }) {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTag, setActiveTag] = useState("All");
  const [selectedPost, setSelectedPost] = useState(null);
  const [likes, setLikes] = useState({});
  const [saved, setSaved] = useState({});



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

  
const tags = [
  "All",
  "Politics",
  "Education",
  "Exams",
  "Scholarships",
  "Tech",
  "Economy",
  "Campus News"
];

const filteredPosts = posts.filter((post) => {
  const matchSearch =
    post.title?.toLowerCase().includes(search.toLowerCase()) ||
    post.description?.toLowerCase().includes(search.toLowerCase());

  const matchTag =
    activeTag === "All" || post.tag === activeTag;

  return matchSearch && matchTag;
});
const nigeriaKeywords = [
  "nigeria",
  "jamb",
  "waec",
  "neco",
  "scholarship",
  "university",
  "admission",
  "fg",
  "lagos",
  "abuja",
  "student",
  "economy",
  "president",
  "budget"
];




const getStudentTag = (text = "") => {
  const t = text.toLowerCase();

  // 🎓 EDUCATION
  if (t.includes("jamb") || t.includes("utme") || t.includes("admission"))
    return "Admissions";

  if (t.includes("waec") || t.includes("neco") || t.includes("exam"))
    return "Exams";

  if (t.includes("scholarship") || t.includes("fellowship"))
    return "Scholarships";

  if (t.includes("nysc"))
    return "NYSC";

  if (
    t.includes("university") ||
    t.includes("college") ||
    t.includes("campus") ||
    t.includes("student")
  )
    return "Campus News";

  if (t.includes("grant") || t.includes("funding"))
    return "Funding";

  // 🏛 POLITICS
  if (
    t.includes("president") ||
    t.includes("government") ||
    t.includes("minister") ||
    t.includes("senate") ||
    t.includes("policy")
  )
    return "Politics";

  // 💻 TECH
  if (
    t.includes("tech") ||
    t.includes("ai") ||
    t.includes("startup") ||
    t.includes("software") ||
    t.includes("app")
  )
    return "Tech";

  // 💰 BUSINESS
  if (
    t.includes("economy") ||
    t.includes("naira") ||
    t.includes("bank") ||
    t.includes("finance") ||
    t.includes("business")
  )
    return "Business";

  // ⚽ SPORTS
  if (
    t.includes("football") ||
    t.includes("match") ||
    t.includes("league") ||
    t.includes("sport")
  )
    return "Sports";

  return "General";
};



  useEffect(() => {
  const loadNews = async () => {
    setLoading(true);

    try {
      const data = await fetchNigeriaNews();
      const generateThumbnail = (title = "") => {
      const encoded = encodeURIComponent(title);

      return `https://source.unsplash.com/600x400/?education,university,students,${encoded}`;
    };
      const formatted = data.map((item, index) => ({
        id: item.id || index,
        title: item.title,
        description: item.description,
        link: item.link,
        image: item.image || generateThumbnail(item.title),
        //type: "Education",
        tag: getStudentTag(item.title + " " + item.description),
      }));
      setPosts(formatted);
      computeTrending(formatted);

      localStorage.setItem(
        "campusFeedCache",
        JSON.stringify(formatted)
      );
    } catch (err) {
      console.error("Failed to load education news", err);
    }

    setLoading(false);
  };

  loadNews();
}, []);
const toggleLike = (id) => {
  setLikes((prev) => ({
    ...prev,
    [id]: prev[id] ? prev[id] - 1 : 1,
  }));
};

const toggleSave = (id) => {
  setSaved((prev) => ({
    ...prev,
    [id]: !prev[id],
  }));
};



const rankedPosts = [...filteredPosts].sort((a, b) => {
  const scoreA =
    (likes[a.id] || 0) * 2 +
    (saved[a.id] ? 3 : 0);

  const scoreB =
    (likes[b.id] || 0) * 2 +
    (saved[b.id] ? 3 : 0);

  return scoreB - scoreA;
});




  return (
    <div className={`${dark ? "bg-[#0b0f19] text-white" : "bg-gray-100"} min-h-screen py-6`}>

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500 rounded-xl text-white">
          <Newspaper />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Smart Feed</h1>
          <p className="text-sm opacity-70">
            News, techs and opportunities curated for you
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <Search size={18} />
        <input
          placeholder="Search news, techs..."
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
          <NewspaperIcon className="animate-bounce" />
        </div>
      )}

      {/* FEED */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 mt-5 gap-4">
        {rankedPosts.map((post) => (
          <div onClick={() => setSelectedPost(post)} className="cursor-pointer"  key={post.id}>
    <div
      
      className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        dark
          ? "border-white/10 bg-linear-to-b from-white/5 to-white/0"
          : "border-gray-200 bg-white"
      }`}
    >
    {/* IMAGE */}
    <div className="relative w-full h-44 overflow-hidden">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

      {/* TAG */}
      <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-indigo-500 text-white">
        {post.tag}
      </span>
    </div>

    {/* CONTENT */}
    <div className="p-4">
      <h3 className="font-bold text-lg leading-snug line-clamp-2">
        {post.title}
      </h3>

      <p className="text-sm mt-2 opacity-70 line-clamp-3">
        {post.description}
      </p>

      {/* META */}
      <div className="flex items-center justify-between mt-4 text-xs opacity-80">
        <span className="flex items-center gap-1">
          <TrendingUp size={14} className="text-orange-400" />
          Trending
        </span>

        <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
          {post.type}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-4">
        <a
          href={post.link}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <ExternalLink size={16} />
          Open
        </a>

        <button onClick={(e) => {
          e.stopPropagation();
          toggleLike(post.id);
        }}>
          <Heart
            fill={likes[post.id] ? "red" : "none"}
            size={24}/>
          {likes[post.id] || 0}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(post.id);
          }}>
          <PinIcon
            size={24}
            fill={saved[post.id] ? "orange" : "none"}/>
        </button>
      </div>
      </div>
    </div>
  </div>
))}
      </div>
      {selectedPost && (
  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
    
    <div className="w-full max-w-2xl bg-white text-black rounded-2xl overflow-hidden relative">

      {/* CLOSE */}
      <button
        onClick={() => setSelectedPost(null)}
        className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full"
      >
        <X size={30}/>
      </button>

      {/* IMAGE */}
      <img
        src={selectedPost.image}
        className="w-full h-60 object-cover"
      />

      {/* CONTENT */}
      <div className="p-4">
        <h2 className="text-xl font-bold">
          {selectedPost.title}
        </h2>

        <p className="mt-3 text-sm text-gray-700">
          {selectedPost.description}
        </p>

        {/* ACTIONS */}
        <div className="flex gap-2 mt-5">
          <a
            href={selectedPost.link}
            target="_blank"
            className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-center"
          >
            Open Source
          </a>

          <div className="flex items-center gap-3 mt-3 text-sm">

            <button onClick={(e) => {
                e.stopPropagation();
                toggleLike(post.id);
              }}>
              <Heart
                fill={likes[post.id] ? "red" : "none"}
                size={24}/>
              {likes[post.id] || 0}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSave(post.id);
              }}>
              <PinIcon
                size={24}
                fill={saved[post.id] ? "orange" : "none"}/>
            </button>

          </div>
        </div>
      </div>
    </div>

  </div>
)}
    </div>
  );
}