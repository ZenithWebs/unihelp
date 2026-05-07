import { useState } from "react";
import {
  AlertTriangle,
  FileWarning,
  Send,
} from "lucide-react";

export default function Report({ dark }) {
  const [category, setCategory] = useState("");
  const [reportedUser, setReportedUser] = useState("");
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!category || !details) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          category,
          reportedUser,
          details,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to submit report");
        return;
      }

      setSuccess("Report submitted successfully");

      setCategory("");
      setReportedUser("");
      setDetails("");

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
            Report an <span className="text-red-500">Issue</span>
          </h1>

          <p className="mt-3 opacity-70">
            Report abuse, scam, copyright issues or inappropriate content.
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
            {/* CATEGORY */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <AlertTriangle size={18} />
                Report Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-300 text-black"
                }`}
              >
                <option value="">Select category</option>

                <option value="Scam">Scam</option>

                <option value="Abuse">Abuse</option>

                <option value="Copyright">Copyright Violation</option>

                <option value="Harassment">Harassment</option>

                <option value="Spam">Spam</option>

                <option value="Other">Other</option>
              </select>
            </div>

            {/* USER */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <FileWarning size={18} />
                Reported User (Optional)
              </label>

              <input
                type="text"
                placeholder="Username or email"
                value={reportedUser}
                onChange={(e) => setReportedUser(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-red-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-red-500"
                }`}
              />
            </div>

            {/* DETAILS */}
            <div>
              <label className="mb-2 block font-medium">
                Report Details
              </label>

              <textarea
                rows={6}
                placeholder="Explain the issue clearly..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={`w-full p-4 rounded-xl border outline-none resize-none transition ${
                  dark
                    ? "bg-gray-900 border-gray-700 text-white focus:border-red-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-red-500"
                }`}
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-semibold transition ${
                loading
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Send size={18} />

                {loading ? "Submitting..." : "Submit Report"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}