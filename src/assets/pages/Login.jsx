import { Book, Calculator, Upload, User2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Images } from "../data/data";

import { auth, db } from "../../firebase/config";

import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const Login = ({ dark }) => {
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // ================= EMAIL LOGIN =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErr("");
    setSuccess("");

    if (!email || !password) {
      setErr("All fields are required");
      return;
    }

    try {
      setIsLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case "auth/user-not-found":
          setErr("No account found with this email");
          break;

        case "auth/wrong-password":
          setErr("Incorrect password");
          break;

        case "auth/invalid-email":
          setErr("Invalid email address");
          break;

        case "auth/too-many-requests":
          setErr("Too many attempts. Try again later.");
          break;

        default:
          setErr("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ================= GOOGLE LOGIN =================
  const handleGoogleLogin = async () => {
    setErr("");
    setSuccess("");

    try {
      setIsLoading(true);

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const userRef = doc(db, "users", user.uid);

      const userSnap = await getDoc(userRef);

      // ================= CREATE USER IF NEW =================
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          username: user.displayName || "Student",
          email: user.email,
          photo: user.photoURL || "",
          provider: "google",
          createdAt: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      if (error.code === "auth/popup-closed-by-user") {
        setErr("Google popup was closed");
      } else {
        setErr("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async () => {
    setErr("");
    setSuccess("");

    if (!email) {
      setErr("Enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      setSuccess("Password reset email sent");
    } catch (error) {
      console.log(error);

      if (error.code === "auth/user-not-found") {
        setErr("No user found with this email");
      } else {
        setErr("Failed to send reset email");
      }
    }
  };

  return (
    <div
      className={`min-h-screen pt-20 flex transition-all duration-300 ${
        dark
          ? "bg-[#0b0f1a] text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* ================= LEFT SIDE ================= */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-10">
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Learn. Share.
            <br />
            <span className="text-indigo-500">Succeed</span> Together.
          </h1>

          <p className="text-gray-400 mb-8">
            Access past questions, calculate your CGPA, and collaborate with
            students across different campuses.
          </p>

          <div className="space-y-5">
            {/* CARD 1 */}
            <div className="flex gap-3">
              <span className="flex justify-center items-center rounded-xl h-14 w-14 text-white bg-purple-700 shrink-0">
                <Book size={24} />
              </span>

              <div>
                <h3 className="font-bold text-lg">Past Questions</h3>

                <p className="text-sm opacity-70">
                  Access quality past questions easily
                </p>
              </div>
            </div>

            {/* CARD 2 */}
            <div className="flex gap-3">
              <span className="flex justify-center items-center rounded-xl h-14 w-14 text-white bg-pink-500 shrink-0">
                <Calculator size={24} />
              </span>

              <div>
                <h3 className="font-bold text-lg">CGPA Calculator</h3>

                <p className="text-sm opacity-70">
                  Calculate and track your grades
                </p>
              </div>
            </div>

            {/* CARD 3 */}
            <div className="flex gap-3">
              <span className="flex justify-center items-center rounded-xl h-14 w-14 text-white bg-green-500 shrink-0">
                <Upload size={24} />
              </span>

              <div>
                <h3 className="font-bold text-lg">Upload & Share</h3>

                <p className="text-sm opacity-70">
                  Share knowledge and help others
                </p>
              </div>
            </div>

            {/* CARD 4 */}
            <div className="flex gap-3">
              <span className="flex justify-center items-center rounded-xl h-14 w-14 text-white bg-indigo-500 shrink-0">
                <User2 size={24} />
              </span>

              <div>
                <h3 className="font-bold text-lg">Student Community</h3>

                <p className="text-sm opacity-70">
                  Connect and learn together
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">© 2026 UniHelp.ng</p>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10">
        <div
          className={`w-full max-w-md p-8 rounded-3xl shadow-xl border ${
            dark
              ? "bg-[#111827] border-gray-800"
              : "bg-white border-gray-200"
          }`}
        >
          {/* HEADER */}
          <div className="flex justify-center mb-3">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
          </div>

          <p className="text-center text-gray-400 mb-8">
            Login to continue to your account
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className={`w-full p-3 mb-4 rounded-xl outline-none border transition-all ${
                dark
                  ? "bg-gray-800 border-gray-700 text-white focus:border-indigo-500"
                  : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
              }`}
            />

            {/* PASSWORD */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full p-3 pr-12 rounded-xl outline-none border transition-all ${
                  dark
                    ? "bg-gray-800 border-gray-700 text-white focus:border-indigo-500"
                    : "bg-gray-100 border-gray-300 text-black focus:border-indigo-500"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {/* OPTIONS */}
            <div className="flex justify-between items-center mb-5 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />

                <span>Show password</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-indigo-500 hover:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>

            {/* ERRORS */}
            {err && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm rounded-lg p-3 mb-4">
                {err}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 text-sm rounded-lg p-3 mb-4">
                {success}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-white font-semibold mb-5 transition-all ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600"
              }`}
            >
              {isLoading ? "Logging In..." : "Login"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-600"></div>

            <span className="text-sm text-gray-400">or</span>

            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 border rounded-xl py-3 transition-all ${
              dark
                ? "border-gray-700 hover:bg-slate-700"
                : "border-gray-300 hover:bg-slate-100"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <img
              src={Images.google_logo}
              className="w-8 h-8 object-contain"
              alt="Google"
            />

            <span>
              {isLoading ? "Please wait..." : "Continue with Google"}
            </span>
          </button>

          {/* FOOTER */}
          <p className="text-sm text-center mt-6">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;