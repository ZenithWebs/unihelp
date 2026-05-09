import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdsBanner({
  title = "Special Offer 🎉",
  description = "Get premium access to unlock more features on CampusFlow.",
  buttonText = "Learn More",
  buttonLink = "#",
  dark = false,
  autoSlide = false,
  slideInterval = 4000,
  ads = [],
  closable = true,
}) {
  const [closed, setClosed] = useState(false);
  const [current, setCurrent] = useState(0);

  /* ---------------- AUTO SLIDE ---------------- */
  useEffect(() => {
    if (!autoSlide || ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) =>
        prev === ads.length - 1 ? 0 : prev + 1
      );
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, ads.length, slideInterval]);

  if (closed) return null;

  /* ---------------- ACTIVE AD ---------------- */
  const activeAd =
    ads.length > 0
      ? ads[current]
      : {
          title,
          description,
          buttonText,
          buttonLink,
        };

  /* ---------------- STYLES ---------------- */
  const wrapper = dark
    ? "bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-white/10 text-white"
    : "bg-gradient-to-r from-indigo-100 to-purple-100 border border-slate-200 text-slate-900";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-xl ${wrapper}`}
    >
      {/* GLOW */}
      <div className="absolute top-[-40px] right-[-40px] h-40 w-40 bg-indigo-500/20 blur-3xl rounded-full" />

      {/* CLOSE BUTTON */}
      {closable && (
        <button
          onClick={() => setClosed(true)}
          className={`absolute top-4 right-4 p-2 rounded-xl transition ${
            dark
              ? "hover:bg-white/10"
              : "hover:bg-black/5"
          }`}
        >
          <X size={18} />
        </button>
      )}

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* LEFT */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
            <Megaphone size={24} className="text-white" />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-black">
              {activeAd.title}
            </h2>

            <p className="opacity-80 mt-1 max-w-2xl">
              {activeAd.description}
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <a
          href={activeAd.buttonLink}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300"
        >
          {activeAd.buttonText}
        </a>
      </div>

      {/* INDICATORS */}
      {ads.length > 1 && (
        <div className="flex items-center gap-2 mt-5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === i
                  ? "w-8 bg-indigo-500"
                  : dark
                  ? "w-2 bg-white/30"
                  : "w-2 bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}