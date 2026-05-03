import React from 'react'
import SmartFeed from '../components/SmartFeed'

const NewsFeed = ({dark}) => {
  return (
    <div className='flex w-full p-5'>
      <SmartFeed dark={dark}/>
    </div>
  )
}

export default NewsFeed
