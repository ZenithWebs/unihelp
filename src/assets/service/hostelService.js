// services/hostelService.js

import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

export const createHostel = (data) => {
  return addDoc(collection(db, "hostels"), data);
};

export const approveHostel = (id) => {
  return updateDoc(doc(db, "hostels", id), {
    status: "approved",
    verified: true,
  });
};