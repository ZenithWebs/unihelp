import { useEffect, useState } from "react";

import imageCompression from "browser-image-compression";

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
  Trash2,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";

import {
  db,
  storage,
  auth,
} from "../../firebase/config";

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

export default function HostelMarketplace({
  dark,
}) {
  /* ======================================================
     STATES
  ====================================================== */

  const [view, setView] =
    useState("market");

  const [hostels, setHostels] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filterLocation, setFilterLocation] =
    useState("");

  const [filterPrice, setFilterPrice] =
    useState("");

  const [showUpload, setShowUpload] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [compressing, setCompressing] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [savedSpace, setSavedSpace] =
    useState(0);

  const [form, setForm] =
    useState({
      title: "",
      location: "",
      price: "",
      phone: "",
      description: "",
    });

  /* ======================================================
     FETCH HOSTELS
  ====================================================== */

  const fetchHostels = async () => {
    setLoading(true);

    try {
      let q =
        view === "market"
          ? query(
              collection(
                db,
                "hostels"
              ),
              where(
                "status",
                "==",
                "approved"
              )
            )
          : query(
              collection(
                db,
                "hostels"
              ),
              where(
                "userId",
                "==",
                auth.currentUser
                  ?.uid
              )
            );

      const snap = await getDocs(q);

      setHostels(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHostels();
  }, [view]);

  /* ======================================================
     FILTER
  ====================================================== */

  const filtered = hostels.filter(
    (h) => {
      const matchSearch =
        (h.title || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        (h.location || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchLocation =
        filterLocation
          ? h.location
              ?.toLowerCase()
              .includes(
                filterLocation.toLowerCase()
              )
          : true;

      const matchPrice =
        filterPrice
          ? Number(h.price) <=
            Number(filterPrice)
          : true;

      return (
        matchSearch &&
        matchLocation &&
        matchPrice
      );
    }
  );

  /* ======================================================
     IMAGE COMPRESSION
  ====================================================== */

  const compressImage = async (
    file
  ) => {
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressed =
        await imageCompression(
          file,
          options
        );

      return compressed;
    } catch (err) {
      console.log(err);

      return file;
    }
  };

  /* ======================================================
     HANDLE IMAGES
  ====================================================== */

  const handleImages = async (
    files
  ) => {
    if (!files.length) return;

    setCompressing(true);

    try {
      const arr =
        Array.from(files);

      const compressedFiles =
        [];

      const previewUrls = [];

      let original = 0;

      let compressed = 0;

      for (let file of arr) {
        original += file.size;

        const optimized =
          await compressImage(
            file
          );

        compressed +=
          optimized.size;

        compressedFiles.push(
          optimized
        );

        previewUrls.push(
          URL.createObjectURL(
            optimized
          )
        );
      }

      setSavedSpace(
        Math.round(
          ((original -
            compressed) /
            original) *
            100
        )
      );

      setImages(
        compressedFiles
      );

      setPreviews(
        previewUrls
      );
    } catch (err) {
      console.log(err);
    }

    setCompressing(false);
  };

  /* ======================================================
     UPLOAD
  ====================================================== */

  const handleUpload = async () => {
    if (!auth.currentUser)
      return;

    if (
      !form.title ||
      !form.location ||
      !form.price ||
      !form.phone
    ) {
      return alert(
        "All fields are required"
      );
    }

    if (images.length === 0) {
      return alert(
        "Please upload at least one image"
      );
    }

    if (form.phone.length < 10) {
      return alert(
        "Invalid WhatsApp number"
      );
    }

    setUploading(true);

    try {
      const imageUrls = [];

      for (let img of images) {
        const storageRef = ref(
          storage,
          `hostels/${Date.now()}-${
            img.name
          }`
        );

        const task =
          uploadBytesResumable(
            storageRef,
            img
          );

        await new Promise(
          (resolve) => {
            task.on(
              "state_changed",

              (snapshot) => {
                const percent =
                  (snapshot.bytesTransferred /
                    snapshot.totalBytes) *
                  100;

                setProgress(
                  Math.round(
                    percent
                  )
                );
              },

              console.error,

              async () => {
                const url =
                  await getDownloadURL(
                    task.snapshot.ref
                  );

                imageUrls.push(
                  url
                );

                resolve();
              }
            );
          }
        );
      }

      await addDoc(
        collection(
          db,
          "hostels"
        ),
        {
          ...form,

          images:
            imageUrls,

          userId:
            auth.currentUser
              .uid,

          createdAt:
            new Date(),

          status:
            "pending",

          verified: false,
        }
      );

      setUploading(false);

      setShowUpload(false);

      setImages([]);

      setPreviews([]);

      setProgress(0);

      setSavedSpace(0);

      setForm({
        title: "",
        location: "",
        price: "",
        phone: "",
        description: "",
      });

      fetchHostels();
    } catch (err) {
      console.log(err);

      setUploading(false);
    }
  };

  /* ======================================================
     WHATSAPP
  ====================================================== */

  const openWhatsApp = (
    phone,
    title
  ) => {
    if (!phone)
      return alert(
        "No phone number"
      );

    const cleanPhone =
      phone.replace(/\D/g, "");

    const message = `Hi, I'm interested in "${title}" on UniHelp. Is it still available?`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  /* ======================================================
     STYLES
  ====================================================== */

  const bg = dark
    ? "bg-[#0b0f1a] text-white"
    : "bg-[#f6f8fc] text-gray-900";

  const card = dark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white border-gray-200 shadow-sm";

  return (
    <div
      className={`min-h-screen w-full md:pt-20 px-4 py-6 ${bg}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Home />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hostel
              Marketplace
            </h1>

            <p className="text-sm opacity-70">
              Find &
              manage
              verified
              student
              hostels
            </p>
          </div>
        </div>

        {/* TOGGLE */}

        <div className="flex gap-2">
          {[
            "market",
            "my",
          ].map((v) => (
            <button
              key={v}
              onClick={() =>
                setView(v)
              }
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                view === v
                  ? "bg-indigo-600 text-white"
                  : dark
                  ? "bg-white/10"
                  : "bg-white"
              }`}
            >
              {v ===
              "market"
                ? "Marketplace"
                : "My Hostels"}
            </button>
          ))}
        </div>

        {/* SEARCH */}

        {view ===
          "market" && (
          <div
            className={`${card} p-4 rounded-2xl grid md:grid-cols-3 gap-3`}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5">
              <Search size={16} />

              <input
                placeholder="Search hostels..."
                className="bg-transparent placeholder:text-slate-400 outline-none w-full text-sm"
                value={
                  search
                }
                onChange={(
                  e
                ) =>
                  setSearch(
                    e.target
                      .value
                  )
                }
              />
            </div>

            <input
              placeholder="Location"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={
                filterLocation
              }
              onChange={(
                e
              ) =>
                setFilterLocation(
                  e.target
                    .value
                )
              }
            />

            <input
              type="number"
              placeholder="Max price"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={
                filterPrice
              }
              onChange={(
                e
              ) =>
                setFilterPrice(
                  e.target
                    .value
                )
              }
            />
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin opacity-60" />
          </div>
        )}

        {/* MARKET GRID */}

        {!loading &&
          view ===
            "market" && (
            <div className="grid md:grid-cols-3 gap-5">
              {filtered.map(
                (h) => (
                  <div
                    key={
                      h.id
                    }
                    className={`${card} rounded-2xl overflow-hidden transition hover:scale-[1.02]`}
                  >
                    <div className="h-52 overflow-hidden relative">
                      <img
                        src={
                          h.images?.[0]
                        }
                        className="w-full h-full object-cover"
                      />

                      {h.verified && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Verified
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h2 className="font-semibold text-lg">
                        {
                          h.title
                        }
                      </h2>

                      <p className="text-sm opacity-70">
                        {
                          h.description
                        }
                      </p>

                      <p className="flex items-center gap-1 text-sm opacity-70">
                        <MapPin size={14} />
                        {
                          h.location
                        }
                      </p>

                      <p className="text-indigo-500 font-bold flex items-center gap-1">
                        <DollarSign size={14} />
                        ₦
                        {h.price}
                      </p>

                      <button
                        onClick={() =>
                          openWhatsApp(
                            h.phone,
                            h.title
                          )
                        }
                        className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium"
                      >
                        <Phone
                          size={
                            14
                          }
                          className="inline mr-1"
                        />
                        Chat on
                        WhatsApp
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {/* MY HOSTELS */}

        {!loading &&
          view ===
            "my" && (
            <div className="grid md:grid-cols-2 gap-5">
              {hostels.map(
                (h) => (
                  <div
                    key={
                      h.id
                    }
                    className={`${card} p-4 rounded-2xl`}
                  >
                    <img
                      src={
                        h.images?.[0]
                      }
                      className="h-52 w-full object-cover rounded-xl mb-3"
                    />

                    <div className="space-y-2">
                      <h2 className="font-semibold text-lg">
                        {
                          h.title
                        }
                      </h2>

                      <p className="text-sm opacity-70">
                        ₦
                        {h.price}
                      </p>

                      <p
                        className={`text-xs px-3 py-1 rounded-full inline-flex ${
                          h.status ===
                          "approved"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {
                          h.status
                        }
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        await deleteDoc(
                          doc(
                            db,
                            "hostels",
                            h.id
                          )
                        );

                        setHostels(
                          (
                            p
                          ) =>
                            p.filter(
                              (
                                x
                              ) =>
                                x.id !==
                                h.id
                            )
                        );
                      }}
                      className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                      Listing
                    </button>
                  </div>
                )
              )}
            </div>
          )}

        {/* FLOAT BUTTON */}

        <button
          onClick={() =>
            setShowUpload(
              true
            )
          }
          className="fixed bottom-28 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
        >
          <PlusCircle />
        </button>

        {/* UPLOAD MODAL */}

        {showUpload && (
          <div className="fixed inset-0 bg-black/60 z-501 flex items-center justify-center p-4">
            <div
              className={`${card} w-full max-w-xl p-5 rounded-3xl space-y-4`}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2 text-lg">
                  <UploadCloud size={18} />
                  Upload
                  Hostel
                </h2>

                <X
                  className="cursor-pointer"
                  onClick={() =>
                    setShowUpload(
                      false
                    )
                  }
                />
              </div>

              {/* INPUTS */}

              <div className="space-y-3">

                <input
                  placeholder="Hostel Title"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.title
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      title:
                        e
                          .target
                          .value,
                    })
                  }
                />

                <input
                  placeholder="Location"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.location
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      location:
                        e
                          .target
                          .value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Price"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.price
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      price:
                        e
                          .target
                          .value,
                    })
                  }
                />

                <input
                  placeholder="WhatsApp Number"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.phone
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      phone:
                        e
                          .target
                          .value,
                    })
                  }
                />

                <textarea
                  placeholder="Short Description"
                  maxLength={
                    120
                  }
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 resize-none outline-none"
                  value={
                    form.description
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      description:
                        e
                          .target
                          .value,
                    })
                  }
                />

                {/* IMAGE INPUT */}

                <div className="space-y-3">
                  <label className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="opacity-70 mb-2" />

                    <p className="text-sm font-medium">
                      Upload
                      Hostel
                      Images
                    </p>

                    <p className="text-xs opacity-60 mt-1">
                      Images are
                      compressed
                      automatically
                    </p>

                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(
                        e
                      ) =>
                        handleImages(
                          e.target
                            .files
                        )
                      }
                    />
                  </label>

                  {/* COMPRESSING */}

                  {compressing && (
                    <div className="text-sm text-indigo-500">
                      Compressing
                      images...
                    </div>
                  )}

                  {/* SAVED */}

                  {savedSpace >
                    0 && (
                    <div className="text-sm text-green-500">
                      Saved{" "}
                      {
                        savedSpace
                      }
                      % storage
                      space
                    </div>
                  )}

                  {/* PREVIEWS */}

                  <div className="flex gap-3 overflow-x-auto">
                    {previews.map(
                      (
                        img,
                        i
                      ) => (
                        <div
                          key={
                            i
                          }
                          className="relative min-w-[110px]"
                        >
                          <img
                            src={
                              img
                            }
                            className="h-24 w-28 object-cover rounded-xl"
                          />

                          <button
                            onClick={() => {
                              setImages(
                                (
                                  prev
                                ) =>
                                  prev.filter(
                                    (
                                      _,
                                      index
                                    ) =>
                                      index !==
                                      i
                                  )
                              );

                              setPreviews(
                                (
                                  prev
                                ) =>
                                  prev.filter(
                                    (
                                      _,
                                      index
                                    ) =>
                                      index !==
                                      i
                                  )
                              );
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* PROGRESS */}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Uploading...
                      </span>

                      <span>
                        {
                          progress
                        }
                        %
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${progress}%`,
                        }}
                        className="h-full bg-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* BUTTON */}

                <button
                  onClick={
                    handleUpload
                  }
                  disabled={
                    uploading
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium"
                >
                  {uploading
                    ? "Uploading..."
                    : "Publish Hostel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}