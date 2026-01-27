import React from "react";

const QuiriesDetailsHeader = ({
  filterValue = "All",
  searchPlaceholder = "Search Queries...",
  onFilterClick,
  onSearch,
  onFlightSearch,
  onHotelSearch,
  userName = "Gashwa",
  userAvatar
}) => {
  return (
    <div className="w-full bg-[#f5f7fb] p-4 rounded-2xl">
      <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-full shadow-sm">

        {/* FILTER */}
        <button
          onClick={onFilterClick}
          className="flex items-center gap-1 text-sm font-medium text-gray-600"
        >
          {filterValue}
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {/* DIVIDER */}
        <div className="h-6 w-px bg-gray-200" />

        {/* SEARCH INPUT */}
        <div className="flex items-center flex-1 gap-2 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 001.48-5.34C15.19 5.01 12.18 2 8.59 2S2 5.01 2 8.39c0 3.38 3.01 6.39 6.59 6.39a6.47 6.47 0 004.13-1.48l.27.28v.79l5 4.99L20.49 19l-4.99-5z"
            />
          </svg>

          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFlightSearch}
            className="flex items-center gap-2 bg-[#1d4ed8] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ✈ Flight Search
          </button>

          <button
            onClick={onHotelSearch}
            className="flex items-center gap-2 bg-[#fbbf24] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            🏨 Hotel Search
          </button>
        </div>

        {/* USER */}
        <div className="flex items-center gap-2 ml-2">
          <img
            src={userAvatar || "https://via.placeholder.com/32"}
            alt="User"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-gray-700">
            {userName}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </div>

      </div>
    </div>
  );
};

export default QuiriesDetailsHeader;
