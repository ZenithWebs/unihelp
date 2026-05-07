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

  const [courses, setCourses] = useState([
    {
      title: "",
      code: "",
      unit: "",
      grade: "A",
    },
  ]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [result, setResult] = useState(false);
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
    setCourses([
      ...courses,
      {
        title: "",
        code: "",
        unit: "",
        grade: "A",
      },
    ]);
  };

  /* ---------------------------------- */
  /* REMOVE COURSE */
  /* ---------------------------------- */

  const removeCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);

    setCourses(
      updated.length
        ? updated
        : [
            {
              title: "",
              code: "",
              unit: "",
              grade: "A",
            },
          ]
    );
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
  /* GPA CALCULATION */
  /* ---------------------------------- */

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach((course) => {
      if (course.unit > 0) {
        totalPoints +=
          course.unit * gradeMap[course.grade];

        totalUnits += course.unit;
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

    setResult(true);
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
        totalUnits += course.unit;

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
  /* FETCH RECORDS */
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
    setCourses([
      {
        title: "",
        code: "",
        unit: "",
        grade: "A",
      },
    ]);

    setResult(false);
    setMsg("");
    setRating("");
  };

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  const bg = dark
    ? "bg-[#0b0f1a] text-white"
    : "bg-[#f6f8fc] text-gray-900";

  const card = dark
    ? "bg-[#111827] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div className={`min-h-screen px-4 py-6 ${bg}`}>
      <div className="max-w-7xl mx-auto">

        {/* MOBILE BUTTON */}
        <button
          onClick={() => navigate("/cgpa")}
          className="md:hidden mb-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white"
        >
          <LucideCalculator size={18} />
          CGPA Tracker
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Calculator size={26} />
          </div>

          <div>
            <h1 className="text-3xl font-black">
              GPA Calculator
            </h1>

            <p className="opacity-70 text-sm">
              Calculate, analyze and save your GPA
            </p>
          </div>
        </div>

        {/* TOP GRID */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-2">

            {/* COURSE CARD */}
            <div className={`${card} rounded-3xl p-5`}>

              {/* TOP */}
              <div className="flex justify-between items-center mb-6">
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
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  <Plus size={18} />
                  Add Course
                </button>
              </div>

              {/* HEADINGS */}
              <div className="grid grid-cols-12 gap-3 mb-3 text-sm font-semibold opacity-60">
                <p className="col-span-4">Course Title</p>
                <p className="col-span-3">Code</p>
                <p className="col-span-2">Unit</p>
                <p className="col-span-3">Grade</p>
              </div>

              {/* COURSES */}
              <div className="space-y-4">
                {courses.map((course, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-center"
                  >

                    {/* TITLE */}
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
                      className={`col-span-4 p-3 rounded-xl border outline-none ${
                        dark
                          ? "bg-gray-900 border-gray-700"
                          : "bg-gray-50 border-gray-300"
                      }`}
                    />

                    {/* CODE */}
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
                      className={`col-span-3 p-3 rounded-xl border outline-none ${
                        dark
                          ? "bg-gray-900 border-gray-700"
                          : "bg-gray-50 border-gray-300"
                      }`}
                    />

                    {/* UNIT */}
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
                      className={`col-span-2 p-3 rounded-xl border outline-none ${
                        dark
                          ? "bg-gray-900 border-gray-700"
                          : "bg-gray-50 border-gray-300"
                      }`}
                    />

                    {/* GRADE */}
                    <div className="col-span-3 flex gap-2 items-center">

                      <select
                        value={course.grade}
                        onChange={(e) =>
                          updateCourse(
                            index,
                            "grade",
                            e.target.value
                          )
                        }
                        className={`flex-1 p-3 rounded-xl border outline-none ${
                          dark
                            ? "bg-gray-900 border-gray-700"
                            : "bg-gray-50 border-gray-300"
                        }`}
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
                        className="text-red-500 hover:scale-110 transition"
                      >
                        <Trash2Icon size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-3 mt-8">

                <button
                  onClick={handleResult}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                >
                  <Calculator size={18} />
                  Calculate GPA
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  Clear All
                </button>
              </div>

              {/* INFO */}
              <div
                className={`mt-8 rounded-2xl p-4 flex gap-3 ${
                  dark
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <LucideLightbulb className="text-yellow-500 shrink-0" />

                <div>
                  <h3 className="font-bold">
                    GPA Formula
                  </h3>

                  <p className="text-sm opacity-70 mt-1">
                    GPA = Total Grade Points ÷ Total
                    Units
                  </p>

                  <p className="text-sm opacity-70">
                    A=5, B=4, C=3, D=2, E=1, F=0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* RESULT */}
            {result && (
              <div className={`${card} rounded-3xl p-6 relative`}>

                <button
                  onClick={() => setResult(false)}
                  className="absolute top-4 right-4 md:hidden"
                >
                  <X />
                </button>

                <div className="text-center">

                  <div className="w-36 h-36 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-white text-5xl font-black shadow-xl">
                    {gpaValue}
                  </div>

                  <h2 className="text-xl font-bold mt-5">
                    Your GPA
                  </h2>

                  <p className="opacity-70 text-sm">
                    Academic performance result
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500">
                    <Trophy size={18} />
                    {rating}
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full mt-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <SaveIcon size={18} />

                    {isSaving
                      ? "Saving..."
                      : "Save Result"}
                  </button>

                  <p className="text-sm mt-3 opacity-70">
                    {msg}
                  </p>
                </div>
              </div>
            )}

            {/* SUMMARY */}
            <div className={`${card} rounded-3xl p-6`}>

              <h2 className="font-bold text-lg flex items-center gap-2 mb-5">
                <BarChart3 size={18} />
                Summary
              </h2>

              <div className="space-y-4">

                <div className="flex justify-between">
                  <p className="opacity-70">
                    Total Courses
                  </p>

                  <h3 className="font-bold text-xl">
                    {summary.totalCourses}
                  </h3>
                </div>

                <div className="flex justify-between">
                  <p className="opacity-70">
                    Total Units
                  </p>

                  <h3 className="font-bold text-xl">
                    {summary.totalUnits}
                  </h3>
                </div>

                <div className="flex justify-between">
                  <p className="opacity-70">
                    Grade Points
                  </p>

                  <h3 className="font-bold text-xl">
                    {summary.totalPoints}
                  </h3>
                </div>

                <div className="flex justify-between">
                  <p className="opacity-70">GPA</p>

                  <h3 className="font-black text-2xl text-indigo-500">
                    {gpaValue}
                  </h3>
                </div>
              </div>
            </div>

            {/* MOTIVATION */}
            <div
              className={`rounded-3xl p-5 ${
                dark
                  ? "bg-linear-to-br from-indigo-600 to-purple-700"
                  : "bg-linear-to-br from-indigo-500 to-purple-600"
              } text-white`}
            >
              <Sparkles className="mb-3" />

              <h2 className="text-xl font-bold">
                Keep Improving 🚀
              </h2>

              <p className="text-sm opacity-90 mt-2">
                Small consistent improvements each
                semester can dramatically boost your
                CGPA.
              </p>
            </div>
          </div>
        </div>

        {/* SAVED RESULTS */}
        <div className="mt-10">

          <div className="flex items-center gap-3 mb-5">
            <GraduationCap className="text-indigo-500" />

            <div>
              <h2 className="text-2xl font-black">
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
              className={`${card} rounded-3xl p-8 text-center`}
            >
              <AlertCircle
                size={45}
                className="mx-auto mb-3 opacity-40"
              />

              <p className="opacity-70">
                No saved GPA records yet
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {records.map((item) => (
              <div
                key={item.id}
                className={`${card} rounded-3xl p-5`}
              >

                {/* TOP */}
                <div className="flex justify-between items-center mb-4">

                  <div>
                    <p className="text-sm opacity-60">
                      GPA
                    </p>

                    <h2 className="text-3xl font-black text-indigo-500">
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

                {/* DATE */}
                <p className="text-xs opacity-50 mb-4">
                  {item.createdAt
                    ?.toDate()
                    .toLocaleDateString()}
                </p>

                {/* COURSES */}
                <div className="space-y-2">
                  {item.courses.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-3 ${
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
    </div>
  );
};

export default GPA;