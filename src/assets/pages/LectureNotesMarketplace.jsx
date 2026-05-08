import { useEffect, useState } from "react";

import {
  Upload,
  Download,
  Star,
  MessageSquare,
  Search,
  X,
  Loader2,
  FileText,
  Sparkles,
  Bell,
  HelpCircle,
  Send,
} from "lucide-react";

import { getAuth, onAuthStateChanged } from "firebase/auth";

import { db, storage } from "../../firebase/config";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

export default function LectureNotesMarketplace({
  dark,
}) {
  /* =========================================================
     STATES
  ========================================================= */

  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [requestText, setRequestText] =
    useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [showUpload, setShowUpload] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [notifications, setNotifications] =
    useState([]);

  const [showMessage, setShowMessage] =
    useState(false);

  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    title: "",
    course: "",
    dept: "",
    lecturer: "",
    school: "",
  });

  const auth = getAuth();

  const [currentUser, setCurrentUser] =
    useState(null);

  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     FETCH NOTES
  ========================================================= */

  const fetchNotes = async () => {
    setLoading(true);

    const snap = await getDocs(
      collection(db, "notes")
    );

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setNotes(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  /* =========================================================
     FILTER NOTES
  ========================================================= */

  const filtered = notes.filter(
    (n) =>
      n.title
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      n.course
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      n.dept
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    setUploading(true);

    try {
      const storageRef = ref(
        storage,
        `notes/${Date.now()}-${file.name}`
      );

      const uploadTask =
        uploadBytesResumable(
          storageRef,
          file
        );

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent =
            (snapshot.bytesTransferred /
              snapshot.totalBytes) *
            100;

          setProgress(Math.round(percent));
        },

        console.error,

        async () => {
          const url = await getDownloadURL(
            uploadTask.snapshot.ref
          );

          await addDoc(
            collection(db, "notes"),
            {
              ...form,
              fileUrl: url,
              fileName: file.name,
              downloads: 0,
              rating: 0,
              createdAt: serverTimestamp(),
            }
          );

          const requestsSnap =
            await getDocs(
              collection(db, "requests")
            );

          requestsSnap.forEach(async (r) => {
            const req = r.data();

            const isMatch =
              req.status === "open" &&
              (req.text
                .toLowerCase()
                .includes(
                  form.course.toLowerCase()
                ) ||
                req.text
                  .toLowerCase()
                  .includes(
                    form.title.toLowerCase()
                  ));

            if (isMatch) {
              await updateDoc(
                doc(db, "requests", r.id),
                {
                  status: "fulfilled",
                }
              );

              await addDoc(
                collection(
                  db,
                  "notifications"
                ),
                {
                  userId: req.userId,
                  message: `Your requested ${form.course} note is now available 🎉`,
                  read: false,
                  createdAt:
                    serverTimestamp(),
                }
              );
            }
          });

          setUploading(false);

          setShowUpload(false);

          setFile(null);

          setProgress(0);

          setForm({
            title: "",
            course: "",
            dept: "",
            lecturer: "",
            school: "",
          });

          fetchNotes();
        }
      );
    } catch (err) {
      console.log(err);

      setUploading(false);
    }
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where(
        "userId",
        "==",
        currentUser.uid
      ),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setNotifications(data);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  /* =========================================================
     DOWNLOAD
  ========================================================= */

  const handleDownload = async (note) => {
    window.open(note.fileUrl, "_blank");

    try {
      await updateDoc(
        doc(db, "notes", note.id),
        {
          downloads: increment(1),
        }
      );

      fetchNotes();
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================================================
     RATE NOTE
  ========================================================= */

  const rateNote = async (
    noteId,
    value
  ) => {
    await updateDoc(doc(db, "notes", noteId), {
      rating: value,
    });

    fetchNotes();
  };

  /* =========================================================
     EXTRACT COURSE
  ========================================================= */

  const extractCourse = (text) => {
    const match = text.match(
      /[A-Z]{3}\d{3}/i
    );

    return match
      ? match[0].toUpperCase()
      : "";
  };

  /* =========================================================
     REQUEST NOTE
  ========================================================= */

  const submitRequest = async () => {
    if (!requestText) return;

    const courseCode =
      extractCourse(requestText);

    await addDoc(collection(db, "requests"), {
      text: requestText,
      course: courseCode || null,
      userId: currentUser?.uid,
      status: "open",
      createdAt: serverTimestamp(),
    });

    setRequestText("");

    alert("Request submitted 🚀");
  };

  /* =========================================================
     REQUESTS LISTENER
  ========================================================= */

  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setRequests(data);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     MARK AS READ
  ========================================================= */

  const markAsRead = async (id) => {
    await updateDoc(
      doc(db, "notifications", id),
      {
        read: true,
      }
    );
  };

  return (
  <div
    className={`min-h-screen w-full overflow-hidden ${
      dark
        ? "bg-[#070b14] text-white"
        : "bg-[#f4f7fb] text-black"
    }`}
    style={{
      backgroundImage:
        "radial-gradient(circle at top, rgba(99,102,241,0.15), transparent 30%)",
    }}
  >
    {/* =========================================================
       MAIN CONTAINER
    ========================================================= */}

    <div className="w-full max-w-450 mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
      {/* =========================================================
         TOP HEADER
      ========================================================= */}

      <div
        className={`glass sticky top-0 z-20 mb-5 rounded-3xl border shadow-xl ${
          dark
            ? "bg-[#111827]/80 border-white/10"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between p-4 sm:p-6">
          {/* LEFT */}

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <FileText
                size={30}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                Lecture Notes Marketplace
              </h1>

              <p className="text-xs sm:text-sm opacity-70 mt-1">
                Upload, search and download
                lecture notes from students
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* SEARCH */}

            <div
              className={`hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl flex-1 min-w-[280px] ${
                dark
                  ? "bg-white/5"
                  : "bg-gray-100"
              }`}
            >
              <Search
                size={18}
                className="opacity-60"
              />

              <input
                placeholder="Search notes..."
                className="bg-transparent outline-none w-full placeholder:text-slate-400"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            {/* NOTIFICATIONS */}

            <div className="relative">
              <button
                onClick={() =>
                  setShowMessage(!showMessage)
                }
                className={`relative h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                  dark
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <Bell size={20} />

                {notifications.filter(
                  (n) => !n.read
                ).length > 0 && (
                  <span className="absolute top-1 right-1 min-w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                    {
                      notifications.filter(
                        (n) => !n.read
                      ).length
                    }
                  </span>
                )}
              </button>

              {/* DROPDOWN */}

              <div
                className={`absolute max-md:left-0 md:right-0 mt-3 w-[320px] sm:w-95 max-w-[95vw] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
                  showMessage
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2"
                } ${
                  dark
                    ? "bg-[#111827]"
                    : "bg-white"
                }`}
              >
                <div className="p-4 border-b border-white/10 font-semibold">
                  Notifications
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-sm opacity-70">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          setShowMessage(false);
                        }}
                        className={`p-4 text-sm border-b cursor-pointer transition ${
                          dark
                            ? "hover:bg-white/5 border-white/5"
                            : "hover:bg-gray-50 border-gray-100"
                        }`}
                      >
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* UPLOAD */}

            <button
              onClick={() =>
                setShowUpload(true)
              }
              className="h-12 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Upload size={18} />

              <span className="hidden sm:block">
                Upload
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH */}

        <div className="px-4 pb-4 md:hidden">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
              dark
                ? "bg-white/5"
                : "bg-gray-100"
            }`}
          >
            <Search
              size={18}
              className="opacity-60"
            />

            <input
              placeholder="Search notes..."
              className="bg-transparent outline-none w-full placeholder:text-slate-400"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* =========================================================
         MAIN GRID
      ========================================================= */}

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_380px] gap-6">
        {/* =========================================================
           NOTES SECTION
        ========================================================= */}

        <div>
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className={`rounded-3xl p-10 text-center border ${
                dark
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              <Sparkles
                size={42}
                className="mx-auto mb-4 opacity-60"
              />

              <h2 className="text-lg font-semibold">
                No lecture notes found
              </h2>

              <p className="text-sm opacity-60 mt-2">
                Try another search keyword
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((note) => (
                <div
                  key={note.id}
                  className={`animate-fadeUp rounded-[28px] p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    dark
                      ? "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                      : "bg-white border-gray-200 hover:shadow-indigo-100"
                  }`}
                >
                  {/* TOP */}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="font-bold text-lg leading-snug">
                        {note.title}
                      </h2>

                      <p className="text-sm opacity-70 mt-2">
                        {note.course} •{" "}
                        {note.dept}
                      </p>

                      <p className="text-xs opacity-60 mt-1">
                        {note.school}
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-medium">
                      PDF
                    </div>
                  </div>

                  {/* STATS */}

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-1 text-sm">
                      <Star
                        size={16}
                        className="text-yellow-400 fill-yellow-400"
                      />

                      {note.rating || 0}
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <Download size={16} />

                      {note.downloads || 0}
                    </div>
                  </div>

                  {/* DOWNLOAD */}

                  <button
                    onClick={() =>
                      handleDownload(note)
                    }
                    className="mt-5 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Download size={16} />
                    Download
                  </button>

                  {/* RATING */}

                  <div className="flex justify-center gap-2 mt-5">
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <button
                          key={star}
                          onClick={() =>
                            rateNote(
                              note.id,
                              star
                            )
                          }
                          className="hover:scale-125 transition"
                        >
                          <Star
                            size={18}
                            className="text-yellow-400"
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================
           SIDEBAR
        ========================================================= */}

        <div className="w-full">
          <div
            className={`2xl:sticky 2xl:top-28 rounded-[28px] border p-5 ${
              dark
                ? "bg-white/5 border-white/10"
                : "bg-white border-gray-200"
            }`}
          >
            {/* TITLE */}

            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center text-white">
                <HelpCircle size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-lg">
                  Request Notes
                </h2>

                <p className="text-xs opacity-60">
                  Ask students for notes
                </p>
              </div>
            </div>

            {/* TEXTAREA */}

            <textarea
              value={requestText}
              onChange={(e) =>
                setRequestText(
                  e.target.value
                )
              }
              placeholder="Need CSC301 Data Structures notes..."
              className={`w-full min-h-30 resize-none rounded-2xl p-4 outline-none ${
                dark
                  ? "bg-[#111827]"
                  : "bg-gray-100"
              }`}
            />

            {/* BUTTON */}

            <button
              onClick={submitRequest}
              className="mt-4 w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Send size={16} />
              Submit Request
            </button>

            {/* RECENT REQUESTS */}

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={18} />

                <h3 className="font-semibold">
                  Recent Requests
                </h3>
              </div>

              {requests.length === 0 ? (
                <p className="text-sm opacity-70">
                  No requests yet
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className={`rounded-2xl border p-4 ${
                        dark
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {req.text}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <span
                          className={`text-[11px] px-3 py-1 rounded-full ${
                            req.status ===
                            "fulfilled"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {req.status}
                        </span>

                        <p className="text-[11px] opacity-60">
                          {req.createdAt
                            ?.toDate
                            ? req.createdAt
                                .toDate()
                                .toLocaleDateString()
                            : "Now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* =========================================================
       UPLOAD MODAL
    ========================================================= */}

    {showUpload && (
      <div className="fixed inset-0 z-501 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div
          className={`w-full max-w-xl rounded-[30px] overflow-hidden shadow-2xl animate-fadeUp ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          {/* HEADER */}

          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="font-bold text-xl">
                Upload Lecture Note
              </h2>

              <p className="text-sm opacity-60 mt-1">
                Share notes with students
              </p>
            </div>

            <button
              onClick={() =>
                setShowUpload(false)
              }
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* BODY */}

          <div className="px-6 space-y-4">
            {[
              {
                placeholder: "Note Title",
                key: "title",
              },
              {
                placeholder: "Course Code",
                key: "course",
              },
              {
                placeholder: "Department",
                key: "dept",
              },
              {
                placeholder: "School",
                key: "school",
              },
            ].map((item) => (
              <input
                key={item.key}
                placeholder={item.placeholder}
                value={form[item.key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [item.key]:
                      e.target.value,
                  })
                }
                className={`w-full h-14 rounded-2xl px-4 outline-none ${
                  dark
                    ? "bg-[#1f2937]"
                    : "bg-gray-100"
                }`}
              />
            ))}

            {/* FILE */}

            <label
              className={`w-full min-h-30 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                dark
                  ? "border-white/10 hover:bg-white/5"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Upload
                size={34}
                className="opacity-60 mb-3"
              />

              <p className="font-medium">
                Click to upload file
              </p>

              <p className="text-xs opacity-60 mt-1">
                PDF, DOC, PPT
              </p>

              <input
                type="file"
                hidden
                onChange={(e) =>
                  setFile(
                    e.target.files[0]
                  )
                }
              />
            </label>

            {file && (
              <div
                className={`p-2 rounded-2xl text-sm ${
                  dark
                    ? "bg-white/5"
                    : "bg-gray-100"
                }`}
              >
                {file.name}
              </div>
            )}

            {/* PROGRESS */}

            {uploading && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    Uploading...
                  </span>

                  <span>
                    {progress}%
                  </span>
                </div>

                <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${progress}%`,
                    }}
                    className="h-full bg-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* BUTTON */}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-all active:scale-[0.98] mb-3"
            >
              {uploading
                ? "Uploading..."
                : "Upload Note"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}