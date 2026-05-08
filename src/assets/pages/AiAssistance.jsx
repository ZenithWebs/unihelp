import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

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
  PanelLeftOpen,
  Gift,
} from "lucide-react";

import {
  auth,
  db,
} from "../../firebase/config";

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
  updateDoc,
  increment,
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

/* =========================================================
    CONFIG
========================================================= */

const FREE_DAILY_MESSAGES = 5;

const COST_PER_MESSAGE = 18;

const AIAssistant = ({
  dark = true,
}) => {
  /* =========================================================
      STATES
  ========================================================= */

  const [messages, setMessages] =
    useState([
      {
        role: "ai",
        text: "Hi 👋 I'm your AI assistant. Upload a PDF or ask me anything about your courses, assignments, CGPA or exams.",
      },
    ]);

  const [chatId, setChatId] =
    useState(null);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [pdfChunks, setPdfChunks] =
    useState([]);

  const [activeDoc, setActiveDoc] =
    useState(null);

  const [tokens, setTokens] =
    useState(0);

  const [freeMessages, setFreeMessages] =
    useState(0);

  const [warning, setWarning] =
    useState("");

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const chatRef = useRef(null);

  const controllerRef =
    useRef(null);

  /* =========================================================
      THEME
  ========================================================= */

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f4f7fb] text-gray-900";

  const card = dark
    ? "bg-white/[0.03] border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200";

  const softCard = dark
    ? "bg-white/[0.04]"
    : "bg-gray-100";

  const inputBg = dark
    ? "bg-[#121a2d] border-white/10 text-white placeholder:text-gray-500"
    : "bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-400";

  const bubbleAi = dark
    ? "bg-[#121a2d] text-white"
    : "bg-gray-100 text-gray-900";

  /* =========================================================
      LOAD TOKENS
  ========================================================= */

  const loadTokens = async () => {
    if (!auth.currentUser) return;

    try {
      const tokenRef = doc(
        db,
        "userTokens",
        auth.currentUser.uid
      );

      const snap =
        await getDoc(tokenRef);

      if (!snap.exists()) {
        await setDoc(tokenRef, {
          userId:
            auth.currentUser.uid,
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

  /* =========================================================
      DAILY FREE MESSAGES
  ========================================================= */

  const loadDailyMessages =
    async () => {
      if (!auth.currentUser) return;

      try {
        const dailyRef = doc(
          db,
          "dailyFreeMessages",
          auth.currentUser.uid
        );

        const snap =
          await getDoc(dailyRef);

        const now = new Date();

        const today = `${now.getFullYear()}-${
          now.getMonth() + 1
        }-${now.getDate()}`;

        /*
            FIRST TIME USER
        */

        if (!snap.exists()) {
          await setDoc(dailyRef, {
            userId:
              auth.currentUser.uid,

            date: today,

            remaining:
              FREE_DAILY_MESSAGES,

            createdAt:
              serverTimestamp(),
          });

          setFreeMessages(
            FREE_DAILY_MESSAGES
          );

          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: `🎁 You received ${FREE_DAILY_MESSAGES} free AI messages for today.`,
            },
          ]);

          return;
        }

        const data = snap.data();

        /*
            NEW DAY RESET
        */

        if (data.date !== today) {
          await updateDoc(
            dailyRef,
            {
              date: today,

              remaining:
                FREE_DAILY_MESSAGES,
            }
          );

          setFreeMessages(
            FREE_DAILY_MESSAGES
          );

          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: `🎁 Your ${FREE_DAILY_MESSAGES} free daily AI messages have been refreshed.`,
            },
          ]);
        } else {
          setFreeMessages(
            data.remaining || 0
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

  /* =========================================================
      USE EFFECTS
  ========================================================= */

  useEffect(() => {
    loadTokens();

    loadDailyMessages();
  }, []);

  useEffect(() => {
    if (
      tokens <= 50 &&
      tokens > 0
    ) {
      setWarning(
        "⚠️ Low tokens remaining. Please top up."
      );
    } else {
      setWarning("");
    }
  }, [tokens]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top:
        chatRef.current
          .scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* =========================================================
      SAVE CHAT
  ========================================================= */

  const saveChat = async (
    msgs
  ) => {
    if (!auth.currentUser) return;

    const cleanMessages =
      msgs.map((m) => ({
        role: m?.role || "ai",
        text: m?.text || "",
      }));

    try {
      if (!chatId) {
        const newChat =
          await addDoc(
            collection(
              db,
              "aiChats"
            ),
            {
              userId:
                auth.currentUser.uid,

              messages:
                cleanMessages,

              createdAt:
                new Date(),
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

            messages:
              cleanMessages,

            updatedAt:
              new Date(),
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

        setChatId(
          lastChat.id
        );

        setMessages(
          lastChat.data()
            .messages
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
    const timeout =
      setTimeout(() => {
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

  const extractPDFText =
    async (file) => {
      const reader =
        new FileReader();

      return new Promise(
        (
          resolve,
          reject
        ) => {
          reader.onload =
            async () => {
              try {
                const typedArray =
                  new Uint8Array(
                    reader.result
                  );

                const pdf =
                  await pdfjsLib.getDocument(
                    typedArray
                  ).promise;

                let fullText =
                  "";

                for (
                  let i = 1;
                  i <=
                  pdf.numPages;
                  i++
                ) {
                  const page =
                    await pdf.getPage(
                      i
                    );

                  const content =
                    await page.getTextContent();

                  const strings =
                    content.items.map(
                      (
                        item
                      ) =>
                        item.str
                    );

                  fullText +=
                    strings.join(
                      " "
                    ) + "\n";
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
          "Only PDF allowed"
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

        setMessages(
          (prev) => [
            ...prev,
            {
              role: "user",
              text: `📄 Uploaded: ${selected.name}`,
            },
            {
              role: "ai",
              text: "✅ PDF processed successfully. Ask me anything about the document.",
            },
          ]
        );
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

  /* =========================================================
      STOP
  ========================================================= */

  const stopGeneration =
    () => {
      controllerRef.current?.abort();

      setLoading(false);
    };

  /* =========================================================
      CLEAR
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
      SEND
  ========================================================= */

  const handleSend = async () => {
    if (
      !input.trim() ||
      loading
    )
      return;

    /*
        USE FREE MESSAGES FIRST
    */

    const usingFreeMessage =
      freeMessages > 0;

    /*
        NO FREE MESSAGE LEFT
        USE TOKENS
    */

    if (
      !usingFreeMessage &&
      tokens <
        COST_PER_MESSAGE
    ) {
      setShowUpgrade(true);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "🚫 You have used all your free daily messages and don't have enough tokens.",
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

    setMessages(
      updatedMessages
    );

    setInput("");

    setLoading(true);

    try {
      /*
          DEDUCT FREE MESSAGE
      */

      if (
        usingFreeMessage
      ) {
        const newRemaining =
          freeMessages - 1;

        setFreeMessages(
          newRemaining
        );

        const dailyRef = doc(
          db,
          "dailyFreeMessages",
          auth.currentUser.uid
        );

        await updateDoc(
          dailyRef,
          {
            remaining:
              newRemaining,
          }
        );
      }

      let contextText = "";

      if (
        pdfChunks.length > 0
      ) {
        contextText =
          pdfChunks
            .slice(0, 3)
            .join("\n");
      }

      const token =
        await auth.currentUser?.getIdToken();

      const API_URL =
        import.meta.env
          .VITE_API_URL;

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

            context:
              contextText,
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
          data.error ||
            "Error"
        );

      const aiReply = {
        role: "ai",
        text: data.reply,
      };

      const finalMessages = [
        ...updatedMessages,
        aiReply,
      ];

      setMessages(
        finalMessages
      );

      await saveChat(
        finalMessages
      );

      /*
          LOAD TOKENS
          ONLY IF NOT USING FREE
      */

      if (
        !usingFreeMessage
      ) {
        await loadTokens();
      }
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
      callback:
        async (
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
                method:
                  "POST",

                headers:
                  {
                    "Content-Type":
                      "application/json",
                  },

                body: JSON.stringify(
                  {
                    transaction_id:
                      response.transaction_id,
                  }
                ),
              }
            );

            await loadTokens();

            setShowUpgrade(
              false
            );

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
      className={`min-h-screen md:pt-20 overflow-hidden ${bg}`}
    >
      {/* BG */}

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[320px] h-[320px] bg-indigo-600/20 blur-[120px] rounded-full" />

        <div className="absolute bottom-[-100px] right-[-100px] w-[320px] h-[320px] bg-violet-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="flex h-screen">

        {/* SIDEBAR */}

        <div
          className={`fixed lg:relative z-500 top-16 left-0 h-full w-[290px] transition-transform duration-300 ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } ${card}`}
        >
          <div className="flex flex-col h-full">

            {/* HEADER */}

            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <Brain className="text-white" />
                </div>

                <div>
                  <h1 className="font-black text-xl">
                    UniHelp AI
                  </h1>

                  <p className="text-xs opacity-60">
                    Smart Assistant
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
                className="lg:hidden"
              >
                <X />
              </button>
            </div>

            {/* CONTENT */}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* FREE MESSAGES */}

              <div
                className={`${softCard} rounded-3xl p-4 border border-yellow-500/20`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-60">
                      FREE DAILY
                    </p>

                    <h2 className="text-3xl font-black text-yellow-400 mt-1">
                      {
                        freeMessages
                      }
                    </h2>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Gift className="text-yellow-400" />
                  </div>
                </div>

                <p className="text-xs opacity-60 mt-3">
                  Free users get 5
                  AI messages daily
                </p>
              </div>

              {/* TOKENS */}

              <div
                className={`${softCard} rounded-3xl p-4 border border-indigo-500/20`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-60">
                      TOKENS
                    </p>

                    <h2 className="text-3xl font-black text-indigo-400 mt-1">
                      {tokens}
                    </h2>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Zap className="text-indigo-400" />
                  </div>
                </div>

                <p className="text-xs opacity-60 mt-3">
                  Used after free
                  messages finish
                </p>
              </div>

              {/* QUICK ACTIONS */}

              <div className="space-y-3">
                {quickActions.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={index}
                      onClick={() =>
                        setInput(
                          item.text
                        )
                      }
                      className={`${softCard} w-full border border-white/10 rounded-2xl p-4 text-left hover:border-indigo-500/30 transition`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <item.icon className="text-indigo-400 w-5 h-5" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-sm">
                            {
                              item.label
                            }
                          </h3>

                          <p className="text-xs opacity-60 mt-1">
                            Quick AI
                            prompt
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>

              {/* ACTIVE PDF */}

              {activeDoc && (
                <div
                  className={`${softCard} rounded-3xl p-4 border border-green-500/20`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <FileText className="text-green-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        Active PDF
                      </p>

                      <p className="text-xs opacity-60 truncate mt-1">
                        {
                          activeDoc
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="p-4 border-t border-white/10">
              <button
                onClick={
                  clearChat
                }
                className="w-full h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        {/* MAIN */}

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* HEADER */}

          <div className="px-4 sm:px-6 py-4 border-b border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setSidebarOpen(
                      true
                    )
                  }
                  className="lg:hidden w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  <PanelLeftOpen />
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-3xl font-black">
                      AI Study
                      Assistant
                    </h1>

                    <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1">
                      <Sparkles size={12} />
                      GPT Powered
                    </div>
                  </div>

                  <p className="opacity-60 mt-1 text-xs sm:text-sm">
                    Learn faster
                    with AI
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowUpgrade(
                    true
                  )
                }
                className="h-11 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-xl flex items-center gap-2"
              >
                <Crown size={18} />
                Upgrade
              </button>

            </div>

            {warning && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
                {warning}
              </div>
            )}
          </div>

          {/* CHAT */}

          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6"
          >
            {messages.map(
              (
                msg,
                index
              ) => (
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
                    className={`flex gap-3 items-end max-w-[95%] md:max-w-[78%] ${
                      msg.role ===
                      "user"
                        ? "flex-row-reverse"
                        : ""
                    }`}
                  >
                    {/* AVATAR */}

                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        msg.role ===
                        "user"
                          ? "bg-gradient-to-br from-indigo-600 to-violet-600"
                          : "bg-gradient-to-br from-emerald-500 to-green-600"
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
                      className={`px-5 py-4 rounded-[28px] text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-xl ${
                        msg.role ===
                        "user"
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-md"
                          : `${bubbleAi} rounded-bl-md border border-white/5`
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
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-400" />
                </div>

                <div
                  className={`${bubbleAi} border border-white/5 rounded-2xl px-4 py-3`}
                >
                  AI is thinking...
                </div>

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

          {/* INPUT */}

          <div className="p-3 sm:p-5 border-t border-white/10 backdrop-blur-xl">

            <div
              className={`${card} rounded-[32px] p-3 shadow-2xl`}
            >
              <div className="flex items-end gap-3">

                {/* FILE */}

                <label className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white cursor-pointer shrink-0">
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

                <div className="flex-1">
                  <textarea
                    rows={1}
                    placeholder="Ask anything academically..."
                    value={input}
                    onChange={(
                      e
                    ) =>
                      setInput(
                        e.target
                          .value
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
                    className={`w-full resize-none rounded-2xl px-4 py-3 border outline-none text-sm sm:text-base ${inputBg}`}
                  />

                  <div className="flex items-center justify-between mt-3 px-1 gap-2">
                    <div className="flex items-center gap-2 text-xs opacity-60">
                      <Lightbulb
                        size={14}
                        className="text-yellow-400"
                      />

                      <span className="hidden sm:block">
                        Free users
                        get 5 AI
                        messages daily
                      </span>

                      <span className="sm:hidden">
                        5 free daily
                        AI chats
                      </span>
                    </div>

                    <div className="text-xs opacity-50">
                      Enter ↵
                    </div>
                  </div>
                </div>

                {/* SEND */}

                <button
                  onClick={
                    handleSend
                  }
                  disabled={
                    loading
                  }
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shrink-0 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}

      {showUpgrade && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center px-4">

          <div
            className={`${card} w-full max-w-md rounded-[32px] p-7 relative`}
          >
            <button
              onClick={() =>
                setShowUpgrade(
                  false
                )
              }
              className="absolute top-5 right-5 opacity-60"
            >
              <X size={20} />
            </button>

            <div className="text-center">

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto flex items-center justify-center text-white shadow-2xl">
                <Crown className="w-11 h-11" />
              </div>

              <h2 className="text-3xl font-black mt-6">
                Upgrade Tokens
              </h2>

              <p className="text-sm opacity-70 mt-3">
                You've used all
                your free daily
                messages.
              </p>

              <div
                className={`mt-7 rounded-[28px] p-6 border ${
                  dark
                    ? "bg-[#121a2d] border-white/10"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-semibold">
                  <Sparkles size={15} />
                  PREMIUM PACK
                </div>

                <h1 className="text-6xl font-black text-indigo-500 mt-3">
                  1500
                </h1>

                <p className="opacity-60 text-sm">
                  Tokens Included
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/10 text-green-400 text-sm font-bold">
                  <ShieldCheck
                    size={15}
                  />
                  ₦600 only
                </div>
              </div>

              <button
                onClick={payNow}
                className="w-full mt-7 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg"
              >
                Buy Tokens
              </button>

              <button
                onClick={() =>
                  setShowUpgrade(
                    false
                  )
                }
                className="mt-5 text-sm opacity-60"
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
