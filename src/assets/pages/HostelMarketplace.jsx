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

export default function HostelMarketplace({ dark }) {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterPrice, setFilterPrice] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    phone: "",
    description: "",
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

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
      h.title?.toLowerCase().includes(search.toLowerCase()) ||
      h.location?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((h) =>
      filterLocation ? h.location === filterLocation : true
    )
    .filter((h) =>
      filterPrice ? Number(h.price) <= Number(filterPrice) : true
    );

  // -----------------------------
  // WHATSAPP LINK
  // -----------------------------
  const openWhatsApp = (phone, title) => {
    const message = `Hello, I'm interested in "${title}" hostel listing on CampusFlow.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

    const handleImage = (file) => {
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
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

  if (!image) {
    alert("Upload an image");
    return;
  }

  setUploading(true);

  try {
    const storageRef = ref(
      storage,
      `hostels/${Date.now()}-${image.name}`
    );

    const uploadTask = uploadBytesResumable(storageRef, image);

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

        await addDoc(collection(db, "hostels"), {
          ...form,
          image: url,
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
        setImage(null);
        setPreview(null);
        setProgress(0);

        fetchHostels(); // refresh list
      }
    );
  } catch (err) {
    console.log(err);
    setUploading(false);
  }
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

        {/* HOSTELS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hostel) => (
            <div
              key={hostel.id}
              className={`rounded-2xl overflow-hidden border ${
                dark
                  ? "bg-[#111827] border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* IMAGE */}
              <img
                src={hostel.image}
                alt={hostel.title}
                className="h-48 w-full object-cover"
              />

              {/* CONTENT */}
              <div className="p-4 space-y-2">
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
            accept="image/*"
            onChange={(e) => handleImage(e.target.files[0])}
          />

          {preview && (
            <img
              src={preview}
              className="mt-3 h-40 w-full object-cover rounded-xl"
            />
          )}
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