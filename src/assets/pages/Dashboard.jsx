import React, { useContext, useEffect, useState } from "react";

import Card from "../components/Card";

import {
  Activity,
  Calculator,
  ChartBar,
  File,
  HistoryIcon,
  Home,
  MessageCircle,
  NewspaperIcon,
  PlayIcon,
  Sparkles,
  Trash2Icon,
  UploadCloud,
  Video,
  ShoppingBag,
  GraduationCap,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";

import {
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";

import { db } from "../../firebase/config";

import SmartFeed from "../components/SmartFeed";

import DonationPopupSystem from "../components/DonationPopup";

const Dashboard = ({ dark }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);

  /* ---------------- FETCH CGPA ---------------- */

  useEffect(() => {
    if (user) {
      fetchRecords(user);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecords = async (user) => {
    if (!user) return;

    const q = query(
      collection(db, "cgpaTracker"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setRecords(data);
    setLoading(false);
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "cgpaTracker", id));

      setRecords((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- SORT ---------------- */

  const sortedRecords = [...records].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    return bTime - aTime;
  });

  /* ---------------- STATS ---------------- */

  const dashboard = {
    totalRecords: records.length,

    bestCGPA: records.length
      ? Math.max(
          ...records.map((r) => Number(r.cgpa) || 0)
        )
      : 0,

    avgCGPA: records.length
      ? (
          records.reduce(
            (a, b) => a + Number(b.cgpa),
            0
          ) / records.length
        ).toFixed(2)
      : 0,

    lastCGPA: sortedRecords.length
      ? sortedRecords[0].cgpa
      : 0,
  };

  /* ---------------- STYLES ---------------- */

  const sectionCard = dark
    ? "bg-[#111827] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div className="py-3 px-4 md:px-6 md:pt-20 w-full">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="font-black text-2xl md:text-3xl">
          Welcome Back,{" "}
          <span className="text-indigo-500">
            {user?.displayName || "Student"}
          </span>{" "}
          👋
        </h1>

        <p className="opacity-70 mt-1 text-sm">
          Manage your studies, marketplace & student
          tools in one place.
        </p>
      </div>

      {/* OVERVIEW */}
      <div
        className={`${sectionCard} p-5 rounded-3xl mb-6`}
      >
        <h2 className="font-bold mb-5 flex items-center gap-2 text-lg">
          <TrendingUp
            size={22}
            className="text-indigo-500"
          />
          Dashboard Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div
            className={`p-4 rounded-2xl ${
              dark
                ? "bg-gray-800"
                : "bg-gray-100"
            }`}
          >
            <p className="text-xs opacity-60">
              Total Records
            </p>

            <h2 className="font-black text-2xl mt-1">
              {dashboard.totalRecords}
            </h2>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              dark
                ? "bg-gray-800"
                : "bg-gray-100"
            }`}
          >
            <p className="text-xs opacity-60">
              Best CGPA
            </p>

            <h2 className="font-black text-2xl mt-1 text-green-500">
              {dashboard.bestCGPA}
            </h2>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              dark
                ? "bg-gray-800"
                : "bg-gray-100"
            }`}
          >
            <p className="text-xs opacity-60">
              Average CGPA
            </p>

            <h2 className="font-black text-2xl mt-1">
              {dashboard.avgCGPA}
            </h2>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              dark
                ? "bg-gray-800"
                : "bg-gray-100"
            }`}
          >
            <p className="text-xs opacity-60">
              Latest CGPA
            </p>

            <h2 className="font-black text-2xl mt-1 text-indigo-500">
              {dashboard.lastCGPA}
            </h2>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div className="space-y-6">

        {/* ACADEMIC */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="text-indigo-500" />

            <h2 className="font-bold text-xl">
              Academic Tools
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Card
              url={"/GPA"}
              dark={dark}
              background={"bg-[#601b9b]"}
              icon={<Calculator />}
              title={"GPA Calculator"}
              description={
                "Calculate and track your GPA"
              }
            />

            <Card
              url={"/CGPA"}
              dark={dark}
              background={"bg-red-500"}
              icon={<Activity />}
              title={"CGPA Tracker"}
              description={
                "Track your CGPA across semesters"
              }
            />

            <Card
              url={"/questions"}
              dark={dark}
              background={"bg-[#4234a5]"}
              icon={<File />}
              title={"Past Questions"}
              description={
                "Browse and download past questions"
              }
            />

            <Card
              url={"/lecturenotesmarketplace"}
              dark={dark}
              background={"bg-yellow-500"}
              icon={<UploadCloud />}
              title={"Lecture Notes"}
              description={
                "Upload & share lecture materials"
              }
            />
          </div>
        </div>

        {/* LEARNING */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-pink-500" />

            <h2 className="font-bold text-xl">
              Learning Resources
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

            <Card
              url={"/tutorialmarketplace"}
              dark={dark}
              background={"bg-green-700"}
              icon={<Video />}
              title={"Tutorial Videos"}
              description={
                "Watch tutorial videos from students"
              }
            />

            <Card
              url={"/tutorials"}
              dark={dark}
              background={"bg-pink-600"}
              icon={<PlayIcon />}
              title={"Video Player"}
              description={
                "Watch educational videos directly"
              }
            />
          </div>
        </div>

        {/* MARKETPLACE */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="text-emerald-500" />

            <h2 className="font-bold text-xl">
              Student Marketplace
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

            <Card
              url={"/hostelmarketplace"}
              dark={dark}
              background={"bg-indigo-500"}
              icon={<Home />}
              title={"Hostel Marketplace"}
              description={
                "Find verified hostels near campus"
              }
            />

            <Card
              url={"/studentmarketplace"}
              dark={dark}
              background={"bg-emerald-600"}
              icon={<ShoppingBag />}
              title={"Student Marketplace"}
              description={
                "Buy & sell items, assignments and more"
              }
            />
          </div>
        </div>

        {/* SMART FEATURES */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-500" />

            <h2 className="font-bold text-xl">
              Smart Features
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

            <Card
              url={"/ai"}
              dark={dark}
              background={"bg-black"}
              icon={<Sparkles />}
              title={"AI Study Assistant"}
              description={
                "Instant explanations and study help"
              }
            />

            <Card
              url={"/community"}
              dark={dark}
              background={"bg-amber-900"}
              icon={<MessageCircle />}
              title={"Community Chat"}
              description={
                "WhatsApp-style student discussion rooms"
              }
            />

            <Card
              url={"/newsfeed"}
              dark={dark}
              background={"bg-blue-500"}
              icon={<NewspaperIcon />}
              title={"Smart Newsfeed"}
              description={
                "News, tech & opportunities curated for you"
              }
            />
          </div>
        </div>
      </div>

      {/* SMART FEED */}
      <div className="mt-7">
        <SmartFeed dark={dark} />
      </div>

      {/* CGPA HISTORY */}
      <div
        className={`${sectionCard} p-5 rounded-3xl mt-7`}
      >
        <h2 className="font-bold mb-5 flex items-center gap-2 text-lg">
          <HistoryIcon className="text-red-500" />
          CGPA History
        </h2>

        {loading && (
          <p className="opacity-60">Loading...</p>
        )}

        {!loading && records.length === 0 && (
          <p className="text-sm opacity-60">
            No saved records yet
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {records.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border ${
                dark
                  ? "border-white/10 bg-white/5"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-indigo-500 text-lg">
                  CGPA: {r.cgpa}
                </h2>

                <button
                  onClick={() =>
                    handleDelete(r.id)
                  }
                  className="text-red-500 hover:scale-110 transition"
                >
                  <Trash2Icon size={18} />
                </button>
              </div>

              <div className="mt-3 text-sm opacity-70 space-y-1">
                {r.semesters?.map((s, i) => (
                  <p key={i}>
                    {s.name} — {s.units} units (
                    {s.gpa})
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DONATION */}
      <DonationPopupSystem dark={dark} />

      <div className="h-10 hidden md:block" />
    </div>
  );
};

export default Dashboard;