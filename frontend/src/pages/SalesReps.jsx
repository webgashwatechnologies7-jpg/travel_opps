import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { dashboardAPI } from '../services/api';

const SalesReps = () => {
  const navigate = useNavigate();
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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales Reps</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assigned</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confirmed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesReps.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">No data available</td>
                </tr>
              ) : (
                salesReps.map((rep, index) => (
                  <tr
                    key={rep.id || index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (rep.id) {
                        navigate(`/company-settings/users/${rep.id}`);
                      }
                    }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{rep.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{rep.total ?? (rep.assigned || 0) + (rep.confirmed || 0)}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{rep.assigned || 0}</td>
                    <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">{rep.confirmed || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default SalesReps;
