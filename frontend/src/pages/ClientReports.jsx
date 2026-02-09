import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsAPI, paymentsAPI } from '../services/api';
import Layout from '../components/Layout';
import { ArrowLeft, Download, FileText, Table, Calendar, DollarSign, TrendingUp, Filter, FileDown } from 'lucide-react';
import { generatePDFReport, generateExcelReport, generateDetailedReport } from '../utils/reportGenerator';

const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '-');

const ClientReports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPayments, setAllPayments] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('weekly');

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, paymentsRes] = await Promise.all([
        accountsAPI.getClient(id),
        paymentsAPI.getByLead(id)
      ]);

      if (clientRes?.data?.success) {
        const c = clientRes.data.data;
        setClient({ id: c.id, name: c.name, email: c.email, mobile: c.mobile, city: c.city, status: c.status });
      } else {
        setClient(null);
        setLoading(false);
        return;
      }

      if (paymentsRes?.data?.success && paymentsRes.data.data?.payments) {
        setAllPayments(paymentsRes.data.data.payments);
      } else {
        setAllPayments([]);
      }
    } catch (error) {
      console.error('Failed to fetch client data:', error);
      setAllPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const reportData = useMemo(() => {
    if (!allPayments.length) {
      return {
        summary: { totalPayments: 0, totalAmount: '₹0', averagePayment: '₹0', pendingPayments: 0, pendingAmount: '₹0', lastPaymentDate: '-', paymentTrend: '-' },
        payments: [],
        monthlyBreakdown: [],
        paymentMethods: {}
      };
    }
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    const filtered = allPayments.filter((p) => {
      const d = new Date(p.created_at);
      return d >= start && d <= end;
    });
    const totalAmount = filtered.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPaid = filtered.reduce((s, p) => s + parseFloat(p.paid_amount || 0), 0);
    const totalDue = filtered.reduce((s, p) => s + parseFloat((p.amount || 0) - (p.paid_amount || 0)), 0);
    const pendingCount = filtered.filter((p) => (p.status || '').toLowerCase() !== 'paid').length;
    const lastPayment = filtered.length ? filtered.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b)) : null;
    const monthlyMap = {};
    filtered.forEach((p) => {
      const m = new Date(p.created_at);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { count: 0, amount: 0 };
      monthlyMap[key].count += 1;
      monthlyMap[key].amount += parseFloat(p.amount || 0);
    });
    const monthlyBreakdown = Object.entries(monthlyMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([k, v]) => ({
        month: new Date(k + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        payments: v.count,
        amount: formatCurrency(v.amount)
      }));
    const payments = filtered.map((p) => ({
      id: p.id,
      date: formatDate(p.created_at),
      amount: formatCurrency(p.amount),
      status: (p.status || 'pending').charAt(0).toUpperCase() + (p.status || '').slice(1),
      method: '-',
      description: '-',
      queryId: p.lead_id ? `Q${p.lead_id}` : '-',
      invoiceNo: '-'
    }));
    return {
      summary: {
        totalPayments: filtered.length,
        totalAmount: formatCurrency(totalAmount),
        averagePayment: filtered.length ? formatCurrency(totalAmount / filtered.length) : '₹0',
        pendingPayments: pendingCount,
        pendingAmount: formatCurrency(totalDue),
        lastPaymentDate: lastPayment ? formatDate(lastPayment.created_at) : '-',
        paymentTrend: '-'
      },
      payments,
      monthlyBreakdown,
      paymentMethods: filtered.length ? { Payment: { count: filtered.length, amount: formatCurrency(totalAmount) } } : {}
    };
  }, [allPayments, dateRange]);

  const generatePDF = () => {
    if (!client || !reportData) return;
    
    try {
      generatePDFReport(client, reportData, dateRange);
      // Show success message
      alert('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const generateExcel = () => {
    if (!client || !reportData) return;
    
    try {
      generateExcelReport(client, reportData, dateRange);
      // Show success message
      alert('Excel report generated successfully!');
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel report. Please try again.');
    }
  };

  const generateDetailedJSON = () => {
    if (!client || !reportData) return;
    
    try {
      generateDetailedReport(client, reportData, dateRange);
      // Show success message
      alert('Detailed JSON report generated successfully!');
    } catch (error) {
      console.error('Error generating detailed report:', error);
      alert('Failed to generate detailed report. Please try again.');
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReportTypeChange = (value) => {
    setReportType(value);
    const today = new Date();
    let start, end;
    if (value === 'weekly') {
      start = new Date(today);
      start.setDate(start.getDate() - 7);
      end = new Date(today);
    } else if (value === 'monthly') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today);
    } else if (value === 'quarterly') {
      start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      end = new Date(today);
    } else if (value === 'yearly') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today);
    } else {
      return;
    }
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
            <p className="text-gray-600">The client you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/accounts/clients')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/accounts/clients/${id}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Client Reports</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={generatePDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={generateExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Table className="h-4 w-4" />
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={generateDetailedJSON}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Detailed Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="font-medium text-gray-900">{client.mobile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Filters */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData?.summary.totalPayments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData?.summary.totalAmount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Last Payment</p>
                <p className="text-lg font-semibold text-gray-900">{reportData?.summary.lastPaymentDate}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData?.summary.pendingAmount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData?.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.invoiceNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h2>
            <div className="space-y-3">
              {reportData?.monthlyBreakdown.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">{month.month}</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm text-gray-600">{month.payments} payments</span>
                    <span className="font-semibold text-gray-900">{month.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(reportData?.paymentMethods || {}).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{method}</p>
                    <p className="text-sm text-gray-600">{data.count} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{data.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientReports;
