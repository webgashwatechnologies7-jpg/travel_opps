import React, { useState } from "react";
<<<<<<< HEAD



const TopLeadSource = ({ leadData }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("total");

  const maxTotal = Math.max(...leadData.map(i => i.total));
  const maxConfirmed = Math.max(...leadData.map(i => i.confirmed));
=======
import { useNavigate } from "react-router-dom";

const TopLeadSource = ({ leadData }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("total");

  const showConfirmedOnly = filter === "confirmed";
  const filteredData = showConfirmedOnly
    ? leadData.filter((item) => (item.confirmed || 0) > 0)
    : leadData;
  const maxTotal = Math.max(...filteredData.map(i => i.total), 0);
  const maxConfirmed = Math.max(...filteredData.map(i => i.confirmed), 0);
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-gray-900">
          Top Lead Source
        </h2>
<<<<<<< HEAD
=======
        <button
          type="button"
          onClick={() => navigate("/masters/lead-source")}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View more
        </button>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)

        {/* Dropdown */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 cursor-pointer text-gray-400 text-xs hover:text-gray-600 transition-colors"
          >
            {filter === "total" ? "Total" : "Confirmed"}
            <span>▾</span>
          </div>

          {open && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg w-32 z-10 py-1">
              <div
                onClick={() => {
                  setFilter("total");
                  setOpen(false);
                }}
                className="px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
              >
                Total
              </div>
              <div
                onClick={() => {
                  setFilter("confirmed");
                  setOpen(false);
                }}
                className="px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer text-gray-700"
              >
                Confirmed
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 items-center mb-4">
<<<<<<< HEAD
        <div className="flex items-center gap-2">
          <span className="w-4 h-2 rounded-sm bg-[#7AA7FF]" />
          <span className="text-gray-500 text-xs">Total Queries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-2 rounded-sm bg-[#2EA7A0]" />
          <span className="text-gray-500 text-xs">Confirmed</span>
        </div>
=======
        {showConfirmedOnly ? (
          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded-sm bg-[#2EA7A0]" />
            <span className="text-gray-500 text-xs">Confirmed</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 rounded-sm bg-[#7AA7FF]" />
              <span className="text-gray-500 text-xs">Total Queries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 rounded-sm bg-[#2EA7A0]" />
              <span className="text-gray-500 text-xs">Confirmed</span>
            </div>
          </>
        )}
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      </div>

      {/* Rows */}
      <div className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-2 -mr-2">
<<<<<<< HEAD
        {leadData.length === 0 ? (
=======
        {filteredData.length === 0 ? (
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          <div className="flex items-center justify-center h-40 text-xs text-gray-400">
            No data available
          </div>
        ) : (
<<<<<<< HEAD
          leadData.map((item, index) => {
=======
          filteredData.map((item, index) => {
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
            const totalWidth = maxTotal ? (item.total / maxTotal) * 100 : 0;
            const confirmedWidth = maxConfirmed ? (item.confirmed / maxConfirmed) * 100 : 0;

            return (
              <div
                key={index}
                className={`rounded-lg p-3 ${index % 2 === 0 ? "bg-[#f8f9fc]" : "bg-white border border-gray-50"
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#2C55D4] text-xs font-medium mb-2 truncate" title={item.source}>
                      {item.source}
                    </p>

                    {/* Bars */}
                    <div className="space-y-1.5">
<<<<<<< HEAD
                      <div className="h-2 rounded-full bg-[#7AA7FF] bg-opacity-90 transition-all duration-500"
                        style={{ width: `${Math.max(totalWidth, 5)}%` }}
                      />
                      <div className="h-2 rounded-full bg-[#2EA7A0] bg-opacity-90 transition-all duration-500"
=======
                      {!showConfirmedOnly && (
                        <div
                          className="h-2 rounded-full bg-[#7AA7FF] bg-opacity-90 transition-all duration-500"
                          style={{ width: `${Math.max(totalWidth, 5)}%` }}
                        />
                      )}
                      <div
                        className="h-2 rounded-full bg-[#2EA7A0] bg-opacity-90 transition-all duration-500"
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
                        style={{ width: `${Math.max(confirmedWidth, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Right Numbers */}
                  <div className="flex flex-col items-end gap-1 min-w-[30px]">
<<<<<<< HEAD
                    <span className="text-gray-400 text-xs">{item.total}</span>
=======
                    {!showConfirmedOnly && (
                      <span className="text-gray-400 text-xs">{item.total}</span>
                    )}
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
                    <span className="text-gray-900 font-bold text-xs">
                      {item.confirmed}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TopLeadSource;
