import { useEffect, useState } from "react";
import { db, auth } from './../../../firebase/config';
import{
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { GraduationCap } from "lucide-react";

export default function MyTutorials({ dark }) {
  const [tutorials, setTutorials] = useState([]);

  const fetchTutorials = async () => {
    const q = query(
      collection(db, "tutorials"),
      where("tutorId", "==", auth.currentUser.uid)
    );

    const snap = await getDocs(q);
    setTutorials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Delete this tutorial?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "tutorials", id));
    fetchTutorials();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4"><GraduationCap/> My Tutorials</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tutorials.map(t => (
          <div
            key={t.id}
            className={`p-4 rounded-xl ${
              dark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h2 className="font-semibold">{t.title}</h2>
            <p className="text-sm opacity-70">{t.description}</p>

            <div className="flex justify-between mt-3">
              <span>₦{t.price}</span>

              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}