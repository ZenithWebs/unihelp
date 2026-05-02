import React from 'react'
import PastQuestions from '../components/PastQuestions'

const Question = ({dark}) => {
  return (
    <div>
      <h1 className='font-bold text-2xl'>Download Questions</h1>
      <PastQuestions dark={dark}/>
    </div>
  )
}

export default Question
