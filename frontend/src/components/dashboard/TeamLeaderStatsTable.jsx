import React from 'react';
import { useNavigate } from 'react-router-dom';

const TeamLeaderStatsTable = ({ data = [], loading = false }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-[#F4F6FF] rounded-xl p-4 w-full h-full flex flex-col">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
                    Team Leader <span className="text-red-500">Performance</span>
                </h2>
                <div className="flex items-center justify-center flex-1">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F4F6FF] rounded-xl p-4 w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold text-gray-900">
                    Team Leader <span className="text-red-500">Stats</span>
                </h2>
            </div>

            <div className="grid grid-cols-[30px_1fr_65px_45px_45px_45px_60px] gap-2 px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <div className="text-left">#</div>
                <div className="text-left">Name</div>
                <div className="text-center">Status</div>
                <div className="text-center">Total</div>
                <div className="text-center text-green-600">Done</div>
                <div className="text-center text-red-600">Reject</div>
                <div className="text-center text-orange-600">Pending</div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll bg-[#F7F8FF] rounded-lg border border-[#E5E7EB]">
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No data available
                    </div>
                ) : (
                    data.map((item, index) => (
                        <div
                            key={item.id || index}
                            className={`
                grid grid-cols-[30px_1fr_65px_45px_45px_45px_60px] gap-2
                items-center px-3 py-3 text-sm border-b last:border-0 border-gray-100
                ${index % 2 === 0 ? "bg-[#E9ECFF]" : "bg-white"}
                hover:opacity-90 transition-opacity cursor-pointer
              `}
                            onClick={() => navigate(`/leads?assigned_to=${item.id}`)}
                        >
                            <div className="font-medium text-gray-600">{index + 1}.</div>
                            <div className="font-semibold text-gray-900 truncate" title={item.name}>
                                {item.name}
                            </div>
                            <div className="text-center">
                                <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full ${item.is_active
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="text-center font-medium text-gray-700 bg-white/50 rounded py-1 text-xs">
                                {item.assigned}
                            </div>
                            <div className="text-center font-medium text-green-600 bg-white/50 rounded py-1 text-xs">
                                {item.confirmed}
                            </div>
                            <div className="text-center font-medium text-red-600 bg-white/50 rounded py-1 text-xs">
                                {item.rejected}
                            </div>
                            <div className="text-center font-bold text-orange-600 bg-white/80 rounded py-1 shadow-sm border border-orange-100 text-xs">
                                {item.pending}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamLeaderStatsTable;
