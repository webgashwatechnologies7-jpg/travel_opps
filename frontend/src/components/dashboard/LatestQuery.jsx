import React from "react";
import { ChevronDown } from "lucide-react";

const LatestQuery = ({ latestNotes = [], onViewMore }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          Latest Query <span className="text-[#2C55D4]">Notes</span>
        </h2>
        <button
          onClick={onViewMore}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View More <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-2 relative -mr-1">
        {latestNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30 grayscale saturate-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notes available</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6">
            {/* Timeline Vertical Line */}
            <div className="absolute left-1.5 top-2 bottom-4 w-[2px] bg-slate-100 rounded-full" />

            {latestNotes.map((note, index) => {
              const dateObj = note.created_at ? new Date(note.created_at) : new Date();
              const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

              return (
                <div key={index} className="relative group cursor-pointer">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#2C55D4] ring-4 ring-blue-50/50 shadow-sm transition-transform group-hover:scale-125" />

                  {/* Content Label Only (Matching Reference Style) */}
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[11.5px] font-semibold text-slate-700 truncate uppercase tracking-tight group-hover:text-[#2C55D4] transition-colors">
                      {note.lead?.client_name || note.client_name || "Note Update"}
                    </p>
                    <span className="text-[9px] font-bold text-slate-300 tabular-nums uppercase">{dateStr}</span>
                  </div>

                  <p className="text-[10px] font-medium text-slate-400 line-clamp-3 leading-relaxed tracking-tight uppercase group-hover:text-slate-500 transition-colors">
                    {note.note || note.remark || "Shared an update on the query."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestQuery;
