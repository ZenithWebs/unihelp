import { useEffect, useState } from "react";

import imageCompression from "browser-image-compression";

import {
  ShoppingBag,
  Search,
  DollarSign,
  Phone,
  Loader2,
  PlusCircle,
  UploadCloud,
  X,
  Trash2,
  CheckCircle2,
  ImageIcon,
  Tag,
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

export default function StudentMarketplace({
  dark,
}) {
  /* =====================================================
     STATES
  ===================================================== */

  const [view, setView] =
    useState("market");

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [filterCategory, setFilterCategory] =
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

  const [savedSpace, setSavedSpace] =
    useState(0);

  const [images, setImages] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [form, setForm] =
    useState({
      title: "",
      category: "",
      price: "",
      phone: "",
      description: "",
    });

  /* =====================================================
     FETCH ITEMS
  ===================================================== */

  const fetchItems = async () => {
    setLoading(true);

    try {
      let q =
        view === "market"
          ? query(
              collection(
                db,
                "studentMarketplace"
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
                "studentMarketplace"
              ),
              where(
                "userId",
                "==",
                auth.currentUser
                  ?.uid
              )
            );

      const snap =
        await getDocs(q);

      setItems(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [view]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredItems =
    items.filter((item) => {
      const matchSearch =
        item.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        item.category
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchCategory =
        filterCategory
          ? item.category
              ?.toLowerCase()
              .includes(
                filterCategory.toLowerCase()
              )
          : true;

      const matchPrice =
        filterPrice
          ? Number(
              item.price
            ) <=
            Number(
              filterPrice
            )
          : true;

      return (
        matchSearch &&
        matchCategory &&
        matchPrice
      );
    });

  /* =====================================================
     IMAGE COMPRESSION
  ===================================================== */

  const compressImage =
    async (file) => {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
          fileType:
            "image/webp",
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

  /* =====================================================
     HANDLE IMAGES
  ===================================================== */

  const handleImages =
    async (files) => {
      if (!files.length)
        return;

      setCompressing(true);

      try {
        const selected =
          Array.from(files);

        const compressedFiles =
          [];

        const previewUrls =
          [];

        let original = 0;

        let compressed = 0;

        for (let file of selected) {
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

  /* =====================================================
     UPLOAD
  ===================================================== */

  const handleUpload =
    async () => {
      if (!auth.currentUser) {
        return alert(
          "Please login"
        );
      }

      if (
        !form.title ||
        !form.category ||
        !form.price ||
        !form.phone
      ) {
        return alert(
          "All fields are required"
        );
      }

      if (images.length === 0) {
        return alert(
          "Upload at least one image"
        );
      }

      setUploading(true);

      try {
        const imageUrls = [];

        for (let img of images) {
          const storageRef = ref(
            storage,
            `marketplace/${Date.now()}-${
              img.name
            }`
          );

          const uploadTask =
            uploadBytesResumable(
              storageRef,
              img
            );

          await new Promise(
            (
              resolve,
              reject
            ) => {
              uploadTask.on(
                "state_changed",

                (
                  snapshot
                ) => {
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

                reject,

                async () => {
                  const downloadURL =
                    await getDownloadURL(
                      uploadTask
                        .snapshot
                        .ref
                    );

                  imageUrls.push(
                    downloadURL
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
            "studentMarketplace"
          ),
          {
            ...form,

            images:
              imageUrls,

            userId:
              auth
                .currentUser
                .uid,

            createdAt:
              new Date(),

            status:
              "pending",

            verified: false,
          }
        );

        setForm({
          title: "",
          category: "",
          price: "",
          phone: "",
          description: "",
        });

        setImages([]);

        setPreviews([]);

        setSavedSpace(0);

        setProgress(0);

        setUploading(false);

        setShowUpload(false);

        fetchItems();
      } catch (err) {
        console.log(err);

        alert(
          "Upload failed"
        );

        setUploading(false);
      }
    };

  /* =====================================================
     WHATSAPP
  ===================================================== */

  const openWhatsApp = (
    phone,
    title
  ) => {
    if (!phone) return;

    const cleanPhone =
      phone.replace(/\D/g, "");

    const message = `Hi, I'm interested in "${title}" from UniHelp Marketplace. Is it still available?`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };


  const bg = dark
    ? "bg-[#0b0f1a] text-white"
    : "bg-[#f6f8fc] text-gray-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div
      className={`min-h-screen w-full md:pt-20 px-4 py-6 ${bg}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
            <ShoppingBag />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Student
              Marketplace
            </h1>

            <p className="text-sm opacity-70">
              Buy, sell &
              promote
              student
              services
              easily
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
                : "My Listings"}
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
                placeholder="Search products..."
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
              placeholder="Category"
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm outline-none"
              value={
                filterCategory
              }
              onChange={(
                e
              ) =>
                setFilterCategory(
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
              {filteredItems.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className={`${card} rounded-2xl overflow-hidden hover:scale-[1.02] transition`}
                  >
                    <div className="h-52 overflow-hidden relative">
                      <img
                        src={
                          item
                            .images?.[0]
                        }
                        className="w-full h-full object-cover"
                        alt=""
                      />

                      {item.verified && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Verified
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold text-lg">
                          {
                            item.title
                          }
                        </h2>

                        <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Tag size={11} />
                          {
                            item.category
                          }
                        </span>
                      </div>

                      <p className="text-sm opacity-70 line-clamp-2">
                        {
                          item.description
                        }
                      </p>

                      <p className="text-indigo-500 font-bold flex items-center gap-1">
                        <DollarSign size={15} />
                        ₦
                        {
                          item.price
                        }
                      </p>

                      <button
                        onClick={() =>
                          openWhatsApp(
                            item.phone,
                            item.title
                          )
                        }
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium"
                      >
                        <Phone
                          size={
                            15
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

        {/* MY LISTINGS */}

        {!loading &&
          view ===
            "my" && (
            <div className="grid md:grid-cols-2 gap-5">
              {items.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className={`${card} p-4 rounded-2xl`}
                  >
                    <img
                      src={
                        item
                          .images?.[0]
                      }
                      className="h-52 w-full object-cover rounded-xl mb-3"
                      alt=""
                    />

                    <div className="space-y-2">
                      <h2 className="font-semibold text-lg">
                        {
                          item.title
                        }
                      </h2>

                      <p className="text-sm opacity-70">
                        {
                          item.category
                        }
                      </p>

                      <p className="text-indigo-500 font-bold">
                        ₦
                        {
                          item.price
                        }
                      </p>

                      <p
                        className={`text-xs inline-flex px-3 py-1 rounded-full ${
                          item.status ===
                          "approved"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {
                          item.status
                        }
                      </p>

                      <button
                        onClick={async () => {
                          await deleteDoc(
                            doc(
                              db,
                              "studentMarketplace",
                              item.id
                            )
                          );

                          setItems(
                            (
                              prev
                            ) =>
                              prev.filter(
                                (
                                  x
                                ) =>
                                  x.id !==
                                  item.id
                              )
                          );
                        }}
                        className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 size={15} />
                        Delete
                        Listing
                      </button>
                    </div>
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

        {/* MODAL */}

        {showUpload && (
          <div className="fixed inset-0 bg-black/60 z-501 flex items-center justify-center px-3">
            <div
              className={`${card} w-full md:w-112.5 max-h-[90vh] overflow-y-auto no-scrollbar p-5 rounded-3xl`}
            >
              {/* TOP */}

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <UploadCloud size={18} />
                  Upload
                  Listing
                </h2>

                <button
                  onClick={() =>
                    setShowUpload(
                      false
                    )
                  }
                >
                  <X />
                </button>
              </div>

              {/* FORM */}

              <div className="space-y-3 ">

                <input
                  placeholder="Product Title"
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
                  placeholder="Category"
                  className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none"
                  value={
                    form.category
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      category:
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
                  placeholder="Description..."
                  rows={
                    4
                  }
                  maxLength={
                    150
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

                {/* IMAGE */}

                <div className="space-y-3">

                  <label className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="opacity-70 mb-2" />

                    <p className="text-sm font-medium">
                      Upload
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
                          className="relative min-w-27.5"
                        >
                          <img
                            src={
                              img
                            }
                            alt=""
                            className="h-24 w-28 rounded-xl object-cover"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition"
                >
                  {uploading
                    ? "Uploading..."
                    : "Publish Listing"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}