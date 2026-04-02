import React, { useState, useEffect } from 'react';
// Layout removed - handled by nested routing
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Clock, MapPin, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ summary: {}, records: [] });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/attendance/report');
      const result = response.data;
      setData(result);
      
      // Robust date matching
      const todayString = new Date().toDateString();
      const todayRec = result.records.find(r => new Date(r.date).toDateString() === todayString);
      setTodayRecord(todayRec || null);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handlePunchIn = async () => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/punch-in');
      const result = response.data;
      if (response.status === 200) {
        toast.success(result.message);
        fetchAttendance();
      } else {
        toast.error(result.message || 'Failed to punch in');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      const response = await api.post('/attendance/punch-out');
      const result = response.data;
      if (response.status === 200) {
        toast.success(result.message);
        fetchAttendance();
      } else {
        toast.error(result.message || 'Failed to punch out');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Attendance & Payroll</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls */}
          <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-gray-100">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" /> Today's Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Punch In</p>
                  <p className="text-3xl font-bold text-gray-800">{todayRecord?.punch_in || '--:--'}</p>
                </div>
                
                <div className="h-20 w-px bg-gray-200 hidden md:block" />

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  {!todayRecord?.punch_in ? (
                    <Button 
                      onClick={handlePunchIn} 
                      disabled={loading}
                      className="relative h-32 w-32 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Clock className="h-8 w-8" />
                      <span className="font-bold">PUNCH IN</span>
                    </Button>
                  ) : !todayRecord?.punch_out ? (
                    <Button 
                      onClick={handlePunchOut} 
                      disabled={loading}
                      className="relative h-32 w-32 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-2xl flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Clock className="h-8 w-8" />
                      <span className="font-bold">PUNCH OUT</span>
                    </Button>
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-green-100 text-green-700 flex flex-col items-center justify-center gap-1 border-4 border-green-200">
                      <TrendingUp className="h-8 w-8" />
                      <span className="text-xs font-bold uppercase">Finished</span>
                    </div>
                  )}
                </div>

                <div className="h-20 w-px bg-gray-200 hidden md:block" />

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Punch Out</p>
                  <p className="text-3xl font-bold text-gray-800">{todayRecord?.punch_out || '--:--'}</p>
                </div>
              </div>

              {todayRecord && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-6">
                  <Badge variant="outline" className="px-4 py-2 text-sm bg-gray-50 flex gap-2 items-center">
                    <MapPin className="h-4 w-4 text-red-400" /> IP: {todayRecord.ip_address}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm bg-gray-50 flex gap-2 items-center">
                    <Clock className="h-4 w-4 text-blue-400" /> Today's Total Hours: <span className="font-bold text-gray-900 ml-1">{todayRecord.total_hours} hrs</span>
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-indigo-100 font-medium">Estimated Salary</p>
                  <DollarSign className="h-5 w-5 text-indigo-300" />
                </div>
                <h3 className="text-3xl font-extrabold mt-2">{formatCurrency(data.summary?.estimated_salary || 0)}</h3>
                <p className="text-xs text-indigo-200 mt-2 italic">*Calculated based on current month's attendance</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                   Monthly Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Present Days</span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{data.summary?.total_present || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Half Days</span>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{data.summary?.total_half_day || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Work Hours</span>
                  <span className="font-bold text-gray-900">{parseFloat(data.summary?.total_hours || 0).toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                   <span className="text-gray-600">Overtime Hours</span>
                   <span className="font-bold text-blue-600">{parseFloat(data.summary?.total_overtime || 0).toFixed(1)} hrs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Table */}
        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800">Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Punch In</th>
                    <th className="px-6 py-4">Punch Out</th>
                    <th className="px-6 py-4">Hours</th>
                    <th className="px-6 py-4">OT</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Loc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.records?.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-6 py-4">{record.punch_in ? record.punch_in.substring(0, 5) : '--:--'}</td>
                      <td className="px-6 py-4">{record.punch_out ? record.punch_out.substring(0, 5) : '--:--'}</td>
                      <td className="px-6 py-4 font-semibold">{record.total_hours} hrs</td>
                      <td className="px-6 py-4 text-blue-600">{record.overtime_hours > 0 ? `+${record.overtime_hours} hrs` : '-'}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} hover:bg-transparent capitalize`}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{record.is_remote ? 'Remote' : 'Office'}</td>
                    </tr>
                  ))}
                  {data.records?.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500 italic">No attendance records found for this month</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Attendance;
