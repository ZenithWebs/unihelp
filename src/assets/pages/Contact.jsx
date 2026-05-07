import { useState } from "react";
import { Mail, Send, User, MessageSquare } from "lucide-react";

export default function Contact({ dark }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !email || !subject || !message) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send message");
        return;
      }

      setSuccess("Message delivered successfully");

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");

    } catch (err) {
      console.log(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen px-6 py-24 transition-all duration-300 ${
        dark
          ? "bg-[#0b1120] text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">
            Contact <span className="text-indigo-500">Us</span>
          </h1>

          <p className="mt-3 opacity-70">
            Have a complaint, suggestion or feedback? Send us a message.
          </p>
        </div>

        {/* CARD */}
        <div
          className={`rounded-3xl p-8 shadow-xl border ${
            dark
              ? "bg-[#111827] border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          {/* ERROR */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-5 bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NAME */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <User size={18} />
                Full Name
              </label>

              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
                }`}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <Mail size={18} />
                Email Address
              </label>

              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
                }`}
              />
            </div>

            {/* SUBJECT */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <MessageSquare size={18} />
                Subject
              </label>

              <input
                type="text"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
                }`}
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="mb-2 font-medium block">
                Message
              </label>

              <textarea
                rows={6}
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none resize-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-indigo-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
                }`}
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-semibold transition ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Send size={18} />

                {loading ? "Sending..." : "Send Message"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}