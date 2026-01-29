import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { dashboardAPI } from "../../services/api";

const TopDestinationAndPerformance = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await dashboardAPI.topDestinations();
      const raw = response.data.data || [];
      const cleaned = raw.filter((item) => {
        const name = (item.destination || "").trim();
        if (!name) return false;
        return name.toLowerCase() !== "destination";
      });
      setDestinations(cleaned);
    } catch (err) {
      setError("Failed to load destinations data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="bg-[#F4F6FF] rounded-xl p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-gray-900">
            Top <span className="text-[#1CA7A6]">Destinations.</span>
          </h2>
          <button
            onClick={() => navigate("/masters/destinations")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            type="button"
          >
            View more
          </button>
        </div>

        <div className="border border-[#E5E7EB] rounded-lg custom-scroll flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm m-3">
              {error}
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8">
              No destinations data available
            </div>
          ) : (
            destinations.slice(0, 6).map((item, index) => (
              <div
                key={`${item.destination || "dest"}-${index}`}
                className={`
                  grid grid-cols-[60px_1fr_100px]
                  items-center px-4 py-3 text-sm cursor-pointer hover:bg-[#E1E7FF]
                  ${index % 2 === 0 ? "bg-[#E9ECFF]" : "bg-white"}
                `}
                onClick={() => {
                  const dest = item.destination || "";
                  if (dest) {
                    navigate(`/leads?destination=${encodeURIComponent(dest)}`);
                  }
                }}
              >
                <div className="text-[12px] font-semibold">{index + 1}.</div>
                <div className="text-[12px] font-semibold">
                  {item.destination || "Unknown"}
                </div>
                <div className="text-[12px] text-right font-medium">
                  {item.total ?? 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TopDestinationAndPerformance;
