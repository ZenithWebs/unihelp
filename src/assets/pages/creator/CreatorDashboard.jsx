import { useState } from "react";
import DashboardHome from "./DashboardHome";
import MyTutorials from "./MyTutorials";
import UploadTutorial from "./UploadTutorial";
import { ActivitySquare, ChartBar, ChartBarBig, DollarSign, GraduationCap, GraduationCapIcon, Plus, PlusIcon } from "lucide-react";
import TutorWithdrawal from "./TutorWithdrawal";
import BottomBar from "../../components/BottomBar";

export default function CreatorDashboard({ dark }) {
  const [tab, setTab] = useState("dashboard");
  const [open, setOpen] = useState(false);

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <DashboardHome dark={dark} />;
      case "tutorials":
        return <MyTutorials dark={dark} />;
      case "upload":
        return <UploadTutorial dark={dark} />;
        case "withdraw":
        return <TutorWithdrawal dark={dark} />;
      default:
        return null;
    }
  };

  const NavItem = ({ label, icon, value }) => (
    <button
      onClick={() => {
        setTab(value);
        setOpen(false);
      }}
      className="flex items-center gap-2 w-full px-4 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition"
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div className={`flex min-h-screen ${dark ? "bg-[#0f172a] text-white" : "bg-gray-100 text-black"}`}>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-[#020617] text-white">
        <h1 className="font-bold flex items-center"><ActivitySquare size={33}/> Creator</h1>
        <button onClick={() => setOpen(true)}>☰</button>
      </div>

      {/* SIDEBAR DESKTOP */}
      <div className={`hidden md:block w-64 p-4 ${dark ? "bg-[#020617]" : "bg-white"} border-r`}>
        <h1 className="text-xl font-bold mb-6 flex items-center gap-1.5"><ActivitySquare size={33}/> Creator</h1>

        <nav className="space-y-2">
          <NavItem label="Dashboard" icon={<ChartBarBig/>} value="dashboard" />
          <NavItem label="My Tutorials" icon={<GraduationCapIcon/>} value="tutorials" />
          <NavItem label="Upload" icon={<PlusIcon/>} value="upload" />
          <NavItem label="Withdraw" icon={<DollarSign/>} value="withdraw" />
        </nav>
      </div>

      {/* MOBILE SIDEBAR */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          
          {/* OVERLAY */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* DRAWER */}
          <div className={`w-64 p-4 ${dark ? "bg-[#020617]" : "bg-white"}`}>
            <h1 className="text-xl font-bold mb-6">🎬 Creator</h1>

            <nav className="space-y-2">
              <NavItem label="Dashboard" icon={<ChartBar/>}value="dashboard" />
              <NavItem label="My Tutorials" icon={<GraduationCap/>}value="tutorials" />
              <NavItem label="Upload" icon={<Plus/>} value="upload" />
              <NavItem label="Withdraw" icon={<DollarSign/>} value="withdraw" />
            </nav>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-6 mt-14 md:mt-0">
        {renderTab()}
      </div>
      <BottomBar/>
    </div>
  );
}