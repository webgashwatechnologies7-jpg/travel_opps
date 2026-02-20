import React from "react";

const YearQueriesChart = ({
  title = "This Year Queries / Confirmed",
  height = 220,
  data = []
}) => {
  const safeHeight = Number(height) || 220;
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = Math.max(
    ...safeData.map(item => (Number(item?.queries) || 0) + (Number(item?.confirmed) || 0)),
    1
  );

  return (
    <div className="bg-[#faf9fe] rounded-lg p-4 h-full flex flex-col">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {title.split("/")[0]}
        <span className="text-blue-600"> / {title.split("/")[1]}</span>
      </h2>

      {/* Chart wrapper */}
      <div
        className="relative flex-1 min-h-0"
        style={{ height: "100%" }}
      >
        {/* Grid (behind bars) */}
        <div className="absolute inset-0 z-0 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 flex items-end justify-between h-full px-2">
          {safeData.map((item, index) => {
            const queries = Number(item?.queries) || 0;
            const confirmed = Number(item?.confirmed) || 0;
            const total = queries + confirmed;
            const barHeight = total > 0 ? (total / maxValue) * safeHeight : 0;
            const queriesHeight = total > 0 ? (queries / total) * barHeight : 0;
            const confirmedHeight = total > 0 ? (confirmed / total) * barHeight : 0;

            return (
              <div key={index} className="flex items-end flex-initial w-full max-w-[38px]">
                <div className="w-[80%] mx-auto flex relative flex-col justify-end rounded overflow-hidden">
                  {/* Confirmed */}
                  <div
                    className="bg-emerald-500"
                    style={{ height: confirmedHeight }}
                  />

                  {/* Queries */}
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
