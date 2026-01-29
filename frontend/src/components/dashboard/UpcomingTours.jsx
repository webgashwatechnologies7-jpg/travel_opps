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
<<<<<<< HEAD
const widths = [
  "200px", "170px", "120px", "170px", "200px"
]
=======

>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
const UpcomingTours = () => {
  const data = [
    { name: "Proposal Sent", value: 4.2 },
    { name: "Hot Lead", value: 2.1 },
    { name: "Cancel", value: 1.5 },
    { name: "Proposal Converted", value: 4.5 },
    { name: "Confirmed", value: 46.1 },
  ];

  return (
<<<<<<< HEAD
    <div className="bg-white w-full h-full xl:h-fit relative rounded-xl shadow-sm overflow-hidden p-4 flex flex-col   items-center gap-4 transition-all duration-300">

      {/* LEFT SECTION - List */}
      <div className="flex-1 w-full space-y-">
        <h2 className="text-base md:text-lg font-bold text-gray-900">
          Upcoming Tours
        </h2>

      
      </div>

      {/* RIGHT SECTION - Chart */}
      <div className="relative flex-none w-[120px] h-[120px] md:w-[140px] md:h-[140px] lg:w-[200px] lg:h-[200px] flex items-center justify-center">
=======
    <div className="bg-white w-full h-full relative rounded-xl shadow-sm overflow-y-auto p-4 flex flex-col items-center gap-3 transition-all duration-300">

      {/* Title Section */}
      <div className="w-full flex-shrink-0">
        <h2 className="text-base md:text-lg font-bold text-gray-900">
          Upcoming Tours
        </h2>
      </div>

      {/* Chart Section */}
      <div className="relative flex-none w-[120px] h-[120px] md:w-[140px] md:h-[140px] lg:w-[200px] lg:h-[200px] flex items-center justify-center flex-shrink-0">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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
<<<<<<< HEAD
        <div className="space-y-2 grid grid-cols-2 gap-x-2 w-full">
          {data.map((item, index) => (
            // <div
            //   key={item.name}
            //   className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2 py-2"
            // >
            //   <div className="flex items-center gap-2 overflow-hidden">
              
            //     {/* <span className="text-xs md:text-xs lg:text-[10px] xl:text-xs font-medium text-slate-700 truncate" title={item.name}>
            //       {item.name}
            //     </span> */}
            //   </div>
            //   {/* <span className="text-xs font-semibold text-slate-900 ml-2">
            //     {item.value}
            //   </span> */}
            // </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 min-w-[8px] rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs md:text-xs lg:text-[10px] xl:text-xs font-medium text-slate-700 truncate">
                {item.name}  {item.value}%
              </span>
            </div>
          ))}
        </div>
=======

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
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
    </div>
  );
};

export default UpcomingTours;
<<<<<<< HEAD


=======
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
