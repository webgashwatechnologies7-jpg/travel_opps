import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#FF9F43", // Proposal Sent
  "#9B59B6", // Hot Lead
  "#EB5757", // Cancel
  "#3867D6", // Proposal Converted
  "#2EC4B6", // Confirmed
];
const UpcomingTours = () => {
  const data = [
    { name: "Proposal Sent", value: 4.2 },
    { name: "Hot Lead", value: 2.1 },
    { name: "Cancel", value: 1.5 },
    { name: "Proposal Converted", value: 4.5 },
    { name: "Confirmed", value: 46.1 },
  ];

  return (
    <div className="bg-white w-full h-full relative rounded-xl shadow-sm overflow-y-auto p-4 flex flex-col items-center gap-3 transition-all duration-300">

      {/* Title Section */}
      <div className="w-full flex-shrink-0">
        <h2 className="text-base md:text-lg font-bold text-gray-900">
          Upcoming Tours
        </h2>
      </div>

      {/* Chart Section */}
      <div className="relative flex-none w-[120px] h-[120px] md:w-[140px] md:h-[140px] lg:w-[200px] lg:h-[200px] flex items-center justify-center flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={window.innerWidth < 1024 ? 35 : 65}
              outerRadius={window.innerWidth < 1024 ? 55 : 95}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER TEXT */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <h3 className="text-xs font-bold text-gray-900 leading-tight">
            Queries
          </h3>
          <p className="text-[10px] font-medium text-gray-500 leading-tight">
            Status
          </p>
        </div>
      </div>

      {/* Progress Bars Section - Now properly positioned */}
      <div className="space-y-2 grid grid-cols-2 gap-x-2 w-full flex-shrink-0">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 min-w-[8px] rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-xs md:text-xs lg:text-[10px] xl:text-xs font-medium text-slate-700 truncate">
              {item.name} {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingTours;
