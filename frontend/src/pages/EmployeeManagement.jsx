import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  User, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download,
  FileText,
  Target,
  Activity,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';

const EmployeeManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reports, setReports] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState(null);
  const [historyPeriod, setHistoryPeriod] = useState('daily');

  useEffect(() => {
    fetchEmployees();
    if (id) {
      // If ID is provided, automatically select and load that employee
      fetchEmployeeDetails(id);
    }
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployeeDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period: reportPeriod });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/employees/${selectedEmployee}/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitLoss = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/employees/${selectedEmployee}/profit-loss?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfitLoss(data.data);
      }
    } catch (error) {
      console.error('Error fetching profit/loss:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceHistory = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period: historyPeriod });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/employees/${selectedEmployee}/performance-history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setPerformanceHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching performance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!selectedEmployee) return;
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period: reportPeriod });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/employees/${selectedEmployee}/reports/pdf?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee-report-${selectedEmployee}-${reportPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    fetchEmployeeDetails(employeeId);
    setReports(null);
    setProfitLoss(null);
    setPerformanceHistory(null);
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchReports();
      fetchProfitLoss();
      fetchPerformanceHistory();
    }
  }, [selectedEmployee, reportPeriod, historyPeriod, startDate, endDate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex items-center space-x-4">
          <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name} - {employee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEmployee && employeeDetails && (
        <>
          {/* Employee Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Employee Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-lg font-semibold">{employeeDetails.employee.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{employeeDetails.employee.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{employeeDetails.employee.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Registration Date</Label>
                  <p className="text-sm">{formatDate(employeeDetails.registration_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={employeeDetails.employee.is_active ? "default" : "secondary"}>
                    {employeeDetails.employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm">{employeeDetails.employee.company || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Leads</p>
                    <p className="text-2xl font-bold">{employeeDetails.work_assignments.total_leads_assigned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Confirmed</p>
                    <p className="text-2xl font-bold">{employeeDetails.work_assignments.confirmed_leads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Cancelled</p>
                    <p className="text-2xl font-bold">{employeeDetails.work_assignments.cancelled_leads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold">{employeeDetails.work_assignments.active_leads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance and Reports */}
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
              <TabsTrigger value="history">Performance History</TabsTrigger>
            </TabsList>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Current Month Target</Label>
                      <p className="text-2xl font-bold">{formatCurrency(employeeDetails.performance.current_month_target)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Month Achieved</Label>
                      <p className="text-2xl font-bold">{formatCurrency(employeeDetails.performance.current_month_achieved)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Revenue</Label>
                      <p className="text-2xl font-bold">{formatCurrency(employeeDetails.performance.total_revenue)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Success Rate</Label>
                      <p className="text-2xl font-bold">{employeeDetails.performance.success_rate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Employee Reports</span>
                    </div>
                    <Button onClick={downloadPDF} className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label>Report Period</Label>
                      <Select value={reportPeriod} onValueChange={setReportPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={fetchReports} disabled={loading}>
                        {loading ? 'Loading...' : 'Generate Report'}
                      </Button>
                    </div>
                  </div>

                  {reports && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Total Leads</p>
                              <p className="text-xl font-bold">{reports.summary.total_leads}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Confirmed</p>
                              <p className="text-xl font-bold text-green-600">{reports.summary.confirmed_leads}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Success Rate</p>
                              <p className="text-xl font-bold">{reports.summary.success_rate}%</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Revenue</p>
                              <p className="text-xl font-bold">{formatCurrency(reports.summary.total_revenue)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profit-loss">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Profit & Loss Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profitLoss && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Actual Revenue</p>
                              <p className="text-xl font-bold text-green-600">
                                {formatCurrency(profitLoss.revenue_analysis.actual_revenue)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Lost Revenue</p>
                              <p className="text-xl font-bold text-red-600">
                                {formatCurrency(profitLoss.revenue_analysis.lost_revenue)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Pending Revenue</p>
                              <p className="text-xl font-bold text-orange-600">
                                {formatCurrency(profitLoss.revenue_analysis.pending_revenue)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Performance Metrics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Conversion Rate:</span>
                              <span className="font-medium">{profitLoss.performance_metrics.conversion_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cancellation Rate:</span>
                              <span className="font-medium">{profitLoss.performance_metrics.cancellation_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average Lead Value:</span>
                              <span className="font-medium">{formatCurrency(profitLoss.performance_metrics.average_lead_value)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Profit Analysis</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Net Profit:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(profitLoss.profit_loss.net_profit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Profit Margin:</span>
                              <span className="font-medium">{profitLoss.profit_loss.profit_margin}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Performance History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label>History Period</Label>
                      <Select value={historyPeriod} onValueChange={setHistoryPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={fetchPerformanceHistory} disabled={loading}>
                        {loading ? 'Loading...' : 'Load History'}
                      </Button>
                    </div>
                  </div>

                  {performanceHistory && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Total Periods</p>
                              <p className="text-xl font-bold">{performanceHistory.summary.total_periods}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Total Leads</p>
                              <p className="text-xl font-bold">{performanceHistory.summary.total_leads_assigned}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Total Revenue</p>
                              <p className="text-xl font-bold">{formatCurrency(performanceHistory.summary.total_revenue)}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium">Avg Success Rate</p>
                              <p className="text-xl font-bold">{performanceHistory.summary.average_success_rate}%</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Period</th>
                              <th className="px-4 py-2 text-right">Leads Assigned</th>
                              <th className="px-4 py-2 text-right">Confirmed</th>
                              <th className="px-4 py-2 text-right">Cancelled</th>
                              <th className="px-4 py-2 text-right">Success Rate</th>
                              <th className="px-4 py-2 text-right">Revenue</th>
                              <th className="px-4 py-2 text-right">Target</th>
                              <th className="px-4 py-2 text-right">Achievement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performanceHistory.performance_history.map((period, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-2">{period.period || period.date}</td>
                                <td className="px-4 py-2 text-right">{period.leads_assigned}</td>
                                <td className="px-4 py-2 text-right text-green-600">{period.leads_confirmed}</td>
                                <td className="px-4 py-2 text-right text-red-600">{period.leads_cancelled}</td>
                                <td className="px-4 py-2 text-right">{period.success_rate}%</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(period.revenue_generated)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(period.target_amount)}</td>
                                <td className="px-4 py-2 text-right">
                                  <span className={period.achievement_percentage >= 100 ? 'text-green-600' : 'text-orange-600'}>
                                    {period.achievement_percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Employee Selected</h3>
            <p className="text-gray-500">Please select an employee from the dropdown to view their details and performance reports.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeManagement;
