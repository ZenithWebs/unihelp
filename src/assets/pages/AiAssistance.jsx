import { useState, useEffect, useRef, useMemo } from "react";

import {
  Brain,
  Send,
  User,
  Sparkles,
  Loader2,
  Lightbulb,
  CheckCircle2,
  BookCopyIcon,
  TargetIcon,
  BrainIcon,
  Plus,
  Crown,
  X,
  FileText,
  MessageSquare,
  ShieldCheck,
  Zap,
  Bot,
  Trash2,
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

const AIAssistant = ({ dark = true }) => {
  /* =========================================================
      STATES
  ========================================================= */

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I'm your AI assistant. Upload a PDF or ask me anything about your courses, CGPA, assignments or exams.",
    },
  ]);

  const [chatId, setChatId] =
    useState(null);

  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [pdfChunks, setPdfChunks] =
    useState([]);

  const [activeDoc, setActiveDoc] =
    useState(null);

  const [tokens, setTokens] = useState(0);

  const [warning, setWarning] =
    useState("");

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const chatRef = useRef(null);

  const controllerRef = useRef(null);

  /* =========================================================
      THEME
  ========================================================= */

  const bg = dark
    ? "bg-[#070b14] text-white"
    : "bg-[#f4f7fb] text-gray-900";

  const card = dark
    ? "bg-[#101826] border border-white/10"
    : "bg-white border border-gray-200";

  const inputBg = dark
    ? "bg-[#1b2435] border-white/10 text-white placeholder:text-gray-500"
    : "bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-400";

  const bubbleAi = dark
    ? "bg-[#1b2435] text-white"
    : "bg-gray-100 text-gray-900";

  /* =========================================================
      TOKENS
  ========================================================= */

  const loadTokens = async () => {
    if (!auth.currentUser) return;

    try {
      const tokenRef = doc(
        db,
        "userTokens",
        auth.currentUser.uid
      );

      const snap = await getDoc(tokenRef);

      if (!snap.exists()) {
        await setDoc(tokenRef, {
          userId: auth.currentUser.uid,
          balance: 0,
        });

        setTokens(0);
      } else {
        setTokens(
          snap.data()?.balance || 0
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    if (tokens <= 50 && tokens > 0) {
      setWarning(
        "⚠️ Low tokens remaining. Please top up."
      );
    } else {
      setWarning("");
    }
  }, [tokens]);

  /* =========================================================
      AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* =========================================================
      SAVE CHAT
  ========================================================= */

  const saveChat = async (msgs) => {
    if (!auth.currentUser) return;

    const cleanMessages = msgs.map(
      (m) => ({
        role: m?.role || "ai",
        text: m?.text || "",
      })
    );

    try {
      if (!chatId) {
        const newChat = await addDoc(
          collection(db, "aiChats"),
          {
            userId:
              auth.currentUser.uid,
            messages: cleanMessages,
            createdAt: new Date(),
          }
        );

        setChatId(newChat.id);
      } else {
        await setDoc(
          doc(db, "aiChats", chatId),
          {
            userId:
              auth.currentUser.uid,
            messages: cleanMessages,
            updatedAt: new Date(),
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================================================
      LOAD CHAT
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
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const lastChat = snap.docs[0];

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveChat(messages);
    }, 1200);

    return () =>
      clearTimeout(timeout);
  }, [messages]);

  /* =========================================================
      PDF
  ========================================================= */

  const splitIntoChunks = (
    text,
    size = 1000
  ) => {
    const chunks = [];

    let current = "";

    text.split(" ").forEach((word) => {
      if (
        (current + word).length > size
      ) {
        chunks.push(current);

        current = word;
      } else {
        current += " " + word;
      }
    });

    if (current) chunks.push(current);

    return chunks;
  };

  const extractPDFText = async (
    file
  ) => {
    const reader = new FileReader();

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
                  (item) => item.str
                );

              fullText +=
                strings.join(" ") + "\n";
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

        reader.readAsArrayBuffer(file);
      }
    );
  };

  const handleFileUpload = async (
    e
  ) => {
    const selected =
      e.target.files[0];

    if (!selected) return;

    if (
      selected.type !==
      "application/pdf"
    ) {
      alert("Only PDF allowed");

      return;
    }

    setLoading(true);

    try {
      const { chunks } =
        await extractPDFText(
          selected
        );

      setPdfChunks(chunks);

      setActiveDoc(selected.name);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: `📄 Uploaded: ${selected.name}`,
        },
        {
          role: "ai",
          text: "✅ PDF processed successfully. Ask me anything about the document.",
        },
      ]);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* =========================================================
      STOP GENERATION
  ========================================================= */

  const stopGeneration = () => {
    controllerRef.current?.abort();

    setLoading(false);
  };

  /* =========================================================
      CLEAR CHAT
  ========================================================= */

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        text: "👋 Chat cleared. Ask me anything.",
      },
    ]);

    setActiveDoc(null);

    setPdfChunks([]);
  };

  /* =========================================================
      SEND MESSAGE
  ========================================================= */

  const handleSend = async () => {
    if (!input.trim() || loading)
      return;

    const COST_PER_MESSAGE = 18;

    if (
      tokens < COST_PER_MESSAGE
    ) {
      setShowUpgrade(true);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "🚫 Not enough tokens. Please top up.",
        },
      ]);

      return;
    }

    const userMsg = {
      role: "user",
      text: input,
    };

    const updatedMessages = [
      ...messages,
      userMsg,
    ];

    setMessages(updatedMessages);

    setInput("");

    setLoading(true);

    try {
      let contextText = "";

      if (pdfChunks.length > 0) {
        contextText = pdfChunks
          .slice(0, 3)
          .join("\n");
      }

      const token =
        await auth.currentUser?.getIdToken();

      const API_URL =
        import.meta.env.VITE_API_URL;

      const res = await fetch(
        `${API_URL}/api/ai/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            messages:
              updatedMessages.slice(
                -6
              ),

            context: contextText,
          }),

          signal:
            controllerRef.current
              ?.signal,
        }
      );

      const data =
        await res.json();

      if (!res.ok)
        throw new Error(
          data.error || "Error"
        );

      const aiReply = {
        role: "ai",
        text: data.reply,
      };

      const finalMessages = [
        ...updatedMessages,
        aiReply,
      ];

      setMessages(finalMessages);

      await saveChat(
        finalMessages
      );

      await loadTokens();
    } catch (err) {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Server error. Try again.",
        },
      ]);
    }

    setLoading(false);
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

        tx_ref:
          Date.now().toString(),

        amount: 600,

        currency: "NGN",

        payment_options:
          "card,banktransfer,ussd",

        customer: {
          email:
            auth.currentUser
              ?.email,

          name:
            auth.currentUser
              ?.displayName ||
            "User",
        },

        customizations: {
          title:
            "UniHelp AI Tokens",

          description:
            "Buy AI tokens",

          logo: Logo,
        },
      }),
      [auth.currentUser]
    );

  const handlePayment =
    useFlutterwave(
      flutterwaveConfig
    );

  const payNow = () => {
    handlePayment({
      callback: async (
        response
      ) => {
        closePaymentModal();

        try {
          const API_URL =
            import.meta.env
              .VITE_API_URL;

          await fetch(
            `${API_URL}/api/ai/verify-payment`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                transaction_id:
                  response.transaction_id,
              }),
            }
          );

          await loadTokens();

          setShowUpgrade(false);

          alert(
            "✅ Tokens added successfully"
          );
        } catch (err) {
          console.log(err);
        }
      },

      onClose: () => {},
    });
  };

  /* =========================================================
      QUICK ACTIONS
  ========================================================= */

  const quickActions = [
    {
      icon: BookCopyIcon,
      label: "Summarize",
      text: "Summarize this document",
    },

    {
      icon: TargetIcon,
      label: "Key Points",
      text: "List key points from this document",
    },

    {
      icon: BrainIcon,
      label: "Explain",
      text: "Explain this document simply",
    },

    {
      icon: Zap,
      label: "Quiz Me",
      text: "Create quiz questions",
    },
  ];


  return (
    <div
      className={`min-h-screen w-full ${bg} md:pt-14 overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-6">

        <div
          className={`${card} rounded-3xl p-4 sm:p-5 md:p-7 mb-4 md:mb-6 backdrop-blur-xl shadow-2xl`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* LEFT */}

            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Brain className="w-7 h-7" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    AI Assistant
                  </h1>

                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold flex items-center gap-1">
                    <Sparkles size={12} />
                    Smart AI
                  </div>
                </div>

                <p className="opacity-70 text-sm sm:text-base mt-1">
                  Smart academic assistant
                  for PDFs, assignments,
                  CGPA & learning support
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">

              {/* TOKENS */}

              <div
                className={`rounded-2xl p-4 min-w-32.5 ${
                  dark
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : "bg-indigo-50 border border-indigo-100"
                }`}
              >
                <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                  <Zap size={14} />
                  TOKENS
                </div>

                <h2 className="text-2xl font-black text-indigo-500">
                  {tokens}
                </h2>
              </div>

              {/* MESSAGES */}

              <div
                className={`rounded-2xl p-4 min-w-32.5 ${
                  dark
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-green-50 border border-green-100"
                }`}
              >
                <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                  <MessageSquare
                    size={14}
                  />
                  MESSAGES
                </div>

                <h2 className="text-2xl font-black text-green-500">
                  {Math.floor(
                    tokens / 18
                  )}
                </h2>
              </div>

            </div>
          </div>

          {/* WARNING */}

          {warning && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
              {warning}
            </div>
          )}
        </div>

        {/* =========================================================
            QUICK ACTIONS
        ========================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-6">
          {quickActions.map(
            (item, index) => (
              <button
                key={index}
                onClick={() =>
                  setInput(item.text)
                }
                className={`${card} rounded-2xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left shadow-lg`}
              >
                <item.icon className="text-indigo-500 mb-3 w-6 h-6" />

                <h3 className="font-bold text-sm sm:text-base">
                  {item.label}
                </h3>

                <p className="text-xs opacity-60 mt-1">
                  Quick AI prompt
                </p>
              </button>
            )
          )}
        </div>

        {/* =========================================================
            ACTIVE PDF
        ========================================================= */}

        {activeDoc && (
          <div
            className={`${card} rounded-2xl p-4 mb-4 md:mb-6 flex items-center gap-3 shadow-lg`}
          >
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <FileText className="text-green-500" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm sm:text-base">
                Active PDF
              </p>

              <p className="text-xs sm:text-sm opacity-70 truncate">
                {activeDoc}
              </p>
            </div>

            <CheckCircle2 className="text-green-500 shrink-0" />
          </div>
        )}

        {/* =========================================================
            CHAT CONTAINER
        ========================================================= */}

        <div
          className={`${card} rounded-3xl overflow-hidden shadow-2xl`}
        >

          {/* TOP BAR */}

          <div
            className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${
              dark
                ? "border-white/10"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="text-indigo-500" />

              <div>
                <h2 className="font-bold text-sm sm:text-base">
                  Conversation
                </h2>

                <p className="text-[11px] sm:text-xs opacity-60">
                  Ask anything academically
                </p>
              </div>
            </div>

            <button
              onClick={clearChat}
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* =========================================================
              MESSAGES
          ========================================================= */}

          <div
            ref={chatRef}
            className="h-[58vh] sm:h-[60vh] overflow-y-auto px-3 sm:px-4 md:px-6 py-5 space-y-5"
          >
            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 items-end max-w-[97%] sm:max-w-[90%] md:max-w-[78%] ${
                      msg.role ===
                      "user"
                        ? "flex-row-reverse"
                        : ""
                    }`}
                  >

                    {/* AVATAR */}

                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.role ===
                        "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {msg.role ===
                      "user" ? (
                        <User size={18} />
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>

                    {/* MESSAGE */}

                    <div
                      className={`px-4 py-3 sm:px-5 sm:py-4 rounded-3xl text-sm sm:text-[15px] leading-relaxed shadow-lg whitespace-pre-wrap wrap-break-words ${
                        msg.role ===
                        "user"
                          ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-br-md"
                          : `${bubbleAi} rounded-bl-md`
                      }`}
                    >
                      {msg.text}
                    </div>

                  </div>
                </div>
              )
            )}

            {/* LOADING */}

            {loading && (
              <div className="flex items-center gap-3 text-sm opacity-70">
                <Loader2
                  className="animate-spin text-indigo-500"
                  size={18}
                />

                <span>
                  AI is thinking...
                </span>

                <button
                  onClick={
                    stopGeneration
                  }
                  className="text-red-400 text-xs"
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* =========================================================
              INPUT AREA
          ========================================================= */}

          <div
            className={`border-t p-3 sm:p-4 ${
              dark
                ? "border-white/10"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">

              {/* FILE BUTTON */}

              <label className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition flex items-center justify-center text-white shadow-lg cursor-pointer shrink-0">
                <Plus className="w-5 h-5" />

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={
                    handleFileUpload
                  }
                  className="hidden"
                />
              </label>

              {/* INPUT */}

              <input
                type="text"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleSend()
                }
                className={`flex-1 h-12 rounded-2xl px-4 border outline-none text-sm sm:text-base ${inputBg}`}
              />

              {/* SEND */}

              <button
                onClick={handleSend}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition flex items-center justify-center text-white shadow-lg shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>

            </div>

            {/* TIP */}

            <div className="mt-4 flex items-start gap-3 text-xs sm:text-sm opacity-70">
              <Lightbulb
                size={16}
                className="text-yellow-500 shrink-0 mt-0.5"
              />

              <p className="leading-relaxed">
                Try prompts like
                “Explain this topic”,
                “Generate exam
                questions”, or “Teach
                me like a beginner”.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          UPGRADE MODAL
      ========================================================= */}

      {showUpgrade && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-3">
          <div
            className={`${card} w-full max-w-md rounded-3xl p-6 relative shadow-2xl animate-in fade-in zoom-in duration-300`}
          >

            {/* CLOSE */}

            <button
              onClick={() =>
                setShowUpgrade(
                  false
                )
              }
              className="absolute top-4 right-4 opacity-60 hover:opacity-100"
            >
              <X size={20} />
            </button>

            <div className="text-center">

              {/* ICON */}

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto flex items-center justify-center text-white shadow-xl">
                <Crown className="w-10 h-10" />
              </div>

              {/* TITLE */}

              <h2 className="text-2xl font-black mt-5">
                Upgrade Tokens
              </h2>

              <p className="text-sm opacity-70 mt-2 leading-relaxed">
                Continue chatting
                with AI by purchasing
                more tokens.
              </p>

              {/* CARD */}

              <div
                className={`mt-6 rounded-3xl p-5 border ${
                  dark
                    ? "bg-[#1b2435] border-white/10"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-lg font-bold">
                  AI Premium Pack
                </p>

                <h1 className="text-5xl font-black text-indigo-500 mt-2">
                  1500
                </h1>

                <p className="opacity-60 text-sm">
                  Tokens
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-semibold">
                  <ShieldCheck
                    size={15}
                  />
                  ₦600 only
                </div>
              </div>

              {/* BUTTON */}

              <button
                onClick={payNow}
                className="w-full mt-6 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition text-white font-bold"
              >
                Buy Tokens
              </button>

              <button
                onClick={() =>
                  setShowUpgrade(
                    false
                  )
                }
                className="mt-4 text-sm opacity-60"
              >
                Maybe later
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;