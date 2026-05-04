import { useEffect, useState } from "react";
import { Heart, Gift } from "lucide-react";

export default function DonationPopupSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  const donationLink = "https://flutterwave.com/donate/yca6jqnjmagr";

  useEffect(() => {
    if (hasShownOnce) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasShownOnce(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasShownOnce]);

  return (
    <>
      {/* Floating Donate Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-25 right-5 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Gift size={18} />
        Donate
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Heart className="text-red-500" />
              <h2 className="text-lg font-bold">Support CampusFlow</h2>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-5">
              Help us keep CampusFlow running and improve learning tools for students.
            </p>

            {/* Donate Button */}
            <a
              href={donationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Gift size={18} />
              Donate via Flutterwave
            </a>

            {/* Footer */}
            <p className="text-xs text-gray-400 text-center mt-4">
              Every contribution helps improve education 🚀
            </p>
          </div>
        </div>
      )}
    </>
  );
}