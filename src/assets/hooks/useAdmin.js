import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setIsAdmin(false);
          return;
        }

        const role = snap.data().role;

        // ✅ MAIN CHECK
        if (role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

      } catch (err) {
        console.log(err);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);
      

  return isAdmin;
}