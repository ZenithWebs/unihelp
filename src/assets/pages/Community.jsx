import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";

/**
 * Campus Chat UI (Firestore-ready)
 * Props:
 *  - dark: boolean (theme toggle)
 */
export default function Community({ dark }) {
  const [messages, setMessages] = useState([
    { id: 1, user: "System", text: "Welcome to Campus Chat 👋" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      user: "You",
      text: input,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // 🔥 Here you later connect Firestore:
    // addDoc(collection(db, "chats/general/messages"), newMsg)
  };

  const theme = dark
    ? {
        bg: "bg-[#0b0f19]",
        panel: "bg-[#121a2a]",
        text: "text-white",
        subtext: "text-gray-400",
        input: "bg-[#1a2235] text-white",
        border: "border-gray-700",
        bubbleMe: "bg-blue-600 text-white",
        bubbleOther: "bg-gray-800 text-white",
      }
    : {
        bg: "bg-gray-100",
        panel: "bg-white",
        text: "text-black",
        subtext: "text-gray-500",
        input: "bg-gray-100 text-black",
        border: "border-gray-200",
        bubbleMe: "bg-blue-500 text-white",
        bubbleOther: "bg-gray-200 text-black",
      };

  return (
    <div className={` w-full flex flex-col ${theme.bg} ${theme.text}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme.border} ${theme.panel}`}
      >
        <h1 className="text-lg font-bold">Campus Community Chat</h1>
        <p className={`text-sm ${theme.subtext}`}>Connect with students in real-time</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow
              ${msg.user === "You" ? theme.bubbleMe + " ml-auto" : theme.bubbleOther}
            `}
          >
            <p className="font-semibold text-xs opacity-70">
              {msg.user}
            </p>
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${theme.border} ${theme.panel} flex gap-2`}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className={`flex-1 px-3 py-2 rounded-lg outline-none ${theme.input}`}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg flex items-center"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
