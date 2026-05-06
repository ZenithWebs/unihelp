import React from 'react'
import { Brain, CalculatorIcon, CloudUploadIcon, File, GroupIcon, HomeIcon, LayoutDashboardIcon, MessageCircle, NewspaperIcon, SparkleIcon, User, Video, WandSparklesIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const BottomBar = ({dark}) => {
  return (
    <div className={`flex z-20 justify-between items-center fixed bottom-0 rounded-t-3xl left-0 gap-0.5 w-full md:hidden py-3 px-6 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-black' }`}>
      
      <NavLink to={'/dashboard'} className={`NavLink font-bold text-[12px] rounded flex flex-col justify-center items-center gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <HomeIcon className=''/> Home</NavLink>

      <NavLink to={'/community'} className={`NavLink text-[12px] justify-center items-center flex-col font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <MessageCircle className=''/> Community</NavLink>

      <NavLink to={'/tutorialmarketplace'} className={`NavLink flex-col text-[12px] justify-center items-center font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <Video className=''/> Tutorials</NavLink>

      <NavLink to={'/ai'} className={`NavLink flex-col text-[12px] justify-center items-center font-bold rounded flex gap-1.5 p-2.5 ${dark ? 'hover:bg-[#601b9b]' : 'hover:bg-slate-300'}`}> <WandSparklesIcon className=''/> Assistance</NavLink>
    </div>
  )
}

export default BottomBar
