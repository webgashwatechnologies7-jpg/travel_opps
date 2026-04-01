import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Users, 
  Clock, 
  Calendar, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const StaffAttendance = () => {
    const [viewMode, setViewMode] = useState('daily'); // daily, monthly
    const today = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const [data, setData] = useState({ present: [], absent: [], summary: {} });
    const [history, setHistory] = useState({ records: [], summary: {} });
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = viewMode === 'daily' 
                ? { date: selectedDate } 
                : { month: selectedMonth, year: selectedYear };
            
            const res = await api.get('/attendance/all', { params });
            if (viewMode === 'daily') {
                setData(res.data);
            } else {
                setHistory(res.data);
            }
        } catch (err) {
            toast.error("Failed to load staff attendance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [viewMode, selectedDate, selectedMonth, selectedYear]);

    const formatTime = (time) => {
        return time ? new Date('2000-01-01 ' + time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff Attendance</h1>
                        <p className="text-gray-500 mt-1">Monitor daily presence and monthly working hours of all employees.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                        <button 
                            onClick={() => setViewMode('daily')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Daily Log
                        </button>
                        <button 
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Monthly Report
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
                    {viewMode === 'daily' ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Select Date:</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">Month:</span>
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50"
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">Year:</span>
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 italic">
                        <Clock className="w-4 h-4" />
                        Last updated {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {viewMode === 'daily' ? (
                        <>
                            <Card icon={<Users className="text-blue-600" />} label="Total Staff" value={data.summary.total_employees || 0} color="blue" />
                            <Card icon={<UserCheck className="text-green-600" />} label="Present" value={data.summary.present_count || 0} color="green" />
                            <Card icon={<UserX className="text-red-600" />} label="Absent" value={data.summary.absent_count || 0} color="red" />
                            <Card icon={<TrendingUp className="text-purple-600" />} label="Attendance %" value={data.summary.total_employees ? Math.round((data.summary.present_count / data.summary.total_employees) * 100) : 0} suffix="%" color="purple" />
                        </>
                    ) : (
                        <>
                            <Card icon={<Calendar className="text-blue-600" />} label="Total Records" value={history.records?.length || 0} color="blue" />
                            <Card icon={<Clock className="text-indigo-600" />} label="Avg Hours/Day" value={history.records?.length ? (history.summary.total_hours / history.records.length).toFixed(1) : 0} color="indigo" />
                            <Card icon={<Clock className="text-amber-600" />} label="Total Overtime" value={Math.round(history.summary.total_overtime || 0)} suffix="h" color="amber" />
                            <Card icon={<TrendingUp className="text-emerald-600" />} label="Productivity" value="High" color="emerald" />
                        </>
                    )}
                </div>

                {/* Table Logic */}
                {viewMode === 'daily' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Present Table */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Active Logs ({data.present.length})
                            </h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Employee</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Punch In</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Punch Out</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.present.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                                                            {row.user?.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{row.user?.name}</div>
                                                            <div className="text-xs text-gray-500">{row.user?.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex flex-col">
                                                        <span>{formatTime(row.punch_in)}</span>
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {row.is_remote ? 'Remote' : row.ip_address}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                                    {row.punch_out ? formatTime(row.punch_out) : <span className="text-orange-500 animate-pulse">Working...</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        row.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {data.present.length === 0 && (
                                    <div className="p-12 text-center text-gray-400">No one has punched in today yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Absent Table */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                Not Pushed In ({data.absent.length})
                            </h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                                {data.absent.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.role}</div>
                                            </div>
                                        </div>
                                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {data.absent.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 italic">Everyone is present! 🚀</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Days</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Hours</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total Overtime</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Group records by user for monthly view snippet */}
                                {Object.values(history.records.reduce((acc, r) => {
                                    if (!acc[r.user_id]) acc[r.user_id] = { user: r.user, days: 0, hours: 0, ot: 0 };
                                    acc[r.user_id].days++;
                                    acc[r.user_id].hours += parseFloat(r.total_hours || 0);
                                    acc[r.user_id].ot += parseFloat(r.overtime_hours || 0);
                                    return acc;
                                }, {})).map((stat, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                                {stat.user?.name.charAt(0)}
                                            </div>
                                            <div className="font-semibold text-gray-900">{stat.user?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{stat.days} Days</td>
                                        <td className="px-6 py-4 text-sm font-bold">{stat.hours.toFixed(1)} hrs</td>
                                        <td className="px-6 py-4 text-sm text-amber-600">+{stat.ot.toFixed(1)} hrs</td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium">
                                                View Sheet <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const Card = ({ icon, label, value, color, suffix = "" }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        purple: "bg-purple-50 text-purple-600",
        indigo: "bg-indigo-50 text-indigo-600",
        amber: "bg-amber-50 text-amber-600",
        emerald: "bg-emerald-50 text-emerald-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-gray-900">{value}</span>
                <span className="text-sm font-bold text-gray-500">{suffix}</span>
            </div>
        </div>
    );
};

export default StaffAttendance;
