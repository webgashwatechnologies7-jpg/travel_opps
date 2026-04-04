import React, { useMemo } from "react";
import { ChevronDown } from "lucide-react";

/**
 * High-Density Revenue Growth Comparison Card
 * Strictly matched to Reference 24
 */
const RevenueGrowthCard = ({ title, data = [], onButtonClick }) => {
  const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

  const coloredData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        dotColor: randomColor(),
      })),
    [data]
  );

  return (
    <div className="rounded-2xl bg-white p-6 w-full h-full flex flex-col shadow-sm border border-gray-100 overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Title */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          {title}
        </h2>
        <button 
          onClick={onButtonClick} 
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 overflow-y-auto custom-scroll pr-3 -mr-1">
        {coloredData.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full shadow-sm"
                  style={{ backgroundColor: item.dotColor }}
                />
                <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px] uppercase tracking-tight group-hover:text-blue-600">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-blue-600 tabular-nums">
                  {item.value || '0%'}
                </span>
                <div className="h-1 w-10 rounded-full bg-slate-100 shadow-inner overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ backgroundColor: item.dotColor, width: item.value || '0%' }}
                  />
                </div>
              </div>
            </div>

            {index !== data.length - 1 && (
              <div className="h-[1px] bg-slate-50 mt-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueGrowthCard;
