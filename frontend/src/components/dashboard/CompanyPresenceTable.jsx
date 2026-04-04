import React from 'react';
import { Clock, Activity, LogOut, User as UserIcon } from 'lucide-react';

const CompanyPresenceTable = ({ data = [], loading = false }) => {
    const [filter, setFilter] = React.useState('all');

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm w-full min-h-[400px] flex flex-col">
                <h2 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Team <span className="text-blue-600">Presence</span>
                </h2>
                <div className="flex items-center justify-center flex-1">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    const onlineItems = data.filter(item => item.is_online);
    const offlineItems = data.filter(item => !item.is_online);
    
    const filteredData = filter === 'all' ? data : (filter === 'online' ? onlineItems : offlineItems);

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm w-full h-full flex flex-col h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Team <span className="text-blue-600 uppercase tracking-tight">Presence & Activity</span>
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Real-time engagement across your team</p>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    All ({data.length})
                  </button>
                  <button 
                    onClick={() => setFilter('online')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${filter === 'online' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                    Online ({onlineItems.length})
                  </button>
                  <button 
                    onClick={() => setFilter('offline')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${filter === 'offline' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Offline ({offlineItems.length})
                  </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_130px_100px_80px_80px_80px] gap-4 px-4 py-3 bg-gray-50 rounded-t-xl text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                <div className="text-left">Team Member</div>
                <div className="text-left">Designation/Role</div>
                <div className="text-center">Active Time</div>
                <div className="text-center">Sessions</div>
                <div className="text-center">Logouts</div>
                <div className="text-center">Status</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scroll border-x border-b border-gray-50 rounded-b-xl">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Activity className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No users found for this filter</p>
                    </div>
                ) : (
                    filteredData.map((item, index) => (
                        <div
                            key={item.id || index}
                            className={`
                                grid grid-cols-[1fr_130px_100px_80px_80px_80px] gap-4
                                items-center px-4 py-4 text-sm border-b last:border-0 border-gray-50
                                hover:bg-blue-50/40 transition-all duration-200
                            `}
                        >
                            {/* Person Info */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                                        {item.profile_picture ? (
                                            <img src={item.profile_picture} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="bg-blue-100 text-blue-600 h-full w-full flex items-center justify-center font-bold text-base">
                                              {item.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {item.is_online && (
                                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate tracking-tight">{item.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                                        Emp ID: {item.id}
                                    </p>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="text-left font-bold text-[11px] text-gray-600 tracking-tight">
                                <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 uppercase leading-none inline-block">
                                  {item.role || 'User'}
                                </span>
                            </div>

                            {/* Active Time */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    <span className="font-black text-amber-700 text-xs">{item.formatted_time}</span>
                                </div>
                            </div>

                            {/* Work Sessions (Logins) */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                                    <Activity className="h-3 w-3 text-blue-600" />
                                    <span className="font-black text-blue-700 text-xs">{item.login_count}</span>
                                </div>
                            </div>

                            {/* Logouts */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 rounded-lg border border-red-100">
                                    <LogOut className="h-3 w-3 text-red-600" />
                                    <span className="font-black text-red-700 text-xs">{item.logout_count}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="text-center">
                                {item.login_count > 0 ? (
                                    item.is_online ? (
                                        <span className="flex items-center justify-center gap-1.5 text-green-600 font-black text-[10px] uppercase bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                            Online
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-bold text-[10px] uppercase bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Offline</span>
                                    )
                                ) : (
                                    <span className="text-amber-600 font-bold text-[10px] uppercase bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Not Started</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>


        </div>
    );
};

export default CompanyPresenceTable;
