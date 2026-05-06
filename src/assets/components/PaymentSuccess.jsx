import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { CheckCheckIcon } from "lucide-react";

export default function PaymentSuccess({ dark }) {
  const [params] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      const tx_ref = params.get("tx_ref");
      const tutorialId = localStorage.getItem("tutorialId");

      const res = await fetch(`http://localhost:5000/verify/${tx_ref}`);
      const data = await res.json();

      if (data.status === "success") {
        await addDoc(collection(db, "purchases"), {
          tx_ref,
          userId: auth.currentUser.uid,
          tutorialId,
          createdAt: new Date()
        });
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className={`${dark ? "bg-[#0f172a] text-white" : "bg-white"} h-screen flex items-center justify-center`}>
      <h1 className="text-2xl font-bold flex"><CheckCheckIcon/> Payment Successful</h1>
    </div>
  );
}