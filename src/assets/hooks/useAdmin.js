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
        const token = await user.getIdTokenResult();

        // ✅ EMAIL CHECK
        const isAdminEmail = user.email === "onakomayaokiki@gmail.com";

        setIsAdmin(isAdminEmail || !!token.claims.admin);
      } catch (err) {
        console.log(err);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return isAdmin;
}