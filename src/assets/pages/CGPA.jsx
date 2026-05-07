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
  const [semesters, setSemesters] = useState([
    { name: "", units: "", gpa: "" },
  ]);
  const navigate = useNavigate();
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
    { title: "", unit: "" },
  ]);
  const [gradeAdvice, setGradeAdvice] = useState([]);

  const addSemester = () => {
    setSemesters([...semesters, { name: "", units: "", gpa: "" }]);
  };

  const removeSemester = (i) => {
    const updated = semesters.filter((_, index) => index !== i);
    setSemesters(updated.length ? updated : [{ name: "", units: "", gpa: "" }]);
  };

  const updateSemester = (i, field, value) => {
    const updated = [...semesters];
    updated[i][field] = value;
    setSemesters(updated);
  };


  const getTotals = () => {
    let totalUnits = 0;
    let totalPoints = 0;

    semesters.forEach((s) => {
      const units = Number(s.units) || 0;
      const gpa = Number(s.gpa) || 0;

      if (units && gpa) {
        totalUnits += units;
        totalPoints += units * gpa;
      }
    });

    return { totalUnits, totalPoints };
  };

  const calculateCGPA = () => {
    const { totalUnits, totalPoints } = getTotals();
    return totalUnits ? (totalPoints / totalUnits).toFixed(2) : "0.00";
  };

  const addTargetCourse = () => {
    setTargetCourses([...targetCourses, { title: "", unit: "" }]);
  };

  const updateTargetCourse = (i, field, value) => {
    const updated = [...targetCourses];
    updated[i][field] = value;
    setTargetCourses(updated);
  };

  const removeTargetCourse = (i) => {
    const updated = targetCourses.filter((_, index) => index !== i);
    setTargetCourses(updated.length ? updated : [{ title: "", unit: "" }]);
  };

  const calculateRequiredGrades = () => {
  const { totalUnits, totalPoints } = getTotals();

  if (!targetCGPA) return;

  const totalNewUnits = targetCourses.reduce(
    (sum, c) => sum + (Number(c.unit) || 0),
    0
  );

  if (!totalNewUnits) return;

  const neededPoints =
    Number(targetCGPA) * (totalUnits + totalNewUnits);

  const remainingPoints = neededPoints - totalPoints;

  const avgGPA = remainingPoints / totalNewUnits;
  
  const getGrade = (gpa) => {
    if (gpa >= 4.5) return "A";
    if (gpa >= 3.5) return "B";
    if (gpa >= 2.5) return "C";
    if (gpa >= 1.5) return "D";
    return "E";
  };

  const advice = targetCourses.map((c) => ({
    ...c,
    required: getGrade(avgGPA),
  }));

  setGradeAdvice(advice);
};
  const handleSave = async () => {
  if (!auth.currentUser) {
    setMsg("Login required");
    return;
  }

  setSaving(true);
  setMsg("");

  try {
    const cgpa = calculateCGPA();

      await addDoc(collection(db, "cgpaTracker"), {
        userId: auth.currentUser.uid,
        semesters,
        cgpa,
        createdAt: serverTimestamp(),
    });

    setMsg("Saved successfully 🔥");
    fetchRecords();
  } catch (err) {
    setMsg("Error saving data");
  }

  setSaving(false);
};
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

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "cgpaTracker", id));
    setRecords(records.filter((r) => r.id !== id));
  };

  const chartData = records.map((item, index) => ({
    name: `Sem ${index + 1}`,
    cgpa: Number(item.cgpa),
  }));

  const bestSemester = semesters.reduce((best, current) => {
    if (!current.gpa) return best;
    if (!best) return current;
    return Number(current.gpa) > Number(best.gpa) ? current : best;
  }, null);

  useEffect(() => {
  if (semesters.length < 2) {
    setWarning("");
    return;
  }

  const last = semesters[semesters.length - 1];
  const prev = semesters[semesters.length - 2];

  if (!last?.gpa || !prev?.gpa) {
    setWarning("");
    return;
  }

  const lastGPA = Number(last.gpa);
  const prevGPA = Number(prev.gpa);

  if (lastGPA < prevGPA) {
    setWarning("⚠️ Your GPA dropped compared to last semester");
  } else {
    setWarning("");
  }
}, [semesters]);

  const predictNextCGPA = () => {
  const { totalUnits, totalPoints } = getTotals();

  if (!predictedGPA || !predictedUnits) return;

  const gpa = Number(predictedGPA);
  const units = Number(predictedUnits);

  const newTotalUnits = totalUnits + units;
  const newTotalPoints = totalPoints + units * gpa;

  setPredictedResult((newTotalPoints / newTotalUnits).toFixed(2));
};

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchRecords(user);
    } else {
      setLoading(false);
    }
  });

  return () => unsub();
}, []);



  return (
    <div
  className={`min-h-screen w-full px-4 ${
    dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
  }`}
>
  {/* MOBILE NAV BUTTON */}
  <button
    onClick={() => navigate("/gpa")}
    className="ml-auto md:hidden flex items-center gap-2 mb-5 px-4 py-2 rounded-lg bg-indigo-500 text-white"
  >
    <CalculatorIcon size={18} />
    GPA Calculator
  </button>

  <div className="max-w-5xl mx-auto">

    {/* HEADER */}
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 bg-indigo-500 shrink-0 rounded-xl flex items-center justify-center text-white">
        <Calculator size={22} />
      </div>
      <div>
        <h1 className="text-2xl font-bold">CGPA Tracker</h1>
        <p className="text-sm opacity-70">
          Track, analyze, and improve your academic performance across semesters
        </p>
      </div>
    </div>

    <p className="text-xs opacity-60 mb-6 flex items-center gap-2">
      <Info size={14} /> Tip: Enter your semester GPA and units to automatically calculate your CGPA.
    </p>

    {/* SEMESTER INPUT */}
    <div
      className={`rounded-2xl p-4 shadow-lg mb-6 ${
        dark ? "bg-[#111827]" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <BookOpen size={18} /> Semester Records
        </h2>

        <button
          onClick={addSemester}
          className="flex items-center max-md:text-sm gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white"
        >
          <Plus size={16} /> Add Semester
        </button>
      </div>

      <p className="text-xs opacity-60 mb-4">
        Add each semester with total units and GPA. Your best semester will be highlighted.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-3 text-sm font-semibold opacity-70">
        <p className="col-span-2">Semester</p>
        <p>Units</p>
        <p>GPA</p>
      </div>

      {semesters.map((s, i) => (
        <div
          key={i}
          className={`grid grid-cols-4 gap-3 mb-3 ${
            bestSemester && bestSemester.name === s.name
              ? "border border-green-500 rounded-lg p-2"
              : ""
          }`}
        >
          <input
            placeholder="100L First"
            value={s.name}
            onChange={(e) =>
              updateSemester(i, "name", e.target.value)
            }
            className={`p-3 rounded border col-span-2 ${
              dark
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-100 border-gray-300"
            }`}
          />

          <input
            type="number"
            placeholder="20"
            value={s.units}
            onChange={(e) =>
              updateSemester(i, "units", e.target.value)
            }
            className={`p-3 rounded border ${
              dark
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-100 border-gray-300"
            }`}
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="4.5"
              value={s.gpa}
              onChange={(e) =>
                updateSemester(i, "gpa", e.target.value)
              }
              className={`p-3 flex w-15 rounded border ${
                dark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-300"
              }`}
            />

            <button
              onClick={() => removeSemester(i)}
              className="text-red-500"
            >
              <Trash2Icon size={18} />
            </button>
          </div>
        </div>
      ))}

      {warning && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {warning}
        </div>
      )}

      {/* CGPA RESULT */}
      <div className="text-center mt-6">
        <p className="text-sm opacity-70">Cumulative CGPA</p>
        <h2 className="text-4xl font-bold text-indigo-500">
          {calculateCGPA()}
        </h2>

        <p className="text-xs opacity-60 mt-1">
          Automatically calculated based on all semesters entered
        </p>

        <button
          onClick={handleSave}
          className="mt-4 px-6 py-2 rounded-lg bg-green-500 text-white flex items-center gap-2 mx-auto"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Record"}
        </button>

        <p className="text-sm mt-2 text-gray-400">{msg}</p>
      </div>
    </div>

    {/* PREDICTOR */}
    <div
      className={`rounded-2xl p-6 mt-6 shadow-lg ${
        dark ? "bg-[#111827]" : "bg-white"
      }`}
    >
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <TrendingUp size={18} /> Predict Next Semester
      </h2>

      <p className="text-xs opacity-60 mb-4">
        Estimate your future CGPA by entering your expected GPA and course units.
      </p>

      <div className="flex gap-3 flex-col md:flex-row">
        <input
          type="number"
          placeholder="Expected GPA (e.g 4.5)"
          value={predictedGPA}
          onChange={(e) => setPredictedGPA(e.target.value)}
          className={`p-3 rounded border flex-1 ${
            dark
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-100 border-gray-300"
          }`}
        />

        <input
          type="number"
          placeholder="Units (e.g 20)"
          value={predictedUnits}
          onChange={(e) => setPredictedUnits(e.target.value)}
          className={`p-3 rounded border flex-1 ${
            dark
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-100 border-gray-300"
          }`}
        />

        <button
          onClick={predictNextCGPA}
          className="px-6 py-3 rounded-lg bg-indigo-500 text-white flex items-center gap-2"
        >
          <Sparkles size={16} /> Predict
        </button>
      </div>

      {predictedResult && (
        <div className="mt-4 text-center">
          <p className="text-sm opacity-70">Projected CGPA</p>
          <h2 className="text-3xl font-bold text-green-500">
            {predictedResult}
          </h2>
        </div>
      )}
    </div>

    {/* TARGET PLANNER */}
    <div
      className={`mt-6 p-5 rounded-xl shadow-lg ${
        dark ? "bg-[#111827]" : "bg-white"
      }`}
    >
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <Target size={18} /> Target Planner
      </h2>

      <p className="text-xs opacity-60 mb-4">
        Set your desired CGPA and get grade recommendations for each course.
      </p>

      <input
        type="number"
        placeholder="Target CGPA (e.g 4.5)"
        value={targetCGPA}
        onChange={(e) => setTargetCGPA(e.target.value)}
        className={`p-3 rounded-lg border w-full mb-5 ${
          dark
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-100 border-gray-300"
        }`}
      />

      {/* COURSES */}
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Book size={16} /> Target Courses
      </h3>

      {targetCourses.map((c, i) => (
        <div key={i} className="grid grid-cols-6 md:flex gap-2 mb-3 items-center">
          <input
            placeholder="Course title"
            value={c.title}
            onChange={(e) =>
              updateTargetCourse(i, "title", e.target.value)
            }
            className={`p-3 col-span-3 rounded-lg border flex-1 ${
              dark
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-100 border-gray-300"
            }`}
          />

          <input
            type="number"
            placeholder="Unit"
            value={c.unit}
            onChange={(e) =>
              updateTargetCourse(i, "unit", e.target.value)
            }
            className={`p-3 col-span-2 rounded-lg border w-24 ${
              dark
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-100 border-gray-300"
            }`}
          />

          <button onClick={() => removeTargetCourse(i)}>
            <X className="text-red-500" size={18} />
          </button>
        </div>
      ))}

      <button
        onClick={addTargetCourse}
        className="mt-2 px-4 py-2 rounded-lg bg-gray-800 text-white flex items-center gap-2"
      >
        <Plus size={16} /> Add Course
      </button>

      <button
        onClick={calculateRequiredGrades}
        className="w-full mt-5 px-4 py-3 rounded-lg font-semibold bg-purple-500 text-white flex items-center justify-center gap-2"
      >
        <BarChart3 size={16} /> Calculate Grade Advice
      </button>

      {gradeAdvice.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <ClipboardList size={16} /> Grade Advice
          </h3>

          {gradeAdvice.map((c, i) => (
            <div key={i} className="mb-2 p-3 rounded-lg border">
              <p className="text-sm font-medium">
                {c.title} ({c.unit} units)
              </p>
              <p className="text-sm text-green-500">
                Aim: <b>{c.required}</b>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* HISTORY */}
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <History size={18} /> History
      </h2>

      {loading && <p>Loading...</p>}
      {!loading && records.length === 0 && (
        <p className="text-gray-400">No records yet</p>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {records.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl shadow ${
              dark ? "bg-[#111827]" : "bg-white"
            }`}
          >
            <div className="flex justify-between mb-2">
              <p className="font-bold text-indigo-500">{r.cgpa}</p>
              <button onClick={() => handleDelete(r.id)}>
                <Trash2Icon size={18} className="text-red-500" />
              </button>
            </div>

            {r.semesters.map((s, i) => (
              <p key={i} className="text-sm opacity-70">
                {s.name} — {s.units} units ({s.gpa})
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* CHART */}
    <div
      className={`rounded-2xl p-6 shadow-lg mt-10 ${
        dark ? "bg-[#111827]" : "bg-white"
      }`}
    >
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <LineChartIcon size={18} /> CGPA Progress
      </h2>

      <p className="text-xs opacity-60 mb-4">
        Visual representation of how your CGPA improves over time.
      </p>

      {chartData.length === 0 ? (
        <p className="text-gray-400">No data to display</p>
      ) : (
        <div className="w-full h-75">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
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