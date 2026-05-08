import { useState } from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db, auth, storage } from "./../../../firebase/config";

import { useNavigate } from "react-router-dom";

export default function CreateTutorial({ dark }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const [videoUrl, setVideoUrl] = useState("");

  const [thumbnail, setThumbnail] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  // ============================
  // HANDLE CREATE
  // ============================
  const handleCreateTutorial = async (e) => {
    e.preventDefault();

    try {
      if (!auth.currentUser) {
        alert("Please login");
        return;
      }

      if (
        !title ||
        !description ||
        !category ||
        !price ||
        !videoUrl
      ) {
        alert("Fill all required fields");
        return;
      }

      setUploading(true);

      let thumbnailUrl = "";
      let pdfUrl = "";

      // ============================
      // UPLOAD THUMBNAIL
      // ============================
      if (thumbnail) {
        const thumbRef = ref(
          storage,
          `tutorial-thumbnails/${Date.now()}-${thumbnail.name}`
        );

        await uploadBytes(thumbRef, thumbnail);

        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // ============================
      // UPLOAD PDF
      // ============================
      if (pdfFile) {
        const pdfRef = ref(
          storage,
          `tutorial-pdfs/${Date.now()}-${pdfFile.name}`
        );

        await uploadBytes(pdfRef, pdfFile);

        pdfUrl = await getDownloadURL(pdfRef);
      }

      // ============================
      // SAVE FIRESTORE
      // ============================
      await addDoc(collection(db, "tutorials"), {
        title,
        description,
        category,
        price: Number(price),

        videoUrl,

        thumbnailUrl,
        pdfUrl,

        tutorId: auth.currentUser.uid,
        tutorName:
          auth.currentUser.displayName ||
          auth.currentUser.email,

        createdAt: serverTimestamp(),
      });

      alert("Tutorial uploaded successfully");

      navigate("/tutorial-marketplace");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
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
      <div
        className={`max-w-3xl mx-auto rounded-3xl p-6 shadow-lg ${
          dark
            ? "bg-[#1e293b]"
            : "bg-white"
        }`}
      >
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Upload Tutorial
          </h1>

          <p className="opacity-70 mt-2">
            Upload your course video, notes and
            tutorial details.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleCreateTutorial}
          className="space-y-5"
        >
          {/* TITLE */}
          <div>
            <label className="block mb-2 font-medium">
              Tutorial Title
            </label>

            <input
              type="text"
              placeholder="React Masterclass"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-xl outline-none border ${
                dark
                  ? "bg-[#0f172a] border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block mb-2 font-medium">
              Description
            </label>

            <textarea
              rows={5}
              placeholder="Describe your tutorial..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-xl outline-none border ${
                dark
                  ? "bg-[#0f172a] border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block mb-2 font-medium">
              Category
            </label>

            <input
              type="text"
              placeholder="Programming"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-xl outline-none border ${
                dark
                  ? "bg-[#0f172a] border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="block mb-2 font-medium">
              Price (₦)
            </label>

            <input
              type="number"
              placeholder="2000"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-xl outline-none border ${
                dark
                  ? "bg-[#0f172a] border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* VIDEO URL */}
          <div>
            <label className="block mb-2 font-medium">
              YouTube Video URL
            </label>

            <input
              type="text"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) =>
                setVideoUrl(e.target.value)
              }
              className={`w-full px-4 py-3 rounded-xl outline-none border ${
                dark
                  ? "bg-[#0f172a] border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* THUMBNAIL */}
          <div>
            <label className="block mb-2 font-medium">
              Thumbnail Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setThumbnail(e.target.files[0])
              }
              className="w-full"
            />
          </div>

          {/* PDF */}
          <div>
            <label className="block mb-2 font-medium">
              PDF Notes (Optional)
            </label>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setPdfFile(e.target.files[0])
              }
              className="w-full"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 rounded-xl text-white font-semibold transition ${
              uploading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading
              ? "Uploading Tutorial..."
              : "Upload Tutorial"}
          </button>
        </form>
      </div>
    </div>
  );
}