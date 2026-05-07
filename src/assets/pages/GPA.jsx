import { Calculator, X, LucideLightbulb, SaveIcon, Trash2Icon, LucideCalculator } from "lucide-react";
import {
  query,
  where,
  getDocs,
  orderBy,
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
  const [courses, setCourses] = useState([
    { title: "", code: "", unit: "", grade: "A" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(false);
  const [rating, setRating] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const gradeMap = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0,
  };

  const addCourse = () => {
    setCourses([
      ...courses,
      { title: "", code: "", unit: "", grade: "A" },
    ]);
  };

  const removeCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(
      updated.length
        ? updated
        : [{ title: "", code: "", unit: "", grade: "A" }]
    );
  };

  const updateCourse = (index, field, value) => {
    const updated = [...courses];
    if (field === "unit") {
      const val = Number(value);
      updated[index][field] = val > 0 ? val : "";
    } else {
      updated[index][field] = value;
    }
    setCourses(updated);
  };

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach((course) => {
      if (course.unit > 0 && gradeMap[course.grade] !== undefined) {
        totalPoints +=
          course.unit * gradeMap[course.grade];
        totalUnits += course.unit;
      }
    });

    return totalUnits
      ? (totalPoints / totalUnits).toFixed(2)
      : "0.00";
  };

  const handleResult = () => {
    const GPA = calculateGPA();

    const gpaVal = Number(GPA);

      if (gpaVal >= 4.5) {
        setRating("Excellent 🏆 First Class");
      } else if (gpaVal >= 3.5) {
        setRating("Very Good 💪 Second Class Upper");
      } else if (gpaVal >= 2.5) {
        setRating("Good 👍 Second Class Lower");
      } else if (gpaVal >= 1.5) {
        setRating("Pass 🙂 Third Class");
      } else {
        setRating("⚠️ Probation level, improve urgently");
      }

      setResult(true);
  };

  const fetchResults = async (currentUser) => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "GPARecords"),
        where("userId", "==", currentUser.uid),
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
  const gpaValue = calculateGPA();
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
        courses,
        GPA: calculateGPA(),
        createdAt: serverTimestamp(),
      });

      setMsg("Saved successfully");
      await fetchResults(auth.currentUser);
    } catch (err) {
      setMsg("Error saving data");
    }

    setIsSaving(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchResults(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "GPARecords", id));
      setRecords(records.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const calculateSummary = () => {
  let totalUnits = 0;
  let totalPoints = 0;
  let totalCourses = 0;

  courses.forEach((course) => {
    if (course.unit) {
      totalCourses += 1;
      totalUnits += course.unit;
      totalPoints += course.unit * gradeMap[course.grade];
    }
  });

  return {
    totalCourses,
    totalUnits,
    totalPoints,
  };
};

const handleClearAll = () => {
  setCourses([{ title: "", code: "", unit: "", grade: "A" }]);
  setIsSaving(false);
  setResult(false);
  setRating("");
  setMsg("");
};
const summary = calculateSummary();

  return (
    <div
      className={`h-full rounded-xl px-4 transition-all duration-300 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <button onClick={(e)=> navigate('/cgpa')}
        className="ml-auto md:hidden flex mb-5 px-4 py-2 rounded-lg bg-indigo-500 text-white">
        <LucideCalculator/> CGPA Tracker
      </button>
      <div className="w-full mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
            <Calculator />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GPA Calculator</h1>
            <p className="text-sm text-gray-400">
              Add courses, calculate and save your GPA
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div
            className={`rounded-2xl p-6 shadow-lg mb-6  flex-1 ${
              dark ? "bg-[#111827]" : "bg-white"
            }`}
          >
            <button
              onClick={addCourse}
              className="w-40 flex ml-auto justify-center mb-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              + Add Course
            </button>

            <div className="grid grid-cols-4 gap-3 mb-4 text-sm font-semibold opacity-70 ">
              <p>Course Title</p>
              <p>Code</p>
              <p>Unit</p>
              <p>Grade</p>
            </div>

            <div className="space-y-3">
              {courses.map((course, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-3 items-center"
                >
                  <input
                    type="text"
                    placeholder="Mathematics"
                    value={course.title}
                    onChange={(e) =>
                      updateCourse(index, "title", e.target.value)
                    }
                    className={`p-3 rounded-lg outline-none border ${
                      dark
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-gray-100 border-gray-300 text-black"
                    }`}
                  />

                  <input
                    type="text"
                    placeholder="MTH101"
                    value={course.code}
                    onChange={(e) =>
                      updateCourse(index, "code", e.target.value)
                    }
                    className={`p-3 rounded-lg outline-none border ${
                      dark
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-gray-100 border-gray-300 text-black"
                    }`}
                  />

                  <input
                    type="number"
                    placeholder="3"
                    value={course.unit}
                    onChange={(e) =>
                      updateCourse(index, "unit", e.target.value)
                    }
                    className={`p-3 rounded-lg outline-none border ${
                      dark
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-gray-100 border-gray-300 text-black"
                    }`}
                  />

                  <span className="flex justify-center items-center gap-3">
                    <select
                      value={course.grade}
                      onChange={(e) =>
                        updateCourse(index, "grade", e.target.value)
                      }
                      className={`p-3 flex-1 rounded-lg outline-none border ${
                        dark
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-gray-100 border-gray-300 text-black"
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
                      onClick={() => removeCourse(index)}
                      className="text-red-500 text-sm font-bold"
                    >
                      <Trash2Icon />
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleResult}
              className="w-60 flex justify-center items-center gap-2.5 mx-auto mt-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              Calculate GPA <Calculator />
            </button>

            <div className="flex gap-2 mt-5">
              <LucideLightbulb size={30} className="text-yellow-400"/>
              <div>
                <h1 className="font-bold">How GPA is Calculated</h1>
                <p className="opacity-70 text-[14px]">GPA = Total Grade Points / Total Courses Units</p>
                <p className="opacity-70 text-[14px]">Grade Points: A=5.0, B=4.00 C=3.00 D=2.00 E=1.00 F=0.00</p>
                </div>
            </div>
          </div>

          {result && (
  <div
    className={` md:w-1/3 max-md:absolute max-md:z-10 top-30 w-[90%] left-[5%] rounded-2xl p-8 shadow-lg text-center mb-6 ${
      dark ? "bg-[#111827]" : "bg-white"
    }`}
  >
    <span
      onClick={() => setResult(false)}
      className="absolute flex h-10 w-10 cursor-pointer justify-center items-center text-2xl rounded-full border-2 md:hidden opacity-70 right-2.5 top-2.5"
    >
      <X />
    </span>

    <p className="font-bold mb-2 text-lg">Your GPA Result</p>
    <p className="text-sm opacity-70 mb-6">
      Based on your entered courses
    </p>

    <div className="flex flex-col items-center justify-center mb-6">
      <div className="w-32 h-32 rounded-full flex items-center justify-center bg-linear-to-br from-green-500 to-emerald-600 text-white text-4xl font-bold shadow-lg">
        {gpaValue}
      </div>
      <p className="mt-4 text-sm opacity-70">Current GPA</p>
      <p className="mt-2 font-semibold text-lg">{rating}</p>
    </div>

    <div className="flex justify-center">
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-8 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold"
      >
        <SaveIcon />
        {isSaving ? "Saving..." : "Save Result"}
      </button>
    </div>

    <p className="mt-3 text-sm text-gray-400">{msg}</p>

    <div
      className={`rounded-2xl p-5 mt-6 ${
        dark ? "bg-[#0f172a]" : "bg-gray-50"
      }`}
    >
      <h2 className="font-bold mb-4">Summary</h2>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-sm opacity-70">Courses</p>
          <h3 className="text-xl font-bold">{summary.totalCourses}</h3>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm opacity-70">Total Units</p>
          <h3 className="text-xl font-bold">{summary.totalUnits}</h3>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm opacity-70">Grade Points</p>
          <h3 className="text-xl font-bold">{summary.totalPoints}</h3>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm opacity-70">GPA</p>
          <h3 className="text-xl font-bold text-indigo-500">
            {calculateGPA()}
          </h3>
        </div>
      </div>

      <button
        onClick={handleClearAll}
        className="mt-5 w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
      >
        Clear All
      </button>
    </div>
  </div>
)}
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Saved Results
          </h2>

          {loading && <p>Loading...</p>}

          {!loading && records.length === 0 && (
            <p className="text-gray-400">
              No saved results yet
            </p>
          )}

          <div className="space-y-4 grid grid-cols-1 md:grid-cols-3">
            {records.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl shadow-sm ${
                  dark ? "bg-[#111827]" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">
                    GPA:{" "}
                    <span className="text-indigo-500">
                      {item.GPA}
                    </span>
                  </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-400">
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 cursor-pointer hover:scale-150">
                    <Trash2Icon size={18} />
                  </button>
                </div>
                  

                  

                  
                </div>

                <div className="text-sm opacity-70">
                  {item.courses.map((c, i) => (
                    <p key={i}>
                      {c.code} - {c.title} ({c.unit} units) →{" "}
                      {c.grade}
                    </p>
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