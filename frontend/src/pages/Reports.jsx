import React, { useState, lazy, Suspense } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  UserCircle2, 
  ClipboardCheck,
  ChevronRight,
  LayoutDashboard,
  Search
} from "lucide-react";
import LogoLoader from "../components/LogoLoader";

// Lazy load the report components
const AnalyticsReport = lazy(() => import("./Analytics"));
const PerformanceReport = lazy(() => import("./Performance"));
const TeamStructureReport = lazy(() => import("./TeamReports"));

/**
 * Executive Suite Reports - Intelligence Hub
 * Refined Typography: No more "Cartoon" fonts. 
 * Using 18px Semibold Poppins for headers, 11px bold blue for buttons.
 */
const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const menuItems = [
    { id: "overview", label: "OVERVIEW", icon: LayoutDashboard },
    { id: "analytics", label: "ANALYSIS", icon: BarChart3 },
    { id: "performance", label: "PERFORMANCE", icon: TrendingUp },
    { id: "team", label: "TEAM REPORTS", icon: Settings },
  ];

  const reportCards = [
    { id: "analytics", title: "Source & Destination", desc: "ROI and Destination analysis.", icon: BarChart3, color: "bg-[#2C55D4]" },
    { id: "performance", title: "Employee Performance", desc: "Targets and achievements.", icon: TrendingUp, color: "bg-[#10B981]" },
    { id: "team", title: "Team Reports", desc: "Hierarchy and structural data.", icon: Settings, color: "bg-[#8B5CF6]" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return <AnalyticsReport />;
      case "performance":
        return <PerformanceReport />;
      case "team":
        return <TeamStructureReport />;
      case "overview":
      default:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {reportCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setActiveTab(card.id)}
                  className="group relative bg-white border border-gray-100 rounded-2xl p-7 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${card.color} shadow-lg shadow-blue-200/20 text-white transform group-hover:scale-105 transition-transform duration-500`}>
                        <card.icon size={22} strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-300 group-hover:text-[#2C55D4] uppercase">
                        REPORT ACTIVE
                      </span>
                    </div>
                    <h2 className="text-[18px] font-semibold text-gray-800 mb-2 transition-colors leading-snug">
                      {card.title}
                    </h2>
                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed mb-6 flex-1">
                      {card.desc}
                    </p>
                    <div className="flex items-center gap-1.5 pt-4 border-t border-gray-50 mt-auto">
                      <span className="text-[11px] font-bold text-[#2C55D4] uppercase tracking-wide">
                        View Report
                      </span>
                      <ChevronRight size={12} strokeWidth={3} className="text-[#2C55D4] translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Quick Links */}
            <div className="mt-12">
               <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Master Data Repositories</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="/accounts/clients" className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-100"><UserCircle2 size={18} /></div>
                        <div>
                           <p className="text-[14px] font-semibold text-gray-800">Client Directory</p>
                           <p className="text-[11px] font-medium text-slate-400">Advanced customer account management</p>
                        </div>
                     </div>
                     <ChevronRight size={14} className="text-slate-300 group-hover:text-[#2C55D4] transform group-hover:translate-x-1 transition-all" />
                  </a>
                  <a href="/leads" className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all group shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-100"><ClipboardCheck size={18} /></div>
                        <div>
                           <p className="text-[14px] font-semibold text-gray-800">Sales Pipeline</p>
                           <p className="text-[11px] font-medium text-slate-400">Comprehensive query and booking summaries</p>
                        </div>
                     </div>
                     <ChevronRight size={14} className="text-slate-300 group-hover:text-[#2C55D4] transform group-hover:translate-x-1 transition-all" />
                  </a>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Executive Navbar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-5 lg:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-11 h-11 bg-[#2C55D4] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <BarChart3 size={22} strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight leading-none">Intelligence Hub</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 opacity-80">
                   Unified CRM Reporting Suite
                </p>
             </div>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold transition-all uppercase tracking-widest whitespace-nowrap ${
                    activeTab === item.id 
                      ? 'bg-white text-[#2C55D4] shadow-md border border-blue-50' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={13} strokeWidth={2.5} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 lg:p-12">
        <div className="max-w-[1600px] mx-auto">
          <Suspense 
            fallback={
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <LogoLoader text="Syncing Analytic Data..." />
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Reports;
