import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { companySettingsAPI } from '../services/api';
import { 
  Download, 
  Share2, 
  Users, 
  PhoneCall, 
  CheckCircle, 
  ClipboardList,
  ChevronRight,
  BarChart3,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import LogoLoader from '../components/LogoLoader';

/**
 * Executive Team Reports
 * Refinement: Semibold Poppins, professional list density, smaller headings.
 */
const TeamReports = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedRange, setSelectedRange] = useState('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedBranchId, selectedRange]);

  const fetchBranches = async () => {
    try {
      const response = await companySettingsAPI.getBranches();
      if (response?.data?.success) {
        setBranches(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { range: selectedRange };
      if (selectedBranchId) {
        params.branch_id = selectedBranchId;
      }
      const response = await companySettingsAPI.getTeamReport(params);
      if (response?.data?.success) {
        setReport(response.data.data);
      } else {
        setError('Failed to load team report');
      }
    } catch (err) {
      console.error('Failed to fetch team report:', err);
      setError('Failed to load team report');
    } finally {
      setLoading(false);
    }
  };

  const activeRange = report?.ranges?.[selectedRange] || {};
  const branchLabel = report?.branch?.name || 'All Teams';

  // Chart Data preparation
  const chartData = (activeRange.per_user || []).map(u => ({
    name: u.name?.split(' ')[0],
    fullName: u.name,
    assigned: u.assigned_to_user || 0,
    confirmed: u.confirmed_by_user || 0,
    contacted: u.contacted_leads || 0
  }));

  const pieData = chartData.map(item => ({
    name: item.name,
    value: item.confirmed
  })).filter(item => item.value > 0);

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to download the report.');
      return;
    }

    const rows = (activeRange.per_user || [])
      .map((item) => `
        <tr>
          <td>${item.name || 'N/A'}</td>
          <td>${item.email || 'N/A'}</td>
          <td>${item.assigned_to_user || 0}</td>
          <td>${item.contacted_leads || 0}</td>
          <td>${item.confirmed_by_user || 0}</td>
        </tr>
      `)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Team Report - ${branchLabel}</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
            .summary { display: flex; gap: 12px; margin-bottom: 16px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; flex: 1; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Team Report - ${branchLabel}</h1>
          <div class="meta">Range: ${selectedRange} | Generated: ${new Date().toLocaleString()}</div>
          <div class="summary">
            <div class="card">Assigned Leads<br><strong>${activeRange.assigned_to_team || 0}</strong></div>
            <div class="card">Contacted Leads<br><strong>${activeRange.contacted_leads || 0}</strong></div>
            <div class="card">Calls Made<br><strong>${activeRange.calls_count || 0}</strong></div>
            <div class="card">Bookings Confirmed<br><strong>${activeRange.confirmed_by_team || 0}</strong></div>
          </div>
          <h2 style="font-size: 16px; margin: 12px 0;">Team Members</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned</th>
                <th>Contacted</th>
                <th>Confirmed</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="5">No data</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-2xl border border-slate-100 shadow-sm">
         <LogoLoader text="Syncing productivity data..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-[18px] font-semibold text-gray-800 tracking-tight">Team <span className="text-[#2C55D4]">Intelligence</span></h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">Multi-branch productivity tracker</p>
         </div>
         
         <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
               {['week', 'month', 'year'].map(r => (
                  <button
                     key={r}
                     onClick={() => setSelectedRange(r)}
                     className={`px-5 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${
                        selectedRange === r ? 'bg-white text-[#2C55D4] shadow-sm border border-blue-50' : 'text-slate-400 hover:text-slate-600'
                     }`}
                  >
                     {r}
                  </button>
               ))}
            </div>

            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
               <button onClick={handleDownloadPdf} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all" title="Download PDF"><Download size={16} /></button>
               <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all" title="Share Report"><Share2 size={16} /></button>
            </div>
         </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
            { label: "ASSIGNED", val: activeRange.assigned_to_team, color: "bg-blue-600" },
            { label: "CONTACTED", val: activeRange.contacted_leads, color: "bg-indigo-500" },
            { label: "CALLS MADE", val: activeRange.calls_count, color: "bg-orange-500" },
            { label: "CONFIRMED", val: activeRange.confirmed_by_team, color: "bg-emerald-500" }
         ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group transition-all hover:bg-[#FBFCFE]">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                  <div className={`w-1.5 h-1.5 rounded-full ${card.color}`} />
               </div>
               <h3 className="text-2xl font-semibold text-gray-800 tabular-nums">{card.val || 0}</h3>
            </div>
         ))}
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest">Team Efficiency</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Assigned leads vs closure frequency</p>
               </div>
               <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest opacity-60">
                   <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Assigned</span>
                   <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmed</span>
               </div>
            </div>
            
            <div className="flex-1 w-full pt-4 overflow-x-auto no-scrollbar">
               <div style={{ minWidth: chartData.length > 8 ? `${chartData.length * 80}px` : '100%', height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94A3B8' }} interval={0} angle={-25} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                        <Tooltip cursor={{ fill: '#F9FAFB', radius: 10 }} contentStyle={{ borderRadius: '15px', border: 'none', shadow: 'none', fontWeight: 700, fontSize: '11px' }} />
                        <Bar dataKey="assigned" name="Assigned" fill="#3B82F6" barSize={30} radius={[5, 5, 0, 0]} opacity={0.8} />
                        <Bar dataKey="confirmed" name="Confirmed" fill="#10B981" barSize={30} radius={[5, 5, 0, 0]} opacity={0.8} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Booking Weighatge</h4>
            <div className="h-[180px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={2}>
                        {pieData.map((entry, index) => (
                           <Cell key={index} fill={['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index % 5]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-3">
              {chartData.slice(0, 5).map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                    <span className="text-[11px] font-bold text-slate-700">{Math.round((item.confirmed / (activeRange.confirmed_by_team || 1)) * 100)}%</span>
                 </div>
              ))}
            </div>
         </div>
      </div>

      {/* Team Details Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
         <div className="p-6 border-b border-gray-50 bg-[#FBFCFE]">
            <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
               Participant <span className="text-[#2C55D4]">List Report.</span>
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
               <thead className="bg-[#FBFCFE]">
                  <tr>
                     <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                     <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned</th>
                     <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacted</th>
                     <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed</th>
                     <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Ratio</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-50">
                  {activeRange.per_user?.map((member, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-[13px]">
                                 {member.name?.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-[13px] font-semibold text-slate-800 leading-none">{member.name}</p>
                                 <p className="text-[10px] font-medium text-slate-400 mt-1">{member.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-4 text-[13px] font-bold text-slate-700 text-center tabular-nums">{member.assigned_to_user || 0}</td>
                        <td className="px-8 py-4 text-[13px] font-bold text-slate-700 text-center tabular-nums">{member.contacted_leads || 0}</td>
                        <td className="px-8 py-4 text-[13px] font-bold text-emerald-600 text-center tabular-nums">{member.confirmed_by_user || 0}</td>
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[70px]">
                                 <div className="bg-[#2C55D4] h-full" style={{ width: `${Math.min((member.confirmed_by_user / (member.assigned_to_user || 1)) * 100, 100)}%` }}></div>
                              </div>
                              <span className="text-[12px] font-bold text-slate-800">
                                 {member.assigned_to_user > 0 ? Math.round((member.confirmed_by_user / member.assigned_to_user) * 100) : 0}%
                              </span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default TeamReports;
