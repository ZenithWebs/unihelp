import { PlayCircle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ---------------- CONFIG ---------------- */
const API_KEY = "AIzaSyAhQUd-So4kqcAMEr6lTlnly-KJdK16Nu8";
const DEFAULT_QUERIES = [
  "Use Of English",
  "Learn Video Editing",
  "How create a video animation",
  "HTML CSS tutorial",
];
const DEFAULT_QUERY =
  DEFAULT_QUERIES[new Date().getSeconds() % DEFAULT_QUERIES.length];

/* ---------------- DEBOUNCE HOOK ---------------- */
const useDebounce = (value, delay = 600) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function TutorialSearchPage({ dark = false }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 600);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [saved, setSaved] = useState([]);

  const listRef = useRef(null);

  /* -------- LOAD SAVED -------- */
  useEffect(() => {
    const data = localStorage.getItem("unihelp_saved_videos");
    if (data) setSaved(JSON.parse(data));
  }, []);

  /* -------- SEARCH YOUTUBE -------- */
useEffect(() => {
  const searchTerm = debouncedQuery.trim()
    ? debouncedQuery
    : DEFAULT_QUERY;

  const fetchVideos = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
          searchTerm
        )}&key=${API_KEY}`
      );

      const data = await res.json();

      if (!data.items) {
        console.error("YouTube API error:", data);
        return;
      }

      const vids = data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
      }));

      setResults(vids);
    } catch (err) {
      console.error("YouTube search error:", err);
    }

    setLoading(false);
  };

  fetchVideos();
}, [debouncedQuery]);

useEffect(() => {
  setQuery(DEFAULT_QUERY);
}, []);

  /* -------- SAVE VIDEO -------- */
  const saveVideo = (video) => {
    if (saved.find((v) => v.id === video.id)) return;

    const updated = [video, ...saved];
    setSaved(updated);
    localStorage.setItem("unihelp_saved_videos", JSON.stringify(updated));
  };

  /* -------- REMOVE VIDEO -------- */
  const removeVideo = (id) => {
    const updated = saved.filter((v) => v.id !== id);
    setSaved(updated);
    localStorage.setItem("unihelp_saved_videos", JSON.stringify(updated));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={`w-full min-h-screen ${dark ? "bg-[#0b0f19] text-white" : "bg-gray-100 text-black"}`}>
      
      {/* HEADER */}
      <div className={`p-4 flex items-center font-bold text-lg ${dark ? "bg-[#111827]" : "bg-white shadow"}`}>
        <PlayCircle className="text-indigo-500 pr-1" size={35}/> <span className="text-indigo-500">UniHelp</span> Tutorials
      </div>

      {/* SEARCH */}
      <div className="p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tutorials (e.g. React hooks, Node.js)..."
          className={`w-full p-3 rounded-lg outline-none ${
            dark ? "bg-gray-900" : "bg-white shadow"
          }`}
        />
      </div>

      {/* PLAYER */}
      {currentVideo && (
        <div className="px-4 max-md:h-screen bg-black/50 max-md:z-20 max-md:w-full max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:backdrop-blur-3xl max-md:top-1/2 max-md:-translate-y-1/2 flex justify-center items-center">

          <div className="rounded-xl overflow-hidden shadow-lg">
            <X onClick={(e)=>{setCurrentVideo(null)}} size={35} className="flex text-white"/>
            <iframe
              className="w-svw z-50 h-64 md:h-96"
              src={`https://www.youtube.com/embed/${currentVideo}`}
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* RESULTS */}
      <div className="p-4">
        <h2 className="font-semibold mb-2">Results</h2>

        {loading && <p className="text-sm opacity-60">Searching...</p>}

        <div className="space-y-3">
          {results.map((video) => (
            <div
              key={video.id}
              className={`flex gap-3 p-2 rounded-lg ${
                dark ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <img
                src={video.thumbnail}
                className="w-28 h-16 rounded-md cursor-pointer"
                onClick={() => setCurrentVideo(video.id)}
              />

              <div className="flex-1">
                <div
                  className="text-sm font-medium cursor-pointer"
                  onClick={() => setCurrentVideo(video.id)}
                >
                  {video.title}
                </div>

                <div className="text-xs opacity-60">
                  {video.channel}
                </div>

                <button
                  onClick={() => saveVideo(video)}
                  className="text-xs text-blue-500 mt-1"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAVED */}
      <div className="p-4">
        <h2 className="font-semibold mb-2">Saved Tutorials</h2>

        <div className="space-y-3">
          {saved.map((video) => (
            <div
              key={video.id}
              className={`flex justify-between items-center p-2 rounded-lg ${
                dark ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div
                className="flex gap-2 cursor-pointer"
                onClick={() => setCurrentVideo(video.id)}
              >
                <img
                  src={video.thumbnail}
                  className="w-20 h-12 rounded-md"
                />
                <span className="text-sm">{video.title}</span>
              </div>

              <button
                onClick={() => removeVideo(video.id)}
                className="text-red-500 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}