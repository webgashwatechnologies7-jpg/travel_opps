import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpcomingTours = ({ data = {} }) => {
  const navigate = useNavigate();
  // ...stats
  const stats = data || {};
  const chartData = [
    { name: 'Proposal Sent', value: stats.proposal_sent || 0, color: '#3B82F6' },
    { name: 'Hot Lead', value: stats.hot_leads || 0, color: '#8B5CF6' },
    { name: 'Cancel', value: stats.cancelled || 0, color: '#EF4444' },
    { name: 'Proposal Conv.', value: stats.proposal_confirmed || 0, color: '#F59E0B' },
    { name: 'Confirmed', value: stats.confirmed || 0, color: '#10B981' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col relative overflow-hidden group" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Upcoming Tours</h2>
        <button
          onClick={() => navigate("/leads?status=confirmed")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View All <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <div className="h-full w-full max-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-[9.5px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate">{item.name}</span>
            <span className="ml-auto text-slate-300 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingTours;
