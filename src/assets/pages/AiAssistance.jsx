import { useState, useEffect, useRef } from "react";
import {
  Brain,
  Send,
  User,
  Sparkles,
  Loader2,
  Lightbulb,
  Link2Icon,
  LucideActivity,
  TypeOutline,
  CheckCircle2Icon,
  CheckCircleIcon,
  CheckCircle2,
  BrainCogIcon,
  BrainIcon,
  TargetIcon,
  BookCopyIcon,
  Plus,
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
  updateDoc,
  increment,
   getDoc,
} from "firebase/firestore";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { ref } from "firebase/storage";
import Logo from '../images/Logo_Dark.png'
import { useMemo } from "react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const AIAssistant = ({ dark }) => {

  
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I'm your AI assistant. Upload your document or Ask me anything about your courses, CGPA, or past questions.",
    },
  ]);

  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileText, setFileText] = useState("");
  const [file, setFile] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [warning, setWarning] = useState('')
  const chatRef = useRef(null);
  const controllerRef = useRef(null);
  const [pdfChunks, setPdfChunks] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [tokens, setTokens] = useState(0);

const loadTokens = async () => {
  if (!auth.currentUser) return;

  const ref = doc(db, "userTokens", auth.currentUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      userId: auth.currentUser.uid,
      balance: 0,
    });

    setTokens(0);
  } else {
    setTokens(snap.data().balance || 0);
  }
};


  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  
  const saveChat = async (msgs) => {
  if (!auth.currentUser) return;

  // 🔥 CLEAN DATA (NO undefined allowed)
  const cleanMessages = msgs.map((m) => ({
    role: m?.role || "ai",
    text: m?.text || "",
  }));

  try {
    if (!chatId) {
      const newChat = await addDoc(collection(db, "aiChats"), {
        userId: auth.currentUser.uid,
        messages: cleanMessages,
        createdAt: new Date(),
      });
      setChatId(newChat.id);
    } else {
      await setDoc(doc(db, "aiChats", chatId), {
        userId: auth.currentUser.uid,
        messages: cleanMessages,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.log("Save error:", err);
  }
};

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

  const splitIntoChunks = (text, size = 1000) => {
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

useEffect(() => {
  loadTokens();
}, []);


  const stopGeneration = () => {
  controllerRef.current?.abort();
  setLoading(false);
};
  
  
  const extractPDFText = async (file) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const typedArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          const strings = content.items.map((item) => item.str);
          fullText += strings.join(" ") + "\n";
        }

        const chunks = splitIntoChunks(fullText);

        resolve({ text: fullText, chunks });
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

  if (selected.type !== "application/pdf") {
    alert("Only PDF allowed");
    return;
  }

  setFile(selected);
  setLoading(true);

  try {
    const { text, chunks } = await extractPDFText(selected);

    setFileText(text);
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
        text: `✅ Document loaded. You can now ask questions about it.`,
      },
    ]);
  } catch (err) {
    console.log(err);
  }

  setLoading(false);
};


 const handleSend = async () => {
  if (loading) return;
  if (!input.trim()) return;

  const COST_PER_MESSAGE = 18;


if (tokens < COST_PER_MESSAGE) {
  setShowUpgrade(true);

  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      text: "🚫 You don’t have enough tokens. Please purchase to continue.",
    },
  ]);

  return;
}

const freshSnap = await getDoc(ref);
const freshBalance = freshSnap.data()?.balance || 0;

if (freshBalance < COST_PER_MESSAGE) {
  setShowUpgrade(true);
  return;
}

  const newMessages = [...messages, { role: "user", text: input }];
  const recentMessages = newMessages.slice(-6);

  setMessages(newMessages);
  setInput("");
  setLoading(true);

  if (controllerRef.current) {
    controllerRef.current.abort();
  }

  controllerRef.current = new AbortController();
  const signal = controllerRef.current.signal;

  try {
    let contextText = "";

    if (pdfChunks.length > 0) {
      const q = input.toLowerCase();

      const relevant = pdfChunks
        .map((chunk) => ({
          chunk,
          score: chunk.toLowerCase().includes(q) ? 1 : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.chunk);

      contextText =
        relevant.length > 0
          ? relevant.join("\n")
          : pdfChunks.slice(0, 2).join("\n");
    }

    // 🔐 TOKEN (for future auth backend)
    const token = await auth.currentUser?.getIdToken();
      const API_URL = import.meta.env.VITE_API_URL;

      const res = await fetch(`${API_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify({
        messages: recentMessages,
        context: contextText,
      }),
      signal,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Server error");

    const aiText = data.reply;

    const ref = doc(db, "userTokens", auth.currentUser.uid);

if (!res.ok) {
  if (data.error === "NOT_ENOUGH_TOKENS") {
    setShowUpgrade(true);
    return;
  }

  throw new Error(data.error);
}


await loadTokens();
    const updated = [
      ...newMessages,
      { role: "ai", text: aiText },
    ];

    setMessages(updated);

    await saveChat(updated);

  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request stopped");
    } else {
      console.log(err);

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Server error. Try again." },
      ]);
    }
  }

  setLoading(false);
};



useEffect(() => {
  if (!messages.length) return;

  const timeout = setTimeout(() => {
    saveChat(messages);
  }, 1500);

  return () => clearTimeout(timeout);
}, [messages]);

const flutterwaveConfig = useMemo(() => ({
  public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
  tx_ref: Date.now().toString(),
  amount: 600,
  currency: "NGN",
  payment_options: "card,banktransfer,ussd",
  customer: {
    email: auth.currentUser?.email,
    name: auth.currentUser?.displayName || "User",
  },
  customizations: {
    title: "UniHelp AI Tokens",
    description: "Buy AI tokens",
    logo: Logo,
  },
  meta: {
    userId: auth.currentUser?.uid,
    tokens: 1500,
  },
}), [auth.currentUser]);
const handlePayment = useFlutterwave(flutterwaveConfig);

      const payNow = () => {
  console.log("Opening payment...");

  handlePayment({
    callback: (response) => {
      console.log(response);
      closePaymentModal();
      alert("Payment processing...");
    },
    onClose: () => {
      console.log("Payment closed");
    },
  });
};


            useEffect(() => {
      if (tokens <= 50 && tokens > 0) {
        setWarning("⚠️ Low tokens. Consider topping up.");
      } else {
        setWarning("");
      }
    }, [tokens]);
  return (
    <div
      className={`min-h-screen w-full px-4 py-2 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col h-[84vh]">

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500 rounded-xl text-white">
            <Brain />
          </div>

          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm opacity-70">
              Ask questions, get explanations, and boost your learning
            </p>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl flex gap-3 mb-4 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <Lightbulb className="text-yellow-500 mt-1" size={20} />
          <p className="text-sm">
            Tip: Ask things like "Explain this topic", "Solve this question", or "How can I improve my CGPA?"
          </p>
        </div>

          <div>
            <p className="text-xs opacity-70">
            ≈ {Math.floor(tokens / 18)} messages remaining
          </p>
          <span className="text-red-500">
            {warning}
          </span>
          </div>
        
        

          {activeDoc && (
              <div className="text-xs flex gap-1.5 items-center opacity-70 mt-2">
                <CheckCircle2 className="text-green-400"/> Active Document: {activeDoc}
              </div>
            )}

        <div
          ref={chatRef}
          className={`flex-1 overflow-y-auto p-4 rounded-xl space-y-4 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-2 max-w-[75%] ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 justify-center items-center rounded-full ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>

                <div
                  className={`p-3 rounded-xl text-sm w-[70%] ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white"
                      : dark
                      ? "bg-gray-800"
                      : "bg-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm opacity-70">
              <Loader2 className="animate-spin" size={16} />
              AI is thinking...
              <button
                onClick={stopGeneration}
                className="ml-3 text-red-400 text-xs"
              >
                Stop
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center max-md:flex-col p-2.5">


          {activeDoc && (
            <div className="flex gap-2 mt-2 text-xs">
              <button
                onClick={() => setInput("Summarize this document")}
                className="flex gap-1.5 items-center font-medium px-3 py-1 bg-indigo-500 text-white rounded"
              >
                <BookCopyIcon/> Summarize
              </button>

              <button
                onClick={() => setInput("List key points from this document")}
                className="flex gap-1.5 items-center font-medium px-3 py-1 bg-green-500 text-white rounded"
              >
                <TargetIcon/> Key Points
              </button>

              <button
                onClick={() => setInput("Explain this document like I'm a beginner")}
                className="flex gap-1.5 items-center font-medium px-3 py-1 bg-purple-500 text-white rounded"
              >
                <BrainIcon/> Explain Simply
              </button>
            </div>
          )}

        </div>
          

          

        <div
          className={`p-2 rounded-xl flex w-full items-center gap-1 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <label className="flex gap-1.5 h-10 w-10 justify-center items-center bg-indigo-600 rounded shrink-0 text-white cursor-pointer text-sm ">
              <Plus size={23}/>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          <input
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`max-w-[70%] p-3 rounded border ${
              dark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300"
            }`}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="bg-indigo-500 flex justify-center items-center h-12 w-12 text-white rounded shrink-0 hover:bg-indigo-600 transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      {showUpgrade && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className={` ${dark ?'bg-[#111827]' : 'bg-white'} p-6 rounded-2xl w-[90%] max-w-md shadow-xl`}>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-yellow-500" />
        <h2 className="text-lg font-bold">Upgrade Tokens</h2>
      </div>

      <p className="text-sm opacity-70 mb-4">
        "You don’t have enough tokens. Purchase to continue using AI."
      </p>


        <div className={`p-3 rounded-xl border ${dark ? 'border-gray-700 bg-slate-800':'border-gray-300 bg-slate-200'}  text-center`}>
          <p className="font-semibold text-2xl">AI Pack</p>
          <p className="text-lg opacity-70 text-amber-600">1,500 tokens</p>
          <p className="font-bold">₦600</p>
        </div>

      <button
        className="w-full mt-4 bg-indigo-500 text-white py-2 rounded-lg"
        onClick={() => {
          console.log("clicked");
          payNow();
        }}>
        Buy Tokens
      </button>

      <button
        className="w-full mt-2 text-sm opacity-70"
        onClick={() => setShowUpgrade(false)}
      >
        Close
      </button>

    </div>
  </div>
)}
    </div>
  );
};

export default AIAssistant;