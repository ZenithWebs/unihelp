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
} from "firebase/firestore";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const AIAssistant = ({ dark }) => {

  
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I'm your AI assistant. Ask me anything about your courses, CGPA, or past questions.",
    },
  ]);

  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileText, setFileText] = useState("");
  const [file, setFile] = useState(null);
  const chatRef = useRef(null);
  const controllerRef = useRef(null);
  const [pdfChunks, setPdfChunks] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

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
  if (!input.trim()) return;

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
    score: chunk.toLowerCase().split(q).length,
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
  .map((x) => x.chunk);

      contextText =
        relevant.length > 0
          ? relevant.join("\n")
          : pdfChunks.slice(0, 2).join("\n");
    }

    const token = await auth.currentUser.getIdToken();

    const res = await fetch("http://localhost:3001/api/ai/chat", {
      method: "POST",
      signal: controllerRef.current.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: recentMessages || [],
        context: contextText || "",
      })
      
    });
    console.log("SEND:", {
      messages: recentMessages,
      context: contextText,
    });

    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();

    const aiText = data?.text || "⚠️ No response from AI";

    const updated = [
      ...newMessages,
      { role: "ai", text: aiText },
    ];

    setMessages(updated);
    await saveChat(updated);

  } catch (err) {
    console.log(err);

    setMessages((prev) => [
      ...prev,
      { role: "ai", text: "⚠️ Server error. Try again." },
    ]);
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

  return (
    <div
      className={`min-h-screen w-full px-4 py-6 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col h-[85vh]">

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
          className={`p-4 rounded-xl flex gap-3 mb-4 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <Lightbulb className="text-yellow-500 mt-1" />
          <p className="text-sm">
            Tip: Ask things like "Explain this topic", "Solve this question",
            or "How can I improve my CGPA?"
          </p>
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
          <div className="flex items-center gap-2">
            <label className="flex gap-1.5 h-10 w-25 justify-center items-center bg-indigo-600 rounded text-white cursor-pointer text-sm ">
              <Plus size={23}/> Upload
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

          </div>


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
          className={`mt-4 p-3 rounded-xl flex gap-2 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <input
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-1 p-3 rounded border ${
              dark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300"
            }`}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            className="bg-indigo-500 text-white px-4 rounded hover:bg-indigo-600 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;