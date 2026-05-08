import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";

import {
  Calculator,
  CalculatorIcon,
  Plus,
  Trash2Icon,
  AlertTriangle,
  Save,
  TrendingUp,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  ClipboardList,
  History,
  LineChart as LineChartIcon,
  X,
  Award,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

const CGPATracker = ({ dark }) => {
  const navigate = useNavigate();

  /* ---------------------------------- */
  /* STATES */
  /* ---------------------------------- */

  const [semesters, setSemesters] = useState([
    {
      name: "",
      units: "",
      gpa: "",
    },
  ]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [warning, setWarning] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [showPopup, setShowPopup] =
    useState(false);

  const [predictedGPA, setPredictedGPA] =
    useState("");

  const [predictedUnits, setPredictedUnits] =
    useState("");

  const [predictedResult, setPredictedResult] =
    useState("");

  const [targetCGPA, setTargetCGPA] =
    useState("");

  const [targetCourses, setTargetCourses] =
    useState([
      {
        title: "",
        unit: "",
      },
    ]);

  const [gradeAdvice, setGradeAdvice] =
    useState([]);

  /* ---------------------------------- */
  /* STYLES */
  /* ---------------------------------- */

  const bg = dark
    ? "bg-[#0b1120] text-white"
    : "bg-[#f4f7ff] text-gray-900";

  const card = dark
    ? "bg-[#111827] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  const inputClass = `w-full p-3 rounded-xl outline-none border transition ${
    dark
      ? "bg-gray-900 border-gray-700 focus:border-indigo-500"
      : "bg-gray-50 border-gray-300 focus:border-indigo-500"
  }`;

  /* ---------------------------------- */
  /* SEMESTER */
  /* ---------------------------------- */

  const addSemester = () => {
    setSemesters([
      ...semesters,
      {
        name: "",
        units: "",
        gpa: "",
      },
    ]);
  };

  const removeSemester = (i) => {
    const updated = semesters.filter(
      (_, index) => index !== i
    );

    setSemesters(
      updated.length
        ? updated
        : [{ name: "", units: "", gpa: "" }]
    );
  };

  const updateSemester = (
    i,
    field,
    value
  ) => {
    const updated = [...semesters];

    updated[i][field] = value;

    setSemesters(updated);
  };

  /* ---------------------------------- */
  /* TOTALS */
  /* ---------------------------------- */

  const getTotals = () => {
    let totalUnits = 0;
    let totalPoints = 0;

    semesters.forEach((s) => {
      const units = Number(s.units) || 0;
      const gpa = Number(s.gpa) || 0;

      if (units > 0 && gpa >= 0) {
        totalUnits += units;
        totalPoints += units * gpa;
      }
    });

    return {
      totalUnits,
      totalPoints,
    };
  };

  const calculateCGPA = () => {
    const { totalUnits, totalPoints } =
      getTotals();

    return totalUnits
      ? (totalPoints / totalUnits).toFixed(2)
      : "0.00";
  };

  /* ---------------------------------- */
  /* CLASSIFICATION */
  /* ---------------------------------- */

  const getClassification = (cgpa) => {
    const value = Number(cgpa);

    if (value >= 4.5)
      return "🏆 First Class";

    if (value >= 3.5)
      return "🔥 Second Class Upper";

    if (value >= 2.4)
      return "💪 Second Class Lower";

    if (value >= 1.5)
      return "🙂 Third Class";

    return "⚠️ Pass";
  };

  /* ---------------------------------- */
  /* BEST SEMESTER */
  /* ---------------------------------- */

  const bestSemester = semesters.reduce(
    (best, current) => {
      if (!current.gpa) return best;

      if (!best) return current;

      return Number(current.gpa) >
        Number(best.gpa)
        ? current
        : best;
    },
    null
  );

  /* ---------------------------------- */
  /* WARNING */
  /* ---------------------------------- */

  useEffect(() => {
    if (semesters.length < 2) {
      setWarning("");
      return;
    }

    const last =
      semesters[semesters.length - 1];

    const prev =
      semesters[semesters.length - 2];

    if (!last?.gpa || !prev?.gpa) {
      setWarning("");
      return;
    }

    if (
      Number(last.gpa) <
      Number(prev.gpa)
    ) {
      setWarning(
        "⚠️ Your GPA dropped compared to the previous semester"
      );
    } else {
      setWarning("");
    }
  }, [semesters]);

  /* ---------------------------------- */
  /* PREDICT */
  /* ---------------------------------- */

  const predictNextCGPA = () => {
    const { totalUnits, totalPoints } =
      getTotals();

    if (
      !predictedGPA ||
      !predictedUnits
    )
      return;

    const gpa = Number(predictedGPA);

    const units =
      Number(predictedUnits);

    const newTotalUnits =
      totalUnits + units;

    const newTotalPoints =
      totalPoints + units * gpa;

    setPredictedResult(
      (
        newTotalPoints / newTotalUnits
      ).toFixed(2)
    );
  };

  /* ---------------------------------- */
  /* TARGET */
  /* ---------------------------------- */

  const addTargetCourse = () => {
    setTargetCourses([
      ...targetCourses,
      {
        title: "",
        unit: "",
      },
    ]);
  };

  const updateTargetCourse = (
    i,
    field,
    value
  ) => {
    const updated = [...targetCourses];

    updated[i][field] = value;

    setTargetCourses(updated);
  };

  const removeTargetCourse = (i) => {
    const updated = targetCourses.filter(
      (_, index) => index !== i
    );

    setTargetCourses(
      updated.length
        ? updated
        : [{ title: "", unit: "" }]
    );
  };

  /* ---------------------------------- */
  /* GRADE ADVICE */
  /* ---------------------------------- */

  const calculateRequiredGrades = () => {
    const { totalUnits, totalPoints } =
      getTotals();

    if (!targetCGPA) return;

    const totalNewUnits =
      targetCourses.reduce(
        (sum, c) =>
          sum + (Number(c.unit) || 0),
        0
      );

    if (!totalNewUnits) return;

    const neededPoints =
      Number(targetCGPA) *
      (totalUnits + totalNewUnits);

    const remainingPoints =
      neededPoints - totalPoints;

    const avgGPA =
      remainingPoints / totalNewUnits;

    const getGrade = (gpa) => {
      if (gpa >= 4.5) return "A";
      if (gpa >= 3.5) return "B";
      if (gpa >= 2.5) return "C";
      if (gpa >= 1.5) return "D";

      return "E";
    };

    const advice = targetCourses.map(
      (c) => ({
        ...c,
        required: getGrade(avgGPA),
      })
    );

    setGradeAdvice(advice);
  };

  /* ---------------------------------- */
  /* SAVE */
  /* ---------------------------------- */

  const handleSave = async () => {
    if (!auth.currentUser) {
      setMsg("Login required");
      return;
    }

    setSaving(true);

    try {
      const cgpa = calculateCGPA();

      await addDoc(
        collection(db, "cgpaTracker"),
        {
          userId: auth.currentUser.uid,
          semesters,
          cgpa,
          createdAt: serverTimestamp(),
        }
      );

      setMsg("Saved successfully 🔥");

      fetchRecords(auth.currentUser);
    } catch (err) {
      setMsg("Error saving data");
    }

    setSaving(false);
  };

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  const fetchRecords = async (user) => {
    if (!user) return;

    const q = query(
      collection(db, "cgpaTracker"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const data = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .sort(
        (a, b) =>
          (b.createdAt?.seconds || 0) -
          (a.createdAt?.seconds || 0)
      );

    setRecords(data);

    setLoading(false);
  };

  /* ---------------------------------- */
  /* DELETE */
  /* ---------------------------------- */

  const handleDelete = async (id) => {
    await deleteDoc(
      doc(db, "cgpaTracker", id)
    );

    setRecords((prev) =>
      prev.filter((r) => r.id !== id)
    );
  };

  /* ---------------------------------- */
  /* AUTH */
  /* ---------------------------------- */

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          fetchRecords(user);
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsub();
  }, []);

  /* ---------------------------------- */
  /* CHART */
  /* ---------------------------------- */

  const chartData = records.map(
    (item, index) => ({
      name: `Record ${index + 1}`,
      cgpa: Number(item.cgpa),
    })
  );

  return (
    <div className={`min-h-screen w-full ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* MOBILE BUTTON */}
        <button
          onClick={() => navigate("/gpa")}
          className="md:hidden mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          <CalculatorIcon size={18} />
          GPA Calculator
        </button>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-lg text-white">
            <Calculator size={30} />
          </div>

          <div>
            <h1 className="text-4xl font-black">
              CGPA Tracker
            </h1>

            <p className="opacity-70 mt-1">
              Track, predict and improve your academic performance
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

          {[
            {
              label: "Semesters",
              value: semesters.length,
            },
            {
              label: "Current CGPA",
              value: calculateCGPA(),
              color: "text-indigo-500",
            },
            {
              label: "Classification",
              value: getClassification(
                calculateCGPA()
              ),
              color: "text-green-500",
            },
            {
              label: "Total Units",
              value:
                getTotals().totalUnits,
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`${card} rounded-3xl p-5`}
            >
              <p className="text-sm opacity-60">
                {item.label}
              </p>

              <h2
                className={`font-black mt-2 text-2xl md:text-3xl ${
                  item.color || ""
                }`}
              >
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="xl:col-span-2 space-y-6">

            {/* SEMESTERS */}
            <div className={`${card} rounded-3xl p-5 md:p-6`}>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>
                  <h2 className="font-bold text-xl flex items-center gap-2">
                    <BookOpen size={20} />
                    Semester Records
                  </h2>

                  <p className="text-sm opacity-60">
                    Add semester GPA records
                  </p>
                </div>

                <button
                  onClick={addSemester}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition"
                >
                  <Plus size={18} />
                  Add Semester
                </button>
              </div>

              <div className="space-y-4">

                {semesters.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 border transition ${
                      bestSemester?.name ===
                      s.name
                        ? "border-green-500"
                        : dark
                        ? "border-white/10 bg-black/20"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                      <div className="md:col-span-5">
                        <label className="text-xs opacity-60 block mb-1">
                          Semester
                        </label>

                        <input
                          placeholder="First Semester"
                          value={s.name}
                          onChange={(e) =>
                            updateSemester(
                              i,
                              "name",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 block mb-1">
                          Units
                        </label>

                        <input
                          type="number"
                          placeholder="24"
                          value={s.units}
                          onChange={(e) =>
                            updateSemester(
                              i,
                              "units",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 block mb-1">
                          GPA
                        </label>

                        <input
                          type="number"
                          placeholder="4.25"
                          value={s.gpa}
                          onChange={(e) =>
                            updateSemester(
                              i,
                              "gpa",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={() =>
                            removeSemester(i)
                          }
                          className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                        >
                          <Trash2Icon
                            size={18}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* WARNING */}
              {warning && (
                <div className="mt-5 p-4 rounded-2xl bg-red-500/10 border border-red-500 text-red-400 flex items-center gap-2">
                  <AlertTriangle
                    size={18}
                  />
                  {warning}
                </div>
              )}

              {/* RESULT */}
              <div className="text-center mt-10">

                <p className="text-sm opacity-60">
                  Current CGPA
                </p>

                <h1 className="text-6xl font-black text-indigo-500 mt-2">
                  {calculateCGPA()}
                </h1>

                <p className="mt-3 text-lg font-semibold">
                  {getClassification(
                    calculateCGPA()
                  )}
                </p>

                <button
                  onClick={() =>
                    setShowPopup(true)
                  }
                  className="mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 mx-auto font-bold transition"
                >
                  <Save size={18} />
                  Save Record
                </button>

                <p className="mt-3 text-sm opacity-70">
                  {msg}
                </p>
              </div>
            </div>

            {/* CHART */}
            <div className={`${card} rounded-3xl p-6`}>

              <h2 className="font-bold text-xl mb-5 flex items-center gap-2">
                <LineChartIcon
                  size={20}
                />
                CGPA Progress
              </h2>

              {chartData.length ===
              0 ? (
                <p className="opacity-60">
                  No chart data yet
                </p>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={chartData}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={
                          dark
                            ? "#374151"
                            : "#d1d5db"
                        }
                      />

                      <XAxis dataKey="name" />

                      <YAxis
                        domain={[0, 5]}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="cgpa"
                        stroke="#6366f1"
                        strokeWidth={4}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* PREDICTOR */}
            <div className={`${card} rounded-3xl p-6`}>

              <h2 className="font-bold text-xl flex items-center gap-2 mb-5">
                <TrendingUp size={20} />
                CGPA Predictor
              </h2>

              <div className="space-y-3">

                <input
                  type="number"
                  placeholder="Expected GPA"
                  value={predictedGPA}
                  onChange={(e) =>
                    setPredictedGPA(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

                <input
                  type="number"
                  placeholder="Expected Units"
                  value={predictedUnits}
                  onChange={(e) =>
                    setPredictedUnits(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

                <button
                  onClick={
                    predictNextCGPA
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                >
                  <Sparkles size={18} />
                  Predict CGPA
                </button>
              </div>

              {predictedResult && (
                <div className="mt-6 text-center">

                  <p className="text-sm opacity-60">
                    Predicted CGPA
                  </p>

                  <h2 className="text-5xl font-black text-green-500 mt-2">
                    {predictedResult}
                  </h2>
                </div>
              )}
            </div>

            {/* TARGET */}
            <div className={`${card} rounded-3xl p-6`}>

              <h2 className="font-bold text-xl flex items-center gap-2 mb-5">
                <Target size={20} />
                Target Planner
              </h2>

              <input
                type="number"
                placeholder="Target CGPA"
                value={targetCGPA}
                onChange={(e) =>
                  setTargetCGPA(
                    e.target.value
                  )
                }
                className={`${inputClass} mb-4`}
              />

              <div className="space-y-3">

                {targetCourses.map(
                  (c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2"
                    >
                      <input
                        placeholder="Course"
                        value={c.title}
                        onChange={(e) =>
                          updateTargetCourse(
                            i,
                            "title",
                            e.target
                              .value
                          )
                        }
                        className={`${inputClass} col-span-7`}
                      />

                      <input
                        type="number"
                        placeholder="Unit"
                        value={c.unit}
                        onChange={(e) =>
                          updateTargetCourse(
                            i,
                            "unit",
                            e.target
                              .value
                          )
                        }
                        className={`${inputClass} col-span-4`}
                      />

                      <button
                        onClick={() =>
                          removeTargetCourse(
                            i
                          )
                        }
                        className="col-span-1 text-red-500"
                      >
                        <X />
                      </button>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={addTargetCourse}
                className="mt-4 px-4 py-3 rounded-xl bg-gray-700 text-white flex items-center gap-2"
              >
                <Plus size={16} />
                Add Course
              </button>

              <button
                onClick={
                  calculateRequiredGrades
                }
                className="w-full mt-5 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <BarChart3 size={18} />
                Calculate Advice
              </button>

              {gradeAdvice.length >
                0 && (
                <div className="mt-6 space-y-3">

                  <h3 className="font-bold flex items-center gap-2">
                    <ClipboardList
                      size={18}
                    />
                    Grade Advice
                  </h3>

                  {gradeAdvice.map(
                    (c, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl ${
                          dark
                            ? "bg-black/20"
                            : "bg-gray-50"
                        }`}
                      >
                        <p className="font-semibold">
                          {c.title}
                        </p>

                        <p className="text-sm opacity-60 mt-1">
                          {c.unit} Units
                        </p>

                        <p className="text-green-500 font-bold mt-2">
                          Aim For:{" "}
                          {c.required}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="mt-10">

          <div className="flex items-center gap-3 mb-6">

            <History className="text-indigo-500" />

            <div>
              <h2 className="text-3xl font-black">
                History
              </h2>

              <p className="text-sm opacity-60">
                Previously saved records
              </p>
            </div>
          </div>

          {loading && (
            <p>Loading...</p>
          )}

          {!loading &&
            records.length === 0 && (
              <div
                className={`${card} rounded-3xl p-10 text-center`}
              >
                <History className="mx-auto mb-3 opacity-40" />

                <p className="font-semibold">
                  No CGPA Records Yet
                </p>

                <p className="text-sm opacity-60 mt-1">
                  Save your first record
                </p>
              </div>
            )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {records.map((r) => (
              <div
                key={r.id}
                className={`${card} rounded-3xl p-5`}
              >

                <div className="flex justify-between items-start mb-4">

                  <div>
                    <p className="text-sm opacity-60">
                      CGPA
                    </p>

                    <h2 className="text-4xl font-black text-indigo-500">
                      {r.cgpa}
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(
                        r.id
                      )
                    }
                    className="text-red-500"
                  >
                    <Trash2Icon
                      size={20}
                    />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">

                  {r.semesters.map(
                    (s, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl p-3 ${
                          dark
                            ? "bg-black/20"
                            : "bg-gray-50"
                        }`}
                      >
                        <p className="font-semibold">
                          {s.name}
                        </p>

                        <p className="text-sm opacity-60">
                          {s.units} Units
                        </p>

                        <p className="text-indigo-500 font-bold mt-1">
                          GPA: {s.gpa}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">

          <div
            className={`w-full max-w-md rounded-[2rem] p-6 md:p-8 relative shadow-2xl ${
              dark
                ? "bg-[#111827] border border-white/10"
                : "bg-white"
            }`}
          >

            <button
              onClick={() =>
                setShowPopup(false)
              }
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="text-center">

              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">

                <div className="w-32 h-32 rounded-full bg-white text-indigo-600 flex items-center justify-center text-5xl font-black">
                  {calculateCGPA()}
                </div>
              </div>

              <h2 className="text-3xl font-black mt-6">
                Current CGPA
              </h2>

              <p className="opacity-70 mt-2">
                {getClassification(
                  calculateCGPA()
                )}
              </p>

              <button
                onClick={handleSave}
                className="w-full mt-6 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition"
              >
                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Record"}
              </button>

              {msg && (
                <p className="mt-4 text-sm opacity-70">
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

export default CGPATracker;