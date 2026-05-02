import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../components/SideBar'
import BottomBar from './../components/BottomBar';
import InstallPWAButton from '../components/InstallPWAButton';

const DashboardLayout = ({dark}) => {
  return (
    <div className='flex gap-0.5'>
      <div>
        <SideBar dark={dark}/>
        <BottomBar dark={dark}/>
      </div>
      <div className={`h-screen max-md:mb-25 w-full pt-20 flex overflow-y-auto no-scrollbar ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}>
        <InstallPWAButton />
        <Outlet/>
      </div>
      
    </div>
  )
}

export default DashboardLayout
