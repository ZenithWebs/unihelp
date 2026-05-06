import { signOut } from "firebase/auth";
import { Brain, CalculatorIcon, ChevronRight, CloudUploadIcon, File, HomeIcon, LayoutDashboardIcon, LogOut, MessageCircle, NotebookPenIcon, PlaySquare, User, VideoIcon, YoutubeIcon } from 'lucide-react'
import {React, useContext, useEffect, useState} from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { auth, db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import ProfilePhoto from './ProfilePhoto.jsx'



const SideBar = ({dark, setDark}) => {
const { user } = useContext(AuthContext);
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const navigate = useNavigate();
const handleLogout = async () => {
  await signOut(auth);
  navigate('/');
};
  return (
    <div className={`pt-22 flex flex-col gap-2 w-70 h-screen max-md:hidden p-10 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-black' }`}>
      
      <NavLink to={'/dashboard'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <LayoutDashboardIcon className=''/> Dashboard</NavLink>

      <NavLink to={'/GPA'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <CalculatorIcon className=''/> GPA Calculator</NavLink>

      <NavLink to={'/CGPA'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <CalculatorIcon className=''/> CGPA Tracking</NavLink>

      <NavLink to={'/questions'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <File className=''/> Past Questions</NavLink>

      <NavLink to={'/tutorials'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <YoutubeIcon className=''/> YT Videos</NavLink>

      <NavLink to={'/lecturenotesmarketplace'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <NotebookPenIcon className=''/> Lecture Note</NavLink>

      <NavLink to={'/hostelmarketplace'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <HomeIcon className=''/> Find Hostel </NavLink>


      <NavLink to={'/tutorialmarketplace'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <VideoIcon className=''/> Find Tutorials </NavLink>
      

      <NavLink to={'/ai'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <Brain className=''/> AI Assistance</NavLink>
      
      <NavLink to={'/community'} className={`NavLink font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <MessageCircle className=''/> Community</NavLink>

      <div className="flex flex-col shrink-0 mt-auto">
        <span className="flex overflow-hidden relative items-center">
          <ProfilePhoto user={user}/> <ChevronRight size={23} className={`absolute right-1 rounded-full flex ${dark ? 'bg-slate-900': 'bg-slate-100'} `}/>
        </span>
        
        <span>
        <p className="flex mt-6 pl-auto text-red-600 font-medium cursor-pointer" onClick={handleLogout}><LogOut/> Logout</p>
        </span>
        
      </div>
      
    </div>
  )
}

export default SideBar
