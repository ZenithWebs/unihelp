import { PlayCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

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

const CACHE_KEY = "yt_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/* ---------------- DEBOUNCE ---------------- */
const useDebounce = (value, delay = 600) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ---------------- CACHE HELPERS ---------------- */
const getCache = () => {
  const data = localStorage.getItem(CACHE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveCache = (cache) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const isValid = (time) => Date.now() - time < CACHE_TTL;

/* ---------------- MAIN COMPONENT ---------------- */
export default function TutorialSearchPage({ dark = false }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 600);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pageToken, setPageToken] = useState("");
  const [currentVideo, setCurrentVideo] = useState(null);

  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  /* ---------------- LOAD SAVED ---------------- */
  useEffect(() => {
    const data = localStorage.getItem("unihelp_saved_videos");
    if (data) setSaved(JSON.parse(data));
  }, []);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("search_history") || "[]");
    setHistory(data);
  }, []);

  /* ---------------- SAVE HISTORY ---------------- */
  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!term) return;

    const stored = JSON.parse(localStorage.getItem("search_history") || "[]");

    const updated = [term, ...stored.filter((t) => t !== term)].slice(0, 5);

    localStorage.setItem("search_history", JSON.stringify(updated));
    setHistory(updated);
  }, [debouncedQuery]);

  /* ---------------- DEFAULT QUERY ---------------- */
  useEffect(() => {
    setQuery(DEFAULT_QUERY);
  }, []);

  /* ---------------- FETCH WITH CACHE ---------------- */
  const fetchVideos = async (reset = false) => {
    setLoading(true);

    const searchTerm =
      (debouncedQuery.trim() || DEFAULT_QUERY) +
      " tutorial education learn";

    const cache = getCache();

    // 🔥 CHECK CACHE FIRST
    if (cache[searchTerm] && isValid(cache[searchTerm].time) && !reset) {
      setResults(cache[searchTerm].data);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(
          searchTerm
        )}&pageToken=${reset ? "" : pageToken}&key=${API_KEY}`
      );

      const data = await res.json();

      if (!data.items) return;

      const vids = data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
      }));

      const newResults = reset ? vids : [...results, ...vids];

      setResults(shuffle(newResults));

      setPageToken(data.nextPageToken || "");

      // 💾 SAVE TO CACHE
      cache[searchTerm] = {
        data: newResults,
        time: Date.now(),
      };

      saveCache(cache);
    } catch (err) {
      console.error("YouTube API error:", err);
    }

    setLoading(false);
  };

  /* ---------------- RUN SEARCH ---------------- */
  useEffect(() => {
    setResults([]);
    setPageToken("");
    fetchVideos(true);
  }, [debouncedQuery]);

  /* ---------------- SAVE VIDEO ---------------- */
  const saveVideo = (video) => {
    if (saved.find((v) => v.id === video.id)) return;

    const updated = [video, ...saved];
    setSaved(updated);
    localStorage.setItem("unihelp_saved_videos", JSON.stringify(updated));
  };

  /* ---------------- REMOVE VIDEO ---------------- */
  const removeVideo = (id) => {
    const updated = saved.filter((v) => v.id !== id);
    setSaved(updated);
    localStorage.setItem("unihelp_saved_videos", JSON.stringify(updated));
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className={`w-full min-h-screen ${
        dark ? "bg-[#0b0f19] text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div
        className={`p-4 flex items-center font-bold text-lg ${
          dark ? "bg-[#111827]" : "bg-white shadow"
        }`}
      >
        <PlayCircle className="text-indigo-500 pr-1" size={35} />
        <span className="text-indigo-500">UniHelp</span> Tutorials
      </div>

      {/* SEARCH */}
      <div className="p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tutorials..."
          className={`w-full p-3 rounded-lg outline-none ${
            dark ? "bg-gray-900" : "bg-white shadow"
          }`}
        />
      </div>

      {/* HISTORY */}
      <div className="flex gap-2 flex-wrap px-4">
        {history.map((item, i) => (
          <button
            key={i}
            onClick={() => setQuery(item)}
            className={`text-xs px-2 py-1 rounded ${
              dark ? "bg-gray-800 text-white" : "bg-gray-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* PLAYER */}
      {currentVideo && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-black p-2 rounded-xl">
            <X
              onClick={() => setCurrentVideo(null)}
              size={30}
              className="text-white cursor-pointer"
            />
            <iframe
              width="360"
              height="215"
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

                <div className="text-xs opacity-60">{video.channel}</div>

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

        {/* LOAD MORE */}
        <button
          onClick={() => fetchVideos(false)}
          className="w-full mt-3 p-2 bg-indigo-600 text-white rounded"
        >
          Load More
        </button>
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