import { useEffect, useState } from "react";
import {
  Upload,
  Download,
  Star,
  MessageSquare,
  Search,
  PlusCircle,
  X,
  Loader2,
  FileText,
  Sparkles,
  Bell,
  HelpCircle,
} from "lucide-react";
import { getAuth } from "firebase/auth";

import { db, storage } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, query, where, orderBy } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { Link } from "react-router-dom";

export default function LectureNotesMarketplace({ dark }) {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [requestText, setRequestText] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showMessage, setShowMessage] = useState(false)
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    course: "",
    dept: "",
    lecturer: "",
    school: "",
  });
    const auth = getAuth();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });

      return () => unsubscribe();
    }, []);


  const fetchNotes = async () => {
    setLoading(true);

    const snap = await getDocs(collection(db, "notes"));

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

  const filtered = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.course?.toLowerCase().includes(search.toLowerCase()) ||
      n.dept?.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- UPLOAD ----------------
  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    setUploading(true);

    try {
      const storageRef = ref(
        storage,
        `notes/${Date.now()}-${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(percent));
        },
        console.error,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, "notes"), {
            ...form,
            fileUrl: url,
            fileName: file.name,
            downloads: 0,
            rating: 0,
            createdAt: serverTimestamp(),
          })

          const requestsSnap = await getDocs(collection(db, "requests"));

          requestsSnap.forEach(async (r) => {
            const req = r.data();

            const isMatch =
              req.status === "open" &&
              (
                req.text.toLowerCase().includes(form.course.toLowerCase()) ||
                req.text.toLowerCase().includes(form.title.toLowerCase())
              );

            if (isMatch) {
              await updateDoc(doc(db, "requests", r.id), {
                status: "fulfilled",
              });

              await addDoc(collection(db, "notifications"), {
                userId: req.userId,
                message: `Your requested ${form.course} note is now available 🎉`,
                noteId: r.id,
                read: false,
                createdAt: serverTimestamp(),
              });
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


  useEffect(() => {
  if (!currentUser) return;

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setNotifications(data);
  });

  return () => unsubscribe();
}, [currentUser]);



  const handleDownload = async (note) => {
    window.open(note.fileUrl, "_blank");

    try {
      await updateDoc(doc(db, "notes", note.id), {
        downloads: increment(1),
      });

      fetchNotes();
    } catch (err) {
      console.log(err);
    }
  };

  const rateNote = async (noteId, value) => {
    await updateDoc(doc(db, "notes", noteId), {
      rating: value,
    });

    fetchNotes();
  };

  
  const extractCourse = (text) => {
  const match = text.match(/[A-Z]{3}\d{3}/i);
  return match ? match[0].toUpperCase() : "";
  };
  
  const submitRequest = async () => {
  if (!requestText) return;

  const courseCode = extractCourse(requestText);

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


  useEffect(() => {
  const q = query(
    collection(db, "requests"),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setRequests(data);
  });

  return () => unsubscribe();
}, []);

 const markAsRead = async (id) => {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 p-6 gap-5">
     <div className={`col-span-2 ${dark ? "bg-[#0b0f19] text-white" : "bg-gray-100 text-black"} min-h-screen w-full `}>

      <div className="flex flex-col-reverse md:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500 rounded-xl text-white">
            <FileText />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Lecture Notes</h1>
            <p className="text-sm opacity-70">
              Upload, discover and download notes from students
            </p>
          </div>
        </div>

        <div className="flex max-md:w-full gap-2 justify-between items-center">
          
            <a href='#request' className="md:hidden flex justify-center items-center bg-green-500 text-white h-10 w-40 rounded-lg gap-1.5"><HelpCircle/> Requests </a>

          <div className="flex ml-auto gap-2.5 items-center">
            <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-indigo-500 px-4 py-2 rounded-xl text-white hover:bg-indigo-600 transition">
            <Upload size={18} /> Upload
          </button>

          <div className="relative cursor-pointer" onClick={()=> setShowMessage(!showMessage)}>
          <Bell/>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
            <div className={`absolute right-0 mt-2 w-72 ${dark ? 'bg-slate-600' : 'bg-white'}  rounded-xl shadow-lg p-3 ${showMessage ? 'flex flex-col' : 'hidden'}`}>
              {notifications.length === 0 ? (
                <p className="text-sm">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      setShowMessage(false); }}
                  className={`p-2 border-b text-sm cursor-pointer  ${dark ? "hover:bg-slate-600" : 'hover:bg-slate-100'}`}>
                    {n.message}
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
 
          
          
          
          </div>
        
        
      </div>

      {/* SEARCH */}
      <div className={`mt-6 flex items-center gap-2 p-3 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <Search size={18} />
        <input
          placeholder="Search notes, course, department..."
          className={`bg-transparent placeholder:text-slate-400  outline-none w-full`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* NOTES GRID */}
      {loading ? (
        <div className="flex justify-center mt-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center mt-16 opacity-70">
          <Sparkles className="mx-auto mb-3" />
          <p>No notes found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-xl border ${
                dark ? "border-white/10 bg-white/5" : "bg-white"
              }`}
            >
              <h3 className="font-bold text-lg">{note.title}</h3>

              <p className="text-sm opacity-70">
                {note.course} • {note.dept}
              </p>

              <p className="text-xs opacity-60">
                {note.school}
              </p>

              <div className="flex justify-between mt-3 text-sm">
                <span>⭐ {note.rating || 0}</span>
                <span>⬇ {note.downloads || 0}</span>
              </div>

              <button
                onClick={() => handleDownload(note)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={16} className="inline mr-1" />
                Download
              </button>

              {/* RATING */}
              <div className="flex gap-1 mt-3">
                {[1,2,3,4,5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    onClick={() => rateNote(note.id, star)}
                    className="cursor-pointer text-yellow-400"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className={`w-[90%] md:w-105 p-6 rounded-2xl ${dark ? "bg-[#111827]" : "bg-white"}`}>

            <div className="flex justify-between mb-4">
              <h2 className="font-bold flex gap-2 items-center">
                <Upload size={18} /> Upload Note
              </h2>

              <X
                onClick={() => setShowUpload(false)}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <input placeholder="Title"
                onChange={(e)=>setForm({...form,title:e.target.value})}
                className="w-full p-3 rounded border" />

              <input placeholder="Course Code"
                onChange={(e)=>setForm({...form,course:e.target.value})}
                className="w-full p-3 rounded border" />

              <input placeholder="Department"
                onChange={(e)=>setForm({...form,dept:e.target.value})}
                className="w-full p-3 rounded border" />

              <input placeholder="School"
                onChange={(e)=>setForm({...form,school:e.target.value})}
                className="w-full p-3 rounded border" />

              <input type="file"
                onChange={(e)=>setFile(e.target.files[0])}
              />
            </div>

            {uploading && (
              <div className="mt-3 text-sm">
                Uploading... {progress}%
              </div>
            )}

            <button
              onClick={handleUpload}
              className="w-full mt-4 bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-600"
            >
              Upload Note
            </button>
          </div>
        </div>
      )}
    </div> 


    <div id="request" className={`mt-6 p-4 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={18} />
          <h2 className="font-semibold">Request Notes</h2>
        </div>

        <textarea
          className={`w-full p-3 rounded ${dark ? 'bg-slate-700' : 'bg-slate-200'}  placeholder:text-slate-400`}
          placeholder="E.g. Need CSC301 Data Structures notes..."
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
        />

        <button
          onClick={submitRequest}
          className="mt-3 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
        >
          Submit Request
        </button>
        {/* REQUESTS LIST */}
      <div className={`mt-6 p-4 rounded-xl ${dark ? "bg-[#111827]" : "bg-white"}`}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} />
        <h2 className="font-semibold">Recent Requests</h2>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm opacity-60">No requests yet</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`p-3 rounded-lg border ${
                dark ? "border-white/10 bg-white/5" : "bg-slate-50 border-white/50"
              }`}
            >
              <p className="text-sm">{req.text}</p>

              <p className="text-xs opacity-60 mt-1">
                {req.createdAt?.toDate
                  ? req.createdAt.toDate().toLocaleString()
                  : "Just now"}
              </p>
            </div>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
    
  );
}