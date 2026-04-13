import React from 'react';
import { Search, Clock, ChevronDown } from 'lucide-react';

/**
 * Today Queries Comparison Card
 * Strictly matched to Reference 24
 */
const TodayQueriesCard = ({ queries = [], loading, onViewAll, onQueryClick }) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full h-[320px] flex flex-col relative overflow-hidden group" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Visual Decoration Shape - Matched to Reference 24 */}
      <div className="absolute top-1/2 -right-8 w-64 h-64 bg-blue-50/20 rounded-full z-0 -translate-y-1/2 transition-transform duration-700 group-hover:scale-105"></div>
      <div className="absolute -bottom-8 right-1/4 w-32 h-32 bg-blue-100/10 rounded-full z-0"></div>

      {/* Top Header - Icon Left, Text Right (Strict 24 Match) */}
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#2C55D4] flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
            <Search size={18} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
              Today's <span className="text-blue-600">Queries</span>
            </h2>
            <p className="text-[20px] font-bold text-slate-800 leading-none mt-1 tabular-nums">{queries.length}</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-1 relative z-10 mt-2">
        {queries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 opacity-30 grayscale saturate-0">
            <Clock className="h-12 w-12 text-slate-300 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed text-center">
              No queries today
            </p>
          </div>
        ) : (
          queries.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onQueryClick?.(item)}
              className="px-2 py-3 cursor-pointer border-b last:border-0 border-gray-50 hover:bg-slate-50 transition-all rounded-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2C55D4] flex-shrink-0" />
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-tight truncate leading-tight group-hover:text-[#2C55D4]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-1 truncate max-w-[150px]">
                      {item.name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold text-slate-500 tabular-nums uppercase">{item.date}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodayQueriesCard;
