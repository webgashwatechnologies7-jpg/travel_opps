import { useState, useEffect } from 'react';
import { dashboardAPI, usersAPI, destinationsAPI, companySettingsAPI } from '../services/api';
// Layout removed - handled by nested routing
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, BarChart3, Users, Target, Award, CheckCircle2, Zap, Calendar, MapPin, User, Search, X, ClipboardList
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

const Performance = () => {
  const [performance, setPerformance] = useState([]);
  const [users, setUsers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filter States
  const [reportType, setReportType] = useState('user'); // New: user, destination, source
  const [timeframe, setTimeframe] = useState('month');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterBy, setFilterBy] = useState('created_at'); 

  useEffect(() => {
    fetchUsers();
    fetchDestinations();
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [reportType, timeframe, month, fromDate, toDate, selectedDestination, selectedEmployee, filterBy]);

  const fetchUsers = async () => {
    try {
      const response = await companySettingsAPI.getUsers();
      // The API returns users in response.data.data.users or just response.data.data
      const userData = response.data.data?.users || response.data.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await destinationsAPI.list();
      const destData = response.data.data || response.data;
      setDestinations(Array.isArray(destData) ? destData : []);
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
      setDestinations([]);
    }
  };

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const params = {
        group_by: reportType,
        timeframe,
        month: timeframe === 'month' ? month : undefined,
        from_date: timeframe === 'custom' ? fromDate : undefined,
        to_date: timeframe === 'custom' ? toDate : undefined,
        destination: selectedDestination || undefined,
        employee_id: selectedEmployee || undefined,
        filter_by: filterBy,
      };
      
      const response = await dashboardAPI.employeePerformance(params);
      setPerformance(response.data.data.employees || []);
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setReportType('user');
    setTimeframe('month');
    setMonth(new Date().toISOString().slice(0, 7));
    setFromDate('');
    setToDate('');
    setSelectedDestination('');
    setSelectedEmployee('');
    setFilterBy('created_at');
  };

  return (
    <div className={`relative page-transition ${loading && performance.length > 0 ? 'opacity-80' : ''}`} title="Performance Insights">
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && performance.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500 bg-[#F9FAFB]">
             <LogoLoader text="Gathering analytics data..." />
          </div>
      ) : (
        <div className="space-y-6">

        {/* Advanced Header & Filter Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Performance Insights</h1>
              <p className="text-gray-500 font-medium mt-1">
                Unified analytics for {reportType === 'user' ? 'team members' : reportType === 'destination' ? 'destinations' : 'lead sources'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg ${
                  showAnalytics 
                    ? 'bg-gray-900 text-white hover:bg-black' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {showAnalytics ? <BarChart3 size={18} /> : <TrendingUp size={18} />}
                {showAnalytics ? 'Hide Analytics' : 'Visualize Results'}
              </button>
              
              <button
                onClick={resetFilters}
                className="p-3 bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                title="Reset Filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            {/* Analysis Level Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <BarChart3 size={12} /> Analysis Level
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="user">By Team Member</option>
                <option value="destination">By Destination</option>
                <option value="source">By Lead Source</option>
              </select>
            </div>
            {/* Filter By Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Search size={12} /> Filter By
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="created_at">Leads Created Date</option>
                <option value="travel_date">Leads Travel Date</option>
              </select>
            </div>

            {/* Timeframe Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Calendar size={12} /> Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">Monthly</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Date Specific Logic */}
            {timeframe === 'month' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 transition-all">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <Calendar size={12} /> Select Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            ) : timeframe === 'custom' ? (
              <>
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 transition-all">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 transition-all">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
              </>
            ) : null}

            {/* Destination Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MapPin size={12} /> Destination
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="">All Destinations</option>
                {Array.isArray(destinations) && destinations.map(dest => (
                  <option key={dest.id} value={dest.name}>{dest.name}</option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <User size={12} /> Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="">Team (All)</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Visualization Section */}
        {showAnalytics && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-md">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Team Size</p>
                  <h4 className="text-2xl font-black text-gray-900">{performance.length}</h4>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-md">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Leads (Month)</p>
                  <h4 className="text-2xl font-black text-gray-900">
                    {performance.reduce((acc, curr) => acc + (curr.total_leads || 0), 0)}
                  </h4>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-md">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Team Conversions</p>
                  <h4 className="text-2xl font-black text-gray-900">
                    {performance.reduce((acc, curr) => acc + (curr.confirmed_leads || 0), 0)}
                  </h4>
                </div>
              </div>

              <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-5 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-400 rounded-2xl flex items-center justify-center text-white">
                  <Award size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-wider mb-1">Avg. Achievement</p>
                  <h4 className="text-2xl font-black text-white">
                    {performance.length > 0 
                      ? Math.round(performance.reduce((acc, curr) => acc + (curr.completion_percentage || 0), 0) / performance.length)
                      : 0}%
                  </h4>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart Card */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                      <Zap className="text-yellow-500 fill-yellow-500" size={24} />
                      Performance Breakdown
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Lead Volume vs Successful Conversions</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></span> Total Leads</span>
                       <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-500"></span> Confirmed</span>
                    </div>
                    {performance.length > 10 && (
                      <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Scroll horizontally to see all {performance.length} employees →</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-4">
                  <div style={{ minWidth: performance.length > 8 ? `${performance.length * 80}px` : '100%', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="performanceTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="performanceConfirmed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc', radius: 10 }}
                          contentStyle={{ 
                            borderRadius: '20px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            fontSize: '12px',
                            fontWeight: 800,
                            padding: '16px'
                          }}
                        />
                        <Bar 
                          name="Total Leads" 
                          dataKey="total_leads" 
                          fill="url(#performanceTotal)" 
                          radius={[8, 8, 0, 0]} 
                          barSize={performance.length > 15 ? 30 : 40} 
                        />
                        <Bar 
                          name="Confirmed" 
                          dataKey="confirmed_leads" 
                          fill="url(#performanceConfirmed)" 
                          radius={[8, 8, 0, 0]} 
                          barSize={performance.length > 15 ? 30 : 40} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Leaderboard/Insights Card */}
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 transition-transform group-hover:scale-110">
                    <Award size={120} className="text-blue-600" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Award className="text-yellow-500" size={18} />
                    Top Performer
                  </h4>
                  {performance.length > 0 ? (
                    (() => {
                      const top = [...performance].sort((a, b) => (b.completion_percentage || 0) - (a.completion_percentage || 0))[0];
                      return (
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                              {top.name?.charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-xl font-black text-gray-900 leading-none">{top.name}</h5>
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Consistency King</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Completion</p>
                              <p className="text-lg font-black text-gray-900">{top.completion_percentage}%</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Efficiency</p>
                              <p className="text-lg font-black text-gray-900">
                                {top.total_leads > 0 ? Math.round((top.confirmed_leads / top.total_leads) * 100) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </div>

                <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 to-transparent"></div>
                  <div className="relative z-10">
                    <h4 className="text-white font-black text-lg mb-4">Strategic Summary</h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Employee performance is tracked based on lead conversion ratios and revenue targets. 
                      Focus on increasing the conversion efficiency of the middle-tier performers to boost overall team revenue.
                    </p>
                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Target Velocity</span>
                        <span className="text-blue-400 font-bold text-xs">+12.5% vs Last Mo</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 grayscale">
                        <div className="bg-blue-500 h-1.5 rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        {!showAnalytics && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="text-blue-600" size={24} />
                Performance Metrics
              </h3>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest px-1">
                 {timeframe === 'month' ? `${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}` : timeframe === 'day' ? 'Today' : timeframe === 'year' ? 'Annual' : 'Selected Period'} 
                 {' • Analysis by '} 
                 <span className="text-blue-600">{reportType === 'user' ? 'Team Members' : reportType === 'destination' ? 'Destinations' : 'Lead Sources'}</span>
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">{reportType === 'user' ? 'Team Member' : reportType === 'destination' ? 'Destination' : 'Lead Source'}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total Leads</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Confirmed</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Efficiency %</th>
                    {reportType === 'user' && (
                       <>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Target</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Achieved</th>
                         <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Completion %</th>
                       </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {performance.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${reportType === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <span className={`text-sm font-bold ${reportType === 'user' ? 'text-blue-600' : 'text-gray-600'}`}>
                              {reportType === 'user' ? <User size={14} /> : reportType === 'destination' ? <MapPin size={14} /> : <Search size={14} />}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-900">{emp.name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{emp.total_leads || 0}</td>
                      <td className="px-6 py-4 font-bold text-green-600">{emp.confirmed_leads || 0}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {emp.total_leads > 0 ? Math.round((emp.confirmed_leads / emp.total_leads) * 100) : 0}% Ratio
                        </span>
                      </td>
                      {reportType === 'user' && (
                        <>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{(emp.target_amount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-bold text-blue-600">₹{(emp.achieved_amount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <div className="flex-1 h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{ width: `${Math.min(emp.completion_percentage || 0, 100)}%` }}></div>
                               </div>
                               <span className="text-[10px] font-black text-blue-600">{emp.completion_percentage || 0}%</span>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {performance.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data found</h3>
                <p className="text-gray-500">Performance data is not available for the selected month. Try selecting a different month or check back later.</p>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Performance;
