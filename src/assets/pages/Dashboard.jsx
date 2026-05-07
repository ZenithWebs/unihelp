import React, { useContext, useEffect, useState } from 'react'
import Card from './../components/Card';
import { Activity, Book, Calculator, ChartBar, File, HistoryIcon, Home, MessageCircle, Newspaper, NewspaperIcon, PlayIcon, Sparkles, Trash2Icon, UploadCloud, Video } from 'lucide-react';
import { AuthContext } from './../context/AuthContext';
import {
  query,
  where,
  getDocs,
  deleteDoc,
  doc, 
  collection,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from 'firebase/auth';
import SmartFeed from '../components/SmartFeed';
import DonationPopupSystem from './../components/DonationPopup';


const Dashboard = ({dark}) => {

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const {user} = useContext(AuthContext);


    useEffect(() => {
  if (user) {
    fetchRecords(user);
  } else {
    setLoading(false);
  }
}, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "cgpaTracker", id));
      setRecords(records.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRecords = async (user) => {
  if (!user) return;

  const q = query(
    collection(db, "cgpaTracker"),
    where("userId", "==", user.uid)
  );

  const snap = await getDocs(q);

  const data = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  setRecords(data);
  setLoading(false);
};

  const sortedRecords = [...records].sort((a, b) => {
  const aTime = a.createdAt?.seconds || 0;
  const bTime = b.createdAt?.seconds || 0;
  return bTime - aTime;
});

  const dashboard = {
    totalRecords: records.length,
    bestCGPA: records.length
      ? Math.max(
        ...records.map((r) => Number(r.cgpa) || 0)
      )
      : 0,
    avgCGPA: records.length
      ? (
          records.reduce((a, b) => a + Number(b.cgpa), 0) /
          records.length
        ).toFixed(2)
      : 0,
      lastCGPA: sortedRecords.length ? sortedRecords[0].cgpa : 0,
  };

  return (
    <div className='py-2.5  px-5 w-full'>
      <h1 className='font-black text-2xl mb-5'>Welcome Back, { user?.displayName || "Student" } 👋</h1>

      <div className={`p-5 rounded-xl my-6 ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <h2 className="font-bold mb-4 flex gap-1.5 items-baseline"><ChartBar size={20} className='text-indigo-500'/> Dashboard Overview</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          
          <div className={`p-3 rounded ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className="text-xs opacity-60">Records</p>
            <h2 className="font-bold">{dashboard.totalRecords}</h2>
          </div>

          <div className={`p-3 rounded ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className="text-xs opacity-60">Best CGPA</p>
            <h2 className="font-bold text-green-500">
              {dashboard.bestCGPA}
            </h2>
          </div>

          <div className={`p-3 rounded ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className="text-xs opacity-60">Average</p>
            <h2 className="font-bold">{dashboard.avgCGPA}</h2>
          </div>

          <div className={`p-3 rounded ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className="text-xs opacity-60">Last</p>
            <h2 className="font-bold text-indigo-500">
              {dashboard.lastCGPA}
            </h2>
          </div>

        </div>
      </div>
      

      <div className='grid grid-cols-1 sm:grid-cols-2 mx-auto md:grid-cols-3 gap-5'>
        <Card url={'/GPA'} dark={dark} background={'bg-[#601b9b]'} icon={<Calculator/>} title={'GPA Calculator'} description={'Calculate and track your GPA'} />

        <Card url={'/CGPA'} dark={dark} background={'bg-[red]'} icon={<Activity/>} title={'CGPA Tracker'} description={'Track your CGPA across semesters'} />

        <Card url={'/questions'} dark={dark} background={'bg-[#4234a5]'} icon={<File/>} title={'Past Questions'} description={'Browse and Download Past Question'} />
        
        <Card url={'/tutorialmarketplace'} dark={dark} background={'bg-green-700'} icon={<Video/>} title={'Tutorial Video'} description={'watch Tutorial video'} />


        <Card url={'/hostelmarketplace'} dark={dark} background={'bg-indigo-500'} icon={<Home/>} title={'Hostel Market Place'} description={'Find verify hostel near your campus'} />

        <Card url={'/lecturenotesmarketplace'} dark={dark} background={'bg-yellow-500'} icon={<UploadCloud/>} title={'Lecture Notes'} description={'Share Lecture Notes & request for lecture note from others'} />

        <Card url={'/ai'} dark={dark} background={'bg-black'} icon={<Sparkles/>} title={'AI Study Assistant'} description={'Ask questions and get instant explanations and study help.'} />


        <Card url={'/community'} dark={dark} background={'bg-amber-900'} icon={<MessageCircle/>} title={'Community Chat'} description={'Real-time group chat for students like WhatsApp-style discussion rooms.'} />


        <Card url={'/tutorials'} dark={dark} background={'bg-pink-600'} icon={<PlayIcon/>} title={'Video Player'} description={'Search and watch educational videos directly inside the app.'} />

        <Card url={'/newsfeed'} dark={dark} background={'bg-blue-400'} icon={<NewspaperIcon/>} title={'Smart Newsfeed'} description={'News, techs and opportunities curated for you'} />


      </div>
      <SmartFeed dark={dark}/>
      

        <div className={`p-5 rounded-xl mt-6 ${dark ? "bg-[#111827]" : "bg-white"}`}>
        <h2 className="font-bold mb-4 flex items-center gap-2"><HistoryIcon className='text-red-500'/> CGPA History</h2>

        {loading && <p>Loading...</p>}

        {!loading && records.length === 0 && (
          <p className="text-sm opacity-60">No saved records yet</p>
        )}

  <div className="grid md:grid-cols-2 gap-4">
        {records.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-lg border"
          >
            <div className="flex justify-between">
              <h2 className="font-bold text-indigo-500">
                CGPA: {r.cgpa}
              </h2>

              <button
                onClick={() => handleDelete(r.id)}
                className="text-red-500"
              >
                <Trash2Icon size={18} />
              </button>
            </div>

            <div className="mt-2 text-sm opacity-70">
              {r.semesters.map((s, i) => (
                <p key={i}>
                  {s.name} — {s.units} units ({s.gpa})
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    <DonationPopupSystem dark={dark}/>
    <pre className='max-md:hidden'>



    </pre>
    </div>
  )
}

export default Dashboard
