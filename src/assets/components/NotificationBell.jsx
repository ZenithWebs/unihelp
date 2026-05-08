import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db, auth } from "../../firebase/config";
import { Bell } from "lucide-react";

export default function NotificationBell({ dark }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  // ============================
  // REAL-TIME FETCH
  // ============================
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setNotifications(data);
    });

    return () => unsub();
  }, []);

  // ============================
  // MARK AS READ
  // ============================
  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), {
      read: true,
    });
  };

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  return (
    <div className="relative">
      {/* BELL */}
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-lg overflow-hidden z-50 ${
            dark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <div className="p-3 font-bold border-b">
            Notifications
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm opacity-60">
                No notifications
              </p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-3 border-b cursor-pointer ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="font-semibold text-sm">
                  {n.title}
                </p>

                <p className="text-xs opacity-70">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}