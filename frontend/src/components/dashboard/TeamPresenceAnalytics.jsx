import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Clock, Calendar, LayoutGrid, ChevronDown } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

/**
 * Team Engagement Analytics Component
 * High-Density Executive Suite Styling
 */
const TeamPresenceAnalytics = ({ data = [], loading = false, period = 'today', onPeriodChange }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 w-full h-[400px] flex items-center justify-center col-span-12 border border-blue-50 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-b-blue-600"></div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] animate-pulse">Syncing Engine...</p>
        </div>
      </div>
    );
  }

  // Stats calculation
  const totalUsers = data.length;
  const checkedInUsers = data.filter(u => u.login_count > 0);
  const notStartedUsers = data.filter(u => u.login_count === 0);
  const checkedInCount = checkedInUsers.length;
  const notCheckedInCount = totalUsers - checkedInCount;

  // Filtered data for table
  const filteredData = data.filter(u => {
    if (filter === 'online') return u.is_online;
    if (filter === 'offline') return !u.is_online;
    return true;
  });

  // Productivity Chart Data
  const chartData = [...data]
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, 14)
    .map(u => ({
      name: u.name.split(' ')[0],
      fullName: u.name,
      hours: parseFloat((u.total_seconds / 3600).toFixed(1))
    }));

  const pieData = [
    { name: 'Checked In', value: checkedInCount, color: '#10b981' },
    { name: 'Not Started', value: notCheckedInCount, color: '#f59e0b' }
  ];

  const periods = [
    { id: 'today', label: 'Today', icon: <Clock className="h-3 w-3" /> },
    { id: 'weekly', label: 'Weekly', icon: <Calendar className="h-3 w-3" /> },
    { id: 'monthly', label: 'Monthly', icon: <LayoutGrid className="h-3 w-3" /> }
  ];

  return (
    <div className="col-span-12 space-y-6 pt-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
           <div className="h-5 w-1.5 bg-[#2C55D4] rounded-full shadow-sm" />
           <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Team Engagement Analytics</h2>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
           {periods.map(p => (
             <button
               key={p.id}
               onClick={() => onPeriodChange(p.id)}
               className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${
                 period === p.id ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {p.icon} {p.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[450px]">
        {/* Attendance (3) */}
        <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-xl transition-all duration-500">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Attendance</h3>
              <button 
                onClick={() => navigate("/staff-attendance")}
                className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all"
              >
                View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
           </div>
           
           <div className="h-[180px] w-full flex items-center justify-center relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-3xl font-extrabold text-blue-600 leading-none">{totalUsers}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">USERS</p>
            </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-5">
                <div className="bg-green-50/20 p-3 rounded-2xl border border-green-50 shadow-sm transition-all group/item hover:bg-green-50">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 text-[10px] font-extrabold text-green-600 uppercase tracking-widest">
                            <span className="h-2 w-2 rounded-full bg-green-500 shadow-sm animate-pulse" /> CHECKED IN
                        </span>
                        <span className="text-[12px] font-black text-green-600 tabular-nums">{checkedInCount}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 pl-4 leading-relaxed uppercase tracking-tighter truncate">
                        {checkedInCount > 0 ? checkedInUsers.map(u => u.name.split(' ')[0]).join(', ') : 'None'}
                    </p>
                </div>
                <div className="bg-amber-50/20 p-3 rounded-2xl border border-amber-50 shadow-sm transition-all group/item hover:bg-amber-50">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">
                            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" /> NOT STARTED
                        </span>
                        <span className="text-[12px] font-black text-amber-600 tabular-nums">{notCheckedInCount}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 pl-4 leading-relaxed uppercase tracking-tighter truncate">
                        {notCheckedInCount > 0 ? notStartedUsers.map(u => u.name.split(' ')[0]).join(', ') : 'None'}
                    </p>
                </div>
           </div>
        </div>

        {/* Productivity (6) */}
        <div className="md:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-500">
           <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Productivity <span className="text-blue-500 font-extrabold underline underline-offset-4 decoration-blue-100 italic">Ranking</span></h3>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{formatDuration(data.reduce((acc, u) => acc + u.total_seconds, 0))} Total</div>
           </div>
           
           <div className="flex-1 w-full relative min-h-0 pt-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                   <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2F5F9E" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8} />
                      </linearGradient>
                   </defs>
                   <CartesianGrid vertical={false} stroke="#f8fafc" strokeDasharray="3 3" opacity={0.4} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} interval={0} />
                   <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} />
                   <Tooltip 
                     cursor={{ fill: '#f1f5f9', radius: 10 }}
                     contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 15px 30px -5px rgb(0 0 0 / 0.2)', fontSize: '12px', fontWeight: 'bold' }}
                   />
                   <Bar dataKey="hours" fill="url(#barGradient)" barSize={28} radius={[10, 10, 5, 5]} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Engagement (3) */}
        <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-500">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 tracking-tight">Engagement</h3>
              <div className="flex bg-slate-50 p-1 rounded-xl shadow-inner">
                  {['all', 'online'].map(f => (
                      <button 
                          key={f}
                          onClick={(e) => { e.stopPropagation(); setFilter(f); }} 
                        className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                    >
                        {f === 'all' ? 'All' : 'Live'}
                    </button>
                ))}
            </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1">
              {filteredData.length > 0 ? filteredData.map((u, index) => (
                <div key={u.id} className={`flex items-center justify-between p-3.5 rounded-2xl border border-gray-50/50 shadow-sm transition-all group ${index % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'} hover:border-blue-200 hover:shadow-md active:scale-[0.98]`}>
                   <div className="min-w-0">
                      <p className="text-[12px] font-extrabold text-slate-800 truncate uppercase tracking-tighter group-hover:text-blue-600 transition-colors uppercase tracking-tight">{u.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.role}</span>
                         <span className="text-slate-200">|</span>
                         <span className="text-[11px] font-black text-blue-600/80 tabular-nums">{u.formatted_time}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] shadow-sm ${
                         u.login_count > 0 ? (u.is_online ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-400') : 'bg-amber-100 text-amber-600'
                      }`}>
                         {u.login_count > 0 ? (u.is_online ? 'LIVE' : 'OFF') : 'START'}
                      </span>
                   </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <div className="w-10 h-10 border-4 border-slate-100 rounded-full mb-2"></div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Empty</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPresenceAnalytics;
