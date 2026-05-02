import React from 'react'
import UploadFile from '../components/UploadFile'

const Upload = ({dark}) => {
  return (
    <div className='flex flex-col w-full p-5'>
      <UploadFile dark={dark}/>
    </div>
  )
}

export default Upload
