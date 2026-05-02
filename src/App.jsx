import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './assets/pages/Dashboard'
import DashboardLayout from './assets/Layouts/DashboardLayout';
import Login from './assets/pages/Login';
import Signup from './assets/pages/Signup';
import CGPA from './assets/pages/CGPA';
import Profile from './assets/pages/Profile';
import Question from './assets/pages/Question';
import Navbar from './assets/components/Navbar';
import Upload from './assets/pages/Upload';
import ProtectedRoute from './assets/components/ProtectedRoutes';
import AiAssistance from './assets/pages/AiAssistance';
import GPA from './assets/pages/GPA';
import LectureNotesMarketplace from './assets/pages/LectureNotesMarketplace';

const App = () => {
    


  const [dark, setDark] = useState(false)
    useEffect(() => {
      localStorage.setItem("theme", dark);
      }, [dark]);
      
  return (
    <>
    
    <Navbar dark={dark}
          setDark={setDark}/>
      <div className={dark ? "bg-slate-900 text-white" : "bg-white text-black"}>
        <Routes>
          <Route path='/' element={<Login dark={dark}/>}/>
          <Route path='/register' element={<Signup dark={dark}/>}/>
          <Route element={<DashboardLayout dark={dark}/>}>
            <Route path='/dashboard' element={ <ProtectedRoute><Dashboard dark={dark}/></ProtectedRoute> }/>
            <Route path='/CGPA' element={<ProtectedRoute><CGPA dark={dark}/></ProtectedRoute>}/>
            <Route path='/GPA' element={<ProtectedRoute><GPA dark={dark}/></ProtectedRoute>}/>
            <Route path='/ai' element={<ProtectedRoute><AiAssistance dark={dark}/></ProtectedRoute>}/>
            <Route path='/upload' element={<ProtectedRoute><Upload dark={dark}/> </ProtectedRoute>}/>
            <Route path='/lecturenotesmarketplace' element={<ProtectedRoute><LectureNotesMarketplace dark={dark}/> </ProtectedRoute>}/>
            <Route path='/profile' element={<ProtectedRoute> <Profile dark={dark}/> </ProtectedRoute>}/>
            <Route path='/questions' element={<ProtectedRoute> <Question dark={dark}/> </ProtectedRoute>}/>
          </Route>
        </Routes>
        </div>
    </>
  )
}

export default App
