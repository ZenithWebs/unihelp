import React, { useState } from 'react'
import { Images } from './../data/data';
import { LightbulbIcon, LightbulbOffIcon, MoonIcon, SunIcon, User } from 'lucide-react';
import ProfilePhoto from './ProfilePhoto';
import { AuthContext } from "../context/AuthContext";
import { useContext } from 'react';

const Navbar = ({ dark, setDark }) => {

  const { user } = useContext(AuthContext);
  const toggleTheme = () => {
    setDark(!dark);
  };
  return (
    <div className={`fixed z-20 top-0 left-0 w-full flex justify-between items-center py-3 px-[5%] ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100' }`}>
      <img src={dark ? Images.dark_logo : Images.light_logo} alt="unihelp.ng" className='w-30 md:w-40'/>
      <span className='flex gap-2'>
        <button
        onClick={toggleTheme}
        className={`px-2 py-2 border-white border-2 text-white rounded-full ${!dark ? 'bg-indigo-950': 'bg-transparent'}`}
      >
        {dark ? <SunIcon/> : <MoonIcon/>}
      </button>
      <span className='md:hidden'>
        <ProfilePhoto user={user}/>
      </span>
      

      </span>
       
    </div>
  )
}

export default Navbar
