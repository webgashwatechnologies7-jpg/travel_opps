import React from "react";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  ChevronDown,
  Bell,
  MessageCircle,
} from "lucide-react";

export default function QueriesHeader({
  title = "Queries",

  searchLabel = "Search",
  filterLabel = "Filter",
  dateLabel = "Data Range",
  destinationLabel = "Destination",

  onSearchClick,
  onFilterClick,
  onDateClick,
  onDestinationClick,

  onChatClick,
  onNotificationClick,
  onMoreClick,

  showNotificationDot = true,
}) {
  const IconsGroup = () => (
    <>
      <IconButton onClick={onChatClick}>
        <MessageCircle size={18} />
      </IconButton>

      <IconButton onClick={onNotificationClick}>
        <div className="relative">
          <Bell size={18} />
          {showNotificationDot && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </IconButton>

      <IconButton onClick={onMoreClick}>
        <ChevronDown size={18} />
      </IconButton>
    </>
  );

  return (
    <div className="w-full bg-[#F7FAFC] px-4 py-3">
      <div className="bg-white rounded-xl border shadow-sm px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* LEFT SIDE: Title + Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">

            {/* Mobile Top Row: Title + Mobile Icons */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <h2 className="text-[20px] font-semibold text-gray-900 whitespace-nowrap">
                {title}
              </h2>

              {/* Visible only on Mobile */}
              <div className="flex md:hidden items-center gap-2">
                <IconsGroup />
              </div>
            </div>

            {/* Controls / Action Buttons */}
            {/* Scrollable on mobile, standard flex on desktop */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scroll no-scrollbar">
              <ActionButton
                icon={<Search size={14} className="flex-shrink-0" />}
                label={searchLabel}
                onClick={onSearchClick}
              />
              <ActionButton
                icon={<Filter size={14} className="flex-shrink-0" />}
                label={filterLabel}
                onClick={onFilterClick}
              />
              <ActionButton
                icon={<Calendar size={14} className="flex-shrink-0" />}
                label={dateLabel}
                onClick={onDateClick}
              />
              <ActionButton
                icon={<MapPin size={14} className="flex-shrink-0" />}
                label={destinationLabel}
                onClick={onDestinationClick}
              />
            </div>
          </div>

          {/* RIGHT SIDE: Desktop Icons */}
          {/* Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-3">
            <IconsGroup />
          </div>
        </div>
      </div>
    </div>
  );
}

/* 🔹 Small Components */

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-[#F8FAFC] text-sm text-gray-600 hover:bg-gray-100 transition"
    >
      {icon}
      <span>{label}</span>
      <ChevronDown size={14} />
    </button>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border bg-[#F8FAFC] flex items-center justify-center hover:bg-gray-100 transition"
    >
      {children}
    </button>
  );
}
