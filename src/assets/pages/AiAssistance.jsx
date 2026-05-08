import { useState, useEffect, useRef, useMemo } from "react";

import {
  Send,
  User,
  Loader2,
  Plus,
  Crown,
  X,
  FileText,
  Sparkles,
  Trash2,
  Bot,
  Zap,
} from "lucide-react";

import { auth, db } from "../../firebase/config";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  useFlutterwave,
  closePaymentModal,
} from "flutterwave-react-v3";

import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

import Logo from "../images/Logo_Dark.png";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorker;

const FREE_DAILY_MESSAGES = 5;

const suggestions = [
  "Summarize this PDF",
  "Explain this topic simply",
  "Create quiz questions",
  "Help me prepare for exams",
];

const AIAssistant = ({ dark = true }) => {
  /* =========================================================
      STATES
  ========================================================= */

  const [messages, setMessages] =
    useState([
      {
        role: "ai",
        text: "Hi 👋 I'm your AI assistant. Upload a PDF or ask me anything.",
      },
    ]);

  const [chatId, setChatId] =
    useState(null);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [tokens, setTokens] =
    useState(0);

  const [freeLeft, setFreeLeft] =
    useState(FREE_DAILY_MESSAGES);

  const [pdfChunks, setPdfChunks] =
    useState([]);

  const [activeDoc, setActiveDoc] =
    useState(null);

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const chatRef = useRef(null);

  /* =========================================================
      THEME
  ========================================================= */

  const bg = dark
    ? "bg-[#0b0b0f] text-white"
    : "bg-[#fafafa] text-black";

  const borderColor = dark
    ? "border-white/10"
    : "border-black/10";

  const cardBg = dark
    ? "bg-[#161616]"
    : "bg-white";

  const inputBg = dark
    ? "bg-[#141414] border-white/10 text-white placeholder:text-gray-500"
    : "bg-white border-black/10 text-black placeholder:text-gray-400";

  /* =========================================================
      AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    chatRef.current?.scrollTo({
      top:
        chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* =========================================================
      LOAD USER DATA
  ========================================================= */

  const loadUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const ref = doc(
        db,
        "userTokens",
        auth.currentUser.uid
      );

      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          balance: 0,
          freeMessagesUsed: 0,
          freeMessagesDate: "",
        });

        setTokens(0);
        setFreeLeft(
          FREE_DAILY_MESSAGES
        );

        return;
      }

      const data = snap.data();

      const today = new Date()
        .toISOString()
        .split("T")[0];

      const savedDate =
        data.freeMessagesDate || "";

      let used =
        data.freeMessagesUsed || 0;

      if (savedDate !== today) {
        used = 0;

        await setDoc(
          ref,
          {
            freeMessagesUsed: 0,
            freeMessagesDate: today,
          },
          { merge: true }
        );
      }

      setTokens(
        data.balance || 0
      );

      setFreeLeft(
        Math.max(
          0,
          FREE_DAILY_MESSAGES -
            used
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  /* =========================================================
      SAVE CHAT
  ========================================================= */

  const saveChat = async (
    msgs
  ) => {
    if (!auth.currentUser) return;

    try {
      if (!chatId) {
        const newChat =
          await addDoc(
            collection(db, "aiChats"),
            {
              userId:
                auth.currentUser.uid,

              messages: msgs,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );

        setChatId(newChat.id);
      } else {
        await setDoc(
          doc(
            db,
            "aiChats",
            chatId
          ),
          {
            userId:
              auth.currentUser.uid,

            messages: msgs,

            updatedAt:
              serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================================================
      LOAD LAST CHAT
  ========================================================= */

  const loadChat = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "aiChats"),

        where(
          "userId",
          "==",
          auth.currentUser.uid
        ),

        orderBy(
          "createdAt",
          "desc"
        ),

        limit(1)
      );

      const snap =
        await getDocs(q);

      if (!snap.empty) {
        const lastChat =
          snap.docs[0];

        setChatId(lastChat.id);

        setMessages(
          lastChat.data().messages
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  /* =========================================================
      PDF FUNCTIONS
  ========================================================= */

  const splitIntoChunks = (
    text,
    size = 1200
  ) => {
    const chunks = [];

    let current = "";

    text.split(" ").forEach(
      (word) => {
        if (
          (
            current + word
          ).length > size
        ) {
          chunks.push(current);

          current = word;
        } else {
          current +=
            " " + word;
        }
      }
    );

    if (current)
      chunks.push(current);

    return chunks;
  };

  const extractPDFText = async (
    file
  ) => {
    const reader =
      new FileReader();

    return new Promise(
      (resolve, reject) => {
        reader.onload = async () => {
          try {
            const typedArray =
              new Uint8Array(
                reader.result
              );

            const pdf =
              await pdfjsLib.getDocument(
                typedArray
              ).promise;

            let fullText = "";

            for (
              let i = 1;
              i <= pdf.numPages;
              i++
            ) {
              const page =
                await pdf.getPage(i);

              const content =
                await page.getTextContent();

              const strings =
                content.items.map(
                  (item) =>
                    item.str
                );

              fullText +=
                strings.join(" ") +
                "\n";
            }

            resolve({
              chunks:
                splitIntoChunks(
                  fullText
                ),
            });
          } catch (err) {
            reject(err);
          }
        };

        reader.readAsArrayBuffer(
          file
        );
      }
    );
  };

  /* =========================================================
      HANDLE FILE
  ========================================================= */

  const handleFileUpload =
    async (e) => {
      const selected =
        e.target.files[0];

      if (!selected) return;

      if (
        selected.type !==
        "application/pdf"
      ) {
        alert(
          "Only PDF files are allowed"
        );
        return;
      }

      setLoading(true);

      try {
        const { chunks } =
          await extractPDFText(
            selected
          );

        setPdfChunks(chunks);

        setActiveDoc(
          selected.name
        );

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `✅ ${selected.name} uploaded successfully.`,
          },
        ]);
      } catch (err) {
        console.log(err);

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text:
              "⚠️ Failed to read PDF.",
          },
        ]);
      }

      setLoading(false);
    };

  /* =========================================================
      SEND MESSAGE
  ========================================================= */

  const handleSend = async () => {
    if (
      !input.trim() ||
      loading
    )
      return;

    if (!auth.currentUser) {
      alert(
        "Please login first"
      );
      return;
    }

    const userMessage = {
      role: "user",
      text: input.trim(),
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);

    setInput("");

    setLoading(true);

    try {
      let contextText = "";

      if (pdfChunks.length > 0) {
        contextText = pdfChunks
          .slice(0, 5)
          .join("\n\n");
      }

      const firebaseToken =
        await auth.currentUser.getIdToken(
          true
        );

      const API_URL =
        import.meta.env
          .VITE_API_URL;

      const response =
        await fetch(
          `${API_URL}/api/ai/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${firebaseToken}`,
            },

            body: JSON.stringify({
              messages:
                updatedMessages.slice(
                  -8
                ),

              context:
                contextText,
            }),
          }
        );

      const data =
        await response.json();

      /* =====================================
          FREE LIMIT
      ===================================== */

      if (
        response.status ===
          403 &&
        data.error ===
          "FREE_LIMIT_REACHED"
      ) {
        setShowUpgrade(true);

        setLoading(false);

        return;
      }

      /* =====================================
          SERVER ERROR
      ===================================== */

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Something went wrong"
        );
      }

      /* =====================================
          AI RESPONSE
      ===================================== */

      const aiReply = {
        role: "ai",
        text:
          data.reply ||
          "No response",
      };

      const finalMessages = [
        ...updatedMessages,
        aiReply,
      ];

      setMessages(finalMessages);

      /* =====================================
          UPDATE FREE
      ===================================== */

      if (data.freeMode) {
        setFreeLeft(
          data.freeLeft || 0
        );
      }

      if (
        typeof data.balance ===
        "number"
      ) {
        setTokens(data.balance);
      }
      await saveChat(
        finalMessages
      );
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            "⚠️ Failed to contact AI server.",
        },
      ]);
    }

    setLoading(false);
  };

  /* =========================================================
      CLEAR CHAT
  ========================================================= */

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        text: "👋 Chat cleared.",
      },
    ]);

    setPdfChunks([]);

    setActiveDoc(null);

    setChatId(null);
  };

  /* =========================================================
      PAYMENT
  ========================================================= */

  const flutterwaveConfig =
    useMemo(
      () => ({
        public_key:
          import.meta.env
            .VITE_FLW_PUBLIC_KEY,

        tx_ref: Date.now().toString(),

        amount: 600,

        currency: "NGN",

        payment_options:
          "card,banktransfer,ussd",

        customer: {
          email:
            auth.currentUser
              ?.email || "",

          name:
            auth.currentUser
              ?.displayName ||
            "User",
        },

        customizations: {
          title:
            "UniHelp AI Tokens",

          description:
            "Buy AI Tokens",

          logo: Logo,
        },

        meta: {
          userId:
            auth.currentUser
              ?.uid,

          tokens: 1500,
        },
      }),
      [auth.currentUser]
    );

  const handleFlutterPayment =
    useFlutterwave(
      flutterwaveConfig
    );

  const verifyPayment =
    async (
      transaction_id
    ) => {
      try {
        const API_URL =
          import.meta.env
            .VITE_API_URL;

        const res =
          await fetch(
            `${API_URL}/api/ai/verify-payment`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                transaction_id,
              }),
            }
          );

        const data =
          await res.json();

        if (data.success) {
          await loadUserData();

          setShowUpgrade(false);

          alert(
            `✅ ${data.tokensAdded} tokens added successfully`
          );
        } else {
          alert(
            "Payment verification failed"
          );
        }
      } catch (err) {
        console.log(err);

        alert(
          "Payment verification failed"
        );
      }
    };

  const payNow = () => {
    handleFlutterPayment({
      callback: async (
        response
      ) => {
        closePaymentModal();

        if (
          response.status ===
          "successful"
        ) {
          await verifyPayment(
            response.transaction_id
          );
        }
      },

      onClose: () => {},
    });
  };

  return (
    <div
      className={`w-full h-screen md:pt-20 overflow-hidden flex flex-col ${bg}`}
    >
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header
        className={`w-full border-b ${borderColor}`}
      >
        <div className="max-w-5xl mx-auto h-16 px-3 sm:px-5 flex items-center justify-between">
          {/* LEFT */}

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>

            <div>
              <h1 className="font-semibold text-sm sm:text-base">
                UniHelp AI
              </h1>

              <p className="text-xs opacity-50">
                Smart academic assistant
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-1">
            {/* FREE */}

            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl border ${borderColor} ${cardBg}`}
            >
              <Zap
                size={15}
                className="text-yellow-400"
              />

              <div className="flex items-center gap-1">
                <p className="text-[10px] opacity-50">
                  FREE
                </p>

                <h2 className="text-sm font-semibold">
                  {freeLeft}
                </h2>
              </div>
            </div>

            {/* TOKENS */}

            <div
              className={`flex items-center gap-1 px-3 py-2 rounded-2xl border ${borderColor} ${cardBg}`}
            >
              <Crown
                size={15}
                className="text-indigo-400"
              />

              <div className="flex items-center gap-1.5">
                <p className="text-[10px] opacity-50">
                  TOKENS
                </p>

                <h2 className="text-sm font-semibold">
                  {tokens}
                </h2>
              </div>
            </div>

            {/* CLEAR */}

            <button
              onClick={clearChat}
              className={`w-10 h-10 rounded-2xl border ${borderColor} ${cardBg} flex items-center justify-center`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          CHAT AREA
      ========================================================= */}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-4xl mx-auto px-3 sm:px-5 py-8">
            {/* EMPTY STATE */}

            {messages.length ===
              1 && (
              <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-[32px] bg-white text-black flex items-center justify-center">
                  <Sparkles size={40} />
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold text-center mt-8">
                  How can I help you?
                </h1>

                <p className="opacity-60 mt-4 text-center max-w-xl leading-7">
                  Upload PDFs, summarize notes,
                  explain topics and generate
                  quizzes with AI.
                </p>

                {/* SUGGESTIONS */}

                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
                  {suggestions.map(
                    (
                      item,
                      index
                    ) => (
                      <button
                        key={index}
                        onClick={() =>
                          setInput(
                            item
                          )
                        }
                        className={`p-4 rounded-2xl border ${borderColor} ${cardBg} text-left hover:scale-[1.01] transition`}
                      >
                        <p className="font-medium text-sm sm:text-base">
                          {item}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* MESSAGES */}

            <div className="space-y-7">
              {messages.map(
                (
                  msg,
                  index
                ) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {/* AI */}

                    {msg.role ===
                      "ai" && (
                      <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                        <Bot
                          size={18}
                        />
                      </div>
                    )}

                    {/* MESSAGE */}

                    <div
                      className={`max-w-[90%] sm:max-w-[80%] whitespace-pre-wrap break-words leading-7 text-[15px] ${
                        msg.role ===
                        "user"
                          ? "bg-white text-black px-5 py-3 rounded-[26px]"
                          : "pt-1"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* USER */}

                    {msg.role ===
                      "user" && (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                        <User
                          size={18}
                          className="text-white"
                        />
                      </div>
                    )}
                  </div>
                )
              )}

              {/* LOADING */}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center">
                    <Bot
                      size={18}
                    />
                  </div>

                  <div className="flex items-center gap-2 opacity-70">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            INPUT AREA
        ========================================================= */}

        <div
          className={`border-t ${borderColor}`}
        >
          <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4">
            {/* ACTIVE PDF */}

            {activeDoc && (
              <div
                className={`mb-3 inline-flex items-center gap-2 px-3 py-2 rounded-2xl border ${borderColor} ${cardBg}`}
              >
                <FileText
                  size={16}
                  className="text-green-400"
                />

                <span className="text-sm truncate max-w-[220px]">
                  {activeDoc}
                </span>
              </div>
            )}

            {/* INPUT */}

            <div
              className={`${inputBg} border rounded-[30px] px-2 py-2 flex items-end gap-2`}
            >
              {/* FILE */}

              <label className="w-11 h-11 rounded-2xl hover:bg-white/5 flex items-center justify-center cursor-pointer shrink-0">
                <Plus size={20} />

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={
                    handleFileUpload
                  }
                  className="hidden"
                />
              </label>

              {/* TEXTAREA */}

              <textarea
                rows={1}
                value={input}
                placeholder="Message AI Assistant..."
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={(
                  e
                ) => {
                  if (
                    e.key ===
                      "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();

                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent outline-none resize-none max-h-40 py-3 px-1 text-sm sm:text-base"
              />

              {/* SEND */}

              <button
                onClick={
                  handleSend
                }
                disabled={loading}
                className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={18}
                  />
                )}
              </button>
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-[11px] opacity-40">
                AI can make mistakes.
              </p>

              <p className="text-[11px] opacity-50">
                {freeLeft} free messages
                left
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================
          UPGRADE MODAL
      ========================================================= */}

      {showUpgrade && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`${inputBg} w-full max-w-md rounded-[32px] p-7 border relative`}
          >
            {/* CLOSE */}

            <button
              onClick={() =>
                setShowUpgrade(
                  false
                )
              }
              className="absolute top-5 right-5"
            >
              <X size={20} />
            </button>

            {/* CONTENT */}

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
                <Zap
                  size={40}
                  className="text-white"
                />
              </div>

              <h1 className="text-3xl font-bold mt-6">
                Upgrade AI Access
              </h1>

              <p className="text-sm opacity-60 mt-3 leading-7">
                You've used all your free AI
                messages for today.
              </p>

              {/* CARD */}

              <div
                className={`mt-7 rounded-3xl p-6 border ${borderColor} ${cardBg}`}
              >
                <h1 className="text-6xl font-black">
                  1500
                </h1>

                <p className="opacity-60 mt-2">
                  Tokens
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm">
                  ₦600 only
                </div>
              </div>

              {/* BUTTON */}

              <button
                onClick={payNow}
                className="w-full h-12 rounded-2xl bg-white text-black font-semibold mt-7"
              >
                Buy Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;