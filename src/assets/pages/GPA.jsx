import {
  Calculator,
  X,
  LucideLightbulb,
  SaveIcon,
  Trash2Icon,
  LucideCalculator,
  Plus,
  BookOpen,
  Trophy,
  BarChart3,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import {
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const GPA = ({ dark }) => {
  const navigate = useNavigate();

  const emptyCourse = {
    title: "",
    code: "",
    unit: "",
    grade: "A",
  };

  const [courses, setCourses] = useState([emptyCourse]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [rating, setRating] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const gradeMap = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0,
  };

  /* ---------------------------------- */
  /* ADD COURSE */
  /* ---------------------------------- */

  const addCourse = () => {
    setCourses([...courses, emptyCourse]);
  };

  /* ---------------------------------- */
  /* REMOVE COURSE */
  /* ---------------------------------- */

  const removeCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);

    setCourses(updated.length ? updated : [emptyCourse]);
  };

  /* ---------------------------------- */
  /* UPDATE COURSE */
  /* ---------------------------------- */

  const updateCourse = (index, field, value) => {
    const updated = [...courses];

    if (field === "unit") {
      updated[index][field] =
        Number(value) > 0 ? Number(value) : "";
    } else {
      updated[index][field] = value;
    }

    setCourses(updated);
  };

  /* ---------------------------------- */
  /* GPA */
  /* ---------------------------------- */

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach((course) => {
      if (course.unit > 0) {
        totalPoints +=
          course.unit * gradeMap[course.grade];

        totalUnits += Number(course.unit);
      }
    });

    return totalUnits
      ? (totalPoints / totalUnits).toFixed(2)
      : "0.00";
  };

  const gpaValue = calculateGPA();

  /* ---------------------------------- */
  /* RESULT */
  /* ---------------------------------- */

  const handleResult = () => {
    const value = Number(gpaValue);

    if (value >= 4.5) {
      setRating("🏆 First Class");
    } else if (value >= 3.5) {
      setRating("💪 Second Class Upper");
    } else if (value >= 2.5) {
      setRating("👍 Second Class Lower");
    } else if (value >= 1.5) {
      setRating("🙂 Third Class");
    } else {
      setRating("⚠️ Probation");
    }

    setShowPopup(true);
  };

  /* ---------------------------------- */
  /* SUMMARY */
  /* ---------------------------------- */

  const calculateSummary = () => {
    let totalCourses = 0;
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach((course) => {
      if (course.unit > 0) {
        totalCourses += 1;
        totalUnits += Number(course.unit);

        totalPoints +=
          course.unit * gradeMap[course.grade];
      }
    });

    return {
      totalCourses,
      totalUnits,
      totalPoints,
    };
  };

  const summary = calculateSummary();

  /* ---------------------------------- */
  /* SAVE */
  /* ---------------------------------- */

  const handleSave = async () => {
    if (!auth.currentUser) {
      setMsg("Login required");
      return;
    }

    setIsSaving(true);
    setMsg("");

    try {
      await addDoc(collection(db, "GPARecords"), {
        userId: auth.currentUser.uid,
        GPA: gpaValue,
        courses,
        createdAt: serverTimestamp(),
      });

      setMsg("Saved successfully 🔥");

      await fetchResults(auth.currentUser);
    } catch (err) {
      setMsg("Failed to save");
    }

    setIsSaving(false);
  };

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  const fetchResults = async (currentUser) => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "GPARecords"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecords(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* ---------------------------------- */
  /* AUTH */
  /* ---------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          fetchResults(user);
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  /* ---------------------------------- */
  /* DELETE */
  /* ---------------------------------- */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "GPARecords", id));

      setRecords(
        records.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------------------------- */
  /* CLEAR */
  /* ---------------------------------- */

  const handleClearAll = () => {
    setCourses([emptyCourse]);

    setShowPopup(false);
    setMsg("");
    setRating("");
  };

  /* ---------------------------------- */
  /* STYLES */
  /* ---------------------------------- */

  const bg = dark
    ? "bg-[#0b1120] text-white"
    : "bg-[#f4f7ff] text-gray-900";

  const card = dark
    ? "bg-[#111827] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  const inputClass = `w-full p-3 rounded-xl border outline-none transition text-sm md:text-base ${
    dark
      ? "bg-gray-900 border-gray-700 focus:border-indigo-500"
      : "bg-gray-50 border-gray-300 focus:border-indigo-500"
  }`;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* MOBILE CGPA BUTTON */}
        <button
          onClick={() => navigate("/cgpa")}
          className="md:hidden mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          <LucideCalculator size={18} />
          CGPA Tracker
        </button>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-lg text-white">
            <Calculator size={30} />
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black">
              GPA Calculator
            </h1>

            <p className="opacity-70 mt-1 text-sm md:text-base">
              Calculate, analyze and save your GPA
            </p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="xl:col-span-2">

            <div className={`${card} rounded-3xl p-4 md:p-6`}>

              {/* TOP */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>
                  <h2 className="font-bold text-xl flex items-center gap-2">
                    <BookOpen size={20} />
                    Course List
                  </h2>

                  <p className="text-sm opacity-60">
                    Add your semester courses
                  </p>
                </div>

                <button
                  onClick={addCourse}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  <Plus size={18} />
                  Add Course
                </button>
              </div>

              {/* COURSES */}
              <div className="space-y-4">

                {courses.map((course, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 border ${
                      dark
                        ? "border-white/10 bg-black/20"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                      {/* TITLE */}
                      <div className="md:col-span-4">
                        <label className="text-xs opacity-60 mb-1 block">
                          Course Title
                        </label>

                        <input
                          type="text"
                          placeholder="Mathematics"
                          value={course.title}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* CODE */}
                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 mb-1 block">
                          Course Code
                        </label>

                        <input
                          type="text"
                          placeholder="MTH101"
                          value={course.code}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "code",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* UNIT */}
                      <div className="md:col-span-2">
                        <label className="text-xs opacity-60 mb-1 block">
                          Unit
                        </label>

                        <input
                          type="number"
                          placeholder="3"
                          value={course.unit}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* GRADE */}
                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 mb-1 block">
                          Grade
                        </label>

                        <div className="flex gap-2">

                          <select
                            value={course.grade}
                            onChange={(e) =>
                              updateCourse(
                                index,
                                "grade",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                            <option>D</option>
                            <option>E</option>
                            <option>F</option>
                          </select>

                          <button
                            onClick={() =>
                              removeCourse(index)
                            }
                            className="w-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <Trash2Icon size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">

                <button
                  onClick={handleResult}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition"
                >
                  <Calculator size={18} />
                  Calculate GPA
                </button>

                <button
                  onClick={handleClearAll}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition"
                >
                  Clear All
                </button>
              </div>

              {/* FORMULA */}
              <div
                className={`mt-8 rounded-2xl p-5 flex gap-3 ${
                  dark
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <LucideLightbulb className="text-yellow-500 shrink-0" />

                <div>
                  <h3 className="font-bold mb-1">
                    GPA Formula
                  </h3>

                  <p className="text-sm opacity-70">
                    GPA = Total Grade Points ÷ Total
                    Units
                  </p>

                  <p className="text-sm opacity-70 mt-1">
                    A=5, B=4, C=3, D=2, E=1, F=0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* SUMMARY */}
            <div className={`${card} rounded-3xl p-6`}>

              <h2 className="font-bold text-xl flex items-center gap-2 mb-6">
                <BarChart3 size={20} />
                Summary
              </h2>

              <div className="space-y-5">

                <div className="flex justify-between items-center">
                  <p className="opacity-70">
                    Total Courses
                  </p>

                  <h3 className="font-black text-2xl">
                    {summary.totalCourses}
                  </h3>
                </div>

                <div className="flex justify-between items-center">
                  <p className="opacity-70">
                    Total Units
                  </p>

                  <h3 className="font-black text-2xl">
                    {summary.totalUnits}
                  </h3>
                </div>

                <div className="flex justify-between items-center">
                  <p className="opacity-70">
                    Grade Points
                  </p>

                  <h3 className="font-black text-2xl">
                    {summary.totalPoints}
                  </h3>
                </div>

                <div className="flex justify-between items-center">
                  <p className="opacity-70">GPA</p>

                  <h3 className="font-black text-3xl text-indigo-500">
                    {gpaValue}
                  </h3>
                </div>
              </div>
            </div>

            {/* MOTIVATION */}
            <div
              className={`rounded-3xl p-6 text-white ${
                dark
                  ? "bg-gradient-to-br from-indigo-700 to-purple-700"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600"
              }`}
            >
              <Sparkles className="mb-3" size={28} />

              <h2 className="text-2xl font-black">
                Keep Improving 🚀
              </h2>

              <p className="text-sm opacity-90 mt-3 leading-6">
                Small consistent improvements each
                semester can dramatically boost your
                CGPA.
              </p>
            </div>
          </div>
        </div>

        {/* SAVED RESULTS */}
        <div className="mt-12">

          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="text-indigo-500" />

            <div>
              <h2 className="text-3xl font-black">
                Saved Results
              </h2>

              <p className="opacity-60 text-sm">
                Your previous GPA records
              </p>
            </div>
          </div>

          {loading && (
            <p className="opacity-70">Loading...</p>
          )}

          {!loading && records.length === 0 && (
            <div
              className={`${card} rounded-3xl p-10 text-center`}
            >
              <AlertCircle
                size={50}
                className="mx-auto mb-4 opacity-40"
              />

              <p className="opacity-70">
                No saved GPA records yet
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {records.map((item) => (
              <div
                key={item.id}
                className={`${card} rounded-3xl p-5`}
              >

                <div className="flex justify-between items-start mb-4">

                  <div>
                    <p className="text-sm opacity-60">
                      GPA
                    </p>

                    <h2 className="text-4xl font-black text-indigo-500">
                      {item.GPA}
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(item.id)
                    }
                    className="text-red-500 hover:scale-110 transition"
                  >
                    <Trash2Icon size={20} />
                  </button>
                </div>

                <p className="text-xs opacity-50 mb-4">
                  {item.createdAt
                    ?.toDate()
                    .toLocaleDateString()}
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">

                  {item.courses.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-3 ${
                        dark
                          ? "bg-black/20"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">
                          {c.code}
                        </p>

                        <span className="font-bold text-indigo-500">
                          {c.grade}
                        </span>
                      </div>

                      <p className="text-sm opacity-70">
                        {c.title}
                      </p>

                      <p className="text-xs opacity-50 mt-1">
                        {c.unit} Units
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">

          <div
            className={`w-full max-w-md rounded-[2rem] p-6 md:p-8 relative animate-[fadeIn_.3s_ease] ${
              dark
                ? "bg-[#111827] border border-white/10"
                : "bg-white"
            } shadow-2xl`}
          >

            {/* CLOSE */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="text-center">

              {/* GPA CIRCLE */}
              <div className="w-40 h-40 mx-auto rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">

                <div className="w-32 h-32 rounded-full bg-white text-indigo-600 flex items-center justify-center text-5xl font-black">
                  {gpaValue}
                </div>
              </div>

              <h2 className="text-3xl font-black mt-6">
                Your GPA
              </h2>

              <p className="opacity-70 mt-2">
                Academic performance result
              </p>

              {/* RATING */}
              <div className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/10 text-green-500 font-semibold">
                <Trophy size={18} />
                {rating}
              </div>

              {/* SAVE */}
              <button
                onClick={handleSave}
                className="w-full mt-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition"
              >
                <SaveIcon size={18} />

                {isSaving
                  ? "Saving..."
                  : "Save Result"}
              </button>

              {/* MESSAGE */}
              {msg && (
                <p className="text-sm mt-4 opacity-70">
                  {msg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPA;