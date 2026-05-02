import React from 'react'
import { Book, Calculator, Upload, User2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Images } from "../data/data";
import { auth, db} from '../../firebase/config';
import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from "firebase/firestore";

const Signup = ({dark}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('')
  const [err, setErr] = useState('');
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const provider = new GoogleAuthProvider();

  // ================= EMAIL SIGNUP =================
  const handleSubmit = async ()=>{
    if(!email || !password || !username ){
      setErr('All input fields are required');
      return;
    }

    if(password.length < 8){
      setErr('Password is not upto 8 character');
      return;
    }

    setIsLoading(true);
    setErr('');

    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: new Date(),
      });

      navigate('/dashboard');

    } catch (err) {
      console.log(err.message);
      setErr('Unable to create account');
    }

    setIsLoading(false);
  };

  // ================= GOOGLE SIGNUP =================
  const handleGoogleSignup = async ()=>{
    setErr('');
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      // Only create if new user
      if (!docSnap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          username: user.displayName,
          email: user.email,
          photo: user.photo,
          createdAt: new Date(),
        });
      }

      navigate('/dashboard');

    } catch (err) {
      console.log(err.message);
      setErr('Google signup failed');
    }

    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen pt-20 flex transition-all duration-300 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`} >

      <div className="hidden md:flex w-1/2 flex-col justify-between p-10">

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Learn. Share. <br />
            <span className="text-indigo-500">Succeed</span> Together.
          </h1>

          <p className="text-gray-400 mb-6">
            Access past questions, calculate your CGPA, and collaborate with students across different campuses.
          </p>

          <div className="space-y-3">

            <div className="flex gap-1.5 font-bold text-xl">
              <span className="flex justify-center items-center rounded-lg h-13 w-13 text-white bg-purple-900">
                <Book/>
              </span>  
              <div>
                Past Questions
                <p className="font-medium text-sm opacity-70">Access Quality past questions</p>
              </div>
            </div>

            <div className="flex gap-1.5 font-bold text-xl">
              <span className="flex justify-center items-center rounded-lg h-13 w-13 text-white bg-pink-500">
                <Calculator/> 
              </span> 
              <div>
                CGPA Calculator
                <p className="font-medium text-sm opacity-70">Calculate and Track your grades</p>
              </div>
            </div>

            <div className="flex gap-1.5 font-bold text-xl">
              <span className="flex justify-center items-center rounded-lg h-13 w-13 text-white bg-green-500">
                <Upload/>
              </span> 
              <div>
                Upload & Share
                <p className="font-medium text-sm opacity-70">Share Knowledge, Help Others</p>
              </div>
            </div>

            <div className="flex gap-1.5 font-bold text-xl">
              <span className="flex justify-center items-center rounded-lg h-13 w-13 text-white bg-indigo-500">
                <User2/> 
              </span>
              <div>
                Student Community
                <p className="font-medium text-sm opacity-70">Connect and learn together.</p>
              </div>
            </div>

          </div>
        </div>

        <p className="text-sm text-gray-500">© 2026 UniHelp.ng</p>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div
          className={`w-full max-w-md p-8 rounded-2xl shadow-lg ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <h2 className="text-2xl font-semibold text-center">Welcome To UniHelp.ng</h2>
          </div>

          <p className="text-gray-400 mb-6 text-center">
            Register to continue with us
          </p>

          <p className='font-medium '>Username</p>
          <input
            type="text"
            onChange={(e)=> setUsername(e.target.value)}
            placeholder="joe smith"
            className={`w-full p-3 mb-4 rounded-lg outline-none border ${
              dark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300 text-black"
            }`}
          />

          <p className='font-medium '>Email Address</p>
          <input
            type="email"
            onChange={(e)=> setEmail(e.target.value)}
            placeholder="Email Address"
            className={`w-full p-3 mb-4 rounded-lg outline-none border ${
              dark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300 text-black"
            }`}
          />

          <p className='font-medium '>Create Password</p>
          <input
            type={`${showPassword ? 'text' : 'password'}`}
            onChange={(e)=> setPassword(e.target.value)}
            placeholder="Password"
            className={`w-full p-3 mb-4 rounded-lg outline-none border ${
              dark
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-gray-100 border-gray-300 text-black"
            }`}
          />

          <div className="flex justify-between items-center mb-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" onClick={()=> setShowPassword(!showPassword)} />
              Show password
            </label>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold mb-4"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>

          <span className='text-center text-red-600 text-sm'>{err}</span>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          <div className="grid gap-3 mb-4">
            <button 
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className={`flex justify-center items-center cursor-pointer border border-gray-600 rounded-lg py-2 ${
                dark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img src={Images.google_logo} className="w-14" alt="" />
              {isLoading ? 'Please wait...' : ' Continue with Google'}
            </button>
          </div>

          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link to={'/'} className="text-indigo-500 cursor-pointer">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup;