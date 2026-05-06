import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../../firebase/config";

export default function UploadTutorial({ dark }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Programming",
    videoUrl: "",
    previewUrl: ""
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.videoUrl || !form.price) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    await addDoc(collection(db, "tutorials"), {
      ...form,
      price: Number(form.price),
      tutorId: auth.currentUser.uid,
      subaccountId: "TUTOR_SUB_ID",
      createdAt: new Date()
    });

    setLoading(false);
    alert("✅ Tutorial uploaded!");

    setForm({
      title: "",
      description: "",
      price: "",
      category: "Programming",
      videoUrl: "",
      previewUrl: ""
    });
  };

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"} min-h-screen p-6`}>
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          🎬 Creator Studio
        </h1>
        <p className="opacity-70 text-sm">
          Upload and monetize your tutorials
        </p>
      </div>

      {/* MAIN CARD */}
      <div
        className={`max-w-2xl w-full mx-auto rounded-2xl p-6 shadow-xl backdrop-blur-lg ${
          dark
            ? "bg-[#1e293b]/80 border border-gray-700"
            : "bg-white border"
        }`}
      >
        {/* TITLE */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Title</label>
          <input
            value={form.title}
            placeholder="e.g. React for Beginners"
            className="input-premium"
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Description</label>
          <textarea
            value={form.description}
            placeholder="Describe your tutorial..."
            className="input-premium h-24"
            onChange={e => setForm({ ...form, description: e.target.value })}
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
              onChange={e => setForm({ ...form, price: e.target.value })}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm opacity-70">Category</label>
            <select
              value={form.category}
              className="input-premium"
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              <option>Programming</option>
              <option>Design</option>
              <option>Business</option>
            </select>
          </div>
        </div>

        {/* VIDEO URL */}
        <div className="mb-4">
          <label className="text-sm opacity-70">Full Video URL</label>
          <input
            value={form.videoUrl}
            placeholder="Vimeo / YouTube embed link"
            className="input-premium"
            onChange={e => setForm({ ...form, videoUrl: e.target.value })}
          />
        </div>

        {/* PREVIEW */}
        <div className="mb-4">
          <label className="text-sm opacity-70">
            Preview Video (30 sec)
          </label>
          <input
            value={form.previewUrl}
            placeholder="Short preview link"
            className="input-premium"
            onChange={e => setForm({ ...form, previewUrl: e.target.value })}
          />
        </div>

        {/* PREVIEW PLAYER */}
        {form.previewUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <iframe
              src={form.previewUrl}
              className="w-full h-40"
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