import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const EmployeePerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await dashboardAPI.employeePerformance();
      setPerformance(response.data.data || []);
    } catch (err) {
      // If API fails, use empty array (might not be admin)
      setPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Employee Performance</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Employee Performance</h2>
      <div className="space-y-2">
        {performance.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No performance data available</p>
        ) : (
          performance.slice(0, 6).map((emp, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <span className="text-sm text-gray-800">{emp.name || `Employee ${index + 1}`}</span>
              <span className="text-sm font-semibold text-gray-800">{emp.performance || 80}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeePerformance;

