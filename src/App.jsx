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
import { Link } from 'react-router-dom';
import HostelMarketplace from './assets/pages/HostelMarketplace';
import NewsFeed from './assets/pages/NewsFeed';
import Community from './assets/pages/Community';
import TutorialPage from './assets/pages/Tutorials';
import MyHostels from './assets/pages/MyUploadedHostel';
import AdminHostelApproval from './assets/pages/AdminHostelApproval';
import InstallPrompt from './assets/components/InstallPrompt';
import UploadTutorial from './assets/pages/creator/UploadTutorial';
import TutorialMarketplace from './assets/pages/TutorialMarketplace';
import CreatorDashboard from './assets/pages/creator/CreatorDashboard';
import { Database } from 'lucide-react';
import AdminDashboard from './assets/pages/AdminDashboard';
import TutorWithdrawal from './assets/pages/creator/TutorWithdrawal';
import Contact from './assets/pages/Contact';
import Report from './assets/pages/Report';

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false)
    useEffect(() => {
      localStorage.setItem("theme", dark);
      }, [dark]);

       useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);
      
  return (
    <>
    
    <Navbar dark={dark} setMenuOpen={setMenuOpen} menuOpen={menuOpen} setDark={setDark}/>

    <InstallPrompt/>
      <div className={dark ? "bg-slate-900 text-white" : "bg-white text-black"}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard dark={dark} /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><TutorWithdrawal dark={dark} /></ProtectedRoute>} />
          <Route path='/creatordashboard' element={<ProtectedRoute><CreatorDashboard dark={dark}/> </ProtectedRoute>}/>


          <Route path='/' element={<Login dark={dark}/>}/>
          <Route path='/register' element={<Signup dark={dark}/>}/>
          <Route element={<DashboardLayout setMenuOpen={setMenuOpen}      menuOpen={menuOpen}  dark={dark}/>}>
            <Route path='/dashboard' element={ <ProtectedRoute><Dashboard dark={dark}/></ProtectedRoute> }/>

            <Route path='/CGPA' element={<ProtectedRoute><CGPA dark={dark}/></ProtectedRoute>}/>

            <Route path='/GPA' element={<ProtectedRoute><GPA dark={dark}/></ProtectedRoute>}/>

            <Route path='/ai' element={<ProtectedRoute><AiAssistance dark={dark}/></ProtectedRoute>}/>

            <Route path='/hostelmarketplace' element={<ProtectedRoute><HostelMarketplace dark={dark}/></ProtectedRoute>}/>

            <Route path='/uploadquestion' element={<ProtectedRoute><Upload dark={dark}/> </ProtectedRoute>}/>

            <Route path='/uploadtutorial' element={<ProtectedRoute><UploadTutorial dark={dark}/> </ProtectedRoute>}/>

            <Route path='/tutorialmarketplace' element={<ProtectedRoute><TutorialMarketplace dark={dark}/> </ProtectedRoute>}/>

            <Route path='/lecturenotesmarketplace' element={<ProtectedRoute><LectureNotesMarketplace dark={dark}/> </ProtectedRoute>}/>

            <Route path='/profile' element={<ProtectedRoute> <Profile dark={dark}/> </ProtectedRoute>}/>
            
            <Route path='/myhostels' element={<ProtectedRoute> <MyHostels dark={dark}/> </ProtectedRoute>}/>

            <Route path='/adminhostelapproval' element={<ProtectedRoute> <AdminHostelApproval dark={dark}/> </ProtectedRoute>}/>

            <Route path='/newsfeed' element={<ProtectedRoute> <NewsFeed dark={dark}/> </ProtectedRoute>}/>

            <Route path='/tutorials' element={<ProtectedRoute> <TutorialPage dark={dark}/> </ProtectedRoute>}/>

            <Route path='/questions' element={<ProtectedRoute> <Question dark={dark}/> </ProtectedRoute>}/>

            <Route path='/community' element={<ProtectedRoute> <Community dark={dark}/> </ProtectedRoute>}/>

            <Route path='/contact' element={<ProtectedRoute> <Contact dark={dark}/> </ProtectedRoute>}/>

            <Route path='/report' element={<ProtectedRoute> <Report dark={dark}/> </ProtectedRoute>}/>

            <Route path='*' element={ <div className='flex flex-col justify-center items-center bg-inherit fixed top-0 left-0 h-screen w-full'><h1 className='font-black text-6xl text-center'>404 </h1> <p className='font-bold'>Page not found</p> <Link to={'/dashboard'} className='bg-indigo-500 flex text-white p-2.5 rounded'>Dashboard</Link> </div> } />
          </Route>
        </Routes>
        </div>
    </>
  )
}

export default App
