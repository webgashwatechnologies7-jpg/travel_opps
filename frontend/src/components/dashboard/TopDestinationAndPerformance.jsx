import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown } from "lucide-react";
import { dashboardAPI } from "../../services/api";

/**
 * Premium Top Destinations Component
 * Recalibrated for Full-Height 340px Row 5
 */
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
    <div className="bg-white p-6 h-full flex flex-col overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          Top <span className="text-blue-600 font-extrabold uppercase tracking-tighter">Destinations.</span>
        </h2>
        <button
          onClick={() => navigate("/masters/destinations")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
          type="button"
        >
          View all <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-full py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[11px] font-bold text-center uppercase tracking-tighter">
            {error}
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-slate-300 text-[11px] font-black uppercase tracking-widest text-center py-20 opacity-30">
            No Destinations Found
          </div>
        ) : (
          destinations.map((item, index) => (
            <div
              key={`${item.destination || "dest"}-${index}`}
              className={`
                grid grid-cols-[30px_1fr_60px]
                items-center px-4 py-2.5 text-[12px] cursor-pointer hover:bg-slate-50 transition-all rounded-2xl mb-2 group border border-transparent hover:border-gray-100
                ${index % 2 === 0 ? "bg-slate-50/40" : "bg-white"}
              `}
              onClick={() => {
                const dest = item.destination || "";
                if (dest) {
                  navigate(`/leads?destination=${encodeURIComponent(dest)}`);
                }
              }}
            >
              <div className="text-[10px] font-bold text-slate-300 tabular-nums">#{index + 1}</div>
              <div className="text-[12px] font-semibold text-slate-600 truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {item.destination || "Unknown"}
              </div>
              <div className="text-[12px] text-right font-bold text-blue-600 tabular-nums">
                {item.total ?? 0}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopDestinationAndPerformance;
