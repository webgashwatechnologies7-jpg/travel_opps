import React from "react";

const YearQueriesChart = ({
  title = "This Year Queries / Confirmed",
  height = 220,
  data=[
    
  ]
}) => {

  console.log(data);
  
  const maxValue = Math.max(
    ...data.map(item => item.queries + item.confirmed),
    1
  );

  return (
    <div className="bg-[#faf9fe] rounded-lg  p-4 mt-2">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {title.split("/")[0]}
        <span className="text-blue-600"> / {title.split("/")[1]}</span>
      </h2>

      {/* Chart wrapper */}
      <div
        className="relative"
        style={{ height }}
      >
        {/* Grid (behind bars) */}
        <div className="absolute inset-0 z-0 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 flex items-end justify-between h-full px-2">
          {data.map((item, index) => {
            const total = item.queries + item.confirmed;
            const barHeight = (total / maxValue) * height;

            const queriesHeight = (item.queries / total) * barHeight;
            const confirmedHeight = (item.confirmed / total) * barHeight;

            return (
              <div key={index} className="flex  items-end w-[38px]">
                <div className="w-full flex relative flex-col justify-end rounded overflow-hidden">
                  {/* Confirmed */}
                  <div
                    className="bg-emerald-500"
                    style={{ height: confirmedHeight }}
                  />

                  {/* Queries */}
                  {/* <p className=" absolute top-[50%] rotate-90">{item.month}</p> */}
                  <div
                    className="bg-blue-400"
                    style={{ height: queriesHeight }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearQueriesChart;
