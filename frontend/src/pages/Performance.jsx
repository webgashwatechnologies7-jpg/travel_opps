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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Employee Performance</h1>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achieved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performance.map((emp) => (
                <tr key={emp.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.total_leads}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{emp.confirmed_leads}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{emp.target_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{emp.achieved_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            emp.completion_percentage >= 100
                              ? 'bg-green-500'
                              : emp.completion_percentage >= 75
                              ? 'bg-blue-500'
                              : emp.completion_percentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(emp.completion_percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          emp.completion_percentage >= 100
                            ? 'text-green-600'
                            : emp.completion_percentage >= 75
                            ? 'text-blue-600'
                            : emp.completion_percentage >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {emp.completion_percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {performance.length === 0 && (
            <div className="text-center py-8 text-gray-500">No performance data found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Performance;

