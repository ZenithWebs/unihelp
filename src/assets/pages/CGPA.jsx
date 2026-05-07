import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";

import {
  Calculator,
  CalculatorIcon,
  Plus,
  Trash2Icon,
  AlertTriangle,
  Info,
  Save,
  TrendingUp,
  Sparkles,
  Target,
  Book,
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

  const [predictedGPA, setPredictedGPA] = useState("");
  const [predictedUnits, setPredictedUnits] = useState("");
  const [predictedResult, setPredictedResult] = useState("");

  const [targetCGPA, setTargetCGPA] = useState("");

  const [targetCourses, setTargetCourses] = useState([
    {
      title: "",
      unit: "",
    },
  ]);

  const [gradeAdvice, setGradeAdvice] = useState([]);

  /* --------------------------------- */
  /* SEMESTER */
  /* --------------------------------- */

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

  const updateSemester = (i, field, value) => {
    const updated = [...semesters];

    updated[i][field] = value;

    setSemesters(updated);
  };

  /* --------------------------------- */
  /* TOTALS */
  /* --------------------------------- */

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
    const { totalUnits, totalPoints } = getTotals();

    return totalUnits
      ? (totalPoints / totalUnits).toFixed(2)
      : "0.00";
  };

  /* --------------------------------- */
  /* CLASSIFICATION */
  /* --------------------------------- */

  const getClassification = (cgpa) => {
    const value = Number(cgpa);

    if (value >= 4.5)
      return "First Class";

    if (value >= 3.5)
      return "Second Class Upper";

    if (value >= 2.4)
      return "Second Class Lower";

    if (value >= 1.5)
      return "Third Class";

    return "Pass";
  };

  /* --------------------------------- */
  /* TARGET COURSES */
  /* --------------------------------- */

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

  /* --------------------------------- */
  /* GRADE ADVICE */
  /* --------------------------------- */

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

  /* --------------------------------- */
  /* SAVE */
  /* --------------------------------- */

  const handleSave = async () => {
    if (!auth.currentUser) {
      setMsg("Login required");
      return;
    }

    setSaving(true);
    setMsg("");

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

  /* --------------------------------- */
  /* FETCH */
  /* --------------------------------- */

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

  /* --------------------------------- */
  /* DELETE */
  /* --------------------------------- */

  const handleDelete = async (id) => {
    await deleteDoc(
      doc(db, "cgpaTracker", id)
    );

    setRecords((prev) =>
      prev.filter((r) => r.id !== id)
    );
  };

  /* --------------------------------- */
  /* CHART */
  /* --------------------------------- */

  const chartData = records.map(
    (item, index) => ({
      name: `Sem ${index + 1}`,
      cgpa: Number(item.cgpa),
    })
  );

  /* --------------------------------- */
  /* BEST SEMESTER */
  /* --------------------------------- */

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

  /* --------------------------------- */
  /* WARNING */
  /* --------------------------------- */

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

    const lastGPA = Number(last.gpa);
    const prevGPA = Number(prev.gpa);

    if (lastGPA < prevGPA) {
      setWarning(
        "⚠️ Your GPA dropped compared to last semester"
      );
    } else {
      setWarning("");
    }
  }, [semesters]);

  /* --------------------------------- */
  /* PREDICT */
  /* --------------------------------- */

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

  /* --------------------------------- */
  /* AUTH */
  /* --------------------------------- */

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

  return (
    <div
      className={`min-h-screen w-full px-4 py-5 ${
        dark
          ? "bg-[#0b0f1a] text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* MOBILE BUTTON */}

      <button
        onClick={() => navigate("/gpa")}
        className="ml-auto md:hidden flex items-center gap-2 mb-5 px-4 py-2 rounded-lg bg-indigo-500 text-white"
      >
        <CalculatorIcon size={18} />
        GPA Calculator
      </button>

      <div className="max-w-6xl mx-auto">
        {/* HEADER */}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
            <Calculator size={24} />
          </div>

          <div>
            <h1 className="text-3xl font-black">
              CGPA Tracker
            </h1>

            <p className="text-sm opacity-70">
              Track, predict & improve
              your academic performance
            </p>
          </div>
        </div>

        {/* SUMMARY */}

        <div
          className={`rounded-2xl p-6 mb-6 ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          <h2 className="font-bold mb-5 flex items-center gap-2">
            <Award
              size={18}
              className="text-indigo-500"
            />
            Academic Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-xl ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-xs opacity-60">
                Semesters
              </p>

              <h2 className="text-2xl font-bold">
                {semesters.length}
              </h2>
            </div>

            <div
              className={`p-4 rounded-xl ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-xs opacity-60">
                Current CGPA
              </p>

              <h2 className="text-2xl font-bold text-indigo-500">
                {calculateCGPA()}
              </h2>
            </div>

            <div
              className={`p-4 rounded-xl ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-xs opacity-60">
                Classification
              </p>

              <h2 className="text-lg font-bold text-green-500">
                {getClassification(
                  calculateCGPA()
                )}
              </h2>
            </div>

            <div
              className={`p-4 rounded-xl ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            >
              <p className="text-xs opacity-60">
                Total Units
              </p>

              <h2 className="text-2xl font-bold">
                {
                  getTotals()
                    .totalUnits
                }
              </h2>
            </div>
          </div>
        </div>

        {/* SEMESTERS */}

        <div
          className={`rounded-2xl p-5 mb-6 ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold flex items-center gap-2">
              <BookOpen size={18} />
              Semester Records
            </h2>

            <button
              onClick={addSemester}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add Semester
            </button>
          </div>

          <div className="space-y-4">
            {semesters.map((s, i) => (
              <div
                key={i}
                className={`grid md:grid-cols-4 gap-3 p-3 rounded-xl ${
                  bestSemester?.name ===
                  s.name
                    ? "border border-green-500"
                    : dark
                    ? "bg-gray-800"
                    : "bg-gray-100"
                }`}
              >
                <input
                  placeholder="Semester"
                  value={s.name}
                  onChange={(e) =>
                    updateSemester(
                      i,
                      "name",
                      e.target.value
                    )
                  }
                  className={`p-3 rounded-lg outline-none ${
                    dark
                      ? "bg-gray-700"
                      : "bg-white"
                  }`}
                />

                <input
                  type="number"
                  placeholder="Units"
                  value={s.units}
                  onChange={(e) =>
                    updateSemester(
                      i,
                      "units",
                      e.target.value
                    )
                  }
                  className={`p-3 rounded-lg outline-none ${
                    dark
                      ? "bg-gray-700"
                      : "bg-white"
                  }`}
                />

                <input
                  type="number"
                  placeholder="GPA"
                  value={s.gpa}
                  onChange={(e) =>
                    updateSemester(
                      i,
                      "gpa",
                      e.target.value
                    )
                  }
                  className={`p-3 rounded-lg outline-none ${
                    dark
                      ? "bg-gray-700"
                      : "bg-white"
                  }`}
                />

                <button
                  onClick={() =>
                    removeSemester(i)
                  }
                  className="bg-red-500 text-white rounded-lg flex items-center justify-center"
                >
                  <Trash2Icon size={18} />
                </button>
              </div>
            ))}
          </div>

          {warning && (
            <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-400 flex items-center gap-2">
              <AlertTriangle size={18} />
              {warning}
            </div>
          )}

          {/* RESULT */}

          <div className="text-center mt-8">
            <p className="text-sm opacity-60">
              Current CGPA
            </p>

            <h1 className="text-5xl font-black text-indigo-500">
              {calculateCGPA()}
            </h1>

            <p className="mt-2 text-sm opacity-70">
              {getClassification(
                calculateCGPA()
              )}
            </p>

            <button
              onClick={handleSave}
              className="mt-5 bg-green-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
            >
              <Save size={16} />
              {saving
                ? "Saving..."
                : "Save Record"}
            </button>

            <p className="mt-3 text-sm opacity-70">
              {msg}
            </p>
          </div>
        </div>

        {/* PREDICTOR */}

        <div
          className={`rounded-2xl p-5 mb-6 ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <TrendingUp size={18} />
            CGPA Predictor
          </h2>

          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Expected GPA"
              value={predictedGPA}
              onChange={(e) =>
                setPredictedGPA(
                  e.target.value
                )
              }
              className={`p-3 rounded-lg outline-none ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            />

            <input
              type="number"
              placeholder="Units"
              value={predictedUnits}
              onChange={(e) =>
                setPredictedUnits(
                  e.target.value
                )
              }
              className={`p-3 rounded-lg outline-none ${
                dark
                  ? "bg-gray-800"
                  : "bg-gray-100"
              }`}
            />

            <button
              onClick={
                predictNextCGPA
              }
              className="bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Predict
            </button>
          </div>

          {predictedResult && (
            <div className="mt-6 text-center">
              <p className="text-sm opacity-60">
                Predicted CGPA
              </p>

              <h2 className="text-4xl font-black text-green-500">
                {predictedResult}
              </h2>
            </div>
          )}
        </div>

        {/* TARGET */}

        <div
          className={`rounded-2xl p-5 mb-6 ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          <h2 className="font-bold flex items-center gap-2 mb-5">
            <Target size={18} />
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
            className={`w-full p-3 rounded-lg mb-5 outline-none ${
              dark
                ? "bg-gray-800"
                : "bg-gray-100"
            }`}
          />

          {targetCourses.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-6 gap-2 mb-3"
            >
              <input
                placeholder="Course title"
                value={c.title}
                onChange={(e) =>
                  updateTargetCourse(
                    i,
                    "title",
                    e.target.value
                  )
                }
                className={`col-span-3 p-3 rounded-lg outline-none ${
                  dark
                    ? "bg-gray-800"
                    : "bg-gray-100"
                }`}
              />

              <input
                type="number"
                placeholder="Unit"
                value={c.unit}
                onChange={(e) =>
                  updateTargetCourse(
                    i,
                    "unit",
                    e.target.value
                  )
                }
                className={`col-span-2 p-3 rounded-lg outline-none ${
                  dark
                    ? "bg-gray-800"
                    : "bg-gray-100"
                }`}
              />

              <button
                onClick={() =>
                  removeTargetCourse(i)
                }
                className="text-red-500"
              >
                <X />
              </button>
            </div>
          ))}

          <button
            onClick={addTargetCourse}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} />
            Add Course
          </button>

          <button
            onClick={
              calculateRequiredGrades
            }
            className="w-full mt-5 bg-purple-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <BarChart3 size={16} />
            Calculate Advice
          </button>

          {gradeAdvice.length >
            0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ClipboardList
                  size={16}
                />
                Grade Advice
              </h3>

              <div className="space-y-3">
                {gradeAdvice.map(
                  (c, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl ${
                        dark
                          ? "bg-gray-800"
                          : "bg-gray-100"
                      }`}
                    >
                      <p className="font-medium">
                        {c.title}
                      </p>

                      <p className="text-sm opacity-70">
                        {c.unit} units
                      </p>

                      <p className="text-green-500 mt-1 font-bold">
                        Aim For Grade:{" "}
                        {c.required}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* HISTORY */}

        <div className="mb-6">
          <h2 className="font-bold text-xl flex items-center gap-2 mb-4">
            <History size={18} />
            History
          </h2>

          {loading && (
            <p>Loading...</p>
          )}

          {!loading &&
            records.length === 0 && (
              <div
                className={`p-10 rounded-2xl text-center ${
                  dark
                    ? "bg-[#111827]"
                    : "bg-white"
                }`}
              >
                <History className="mx-auto mb-3 opacity-40" />

                <p className="font-semibold">
                  No CGPA Records Yet
                </p>

                <p className="text-sm opacity-60 mt-1">
                  Save your first
                  record to start
                  tracking
                </p>
              </div>
            )}

          <div className="grid md:grid-cols-3 gap-4">
            {records.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border transition hover:scale-[1.02] ${
                  dark
                    ? "bg-[#111827] border-white/10"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between mb-3">
                  <h2 className="text-indigo-500 font-black text-xl">
                    {r.cgpa}
                  </h2>

                  <button
                    onClick={() =>
                      handleDelete(
                        r.id
                      )
                    }
                  >
                    <Trash2Icon
                      className="text-red-500"
                      size={18}
                    />
                  </button>
                </div>

                <div className="space-y-1">
                  {r.semesters.map(
                    (s, i) => (
                      <p
                        key={i}
                        className="text-sm opacity-70"
                      >
                        {s.name} —{" "}
                        {s.units} units (
                        {s.gpa})
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART */}

        <div
          className={`rounded-2xl p-6 ${
            dark
              ? "bg-[#111827]"
              : "bg-white"
          }`}
        >
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
            <LineChartIcon size={18} />
            CGPA Progress
          </h2>

          {chartData.length === 0 ? (
            <p className="text-sm opacity-60">
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
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CGPATracker;