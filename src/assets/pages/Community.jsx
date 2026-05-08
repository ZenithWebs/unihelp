import { useEffect, useRef, useState } from "react";
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

import { db, auth } from "../../firebase/config";

import {
  School,
  SendHorizontal,
} from "lucide-react";

/* =========================================================
   TYPING INDICATOR HOOK
========================================================= */

export const useTypingIndicator = (roomId) => {
  const typingTimeout = useRef(null);
  const lastSent = useRef(0);

  const sendTyping = async (value) => {
    const now = Date.now();

    if (!value.trim()) return;

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
    const typingRef = collection(
      db,
      "typing",
      roomId,
      "users"
    );

    const unsubscribe = onSnapshot(
      typingRef,
      (snapshot) => {
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
      }
    );

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
  const inputRef = useRef(null);

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

  const { sendTyping } =
    useTypingIndicator(roomId);

  /* =========================================================
     AUTO FOCUS INPUT
  ========================================================= */

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

    const unsubscribe = onSnapshot(
      membersRef,
      (snapshot) => {
        const membersData = snapshot.docs.map(
          (docItem) => ({
            userId: docItem.id,
            ...docItem.data(),
          })
        );

        setMembers(membersData);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  /* =========================================================
     MESSAGE STATUS
  ========================================================= */

  const getMessageStatus = (message) => {
    const others = members.filter(
      (member) =>
        member.userId !==
        auth.currentUser?.uid
    );

    if (others.length === 0) return "Sent";

    const seenCount = others.filter(
      (member) =>
        member.lastSeenAt?.toMillis &&
        message.createdAt?.toMillis &&
        member.lastSeenAt.toMillis() >=
          message.createdAt.toMillis()
    ).length;

    if (seenCount === others.length)
      return "Seen";

    return "Delivered";
  };

  /* =========================================================
     MARK AS SEEN
  ========================================================= */

  const markAsSeen = async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) return;

    await setDoc(
      doc(
        db,
        "rooms",
        roomId,
        "members",
        userId
      ),
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

    setLastDoc(
      snapshot.docs[snapshot.docs.length - 1]
    );

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

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
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

    const olderMessages = snapshot.docs.map(
      (docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })
    );

    setMessages((prev) => [
      ...olderMessages.reverse(),
      ...prev,
    ]);

    setLastDoc(
      snapshot.docs[snapshot.docs.length - 1]
    );
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
      className={`h-screen md:pt-20 w-full flex flex-col overflow-hidden ${
        dark
          ? "bg-[#0a0f1c] text-white"
          : "bg-[#f3f4f6] text-black"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 35%)",
      }}
    >
      {/* =========================================================
         HEADER
      ========================================================= */}

      <div
        className={`sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md ${
          dark
            ? "bg-[#111827]/95 border-gray-800"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20">
            <School
              size={22}
              className="text-indigo-500"
            />
          </div>

          <div>
            <h1 className="font-semibold text-sm sm:text-base">
              UniHelp Community
            </h1>

            <p className="text-xs opacity-60">
              {members.length} members
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
         CHAT AREA
      ========================================================= */}

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 space-y-3 scroll-smooth">
        {/* LOADER */}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`animate-pulse flex gap-2 ${
                  item % 2 === 0
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`h-10 rounded-2xl w-40 ${
                    dark
                      ? "bg-gray-800"
                      : "bg-gray-300"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* LOAD MORE */}

        {!loading && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              className="text-xs px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all"
            >
              Load older messages
            </button>
          </div>
        )}

        {/* MESSAGES */}

        {messages.map((message, index) => {
          const isMe =
            message.userId ===
            auth.currentUser?.uid;

          const previous =
            messages[index - 1];

          const showAvatar =
            !previous ||
            previous.userId !==
              message.userId;

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 animate-fadeIn ${
                isMe
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {!isMe && showAvatar ? (
                <img
                  src={
                    message.avatar ||
                    "/default-avatar.png"
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover shadow-sm"
                />
              ) : (
                !isMe && (
                  <div className="w-8" />
                )
              )}

              <div className="max-w-[85%] sm:max-w-[70%]">
                {!isMe && showAvatar && (
                  <p className="text-[11px] mb-1 ml-1 font-medium opacity-70">
                    {message.name}
                  </p>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : dark
                      ? "bg-[#1f2937] text-gray-100 rounded-bl-md"
                      : "bg-white text-gray-800 rounded-bl-md"
                  }`}
                >
                  {message.text}
                </div>

                <div
                  className={`flex items-center mt-1 text-[10px] opacity-60 ${
                    isMe
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <span>
                    {message.createdAt
                      ?.toDate?.()
                      ?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>

                  {isMe && (
                    <span className="ml-2">
                      {getMessageStatus(
                        message
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* =========================================================
           TYPING INDICATOR
        ========================================================= */}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>

              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>

              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>

            <p className="text-xs italic opacity-70">
              {typingUsers.length === 1
                ? "Someone is typing..."
                : `${typingUsers.length} people typing...`}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* =========================================================
         INPUT AREA
      ========================================================= */}

      <div
        className={`sticky bottom-0 border-t p-3 sm:p-4 backdrop-blur-md ${
          dark
            ? "bg-[#111827]/95 border-gray-800"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              const value = e.target.value;

              setText(value);

              sendTyping(value);
            }}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-3 rounded-full outline-none text-sm transition-all ${
              dark
                ? "bg-[#1f2937] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                : "bg-gray-100 text-black placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-400"
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className={`p-3 rounded-full transition-all shadow-md ${
              text.trim()
                ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            }`}
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}