import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import LogoLoader from '../components/LogoLoader';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Search, 
  LayoutGrid, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

/**
 * Executive Analytics Page
 * Refined Typography: Semibold Poppins, professional slates.
 */
const Analytics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDestination = location.pathname.includes('destination-performance');
  const [sourceRoi, setSourceRoi] = useState([]);
  const [destinationPerf, setDestinationPerf] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState(isDestination ? 'destination' : 'source');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(location.pathname.includes('destination-performance') ? 'destination' : 'source');
  }, [location.pathname]);

  useEffect(() => {
    fetchAnalytics();
  }, [month]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sourceRes, destRes] = await Promise.all([
        dashboardAPI.sourceRoi(month),
        dashboardAPI.destinationPerformance(month),
      ]);
      setSourceRoi(sourceRes.data.data.sources || []);
      setDestinationPerf(destRes.data.data.destinations || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const data = activeTab === 'source' ? sourceRoi : destinationPerf;

  // Chart Data preparation
  const chartData = data.slice(0, 10).map(item => ({
    name: (item.source || item.destination || 'N/A').split('-')[0].substring(0, 10),
    fullName: item.source || item.destination,
    leads: item.total_leads || 0,
    confirmed: item.confirmed_leads || 0,
    rate: parseFloat(item.conversion_rate) || 0
  }));

  if (loading && sourceRoi.length === 0 && destinationPerf.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-2xl border border-slate-100 shadow-sm">
        <LogoLoader text="Syncing analytic data..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h2 className="text-[18px] font-semibold text-gray-800 tracking-tight">
                Conversion <span className="text-[#2C55D4]">Analytics</span>
             </h2>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Real-time performance across channels
             </p>
          </div>

          <div className="flex items-center gap-3">
             <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
             />
             <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                   onClick={() => setActiveTab('source')}
                   className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${
                      activeTab === 'source' ? 'bg-white text-[#2C55D4] shadow-sm border border-blue-50' : 'text-slate-400 hover:text-slate-600'
                   }`}
                >
                   Source
                </button>
                <button
                   onClick={() => setActiveTab('destination')}
                   className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${
                      activeTab === 'destination' ? 'bg-white text-[#2C55D4] shadow-sm border border-blue-50' : 'text-slate-400 hover:text-slate-600'
                   }`}
                >
                   Destination
                </button>
             </div>
          </div>
      </div>

      {/* Analytics Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-6">
              <div>
                 <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest">Performance Funnel</h3>
                 <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Lead Generation vs Confirmation</p>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest opacity-60">
                 <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leads</span>
                 <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed</span>
              </div>
           </div>

           <div className="flex-1 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                       <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.2} />
                       </linearGradient>
                       <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.2} />
                       </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94A3B8' }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                    <Tooltip 
                       cursor={{ fill: '#F9FAFB', radius: 10 }}
                       contentStyle={{ borderRadius: '15px', border: 'none', shadow: 'none', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="leads" name="Total Leads" fill="url(#leadsGradient)" barSize={35} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="url(#confGradient)" barSize={35} radius={[8, 8, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="bg-[#2C55D4] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 transition-transform group-hover:scale-110">
                 <TrendingUp size={120} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 opacity-80 mb-2">Market Leader</p>
              {data.length > 0 ? (
                 <>
                    <h4 className="text-2xl font-bold mb-1 truncate">{data[0].source || data[0].destination}</h4>
                    <div className="flex items-center gap-2 text-blue-100 font-bold text-[13px]">
                       <ArrowUpRight size={16} /> {data[0].conversion_rate}% Conversion
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/5">
                          <p className="text-[9px] font-bold uppercase text-blue-100/60 mb-1 leading-none">EFFICIENCY</p>
                          <p className="text-lg font-bold">PEAK</p>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/5">
                          <p className="text-[9px] font-bold uppercase text-blue-100/60 mb-1 leading-none">LEADS</p>
                          <p className="text-lg font-bold">{data[0].total_leads}</p>
                       </div>
                    </div>
                 </>
              ) : (
                 <p className="text-sm font-medium opacity-50 mt-4">Analytic void</p>
              )}
           </div>

           <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Volume Share</h4>
              <div className="h-[180px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={chartData} dataKey="leads" innerRadius={55} outerRadius={75} paddingAngle={4}>
                          {chartData.map((entry, index) => (
                             <Cell key={index} fill={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                 {chartData.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{item.fullName}</span>
                       <span className="text-[11px] font-bold text-slate-700">{item.leads} leads</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-50 bg-slate-50/10">
           <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              Detailed <span className="text-[#2C55D4]">Metrics</span>
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#FBFCFE]">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeTab === 'source' ? 'Source' : 'Destination'}
                </th>
                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume</th>
                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed</th>
                {activeTab === 'destination' && (
                  <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cancelled</th>
                )}
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#2C55D4] group-hover:text-white transition-all">
                          {activeTab === 'source' ? <Search size={14} /> : <MapPin size={14} />}
                       </div>
                       <span className="text-[13px] font-semibold text-slate-700">{item.source || item.destination}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-[13px] font-bold text-slate-700 text-center tabular-nums">{item.total_leads}</td>
                  <td className="px-8 py-4 text-[13px] font-bold text-emerald-600 text-center tabular-nums">{item.confirmed_leads}</td>
                  {activeTab === 'destination' && (
                    <td className="px-8 py-4 text-[13px] font-bold text-red-400 text-center tabular-nums">{item.cancelled_leads}</td>
                  )}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-[100px] bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div
                          className="bg-[#2C55D4] h-full rounded-full"
                          style={{ width: `${Math.min(parseFloat(item.conversion_rate), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 tabular-nums">{item.conversion_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="p-16 flex flex-col items-center opacity-30 text-slate-300">
               <TrendingUp size={40} className="mb-3" />
               <p className="text-[10px] font-bold uppercase tracking-widest">No Intelligence Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
