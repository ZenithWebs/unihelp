import { useEffect, useState } from "react";
import {
  Home,
  Search,
  MapPin,
  DollarSign,
  Phone,
  Loader2,
  PlusCircle,
  UploadCloud,
  X,
} from "lucide-react";

import { db, storage, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

export default function HostelMarketplace({ dark }) {
  const [view, setView] = useState("market");
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
      title: "",
      location: "",
      price: "",
      phone: "",
      description: "",
    });

  /* ---------------- FETCH ---------------- */
  const fetchHostels = async () => {
    setLoading(true);

    let q =
      view === "my"
        ? query(collection(db, "hostels"), 
        where("status", "==", "approved"))
        : query(collection(db, "hostels"),
          where("userId", "==", auth.currentUser.uid)
        );

    const snap = await getDocs(q);

    setHostels(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchHostels();
  }, [view]);

  /* ---------------- FILTER ---------------- */
  const filtered = hostels.filter((h) => {
    const matchSearch =
      (h.title || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (h.location || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchLocation = filterLocation
      ? h.location === filterLocation
      : true;

    const matchPrice = filterPrice
      ? Number(h.price) <= Number(filterPrice)
      : true;

    return matchSearch && matchLocation && matchPrice;
  });

  /* ---------------- UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!auth.currentUser) return;
    if (!form.title || !form.location || !form.price || !form.phone) {
      return alert("All fields are required");
    }

    if (images.length === 0) {
      return alert("Please upload at least one image");
    }

    if (form.phone.length < 10) {
      return alert("Invalid WhatsApp number");
    }

    setUploading(true);

    const urls = [];

    for (let img of images) {
      const storageRef = ref(
        storage,
        `hostels/${Date.now()}-${img.name}`
      );

      const task = uploadBytesResumable(storageRef, img);

      await new Promise((res) => {
        task.on("state_changed", null, null, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          urls.push(url);
          res();
        });
      });
    }

    await addDoc(collection(db, "hostels"), {
        ...form,
        images: imageUrls,
        userId: auth.currentUser.uid,
        createdAt: new Date(),

        status: "pending",
        verified: false,
      });

    setUploading(false);
    setShowUpload(false);
    fetchHostels();
  };

    const openWhatsApp = (phone, title) => {
      if (!phone) return alert("No phone number");

      const cleanPhone = phone.replace(/\D/g, "");

      const message = `Hi, I'm interested in "${title}" on UniHelp. Is it still available?`;

      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    };

  const bg = dark
    ? "bg-[#0b0f1a] text-white"
    : "bg-[#f6f8fc] text-gray-900";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200 shadow-sm";

  return (
    <div className={`min-h-screen w-full px-4 py-6 ${bg}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Home />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hostel Marketplace
            </h1>
            <p className="text-sm opacity-70">
              Find & manage verified student hostels
            </p>
          </div>
        </div>

        {/* TOGGLE */}
        <div className="flex gap-2">
          {["market", "my"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                view === v
                  ? "bg-indigo-600 text-white"
                  : dark
                  ? "bg-white/10"
                  : "bg-white"
              }`}
            >
              {v === "market" ? "Marketplace" : "My Hostels"}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        {view === "market" && (
          <div className={`${card} p-4 rounded-2xl grid md:grid-cols-3 gap-3`}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5">
              <Search size={16} />
              <input
                placeholder="Search hostels..."
                className="bg-transparent placeholder:text-slate-400 outline-none w-full text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <input
              placeholder="Location"
              className="px-3 py-2 placeholder:text-slate-400 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            />

            <input
              type="number"
              placeholder="Max price"
              className="px-3 py-2 placeholder:text-slate-400 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
            />
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin opacity-60" />
          </div>
        )}

        {/* GRID */}
        {!loading && view === "market" && (
          <div className="grid md:grid-cols-3 gap-5">
            {filtered.map((h) => (
              <div
                key={h.id}
                className={`${card} rounded-2xl overflow-hidden transition hover:scale-[1.02]`}
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={h.images?.[0]}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-2">
                  <h2 className="font-semibold">{h.title}</h2>

                  <p className="flex items-center gap-1 text-sm opacity-70">
                    <MapPin size={14} /> {h.location}
                  </p>

                  <p className="text-indigo-500 font-bold flex items-center gap-1">
                    <DollarSign size={14} /> ₦{h.price}
                  </p>

                 <button
                  onClick={() => openWhatsApp(h.phone, h.title)}
                  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium">
                  <Phone size={14} className="inline mr-1" />
                  Chat on WhatsApp
                </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MY HOSTELS */}
        {!loading && view === "my" && (
          <div className="grid md:grid-cols-2 gap-5">
            {hostels.map((h) => (
              <div key={h.id} className={`${card} p-4 rounded-2xl`}>
                <img
                  src={h.images?.[0]}
                  className="h-40 w-full object-cover rounded-xl mb-3"
                />

                <h2 className="font-semibold">{h.title}</h2>
                <p className="text-sm opacity-70">₦{h.price}</p>

                <button
                  onClick={async () => {
                    await deleteDoc(doc(db, "hostels", h.id));
                    setHostels((p) =>
                      p.filter((x) => x.id !== h.id)
                    );
                  }}
                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm"
                >
                  Delete Listing
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FLOAT BUTTON */}
        <button
          onClick={() => setShowUpload(true)}
          className="fixed bottom-30 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
        >
          <PlusCircle />
        </button>

        {/* UPLOAD MODAL */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div
              className={`${card} w-[92%] md:w-105 p-5 rounded-2xl space-y-3`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                  <UploadCloud size={16} />
                  Upload Hostel
                </h2>

                <X
                  className="cursor-pointer"
                  onClick={() => setShowUpload(false)}
                />
              </div>

              <div className="space-y-3">

                <input
                  placeholder="Hostel Title"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />

                <input
                  placeholder="Location (e.g. UNILAG, Yaba)"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Price (₦)"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />

                <input
                  placeholder="WhatsApp Number (e.g. 2348012345678)"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />

                <textarea
                  placeholder="Short description (max 120 characters)"
                  maxLength={120}
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 resize-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />

                {/* IMAGE UPLOAD */}
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImages(e.target.files)}
                  />

                  <div className="flex gap-2 overflow-x-auto">
                    {previews.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        className="h-20 w-28 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleUpload}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
              >
                {uploading ? "Uploading..." : "Publish Hostel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}