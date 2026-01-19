import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import Layout from '../components/Layout';

const Performance = () => {
  const [performance, setPerformance] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, [month]);

  const fetchPerformance = async () => {
    try {
      const response = await dashboardAPI.employeePerformance(month);
      setPerformance(response.data.data.employees || []);
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Performance</h1>
              <p className="text-gray-600 mt-1">Track and analyze employee performance metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
                Select Month:
              </label>
              <input
                id="month-select"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            <p className="text-sm text-gray-600 mt-1">Monthly performance data for all employees</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Leads</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confirmed</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Achieved</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completion %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {performance.map((emp) => (
                  <tr key={emp.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">{emp.name?.charAt(0) || 'E'}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{emp.name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{emp.total_leads || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{emp.confirmed_leads || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(emp.target_amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(emp.achieved_amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                emp.completion_percentage >= 100
                                  ? 'bg-green-500'
                                  : emp.completion_percentage >= 75
                                  ? 'bg-blue-500'
                                  : emp.completion_percentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(emp.completion_percentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold ${
                              emp.completion_percentage >= 100
                                ? 'text-green-600'
                                : emp.completion_percentage >= 75
                                ? 'text-blue-600'
                                : emp.completion_percentage >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {emp.completion_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {performance.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data found</h3>
              <p className="text-gray-500">Performance data is not available for the selected month. Try selecting a different month or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Performance;

