import { useState } from "react";
import {
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
} from "lucide-react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { auth } from "./../../firebase/config";

const config = {
  public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,

  tx_ref: Date.now().toString(),

  amount: 5000,

  currency: "NGN",

  payment_options: "card,banktransfer,ussd",

  customer: {
    email: auth.currentUser?.email,
    name: auth.currentUser?.displayName || "UniHelp User",
  },

  customizations: {
    title: "UniHelp Premium",
    description: "Premium Subscription",
    logo: "/Favicon.png",
  },
};

const handleFlutterPayment =
  useFlutterwave(config);

  
export default function PremiumSubscriptionPage({
  dark = true,
}) {
  const [billing, setBilling] = useState("monthly");

  /* ---------------- PRICING ---------------- */
  const plans = [
  {
    id: "starter",
    name: "Student Plus",
    price:
      billing === "monthly" ? "₦2,500" : "₦24,000",

    description:
      "Better visibility and premium student tools.",

    features: [
      "Access premium tutorials",
      "Download exclusive past questions",
      "Priority hostel search visibility",
      "Verified student badge",
      "Reduced ads experience",
      "Bookmark unlimited hostels",
      "Early access to new features",
    ],

    popular: false,

    gradient:
      "from-slate-500 to-slate-700",
  },

  {
    id: "pro",
    name: "Tutor Pro",
    price:
      billing === "monthly" ? "₦5,000" : "₦50,000",

    description:
      "Built for tutors and creators earning on UniHelp.",

    features: [
      "Upload unlimited tutorials",
      "Sell premium PDFs & videos",
      "Advanced earnings dashboard",
      "Withdrawal priority approval",
      "Affiliate commission boost",
      "Featured tutorial promotion",
      "Student analytics insights",
      "Priority support",
    ],

    popular: true,

    gradient:
      "from-indigo-500 to-purple-600",
  },

  {
    id: "elite",
    name: "Hostel & Business",
    price:
      billing === "monthly" ? "₦10,000" : "₦100,000",

    description:
      "Perfect for hostel agents and campus businesses.",

    features: [
      "Featured hostel placement",
      "Verified hostel badge",
      "Unlimited hostel uploads",
      "Boost listing visibility",
      "Direct student lead access",
      "Business analytics dashboard",
      "UniHelp ad placements",
      "Priority moderation approval",
      "Dedicated support access",
    ],

    popular: false,

    gradient:
      "from-yellow-500 to-orange-500",
  },
];

  /* ---------------- STYLES ---------------- */
  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f3f6ff] text-slate-900";

  const glass = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-200";

  return (
    <div
      className={`min-h-screen w-full overflow-hidden relative ${bg}`}
    >
      {/* BACKGROUND GLOWS */}
      <div className="absolute top-[-200px] left-[-100px] h-[400px] w-[400px] bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-[-200px] right-[-100px] h-[400px] w-[400px] bg-purple-500/20 blur-3xl rounded-full" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20">
        {/* HERO */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-xl">
            <Crown size={18} />
            UniHelp Premium
          </div>

          <h1 className="text-4xl md:text-7xl font-black mt-8 leading-tight">
            Unlock The
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {" "}
              Full Power{" "}
            </span>
            Of UniHelp 🚀
          </h1>

          <p className="opacity-70 text-lg md:text-xl mt-6 max-w-3xl mx-auto">
            Get access to premium tools, advanced
            monetization, priority listings, analytics,
            and exclusive student features.
          </p>

          {/* BILLING TOGGLE */}
          <div
            className={`mt-10 inline-flex items-center p-2 rounded-2xl ${glass}`}
          >
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                billing === "monthly"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : ""
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                billing === "yearly"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : ""
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid lg:grid-cols-3 gap-8 mt-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative overflow-hidden rounded-[32px] p-8 transition-all duration-300 hover:-translate-y-2 ${glass} ${
                plan.popular
                  ? "scale-105 border-indigo-500 shadow-2xl shadow-indigo-500/20"
                  : ""
              }`}
            >
              {/* POPULAR */}
              {plan.popular && (
                <div className="absolute top-5 right-5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg">
                  MOST POPULAR
                </div>
              )}

              {/* GLOW */}
              <div
                className={`absolute top-[-100px] right-[-100px] h-52 w-52 bg-gradient-to-br ${plan.gradient} opacity-20 blur-3xl rounded-full`}
              />

              <div className="relative z-10">
                {/* PLAN ICON */}
                <div
                  className={`h-16 w-16 rounded-3xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-xl`}
                >
                  <Sparkles className="text-white" />
                </div>

                {/* TITLE */}
                <h2 className="text-3xl font-black mt-6">
                  {plan.name}
                </h2>

                <p className="opacity-70 mt-2">
                  {plan.description}
                </p>

                {/* PRICE */}
                <div className="mt-8 flex items-end gap-2">
                  <h3 className="text-5xl font-black">
                    {plan.price}
                  </h3>

                  <span className="opacity-60 mb-2">
                    /{billing === "monthly"
                      ? "mo"
                      : "yr"}
                  </span>
                </div>

                {/* FEATURES */}
                <div className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3"
                    >
                      <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check
                          size={14}
                          className="text-green-500"
                        />
                      </div>

                      <span className="opacity-90">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* BUTTON */}
                <button
                  className={`w-full mt-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
                      : dark
                      ? "bg-white/10 hover:bg-white/20"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FEATURES SECTION */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            {
              icon: ShieldCheck,
              title: "Verified Access",
              desc: "Get verified badges and trusted account status.",
            },

            {
              icon: Zap,
              title: "Faster Growth",
              desc: "Boost hostel visibility and tutor reach instantly.",
            },

            {
              icon: Star,
              title: "Exclusive Features",
              desc: "Unlock premium tools before everyone else.",
            },
          ].map((item, i) => {
            const Icon = item.icon;

            return (
              <div
                key={i}
                className={`${glass} rounded-[30px] p-8`}
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Icon className="text-white" />
                </div>

                <h3 className="text-2xl font-black mt-6">
                  {item.title}
                </h3>

                <p className="opacity-70 mt-3">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          className={`mt-24 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden ${glass}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black">
              Ready To Go Premium?
            </h2>

            <p className="opacity-70 mt-5 max-w-2xl mx-auto text-lg">
              Join thousands of students already using
              UniHelp Premium to grow faster and earn
              more.
            </p>

            <button className="mt-10 px-10 py-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold shadow-2xl hover:scale-105 transition-all duration-300">
              Upgrade Now 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}