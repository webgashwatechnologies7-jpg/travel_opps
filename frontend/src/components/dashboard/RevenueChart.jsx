import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RevenueChart = ({ revenueData = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden group" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Revenue Growth</h2>
        <button 
          onClick={() => navigate("/reports")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View Analytics <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-[220px] mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2C55D4" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#2C55D4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" opacity={0.4} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#CBD5E1', fontSize: 10, fontWeight: 800 }} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 15px 30px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} 
            />
            <Area type="monotone" dataKey="revenue" stroke="#2C55D4" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
