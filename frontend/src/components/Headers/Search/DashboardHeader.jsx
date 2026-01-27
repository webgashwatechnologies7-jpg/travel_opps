import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Bell,
  Settings,
  Grid
} from "lucide-react";

export default function DashboardHeader() {
  const [openFilter, setOpenFilter] = useState(false);

  return (
    <>
      <div className="w-full bg-[#E6EAF8] px-4 py-2">
        {/* ================= DESKTOP HEADER (UNCHANGED) ================= */}
        <div className="hidden lg:flex flex-wrap items-center justify-between gap-3">

          {/* LEFT */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center bg-white rounded-md px-3 h-9 w-[260px]">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-sm w-full"
              />
            </div>

            <button className="flex items-center gap-1 bg-white h-9 px-3 rounded-md text-sm">
              <SlidersHorizontal size={14} />
              Filter
              <ChevronDown size={14} />
            </button>

            <button className="flex items-center gap-1 bg-white h-9 px-3 rounded-md text-sm">
              Select
              <ChevronDown size={14} />
            </button>

            <button className="flex items-center justify-center bg-white h-9 w-9 rounded-md">
              <Grid size={16} />
            </button>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <button className="h-9 px-4 bg-[#0B3C88] text-white rounded-md text-sm font-medium">
              Flight Search
            </button>

            <button className="h-9 px-4 bg-[#FDB44B] text-white rounded-md text-sm font-medium">
              Hotel Search
            </button>

            <button className="h-9 w-9 bg-white rounded-md flex items-center justify-center">
              <Bell size={16} />
            </button>

            <button className="h-9 w-9 bg-white rounded-md flex items-center justify-center">
              <Settings size={16} />
            </button>

            <div className="flex items-center gap-2 bg-white h-9 px-2 rounded-md">
              <img
                src="https://i.pravatar.cc/40"
                alt="user"
                className="h-6 w-6 rounded-full"
              />
              <span className="text-sm font-medium">Evan Yates</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* ================= MOBILE / TABLET HEADER ================= */}
        <div className="lg:hidden">
          {/* TOP BAR */}
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-2">
              <button className="h-9 px-3 bg-[#0B3C88] text-white rounded-md text-sm">
                Flight
              </button>
              <button className="h-9 px-3 bg-[#FDB44B] text-white rounded-md text-sm">
                Hotel
              </button>
              <button className="h-9 w-9 bg-white rounded-md flex items-center justify-center">
                <Bell size={16} />
              </button>
              <button className="h-9 w-9 bg-white rounded-md flex items-center justify-center">
                <Settings size={16} />
              </button>
            </div>

            {/* RIGHT PROFILE */}
            <div className="h-9 w-9 bg-white rounded-md flex items-center justify-center">
              <img
                src="https://i.pravatar.cc/40"
                alt="user"
                className="h-7 w-7 rounded-full"
              />
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-3">
            <div className="flex items-center bg-white rounded-md px-3 h-10">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="outline-none text-sm w-full"
              />
              <button onClick={() => setOpenFilter(true)}>
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER BOTTOM SHEET ================= */}
      {openFilter && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setOpenFilter(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded-md" />
              <div className="h-10 bg-gray-100 rounded-md" />
              <div className="h-10 bg-gray-100 rounded-md" />
            </div>

            <button className="mt-5 w-full h-10 bg-[#0B3C88] text-white rounded-md">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}
