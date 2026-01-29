import React from "react";

const TodayQueriesCard = ({ queries = [], totalCount, loading, onViewAll, onQueryClick }) => {
  const displayCount = typeof totalCount === "number" ? totalCount : queries.length;

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="rounded-lg p-4" style={{
        backgroundImage: `
      linear-gradient(
        rgba(255, 255, 255, 0.45),
        rgba(255, 255, 255, 0.45)
      ),
      url(/images/dashboard/queries.svg)
    `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white text-lg shadow-sm" >
            <img src="/icons/bucket.svg" className="w-5 h-5 invert brightness-0" alt="" />
          </div>

          <div>
            <p className="text-xs font-medium text-black">Today's Queries</p>
            <h2 className="text-base font-bold text-gray-900">
              {loading ? "-" : displayCount}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-blue-700 hover:underline mt-1 inline-block"
        >
          View All Queries
        </button>
      </div>

      {/* List */}
      <div className="mt-1 p-4 bg-white flex-1 space-y-3 min-h-[140px] overflow-y-auto custom-scroll pr-2 -mr-2">
        {loading ? (
          <div className="text-center text-xs text-gray-400">Loading...</div>
        ) : queries.length === 0 ? (
          <div className="text-center text-xs text-gray-400">No queries today</div>
        ) : (
          queries.map((item) => (
            <div
              key={item.id || `${item.title}-${item.date}`}
              onClick={() => onQueryClick?.(item)}
              className="border-b border-gray-300 pb-3 last:border-b-0 last:pb-0 cursor-pointer hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-800 truncate" title={item.title}>
                {item.title}
              </h4>

              <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1 truncate max-w-[60%]">
                  <img src="/icons/user.svg" className="w-3 h-3" alt="" />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="text-blue-600 whitespace-nowrap">{item.date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Button */}
      <div className="p-2 bg-white pt-0">
        <button
          type="button"
          onClick={onViewAll}
          className="w-fit px-3 py-2 rounded-md bg-primary text-xs text-white font-medium hover:bg-secondary transition-colors shadow-sm"
        >
          View All Queries
        </button>
      </div>
    </div>
  );
};

export default TodayQueriesCard;
