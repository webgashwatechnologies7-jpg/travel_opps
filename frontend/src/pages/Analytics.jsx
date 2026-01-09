import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import Layout from '../components/Layout';

const Analytics = () => {
  const [sourceRoi, setSourceRoi] = useState([]);
  const [destinationPerf, setDestinationPerf] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('source');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [month]);

  const fetchAnalytics = async () => {
    try {
      const [sourceRes, destRes] = await Promise.all([
        dashboardAPI.sourceRoi(month),
        dashboardAPI.destinationPerformance(month),
      ]);
      setSourceRoi(sourceRes.data.data.sources || []);
      setDestinationPerf(destRes.data.data.destinations || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
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

  const data = activeTab === 'source' ? sourceRoi : destinationPerf;

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('source')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'source'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Source ROI
          </button>
          <button
            onClick={() => setActiveTab('destination')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'destination'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Destination Performance
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'source' ? 'Source' : 'Destination'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'source' ? 'Confirmed' : 'Confirmed'}
                </th>
                {activeTab === 'destination' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.source || item.destination}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.total_leads}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.confirmed_leads}</td>
                  {activeTab === 'destination' && (
                    <td className="px-6 py-4 text-sm text-gray-900">{item.cancelled_leads}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(item.conversion_rate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{item.conversion_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">No analytics data found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;

