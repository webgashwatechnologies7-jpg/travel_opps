import React from 'react';
import { useNavigate } from 'react-router-dom';

const TeamLeaderStatsTable = ({ data = [], loading = false, error = null }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-bold text-gray-900 leading-tight flex items-center gap-2">
                    Team Leader <span className="text-blue-600 font-extrabold uppercase tracking-tighter">Stats</span>
                </h2>
                <button onClick={() => navigate("/staff-management/dashboard")} className="text-blue-500 text-[10px] font-bold uppercase tracking-widest border-b border-blue-50 pb-0.5">View More</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll pr-1 mt-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 text-left">
                                <th className="pb-3 pr-2">NAME</th>
                                <th className="pb-3 pr-2 text-center">STATUS</th>
                                <th className="pb-3 pr-2 text-center">TOTAL</th>
                                <th className="pb-3 pr-2 text-center text-green-600">DONE</th>
                                <th className="pb-3 pr-2 text-center text-red-600">REJ</th>
                                <th className="pb-3 text-center text-orange-600">PEND</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr><td colSpan="6" className="py-10 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Empty</td></tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr 
                                      key={item.id || index}
                                      onClick={() => navigate(`/leads?assigned_to=${item.id}`)}
                                      className="border-b last:border-0 border-gray-50/50 group cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="py-2 font-bold text-gray-900 text-[11px] uppercase tracking-tighter">
                                            {item.name}
                                        </td>
                                        <td className="py-2 text-center">
                                            <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black uppercase rounded-lg shadow-sm ${item.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.is_active ? 'Active' : 'Off'}
                                            </span>
                                        </td>
                                        <td className="py-2 text-center font-bold text-gray-700 tabular-nums text-[11px]">
                                            {item.assigned}
                                        </td>
                                        <td className="py-2 text-center font-extrabold text-green-600 tabular-nums text-[11px]">
                                            {item.confirmed}
                                        </td>
                                        <td className="py-2 text-center font-extrabold text-red-600 tabular-nums text-[11px]">
                                            {item.rejected}
                                        </td>
                                        <td className="py-2 text-center font-extrabold text-orange-600 bg-orange-50/20 rounded-lg tabular-nums text-[11px]">
                                            {item.pending}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TeamLeaderStatsTable;
