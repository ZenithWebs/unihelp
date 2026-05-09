import {
  Users,
  Gift,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export default function AffiliateBanner({
  dark = false,
  referralCode = "CAMPUSFLOW50",
  earnings = 25000,
  referrals = 12,
  commission = "₦2,000 per referral",
  title = "Earn With CampusFlow 🚀",
  description = "Invite friends and earn commissions whenever they join or make payments on CampusFlow.",
}) {
  const [copied, setCopied] = useState(false);

  /* ---------------- COPY LINK ---------------- */
  const referralLink = `https://campusflow.app/ref/${referralCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- STYLES ---------------- */
  const glass = dark
    ? "bg-white/5 border border-white/10 text-white"
    : "bg-white border border-slate-200 text-slate-900";

  return (
    <div
      className={`relative overflow-hidden rounded-[32px] p-6 md:p-8 shadow-2xl backdrop-blur-xl ${glass}`}
    >
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-50px] right-[-50px] h-52 w-52 bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-[-50px] left-[-50px] h-52 w-52 bg-purple-500/20 blur-3xl rounded-full" />

      <div className="relative z-10">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          {/* LEFT CONTENT */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg">
              <Gift size={16} />
              Affiliate Program
            </div>

            <h2 className="text-3xl md:text-5xl font-black mt-5 leading-tight">
              {title}
            </h2>

            <p className="opacity-80 mt-4 text-base md:text-lg">
              {description}
            </p>

            {/* COMMISSION */}
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500/10 text-green-500 font-bold">
              <TrendingUp size={18} />
              {commission}
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4 min-w-[280px]">
            <div
              className={`rounded-3xl p-5 ${
                dark
                  ? "bg-white/5"
                  : "bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <Users className="text-indigo-500" />
                <span className="text-xs opacity-60">
                  Referrals
                </span>
              </div>

              <h3 className="text-3xl font-black mt-4">
                {referrals}
              </h3>
            </div>

            <div
              className={`rounded-3xl p-5 ${
                dark
                  ? "bg-white/5"
                  : "bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <Gift className="text-purple-500" />
                <span className="text-xs opacity-60">
                  Earnings
                </span>
              </div>

              <h3 className="text-3xl font-black mt-4">
                ₦{earnings.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        {/* REFERRAL BOX */}
        <div
          className={`mt-8 rounded-[28px] p-4 md:p-5 flex flex-col lg:flex-row gap-4 items-center justify-between ${
            dark
              ? "bg-white/5 border border-white/10"
              : "bg-slate-100 border border-slate-200"
          }`}
        >
          {/* LINK */}
          <div className="flex-1 w-full">
            <p className="text-sm opacity-70 mb-2">
              Your Referral Link
            </p>

            <div
              className={`w-full rounded-2xl px-4 py-4 break-all ${
                dark
                  ? "bg-[#0b1020]"
                  : "bg-white"
              }`}
            >
              {referralLink}
            </div>
          </div>

          {/* COPY BUTTON */}
          <button
            onClick={copyLink}
            className={`px-6 py-4 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg ${
              copied
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105"
            }`}
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}