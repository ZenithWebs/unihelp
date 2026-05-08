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

import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

import Logo from "../images/Logo_Dark.png";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const AIAssistant = ({ dark }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I'm your AI assistant. Upload a PDF or ask me anything about your courses, CGPA, assignments or exams.",
    },
  ]);

  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [pdfChunks, setPdfChunks] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  const [tokens, setTokens] = useState(0);
  const [warning, setWarning] = useState("");

  const [showUpgrade, setShowUpgrade] = useState(false);

  const chatRef = useRef(null);
  const controllerRef = useRef(null);

  /* ------------------------------------------------ */
  /* THEME */
  /* ------------------------------------------------ */

  const bg = dark
    ? "bg-[#070b14] text-white"
    : "bg-[#f4f7fb] text-gray-900";

  const card = dark
    ? "bg-[#101826] border border-white/10"
    : "bg-white border border-gray-200";

  const inputBg = dark
    ? "bg-[#1b2435] border-white/10 text-white"
    : "bg-gray-100 border-gray-300 text-gray-900";

  /* ------------------------------------------------ */
  /* TOKENS */
  /* ------------------------------------------------ */

  const loadTokens = async () => {
    if (!auth.currentUser) return;

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
      setTokens(snap.data().balance || 0);
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

  /* ------------------------------------------------ */
  /* AUTO SCROLL */
  /* ------------------------------------------------ */

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* ------------------------------------------------ */
  /* CHAT SAVE */
  /* ------------------------------------------------ */

  const saveChat = async (msgs) => {
    if (!auth.currentUser) return;

    const cleanMessages = msgs.map((m) => ({
      role: m?.role || "ai",
      text: m?.text || "",
    }));

    try {
      if (!chatId) {
        const newChat = await addDoc(
          collection(db, "aiChats"),
          {
            userId: auth.currentUser.uid,
            messages: cleanMessages,
            createdAt: new Date(),
          }
        );

        setChatId(newChat.id);
      } else {
        await setDoc(doc(db, "aiChats", chatId), {
          userId: auth.currentUser.uid,
          messages: cleanMessages,
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ------------------------------------------------ */
  /* LOAD CHAT */
  /* ------------------------------------------------ */

  const loadChat = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "aiChats"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const lastChat = snap.docs[0];

      setChatId(lastChat.id);
      setMessages(lastChat.data().messages);
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveChat(messages);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [messages]);

  /* ------------------------------------------------ */
  /* PDF */
  /* ------------------------------------------------ */

  const splitIntoChunks = (
    text,
    size = 1000
  ) => {
    const chunks = [];
    let current = "";

    text.split(" ").forEach((word) => {
      if ((current + word).length > size) {
        chunks.push(current);
        current = word;
      } else {
        current += " " + word;
      }
    });

    if (current) chunks.push(current);

    return chunks;
  };

  const extractPDFText = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedArray = new Uint8Array(
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
            const page = await pdf.getPage(i);

            const content =
              await page.getTextContent();

            const strings = content.items.map(
              (item) => item.str
            );

            fullText +=
              strings.join(" ") + "\n";
          }

          resolve({
            chunks: splitIntoChunks(fullText),
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (
      selected.type !== "application/pdf"
    ) {
      alert("Only PDF allowed");
      return;
    }

    setLoading(true);

    try {
      const { chunks } =
        await extractPDFText(selected);

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

  /* ------------------------------------------------ */
  /* SEND */
  /* ------------------------------------------------ */

  const stopGeneration = () => {
    controllerRef.current?.abort();
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const COST_PER_MESSAGE = 18;

    if (tokens < COST_PER_MESSAGE) {
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
        const relevant = pdfChunks
          .slice(0, 3)
          .join("\n");

        contextText = relevant;
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
              updatedMessages.slice(-6),
            context: contextText,
          }),
        }
      );

      const data = await res.json();

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

      await saveChat(finalMessages);

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

  /* ------------------------------------------------ */
  /* PAYMENT */
  /* ------------------------------------------------ */

  const flutterwaveConfig = useMemo(
    () => ({
      public_key:
        import.meta.env.VITE_FLW_PUBLIC_KEY,

      tx_ref: Date.now().toString(),

      amount: 600,

      currency: "NGN",

      payment_options:
        "card,banktransfer,ussd",

      customer: {
        email:
          auth.currentUser?.email,
        name:
          auth.currentUser
            ?.displayName || "User",
      },

      customizations: {
        title: "UniHelp AI Tokens",
        description: "Buy AI tokens",
        logo: Logo,
      },
    }),
    [auth.currentUser]
  );

  const handlePayment =
    useFlutterwave(flutterwaveConfig);

  const payNow = () => {
    handlePayment({
      callback: async (response) => {
        closePaymentModal();

        try {
          const API_URL =
            import.meta.env.VITE_API_URL;

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

  return (
<div
  className={`min-h-screen ${bg} px-2 sm:px-4 md:px-6 py-3 md:py-6`}
>
  <div className="max-w-7xl mx-auto">

    {/* HEADER */}
    <div
      className={`${card} rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-7 mb-4 md:mb-6`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        {/* LEFT */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">
              AI Assistant
            </h1>

            <p className="opacity-70 text-xs sm:text-sm md:text-base mt-1 wrap-break-words">
              Smart academic assistant for PDFs,
              assignments, CGPA & learning support
            </p>
          </div>
        </div>

        {/* TOKEN CARDS */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">

          <div
            className={`rounded-2xl p-3 sm:p-4 min-w-0 ${
              dark
                ? "bg-indigo-500/10 border border-indigo-500/20"
                : "bg-indigo-50 border border-indigo-100"
            }`}
          >
            <p className="text-[10px] sm:text-xs opacity-60">
              Tokens
            </p>

            <h2 className="text-xl sm:text-2xl font-black text-indigo-500 truncate">
              {tokens}
            </h2>
          </div>

          <div
            className={`rounded-2xl p-3 sm:p-4 min-w-0 ${
              dark
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-green-50 border border-green-100"
            }`}
          >
            <p className="text-[10px] sm:text-xs opacity-60">
              Messages Left
            </p>

            <h2 className="text-xl sm:text-2xl font-black text-green-500 truncate">
              {Math.floor(tokens / 18)}
            </h2>
          </div>
        </div>
      </div>

      {/* WARNING */}
      {warning && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 text-xs sm:text-sm">
          {warning}
        </div>
      )}
    </div>

    {/* QUICK ACTIONS */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-6">
      {[
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
      ].map((item, index) => (
        <button
          key={index}
          onClick={() => setInput(item.text)}
          className={`${card} rounded-2xl p-3 sm:p-4 hover:scale-[1.02] active:scale-[0.98] transition text-left`}
        >
          <item.icon className="text-indigo-500 mb-2 w-5 h-5 sm:w-6 sm:h-6" />

          <h3 className="font-bold text-sm sm:text-base">
            {item.label}
          </h3>
        </button>
      ))}
    </div>

    {/* ACTIVE DOCUMENT */}
    {activeDoc && (
      <div
        className={`${card} rounded-2xl p-3 sm:p-4 mb-4 md:mb-6 flex items-center gap-3 overflow-hidden`}
      >
        <FileText className="text-green-500 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm sm:text-base">
            Active PDF
          </p>

          <p className="text-xs sm:text-sm opacity-70 truncate">
            {activeDoc}
          </p>
        </div>

        <CheckCircle2 className="text-green-500 shrink-0" />
      </div>
    )}

    {/* CHAT CONTAINER */}
    <div
      className={`${card} rounded-2xl md:rounded-3xl overflow-hidden`}
    >
      {/* TOP */}
      <div
        className={`flex items-center gap-3 px-4 sm:px-5 py-4 border-b ${
          dark
            ? "border-white/10"
            : "border-gray-200"
        }`}
      >
        <MessageSquare className="text-indigo-500 shrink-0" />

        <div className="min-w-0">
          <h2 className="font-bold text-sm sm:text-base">
            Conversation
          </h2>

          <p className="text-[11px] sm:text-xs opacity-60 truncate">
            Ask anything academically
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={chatRef}
        className="h-[58vh] sm:h-[60vh] overflow-y-auto px-3 sm:px-4 md:px-6 py-4 space-y-5"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`flex gap-2 sm:gap-3 items-end max-w-[97%] sm:max-w-[90%] md:max-w-[78%] ${
                msg.role === "user"
                  ? "flex-row-reverse"
                  : ""
              }`}
            >
              {/* AVATAR */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              {/* BUBBLE */}
              <div
                className={`px-4 py-3 sm:px-5 sm:py-4 rounded-3xl text-xs sm:text-sm md:text-[15px] leading-relaxed shadow-sm wrap-break-words whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : dark
                    ? "bg-[#1b2435] rounded-bl-md"
                    : "bg-gray-100 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-70">
            <Loader2
              className="animate-spin shrink-0"
              size={16}
            />

            <span>AI is thinking...</span>

            <button
              onClick={stopGeneration}
              className="text-red-400 text-xs"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div
        className={`border-t p-3 sm:p-4 ${
          dark
            ? "border-white/10"
            : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">

          {/* FILE BUTTON */}
          <label className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center text-white shrink-0 cursor-pointer">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* INPUT */}
          <input
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" && handleSend()
            }
            className={`flex-1 h-11 sm:h-12 rounded-2xl px-4 text-sm sm:text-base border outline-none min-w-0 ${inputBg}`}
          />

          {/* SEND */}
          <button
            onClick={handleSend}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center text-white shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* TIP */}
        <div className="mt-4 flex items-start gap-2 sm:gap-3 text-[11px] sm:text-sm opacity-70">
          <Lightbulb
            size={16}
            className="text-yellow-500 shrink-0 mt-0.5"
          />

          <p className="leading-relaxed">
            Try prompts like “Explain this topic”,
            “Generate exam questions”, or “Teach me
            like a beginner”.
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* UPGRADE MODAL */}
  {showUpgrade && (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-3">
      <div
        className={`${card} w-full max-w-md rounded-3xl p-5 sm:p-6 relative animate-in fade-in zoom-in duration-300`}
      >
        <button
          onClick={() =>
            setShowUpgrade(false)
          }
          className="absolute top-4 right-4 opacity-60 hover:opacity-100"
        >
          <X size={20} />
        </button>

        <div className="text-center">

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 mx-auto flex items-center justify-center text-white shadow-xl">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-5">
            Upgrade Tokens
          </h2>

          <p className="text-xs sm:text-sm opacity-70 mt-2 leading-relaxed">
            Continue chatting with AI by purchasing
            more tokens.
          </p>

          <div
            className={`mt-5 rounded-3xl p-4 sm:p-5 border ${
              dark
                ? "bg-[#1b2435] border-white/10"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-base sm:text-lg font-bold">
              AI Premium Pack
            </p>

            <h1 className="text-4xl sm:text-5xl font-black text-indigo-500 mt-2">
              1500
            </h1>

            <p className="opacity-60 text-sm">
              Tokens
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-xs sm:text-sm font-semibold">
              <ShieldCheck size={15} />
              ₦600 only
            </div>
          </div>

          <button
            onClick={payNow}
            className="w-full mt-6 h-11 sm:h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-sm sm:text-base"
          >
            Buy Tokens
          </button>

          <button
            onClick={() =>
              setShowUpgrade(false)
            }
            className="mt-4 text-xs sm:text-sm opacity-60"
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