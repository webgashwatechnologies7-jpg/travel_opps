import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';
import { ArrowLeft, Download, FileText, Table, Calendar, DollarSign, TrendingUp, Filter, FileDown } from 'lucide-react';
import { generatePDFReport, generateExcelReport, generateDetailedReport } from '../utils/reportGenerator';

const ClientReports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
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
      // Mock client data
      const mockClient = {
        id: id,
        name: 'Shubi Paras',
        email: 'web.gashwatechnologies7@gmail.com',
        mobile: '+919805585855',
        city: 'Shimla',
        status: 'Active'
      };
      setClient(mockClient);

      // Mock report data
      const mockReportData = {
        summary: {
          totalPayments: 15,
          totalAmount: '₹2,45,000',
          averagePayment: '₹16,333',
          pendingPayments: 3,
          pendingAmount: '₹45,000',
          lastPaymentDate: '2024-01-10',
          paymentTrend: 'up'
        },
        payments: [
          {
            id: 1,
            date: '2024-01-10',
            amount: '₹15,000',
            status: 'Paid',
            method: 'Bank Transfer',
            description: 'Manali Trip - Final Payment',
            queryId: 'Q001',
            invoiceNo: 'INV-2024-001'
          },
          {
            id: 2,
            date: '2024-01-08',
            amount: '₹20,000',
            status: 'Paid',
            method: 'Cash',
            description: 'Delhi Trip - Advance',
            queryId: 'Q002',
            invoiceNo: 'INV-2024-002'
          },
          {
            id: 3,
            date: '2024-01-05',
            amount: '₹10,000',
            status: 'Paid',
            method: 'Online',
            description: 'Hotel Booking - Shimla',
            queryId: 'Q003',
            invoiceNo: 'INV-2024-003'
          },
          {
            id: 4,
            date: '2024-01-03',
            amount: '₹25,000',
            status: 'Paid',
            method: 'Bank Transfer',
            description: 'Manali Trip - Package',
            queryId: 'Q001',
            invoiceNo: 'INV-2024-004'
          },
          {
            id: 5,
            date: '2023-12-28',
            amount: '₹15,000',
            status: 'Paid',
            method: 'UPI',
            description: 'Transportation - Delhi',
            queryId: 'Q002',
            invoiceNo: 'INV-2023-045'
          }
        ],
        monthlyBreakdown: [
          { month: 'Jan 2024', payments: 4, amount: '₹70,000' },
          { month: 'Dec 2023', payments: 6, amount: '₹95,000' },
          { month: 'Nov 2023', payments: 3, amount: '₹45,000' },
          { month: 'Oct 2023', payments: 2, amount: '₹35,000' }
        ],
        paymentMethods: {
          'Bank Transfer': { count: 8, amount: '₹1,80,000' },
          'Cash': { count: 4, amount: '₹45,000' },
          'Online': { count: 2, amount: '₹15,000' },
          'UPI': { count: 1, amount: '₹5,000' }
        }
      };
      setReportData(mockReportData);
    } catch (error) {
      console.error('Failed to fetch client data:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  onChange={(e) => setReportType(e.target.value)}
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
