import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { dashboardAPI } from '../services/api';

/**
 * Premium Sales Reps Performance Table
 * High-Density Executive Suite Styling
 */
const SalesRepsTable = ({ title = "Performance Reps" }) => {
  const navigate = useNavigate();
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const response = await dashboardAPI.salesRepsStats();
      setSalesReps(response.data.data || []);
    } catch (err) {
      setError('Failed to load performance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
          Performance <span className="text-blue-600">Represent.</span>
        </h2>
        <button
          onClick={() => navigate("/sales-reps")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1 mt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-xs font-bold">{error}</div>
        ) : salesReps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30 grayscale saturate-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100 px-4 py-2 rounded-xl">
              No reports yet
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-bold text-slate-300 uppercase tracking-widest border-b border-gray-50 text-left">
                <th className="pb-3 pr-2">#</th>
                <th className="pb-3 pr-2">NAME</th>
                <th className="pb-3 pr-2 text-center">TOTAL</th>
                <th className="pb-3 pr-2 text-center">PEND</th>
                <th className="pb-3 text-center">CONV.</th>
              </tr>
            </thead>
            <tbody>
              {salesReps.map((rep, index) => (
                <tr
                  key={rep.id || index}
                  onClick={() => {
                    const repId = rep.id || rep.user_id;
                    if (repId) navigate(`/leads?assigned_to=${repId}`);
                  }}
                  className="border-b last:border-0 border-gray-50/50 group cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 font-semibold text-slate-300 text-[11px] group-hover:text-blue-600 transition-colors">
                    {index + 1}.
                  </td>
                  <td className="py-2.5 text-slate-600 text-[12px] font-semibold truncate uppercase tracking-tight max-w-[120px]">
                    {rep.name.split(' ')[0]}
                  </td>
                  <td className="py-2.5 text-center px-2">
                    <span className="bg-slate-50 px-2 py-0.5 rounded-lg font-semibold text-slate-600 text-[10px] tabular-nums">
                      {rep.total ?? rep.assigned}
                    </span>
                  </td>
                  <td className="py-2.5 text-center px-2">
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg font-semibold text-[10px] tabular-nums">
                      {rep.pending || 0}
                    </span>
                  </td>
                  <td className="py-2.5 text-center px-2">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-[10px] tabular-nums border border-emerald-100/50">
                      {rep.confirmed || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesRepsTable;
