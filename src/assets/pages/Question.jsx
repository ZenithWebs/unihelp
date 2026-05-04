import React from 'react'
import PastQuestions from '../components/PastQuestions'
import { Link } from 'react-router-dom';
import { PlusCircleIcon } from 'lucide-react';

const Question = ({dark}) => {
  return (
    <div className='relative w-full p-5'>
      <h1 className='font-bold text-2xl'>Download Questions</h1>
      <PastQuestions dark={dark}/>
      <Link className='absolute p-5 bg-indigo-500 rounded-full text-white right-5 bottom-30' to={'/uploadquestion'}><PlusCircleIcon size={30}/></Link>
    </div>
  )
}

export default Question
