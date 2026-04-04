import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

/**
 * High-Density Task Followups Card
 * Strictly matched to Reference 24
 */
const TaskFollowups = ({ followups = [], onViewMore, onFollowupClick }) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full h-[320px] flex flex-col relative overflow-hidden group" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0 relative z-10 border-b border-gray-50 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
            Task / <span className="text-[#2C55D4] font-extrabold uppercase">Followups</span>
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center">Today's Schedule</p>
        </div>
        <button
          onClick={onViewMore}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View More <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1 relative z-10 pt-4">
        {followups?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30 grayscale saturate-0">
            <Calendar className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              No followups today
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {followups.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onFollowupClick?.(item)}
                className="flex items-start gap-4 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-blue-50"
              >
                {/* Left Stripe Dot */}
                <div className={`w-[2.5px] h-8 rounded-full flex-shrink-0 ${item.color || 'bg-[#2C55D4]'} group-hover:scale-y-110 transition-all`} />

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1 tabular-nums">
                    {item.date}
                  </p>
                  <p className="text-slate-700 text-[11.5px] font-semibold truncate tracking-tight group-hover:text-[#2C55D4] uppercase leading-tight">
                    {item.title}
                  </p>
                </div>

                {/* Status Marker Dot */}
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-3 bg-slate-100 group-hover:bg-[#2C55D4] transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFollowups;
