import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const SalesRepsTable = ({ title = "Sales Reps Performance" }) => {
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const response = await dashboardAPI.salesRepsStats();
      setSalesReps(response.data.data || []);
    } catch (err) {
      setError('Failed to load sales reps data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {title && (
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Name</th>
              <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Total</th>
              <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Assigned</th>
              <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {salesReps.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
                  No sales reps data available
                </td>
              </tr>
            ) : (
              salesReps.map((rep, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 text-gray-800 font-medium text-xs">{rep.name}</td>
                  <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.assigned + rep.confirmed}</td>
                  <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.assigned}</td>
                  <td className="py-2 px-3 text-right text-gray-700 text-xs">{rep.confirmed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesRepsTable;

