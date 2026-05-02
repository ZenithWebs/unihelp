import { FileUpIcon, Plus, X, AlertCircle, UploadCloud } from "lucide-react";
import { useState } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { storage, db, auth } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function UploadFile({ dark }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    school: "",
    title: "",
    courseCode: "",
    year: "",
    department: "",
  });

  const navigate = useNavigate();
  const MAX_SIZE = 3 * 1024 * 1024;

  // -----------------------------
  // VALIDATION
  // -----------------------------
  const validateFile = (file) => {
    if (file.size > MAX_SIZE) {
      setError(`${file.name} is too large (Max 3MB)`);
      return false;
    }
    return true;
  };

  const isFormValid = () => {
    return (
      form.school &&
      form.title &&
      form.courseCode &&
      form.year &&
      form.department &&
      files.length > 0
    );
  };

  // -----------------------------
  // FILE HANDLING
  // -----------------------------
  const handleFiles = (fileList) => {
    const arr = Array.from(fileList);

    const validFiles = arr.filter(validateFile);

    if (validFiles.length !== arr.length) return;

    setFiles((prev) => [...prev, ...validFiles]);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));

    setProgress((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  // -----------------------------
  // UPLOAD
  // -----------------------------
  const handleUpload = async () => {
    if (!auth.currentUser) {
      setError("⚠️ Please login first");
      return;
    }

    if (!isFormValid()) {
      setError("⚠️ Please fill all fields and add at least one file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedFiles = [];

      for (let file of files) {
        const storageRef = ref(
          storage,
          `questions/${auth.currentUser.uid}/${Date.now()}-${file.name}`
        );

        const uploadTask = uploadBytesResumable(storageRef, file);

        const fileData = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const percent =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

              setProgress((prev) => ({
                ...prev,
                [file.name]: Math.round(percent),
              }));
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);

              resolve({
                name: file.name,
                url,
                size: file.size,
                type: file.type,
              });
            }
          );
        });

        uploadedFiles.push(fileData);
      }

      await addDoc(collection(db, "questions"), {
        ...form,
        files: uploadedFiles,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });

      navigate("/questions");
    } catch (err) {
      console.log(err);
      setError("❌ Upload failed. Try again.");
    }

    setUploading(false);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Upload Past Questions</h1>
          <p className="text-sm opacity-70">
            Share materials with other students 📚
          </p>
        </div>

        {/* FORM */}
        <div className={`p-5 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UploadCloud size={18} /> Document Details
          </h2>

          <div className="grid gap-3">
            {["school", "title", "courseCode", "year", "department"].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  value={form[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className={`p-3 rounded border ${
                    dark
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              )
            )}
          </div>
        </div>

        {/* DROP ZONE */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragActive ? "border-indigo-500 scale-105" : "border-gray-400"
          } ${dark ? "bg-[#111827]" : "bg-white"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="fileInput"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <label htmlFor="fileInput" className="cursor-pointer">
            <Plus size={30} className="mx-auto mb-2" />
            <p className="text-sm">
              Drag & Drop files or click to upload
            </p>
            <p className="text-xs opacity-60 mt-1">
              Max size: 3MB per file
            </p>
          </label>
        </div>
                {/* FILE PREVIEW */}
        {files.length > 0 && (
          <div className={`p-5 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileUpIcon size={18} /> Selected Files ({files.length})
              </h2>

              <button
                onClick={() => {
                  setFiles([]);
                  setProgress({});
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`p-3 rounded-lg flex flex-col gap-2 ${
                    dark ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  {/* FILE HEADER */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileUpIcon className="text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs opacity-60">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button onClick={() => handleDelete(file.name)}>
                      <X className="text-red-500 hover:scale-110 transition" />
                    </button>
                  </div>

                  {/* PROGRESS */}
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{
                        width: `${progress[file.name] || 0}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-right opacity-60">
                    {progress[file.name] || 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* UPLOAD BUTTON */}
        <div className="text-center">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Now"}
          </button>

          {/* SUCCESS NOTE */}
          {!uploading && files.length === 0 && (
            <p className="text-xs opacity-60 mt-2">
              Files will be uploaded and visible to other users
            </p>
          )}
        </div>

      </div>
    </div>
  );
}