import React from "react";
import { Search, ChevronDown } from "lucide-react";

export default function HeaderComponent({
  searchPlaceholder = "Search Queries...",
  onSearch,
  flightText = "Flight Search",
  hotelText = "Hotel Search",
  onFlightClick,
  onHotelClick,
  userName,
  userAvatar,
  onProfileClick,
}) {
  return (
    <div className="w-full bg-[#F7FAFC] px-4 py-3">
      <div className="bg-white rounded-full shadow-sm flex items-center justify-between px-4 py-2">
        {/* Search */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Flight Button */}
          <button
            onClick={onFlightClick}
            className="bg-[#0B3C91] hover:bg-[#0A347D] transition text-white text-sm px-4 py-2 rounded-md flex items-center gap-1"
          >
            ✈️ {flightText}
          </button>

          {/* Hotel Button */}
          <button
            onClick={onHotelClick}
            className="bg-[#F6A623] hover:bg-[#E0951F] transition text-white text-sm px-4 py-2 rounded-md flex items-center gap-1"
          >
            🏨 {hotelText}
          </button>

          {/* User */}
          <div
            onClick={onProfileClick}
            className="flex items-center gap-2 cursor-pointer ml-2"
          >
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-800">
              {userName}
            </span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
