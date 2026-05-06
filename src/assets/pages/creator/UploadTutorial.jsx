import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../../firebase/config";

export default function UploadTutorial({ dark }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    videoUrl: "",
    previewUrl: "",
    tutorName: ""
  });

  const [loading, setLoading] = useState(false);

  // ============================
  // 🎥 FIX YOUTUBE URL
  // ============================
  const getEmbedUrl = (url) => {
    if (!url) return "";

    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1];
      return `https://www.youtube.com/embed/${id}`;
    }

    return url;
  };

  // ============================
  // ✅ VALIDATION
  // ============================
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ============================
  // 🚀 SUBMIT
  // ============================
  const handleSubmit = async () => {
    if (!form.title || !form.videoUrl || !form.price || !form.tutorName) {
      alert("Please fill all required fields");
      return;
    }

    if (!isValidUrl(form.videoUrl)) {
      alert("Invalid video URL");
      return;
    }

    if (form.previewUrl && !isValidUrl(form.previewUrl)) {
      alert("Invalid preview URL");
      return;
    }

    if (!auth.currentUser) {
      alert("You must be logged in");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "tutorials"), {
        ...form,
        videoUrl: getEmbedUrl(form.videoUrl),
        previewUrl: getEmbedUrl(form.previewUrl),
        price: Number(form.price),
        tutorId: auth.currentUser.uid,
        createdAt: new Date()
      });

      alert("✅ Tutorial uploaded!");

      setForm({
        title: "",
        description: "",
        price: "",
        category: "",
        videoUrl: "",
        previewUrl: "",
        tutorName: ""
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const previewSrc = getEmbedUrl(form.previewUrl);

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen p-6`}>
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">🎬 Creator Studio</h1>
        <p className="opacity-70 text-sm">Upload and monetize your tutorials</p>
      </div>

      {/* MAIN CARD */}
      <div
        className={`max-w-2xl w-full mx-auto rounded-2xl p-6 shadow-xl ${
          dark ? "bg-[#1e293b]/80 border border-gray-700" : "bg-white border"
        }`}
      >
        {/* TUTOR NAME */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Tutor Name</label>
          <input
            value={form.tutorName}
            placeholder="e.g. John Doe"
            className="input-premium"
            onChange={(e) => setForm({ ...form, tutorName: e.target.value })}
          />
        </div>

        {/* TITLE */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Title</label>
          <input
            value={form.title}
            placeholder="e.g. Engineering Mathematics"
            className="input-premium"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Description</label>
          <textarea
            value={form.description}
            placeholder="Describe your tutorial..."
            className="input-premium h-24"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* ROW */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* PRICE */}
          <div>
            <label className="text-sm opacity-70">Price (₦)</label>
            <input
              type="number"
              value={form.price}
              placeholder="1000"
              className="input-premium"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          {/* CATEGORY (NOW CUSTOM) */}
          <div>
            <label className="text-sm opacity-70">Category</label>
            <input
              value={form.category}
              placeholder="e.g. Programming, AI, Design"
              className="input-premium"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
        </div>

        {/* VIDEO URL */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Full Video URL</label>
          <input
            value={form.videoUrl}
            placeholder="Paste YouTube or Vimeo link"
            className="input-premium"
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
        </div>

        {/* PREVIEW */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Preview Video (optional)</label>
          <input
            value={form.previewUrl}
            placeholder="Short preview link"
            className="input-premium"
            onChange={(e) => setForm({ ...form, previewUrl: e.target.value })}
          />
        </div>

        {/* PREVIEW PLAYER */}
        {previewSrc && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <iframe
              src={previewSrc}
              className="w-full h-40"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold transition"
        >
          {loading ? "Uploading..." : "🚀 Publish Tutorial"}
        </button>
      </div>
    </div>
  );
}