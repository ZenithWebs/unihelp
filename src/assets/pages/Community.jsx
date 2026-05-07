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

import { db, auth } from "./../../firebase/config";
import { School } from "lucide-react";

/* =========================================================
   TYPING INDICATOR HOOK
========================================================= */

export const useTypingIndicator = (roomId) => {
  const typingTimeout = useRef(null);
  const lastSent = useRef(0);

  const sendTyping = async (value) => {
    const now = Date.now();

    if (!value.trim()) return;

    // Prevent spam writes
    if (now - lastSent.current < 2000) return;

    lastSent.current = now;

    await setDoc(
      doc(db, "typing", roomId, "users", auth.currentUser.uid),
      {
        isTyping: true,
        updatedAt: serverTimestamp(),
      }
    );

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

/* =========================================================
   TYPING LISTENER HOOK
========================================================= */

export const useTypingListener = (roomId) => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const typingRef = collection(db, "typing", roomId, "users");

    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const activeUsers = [];

      snapshot.forEach((docItem) => {
        const data = docItem.data();

        if (
          data.isTyping &&
          docItem.id !== auth.currentUser?.uid
        ) {
          activeUsers.push(docItem.id);
        }
      });

      setTypingUsers(activeUsers);
    });

    return () => unsubscribe();
  }, [roomId]);

  return typingUsers;
};

/* =========================================================
   MAIN COMMUNITY COMPONENT
========================================================= */

export default function Community({ dark }) {
  /* =========================================================
     STATES
  ========================================================= */

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [members, setMembers] = useState([]);

  const bottomRef = useRef(null);

  /* =========================================================
     ROOM CONFIG
  ========================================================= */

  const roomId = "campus-global";

  const messagesRef = collection(
    db,
    "chats",
    roomId,
    "messages"
  );

  const typingUsers = useTypingListener(roomId);
  const { sendTyping } = useTypingIndicator(roomId);

  /* =========================================================
     MEMBER LISTENER
  ========================================================= */

  useEffect(() => {
    const membersRef = collection(
      db,
      "rooms",
      roomId,
      "members"
    );

    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map((docItem) => ({
        userId: docItem.id,
        ...docItem.data(),
      }));

      setMembers(membersData);
    });

    return () => unsubscribe();
  }, [roomId]);

  /* =========================================================
     MESSAGE STATUS
  ========================================================= */

  const getMessageStatus = (message) => {
    const others = members.filter(
      (member) => member.userId !== auth.currentUser?.uid
    );

    if (others.length === 0) return "sent";

    const seenCount = others.filter(
      (member) =>
        member.lastSeenAt?.toMillis &&
        message.createdAt?.toMillis &&
        member.lastSeenAt.toMillis() >=
          message.createdAt.toMillis()
    ).length;

    if (seenCount === others.length) return "seen";

    return "delivered";
  };

  /* =========================================================
     MARK AS SEEN
  ========================================================= */

  const markAsSeen = async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) return;

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

  /* =========================================================
     FETCH INITIAL MESSAGES
  ========================================================= */

  const fetchInitialMessages = async () => {
    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const snapshot = await getDocs(q);

    const loadedMessages = snapshot.docs
      .map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }))
      .reverse();

    setMessages(loadedMessages);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setLoading(false);

    localStorage.setItem(
      "campusflow_chat_cache",
      JSON.stringify(loadedMessages)
    );
  };

  /* =========================================================
     REALTIME LISTENER
  ========================================================= */

  const setupRealtime = () => {
    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const liveMessages = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .reverse();

      setMessages(liveMessages);

      localStorage.setItem(
        "campusflow_chat_cache",
        JSON.stringify(liveMessages)
      );
    });
  };

  /* =========================================================
     INITIALIZE CHAT
  ========================================================= */

  useEffect(() => {
    fetchInitialMessages();

    const unsubscribe = setupRealtime();

    return () => unsubscribe();
  }, []);

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage = async () => {
    if (!text.trim()) return;

    const user = auth.currentUser;

    const newMessage = {
      text,
      userId: user?.uid || "anonymous",
      name: user?.displayName || "Anonymous",
      avatar: user?.photoURL || null,
      createdAt: serverTimestamp(),
    };

    await addDoc(messagesRef, newMessage);

    setText("");
  };

  /* =========================================================
     LOAD OLDER MESSAGES
  ========================================================= */

  const loadMore = async () => {
    if (!lastDoc) return;

    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(20)
    );

    const snapshot = await getDocs(q);

    const olderMessages = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    setMessages((prev) => [
      ...olderMessages.reverse(),
      ...prev,
    ]);

    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  };

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className={`h-[90%] w-full flex flex-col ${
        dark
          ? "bg-[#0b0f19] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* =========================================================
         HEADER
      ========================================================= */}

      <div
        className={`p-4 font-bold flex shadow-md ${
          dark ? "bg-[#111827]" : "bg-white"
        }`}
      >
        <School
          size={23}
          className="text-indigo-500"
        />
        UniHelp Chat
      </div>

      {/* =========================================================
         CHAT AREA
      ========================================================= */}

      <div className="h-full relative overflow-y-auto p-3 space-y-2">
        {loading && (
          <p className="text-sm opacity-60">
            Loading chat...
          </p>
        )}

        <button
          onClick={loadMore}
          className="text-xs cursor-pointer text-blue-400 mb-2"
        >
          Load older messages
        </button>

        {messages.map((message) => {
          const isMe =
            message.userId === auth.currentUser?.uid;

          return (
            <div
              key={message.id}
              className={`flex gap-2 ${
                isMe
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {!isMe && (
                <img
                  src={
                    message.avatar ||
                    "/default-avatar.png"
                  }
                  alt="avatar"
                  className="w-6 h-6 rounded-full mt-1"
                />
              )}

              <div className="max-w-[75%]">
                {!isMe && (
                  <div className="text-[11px] font-semibold opacity-70">
                    {message.name}
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
                  {message.text}
                </div>

                {isMe && (
                  <p className="text-[10px] opacity-60 mt-1 text-right">
                    {getMessageStatus(message)}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* =========================================================
           TYPING INDICATOR
        ========================================================= */}

        {typingUsers.length > 0 && (
          <div className="text-xs italic opacity-70 px-2">
            {typingUsers.length === 1
              ? "Typing..."
              : `${typingUsers.length} people typing...`}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* =========================================================
         INPUT AREA
      ========================================================= */}

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
          placeholder="Message UniHelp..."
          className={`flex-1 p-2 rounded-md outline-none ${
            dark
              ? "bg-gray-900 text-white"
              : "bg-gray-100"
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
