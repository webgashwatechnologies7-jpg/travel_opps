import React from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Annual Engagement / Year Queries Chart
 * High-Density Executive Suite Styling
 */
const YearQueriesChart = ({ title = "Annual Engagement", data = [] }) => {
  const navigate = useNavigate();
  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { month: 'Jan', queries: 20, confirmed: 10 },
    { month: 'Feb', queries: 40, confirmed: 15 },
    { month: 'Mar', queries: 35, confirmed: 12 },
    { month: 'Apr', queries: 50, confirmed: 25 },
    { month: 'May', queries: 45, confirmed: 30 },
    { month: 'Jun', queries: 60, confirmed: 35 },
    { month: 'Jul', queries: 70, confirmed: 40 },
    { month: 'Aug', queries: 55, confirmed: 45 },
    { month: 'Sep', queries: 80, confirmed: 60 },
    { month: 'Oct', queries: 90, confirmed: 70 },
    { month: 'Nov', queries: 85, confirmed: 65 },
    { month: 'Dec', queries: 100, confirmed: 80 }
  ];

  const maxValue = Math.max(...safeData.map(item => (Number(item?.queries) || 0) + (Number(item?.confirmed) || 0)), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden group" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          Annual <span className="text-blue-600">Engagement</span>
        </h2>
        <button
          onClick={() => navigate("/reports")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-col relative pt-4 overflow-hidden">
        {/* Horizontal Grid lines */}
        <div className="absolute inset-x-0 inset-y-0 z-0 flex flex-col justify-between pt-10 pb-12 px-4 shadow-inner bg-slate-50/10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-t border-slate-50 w-full" />
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex items-end justify-around h-full w-full px-1 pb-10">
          {safeData.map((item, index) => {
            const queries = Number(item?.queries) || 0;
            const confirmed = Number(item?.confirmed) || 0;
            const total = queries + confirmed;
            const barHeight = total > 0 ? (total / maxValue) * 100 : 0;
            const confirmedHeight = total > 0 ? (confirmed / total) * 100 : 0;

            return (
              <div key={index} className="flex flex-col items-center flex-1 h-full max-w-[28px] group/bar mx-0.5">
                <div className="flex-1 w-full h-full flex items-end">
                  <div
                    className="w-full relative flex flex-col justify-end rounded-lg shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-md cursor-pointer overflow-hidden border border-white/50"
                    style={{ height: `${Math.max(barHeight, 2)}%` }}
                  >
                    <div className="bg-[#2EA7A0] shrink-0" style={{ height: `${confirmedHeight}%` }} />
                    <div className="bg-[#7AA7FF] flex-1" />
                  </div>
                </div>
                <div className="mt-2 text-[8px] font-black text-slate-400 rotate-[45deg] group-hover/bar:text-blue-600 transition-colors uppercase tracking-widest whitespace-nowrap">
                  {item.month || index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Stats Legend */}
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50/50 rounded-2xl absolute bottom-0 left-0 right-0 border-t border-slate-50 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7AA7FF] shadow-sm" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">QUERIES</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2EA7A0] shadow-sm" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CONFIRMED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearQueriesChart;
