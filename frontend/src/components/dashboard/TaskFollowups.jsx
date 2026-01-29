import React, { useState } from "react";

const TaskFollowups = ({ followups, onViewMore, onFollowupClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#F4F6FF] rounded-xl p-4 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font triggered">Task / <span className="text-[#3B82F6]">Followup's</span></h2>
        <button
          type="button"
          onClick={onViewMore}
          className="text-[#3B82F6] text-sm font-medium flex items-center gap-1"
        >
          View more
          <span className={`transition-transform ${expanded && followups?.length > 3 ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
      </div>

      <div className="h-[1px] bg-[#E5E7EB] mb-2" />

      {/* List */}
      <div
        className={`
          transition-all duration-300 flex-1
          ${expanded ? "overflow-y-auto custom-scroll" : "overflow-hidden"}
        `}
      >
        {followups?.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No followups today</p>
        ) : followups.map((item) => (
          <div
            key={item.id}
            onClick={() => onFollowupClick?.(item)}
            className={`
              flex items-center gap-4 px-3 py-3 rounded-md cursor-pointer
              ${item.highlight ? "bg-[#FFF5E8]" : "hover:bg-gray-50"}
            `}
          >
            {/* Left Color Bar */}
            <div className="w-[2px] h-4 rounded-full">
              {item.color !== "bg-transparent" && (
                <div className={`w-full h-full rounded-full ${item.color}`} />
              )}
            </div>

            {/* Date */}
            <div className={`text-[12px] ${item.highlight ? "text-orange-500 font-medium" : "text-gray-700"}`}>
              {item.date}
            </div>

            {/* Check */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-green-500 text-xs">✔</span>
              <span className="text-gray-800 text-[12px]">{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskFollowups;
