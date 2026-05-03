import { useEffect, useState } from "react";
import {
  Home,
  Search,
  MapPin,
  DollarSign,
  Phone,
  Loader2,
} from "lucide-react";

import { db } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { PlusCircle, X, UploadCloud } from "lucide-react";
import { storage, auth } from "../../firebase/config";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { addDoc } from "firebase/firestore";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import { uploadBytes } from "firebase/storage";



export default function HostelMarketplace({ dark }) {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [priceFilter, setPriceFilter] = useState("");
    const [recommended, setRecommended] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [search, setSearch] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterPrice, setFilterPrice] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    phone: "",
    description: "",
    });


  // -----------------------------
  // FETCH HOSTELS
  // -----------------------------
  const fetchHostels = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "hostels"));

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHostels(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  // -----------------------------
  // FILTER SYSTEM
  // -----------------------------
    const filtered = hostels
  .filter((h) =>
    (h.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (h.location || "").toLowerCase().includes(search.toLowerCase()) ||
    (h.description || "").toLowerCase().includes(search.toLowerCase())
  )
  .filter((h) =>
    filterLocation ? h.location === filterLocation : true
  )
  .filter((h) => {
    if (!filterPrice) return true;
    return Number(h.price || 0) <= Number(filterPrice);
  });

  useEffect(() => {
  if (!hostels?.length) return;

  const sorted = [...hostels]
    .filter((h) => h.price)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, 4);

  setRecommended(sorted);
}, [hostels]);
 
  // -----------------------------
  // WHATSAPP LINK
  // -----------------------------
    const openWhatsApp = (phone, title) => {
      const message = `Hi, I'm interested in "${title}" on CampusFlow. Is it still available?`;

      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    };

    const handleImages = (files) => {
  const arr = Array.from(files).filter((f) =>
    f.type.startsWith("image/")
  );

  if (arr.length === 0) {
    alert("Only images allowed");
    return;
  }

  setImages(arr);
  setPreviews(arr.map((f) => URL.createObjectURL(f)));
};

    const handleUpload = async () => {
  if (!auth.currentUser) {
    alert("Login required");
    return;
  }

  if (!form.title || !form.location || !form.price || !form.phone) {
    alert("Fill all required fields");
    return;
  }

  if (images.length === 0) {
    alert("Upload at least one image");
    return;
  }

  setUploading(true);

  try {
    const imageUrls = await uploadImages();

    await addDoc(collection(db, "hostels"), {
      ...form,
      images: imageUrls,
      verified: false,
      userId: auth.currentUser.uid,
      createdAt: new Date(),
    });

    // RESET
    setUploading(false);
    setShowUpload(false);
    setForm({
      title: "",
      location: "",
      price: "",
      phone: "",
      description: "",
    });
    setImages([]);
    setPreviews([]);
    setProgress(0);

    fetchHostels();
  } catch (err) {
    console.log(err);
    setUploading(false);
  }
};

    const toggleBookmark = async (id) => {
  if (!auth.currentUser) return alert("Login required");

  const userRef = doc(db, "users", auth.currentUser.uid);

  const isSaved = bookmarks.includes(id);

  try {
    await updateDoc(userRef, {
      bookmarks: isSaved
        ? arrayRemove(id)
        : arrayUnion(id),
    });

    setBookmarks((prev) =>
      isSaved ? prev.filter((i) => i !== id) : [...prev, id]
    );
  } catch (err) {
    console.log(err);
  }
};


  useEffect(() => {
  if (!hostels.length) return;

  const sorted = [...hostels]
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  setRecommended(sorted);
}, [hostels]);

const uploadImages = async () => {
  const urls = [];

  for (let img of images) {
    const storageRef = ref(
      storage,
      `hostels/${Date.now()}-${img.name}`
    );

    const uploadTask = uploadBytesResumable(storageRef, img);

    await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          setProgress(Math.round(prog));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          urls.push(url);
          resolve();
        }
      );
    });
  }

  return urls;
};


  return (
    <div
      className={`min-h-screen w-full px-4 py-6 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500 rounded-xl text-white">
            <Home />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Hostel Marketplace</h1>
            <p className="text-sm opacity-70">
              Find verified hostels near your campus
            </p>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div
          className={`p-4 rounded-xl grid md:grid-cols-3 gap-3 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2 border border-slate-500/50  p-2 rounded">
            <Search size={16} />
            <input
              placeholder="Search hostel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent placeholder:text-slate-400 outline-none w-full"
            />
          </div>

          <input
            placeholder="Filter by location"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="p-2 border border-slate-500/50 placeholder:text-slate-400 rounded"
          />

          <input
            type="number"
            placeholder="Max price"
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            className="p-2 border border-slate-500/50 placeholder:text-slate-400 rounded"
          />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center mt-10">
            <Loader2 className="animate-spin" />
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-bold mb-3">🔥 Recommended</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommended.map((h) => (
              <div key={h.id} className="p-3 rounded-xl bg-indigo-500/10">
                <p className="text-sm font-semibold">{h.title}</p>
                <p className="text-xs opacity-70">₦{h.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HOSTELS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hostel) => (
            <div
              key={hostel.id}
              className={`rounded-2xl overflow-hidden border ${
                dark
                  ? "bg-[#111827] border-white/10"
                  : "bg-white border-gray-200"
              }`}>

              <div className="flex gap-2 overflow-x-auto">
                {Array.isArray(hostel.images) &&
                  hostel.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="h-40 w-[90%] flex mx-auto mt-2.5 object-cover rounded-xl"
                    />
                  ))}
              </div>

              {/* CONTENT */}
              <div className="p-4 space-y-2">
                <p className="text-xs opacity-70 mt-2">
                  Agent: {usersMap[hostel.userId]?.name || "Anonymous"}
                </p>
                {hostel.verified && (
                  <span className="text-xs bg-green-500 px-2 py-1 rounded text-white">
                    Verified
                  </span>
                )}
                <h3 className="font-bold text-lg">
                  {hostel.title}
                </h3>
                

                <p className="flex items-center gap-1 text-sm opacity-70">
                  <MapPin size={14} /> {hostel.location}
                </p>

                <p className="flex items-center gap-1 text-indigo-500 font-semibold">
                  <DollarSign size={14} /> ₦{hostel.price}
                </p>

                <p className="text-sm opacity-70 line-clamp-2">
                  {hostel.description}
                </p>

                {/* CTA */}
                <button
                  onClick={() =>
                    openWhatsApp(hostel.phone, hostel.title)
                  }
                  className="w-full flex items-center justify-center gap-2 mt-3 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl"
                >
                  <Phone size={16} />
                  Message Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUpload && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div
      className={`w-[95%] md:w-125 p-6 rounded-2xl ${
        dark ? "bg-[#111827]" : "bg-white"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold flex items-center gap-2">
          <UploadCloud size={18} /> Upload Hostel
        </h2>

        <X
          className="cursor-pointer"
          onClick={() => setShowUpload(false)}
        />
      </div>

      {/* FORM */}
      <div className="space-y-3">

        <input
          placeholder="Hostel Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          className="w-full p-3 border rounded"
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
          className="w-full p-3 border rounded"
        />

        <input
          type="number"
          placeholder="Price (₦)"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          className="w-full p-3 border rounded"
        />

        <input
          placeholder="WhatsApp Number (234...)"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          className="w-full p-3 border rounded"
        />

        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="w-full p-3 border rounded"
        />

        {/* IMAGE */}
        <div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleImages(e.target.files)}
        />

        <div className="flex gap-2 mt-2 overflow-x-auto">
          {previews.map((img, i) => (
            <img
              key={i}
              src={img}
              className="h-20 w-28 object-cover rounded"
            />
          ))}
        </div>
        </div>

        {/* PROGRESS */}
        {uploading && (
          <div className="w-full bg-gray-300 rounded">
            <div
              className="bg-indigo-600 text-white text-xs text-center rounded"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleUpload}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl"
        >
          {uploading ? "Uploading..." : "Upload Hostel"}
        </button>
      </div>
    </div>
  </div>
)}

      <button onClick={() => setShowUpload(true)}
        className="fixed bottom-32  md:bottom-6 right-6 p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
        <PlusCircle />
        </button>
    </div>
  );
}