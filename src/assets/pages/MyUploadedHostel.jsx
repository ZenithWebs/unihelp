import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { Loader2, Trash2, MapPin, DollarSign } from "lucide-react";

export default function MyHostels({ dark }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // FETCH ONLY USER HOSTELS (COST SAVING)
  // -----------------------------
  

  useEffect(() => {
    fetchMyHostels();
  }, []);

  // -----------------------------
  // DELETE HOSTEL
  // -----------------------------
  const deleteHostel = async (id) => {
    if (!window.confirm("Delete this hostel?")) return;

    try {
      await deleteDoc(doc(db, "hostels", id));
      setHostels((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <h1 className="text-2xl font-bold mb-6">
          🏠 My Uploaded Hostels
        </h1>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && hostels.length === 0 && (
          <div className="text-center opacity-70 mt-10">
            You haven’t uploaded any hostels yet.
          </div>
        )}

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-4">
          {hostels.map((h) => (
            <div
              key={h.id}
              className={`rounded-xl overflow-hidden shadow border ${
                dark ? "bg-[#111827] border-white/10" : "bg-white"
              }`}
            >
              {/* IMAGE */}
              <div className="h-40 overflow-hidden">
                {h.images?.[0] && (
                  <img
                    src={h.images[0]}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* CONTENT */}
              <div className="p-4 space-y-2">
                <h2 className="font-bold text-lg">{h.title}</h2>

                <p className="flex items-center gap-1 text-sm opacity-70">
                  <MapPin size={14} /> {h.location}
                </p>

                <p className="flex items-center gap-1 text-indigo-500 font-semibold">
                  <DollarSign size={14} /> ₦{h.price}
                </p>

                <p className="text-xs opacity-60 line-clamp-2">
                  {h.description}
                </p>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => deleteHostel(h.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}