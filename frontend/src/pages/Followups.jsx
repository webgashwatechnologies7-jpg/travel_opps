import { useState, useEffect } from 'react';
import { followupsAPI } from '../services/api';
import Layout from '../components/Layout';

const Followups = () => {
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [overdueFollowups, setOverdueFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const [todayRes, overdueRes] = await Promise.all([
        followupsAPI.today(),
        followupsAPI.overdue(),
      ]);
      setTodayFollowups(todayRes.data.data.followups || []);
      setOverdueFollowups(overdueRes.data.data.followups || []);
    } catch (err) {
      console.error('Failed to fetch followups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await followupsAPI.complete(id);
      fetchFollowups();
    } catch (err) {
      alert('Failed to mark as complete');
    }
  };

  const followups = activeTab === 'today' ? todayFollowups : overdueFollowups;

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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Followups</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today ({todayFollowups.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overdue ({overdueFollowups.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {followups.map((followup) => (
                <tr key={followup.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {followup.lead?.client_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{followup.lead?.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{followup.remark || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {followup.reminder_date} {followup.reminder_time || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleComplete(followup.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Mark Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {followups.length === 0 && (
            <div className="text-center py-8 text-gray-500">No followups found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Followups;

