import React, { useState, useContext} from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import SideBar from '../components/SideBar'
import BottomBar from './../components/BottomBar';
import { auth, db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import ProfilePhoto from '../components/ProfilePhoto'
import { Brain, CalculatorIcon, ChartAreaIcon, ChevronRight, CloudUploadIcon, File, FileWarning, HouseIcon, LayoutDashboardIcon, LogOut, NewspaperIcon, NotebookPenIcon, PhoneCall, PlaySquareIcon, Video, VideoIcon } from 'lucide-react';

const DashboardLayout = ({dark, menuOpen, setMenuOpen}) => {

  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };
  return (
    <div className='flex gap-0.5'>
      <div>
        <SideBar dark={dark}/>
        <BottomBar dark={dark}/>
        {menuOpen &&
          <div className={`fixed md:hidden pb-38 py-10 px-5 left-0 top-10 h-screen w-[70%] z-10 flex flex-col ${dark ? 'bg-slate-900' : 'bg-slate-100'}`}>
             
      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/GPA'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <CalculatorIcon className=''/> GPA Calculator</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/CGPA'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <ChartAreaIcon className=''/> CGPA Tracking</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/questions'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <File className=''/> Past Questions</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/tutorials'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <PlaySquareIcon className=''/> Browse YT videos </NavLink>
      
      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/lecturenotesmarketplace'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <NotebookPenIcon className=''/> Lecture Note</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/hostelmarketplace'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <HouseIcon className=''/> Find Hostel</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/tutorialmarketplace'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <Video className=''/>Find Tutorials</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/newsfeed'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <NewspaperIcon className=''/> Smart Feeds</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/ai'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <Brain className=''/> AI Assistance</NavLink>

      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/report'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <FileWarning className=''/> Report</NavLink>


      <NavLink onClick={(e)=> setMenuOpen(false)} to={'/contact'} className={`NavLink font-medium rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <PhoneCall className=''/> Contact Us</NavLink>


      <div onClick={(e)=> setMenuOpen(false)} className="flex flex-col shrink-0 mt-auto">
        <Link to={'/profile'} className="flex overflow-hidden relative items-center">
          <ProfilePhoto  user={user}/> <ChevronRight size={23} className={`absolute right-1 rounded-full flex ${dark ? 'bg-slate-900': 'bg-slate-100'} `}/>
        </Link>  
      </div>
        </div>
        }
        

      </div>
      <div onClick={(e)=> setMenuOpen(false)} className={`h-screen max-md:mb-25 w-full pt-20 flex overflow-y-auto no-scrollbar ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}>
        
        <Outlet/>
      </div>
      
    </div>
  )
}

export default DashboardLayout
