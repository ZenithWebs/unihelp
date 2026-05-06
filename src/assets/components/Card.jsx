import { ChevronRight, MoveLeft, MoveRightIcon } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const Card = ({title, description, url, icon, background, dark}) => {
  return (
    <Link to={url} className={`flex w-full items-start gap-2.5 border  p-2 rounded-lg shadow ${dark ? 'border-slate-700' : 'border-slate-200' }`}>
      <div className={`flex justify-center rounded-lg items-center h-15 w-15 ${background} text-white`} >
        {icon}
      </div>
      <div className='flex flex-col flex-1'>
        <p className='font-bold'>{title}</p>
        <p className='text-[14px]'>{description}</p>
        <span className={`flex justify-center items-center rounded-full h-10 w-10 text-white font-extrabold ml-auto mt-2.5 ${background}`}><ChevronRight size={20}/></span>
      </div>
    </Link>
  )
}

export default Card
