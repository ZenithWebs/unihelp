import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
  startAfter,
  doc, 
  setDoc,
} from "firebase/firestore";
import { db, auth } from './../../firebase/config';
import { School } from 'lucide-react';

export const useTypingIndicator = (roomId) => {
  const typingTimeout = useRef(null);
  const lastSent = useRef(0);

  const sendTyping = async (value) => {
    const now = Date.now();
     if (!value.trim()) return;

    // 🚫 throttle (prevents spam writes)
    if (now - lastSent.current < 2000) return;
    lastSent.current = now;

    await setDoc(
      doc(db, "typing", roomId, "users", auth.currentUser.uid),
      {
        isTyping: true,
        updatedAt: serverTimestamp(),
      }
    );

    // ⏱ auto stop typing after 2.5s
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      await setDoc(
        doc(db, "typing", roomId, "users", auth.currentUser.uid),
        {
          isTyping: false,
          updatedAt: serverTimestamp(),
        }
      );
    }, 2500);
  };

  return { sendTyping };
};

export const useTypingListener = (roomId) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const ref = collection(db, "typing", roomId, "users");

    const unsub = onSnapshot(ref, (snapshot) => {
      const active = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // ❗ ignore current user
        if (
          data.isTyping &&
          doc.id !== auth.currentUser?.uid
        ) {
          active.push(doc.id);
        }
      });

      setTypingUsers(active);
    });

    return () => unsub();
  }, [roomId]);

  return typingUsers;
};

export default function Community({ dark }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [members, setMembers] = useState([]);
  const bottomRef = useRef(null);

  const roomId = "campus-global"; 
  const typingUsers = useTypingListener(roomId);

  const messagesRef = collection(db, "chats", roomId, "messages");

  const getMessageStatus = (msg) => {
  const others = members.filter(
    (m) => m.userId !== auth.currentUser.uid
  );

  if (others.length === 0) return "sent";

  const seenCount = others.filter(
    (m) =>
      m.lastSeenAt?.toMillis &&
      msg.createdAt?.toMillis &&
      m.lastSeenAt.toMillis() >= msg.createdAt.toMillis()
  ).length;

  if (seenCount === others.length) return "seen";
  return "delivered";
};
  

useEffect(() => {
  const ref = collection(db, "rooms", roomId, "members");

  const unsub = onSnapshot(ref, (snap) => {
    const data = snap.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    }));

    setMembers(data);
  });

  return () => unsub();
}, [roomId]);

  // 🎯 Load cached messages first (FAST UI)
  useEffect(() => {
  fetchInitialMessages();

  const unsubscribe = setupRealtime();

  return () => unsubscribe(); // ✅ cleanup
}, []);

const markAsSeen = async () => {
  const userId = auth.currentUser?.uid;

  await setDoc(
    doc(db, "rooms", roomId, "members", userId),
    {
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
};
useEffect(() => {
  if (messages.length > 0) {
    markAsSeen();
  }
}, [messages]);

  // ⚡ Initial load (ONLY last 30 messages)
  const fetchInitialMessages = async () => {
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(30));
    const snap = await getDocs(q);

    const msgs = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).reverse();

    setMessages(msgs);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setLoading(false);

    localStorage.setItem("unihelp_chat_cache", JSON.stringify(msgs));
  };

  // ⚡ REALTIME (ONLY active room → low cost)
  const setupRealtime = () => {
  const q = query(messagesRef, orderBy("createdAt", "desc"), limit(20));

  return onSnapshot(q, (snapshot) => {
    const liveMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).reverse();

    setMessages(liveMessages);

    localStorage.setItem(
      "campusflow_chat_cache",
      JSON.stringify(liveMessages)
    );
  });
};

  // 📤 Send message (optimized write)
  const sendMessage = async () => {
  if (!text.trim()) return;

  const user = auth.currentUser;

  const newMsg = {
    text,
    userId: user?.uid || "anon",
    name: user?.displayName || "Anonymous",
    avatar: user?.photoURL || null,
    createdAt: serverTimestamp(),
  };

  await addDoc(messagesRef, newMsg);

  setText("");
};

  // 📜 Load older messages (pagination = COST SAVING)
  const loadMore = async () => {
    if (!lastDoc) return;

    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(20)
    );

    const snap = await getDocs(q);

    const older = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setMessages((prev) => [...older.reverse(), ...prev]);

    setLastDoc(snap.docs[snap.docs.length - 1]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const { sendTyping } = useTypingIndicator(roomId);

  return (
    <div
      className={`h-[90%] w-full flex flex-col ${
        dark ? "bg-[#0b0f19] text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div
        className={`p-4 font-bold flex shadow-md ${
          dark ? "bg-[#111827]" : "bg-white"
        }`}
      >
        <School size={23} className="text-indigo-500"/> UniHelp Chat
      </div>

      {/* CHAT AREA */}
      <div className=" h-full relative overflow-y-auto p-3 space-y-2">
        {loading && <p className="text-sm opacity-60">Loading chat...</p>}

        <button
          onClick={loadMore}
          className="text-xs cursor-pointer text-blue-400 mb-2"
        >
          Load older messages
        </button>

        {messages.map((msg) => {
        const isMe = msg.userId === auth.currentUser?.uid;

        return (
          <div className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
            {!isMe && (
              <img
                src={msg.avatar || "/default-avatar.png"}
                className="w-6 h-6 rounded-full mt-1"
              />
            )}

          <div className="max-w-[75%]">
            {!isMe && (
              <div className="text-[11px] font-semibold opacity-70">
                {msg.name}
              </div>
            )}

            <div
              className={`p-2 rounded-lg text-sm ${
                isMe
                  ? "bg-blue-600 text-white"
                  : dark
                  ? "bg-gray-800"
                  : "bg-white shadow"
              }`}
            >
              {msg.text}
            </div>
          </div>
        </div>
                );
              })}

          {typingUsers.length > 0 && (
            <div className="text-xs italic opacity-70 px-2">
              {typingUsers.length === 1
                ? "Typing..."
                : `${typingUsers.length} people typing...`}
            </div>
          )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        className={`p-3 flex gap-2 ${
          dark ? "bg-[#111827]" : "bg-white"
        }`}
      >
        <input
          value={text}
          onChange={(e) => {
            const value = e.target.value;
            setText(value);
            sendTyping(value);
          }}
          
          placeholder="Message Unihelp..."
          className={`flex-1 p-2 rounded-md outline-none ${
            dark ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
        />

        <button
          onClick={sendMessage}
          className="bg-indigo-500 cursor-pointer hover:bg-indigo-600 text-white px-4 rounded-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}