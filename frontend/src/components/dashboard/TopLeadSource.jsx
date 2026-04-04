import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Top Lead Source Component
 * High-Density Executive Suite Style
 */
const TopLeadSource = ({ leadData = [] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("total");

  // Get lead source counts from passed data 
  const sourceStats = Array.isArray(leadData) ? leadData : [];
  
  const filteredData = [...sourceStats]
    .sort((a, b) => (filter === "confirmed" ? (b.confirmed || 0) - (a.confirmed || 0) : (b.total || 0) - (a.total || 0)))
    .slice(0, 10);

  const maxTotal = Math.max(...sourceStats.map(i => i.total || 0), 1);
  const maxConfirmed = Math.max(...sourceStats.map(i => i.confirmed || 0), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col w-full h-full relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          Top Lead <span className="text-blue-600">Source</span>
        </h2>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 bg-slate-50/50 px-3 py-1 rounded-full border border-slate-50">
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-[9px] font-black uppercase text-slate-400 font-mono">TOTAL</span>
            </div>
            <div className="flex items-center gap-1.5 grayscale opacity-50">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-[9px] font-black uppercase text-slate-400 font-mono">CONFIRMED</span>
            </div>
          </div>
          <button 
            onClick={() => navigate("/reports")}
            className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
          >
            View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1 mt-2">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30 grayscale saturate-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100 px-4 py-2 rounded-xl">
              No sources available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item, index) => {
              const totalWidth = (item.total / maxTotal) * 100;
              const confirmedWidth = (item.confirmed / maxConfirmed) * 100;

              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between py-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-tight truncate max-w-[150px] group-hover:text-blue-600 transition-colors">
                      {item.label || item.source || "Other"}
                    </span>
                    <span className="text-[10px] font-black text-blue-600 tabular-nums bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-50/50">
                      {item.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden mt-1 relative">
                    <div
                      className="absolute h-full rounded-full bg-blue-100 transition-all duration-700"
                      style={{ width: `${totalWidth}%` }}
                    />
                    <div
                      className="absolute h-full rounded-full bg-[#2C55D4] transition-all duration-1000 shadow-sm"
                      style={{ width: `${confirmedWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopLeadSource;
