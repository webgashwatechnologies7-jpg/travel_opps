// import { useState, useEffect } from 'react';
// import { dashboardAPI } from '../services/api';

// const SalesRepsTable = ({ title = "Sales Reps Performance" }) => {


//   return (
//     <div className="bg-white rounded-lg shadow p-4">
//       {title && (
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
//       )}
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b bg-gray-50">
//               <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Name</th>
//               <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Total</th>
//               <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Assigned</th>
//               <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Confirmed</th>
//             </tr>
//           </thead>
//           <tbody>
//             {salesReps.length === 0 ? (
//               <tr>
//                 <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
//                   No sales reps data available
//                 </td>
//               </tr>
//             ) : (
//               salesReps.map((rep, index) => (
//                 <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
//                   <td className="py-2 px-3 text-gray-800 font-medium text-xs">{rep.name}</td>
//                   <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.assigned + rep.confirmed}</td>
//                   <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.assigned}</td>
//                   <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.confirmed}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default SalesRepsTable;



import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const SalesRepsTable = ({ title = "Sales" }) => {
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
      setError('Failed to load sales reps data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#F4F6FF] rounded-xl p-4 w-full h-full flex flex-col">
      {/* Component Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-gray-900">
          {title} <span className="text-red-500">Reps.</span>
        </h2>
        <button
          type="button"
          onClick={() => navigate('/sales-reps')}
          className="text-[#3B82F6] text-xs font-medium flex items-center gap-1"
        >
          View more
          <span className="transition-transform duration-200">▼</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[30px_1fr_60px_70px] gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="text-left">#</div>
        <div className="text-left">Name</div>
        <div className="text-center">Total</div>
        <div className="text-center">Confirm</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll bg-[#F7F8FF] rounded-lg border border-[#E5E7EB]">
        {salesReps.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No data available
          </div>
        ) : (
          salesReps.map((rep, index) => {
            const assigned = rep.assigned || 0;
            const confirmed = rep.confirmed || 0;
            const total = rep.total ?? assigned + confirmed;
            const repId = rep.id || rep.user_id || rep.user?.id || rep.user?.user_id;
            const repName = rep.name || rep.user?.name || rep.user_name || '';

            return (
              <div
                key={repId || index}
                className={`
                  grid grid-cols-[30px_1fr_60px_70px] gap-2
                  items-center px-3 py-3 text-sm border-b last:border-0 border-gray-100
                  ${index % 2 === 0 ? "bg-[#E9ECFF]" : "bg-white"}
                  hover:opacity-90 transition-opacity cursor-pointer
                `}
                onClick={() => {
                  if (repId) {
                    navigate(`/leads?assigned_to=${repId}`);
                    return;
                  }
                  if (repName) {
                    navigate(`/leads?assigned_name=${encodeURIComponent(repName)}`);
                  }
                }}
              >
                <div className="font-medium text-gray-600">{index + 1}.</div>
                <div className="font-semibold text-gray-900 truncate" title={rep.name}>
                  {rep.name}
                </div>
                <div className="text-center font-medium text-gray-700 bg-white/50 rounded py-1">
                  {total}
                </div>
                <div className="text-center font-bold text-green-600 bg-white/80 rounded py-1 shadow-sm border border-green-100">
                  {confirmed}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SalesRepsTable;
