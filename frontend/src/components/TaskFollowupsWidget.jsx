import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { followupsAPI } from '../services/api';
import { Bell, CheckCircle } from 'lucide-react';

const TaskFollowupsWidget = ({ maxItems = 10, showViewAll = true }) => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const response = await followupsAPI.today();
      setFollowups(response.data.data?.followups || []);
    } catch (err) {
      setError('Failed to load followups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    // Time is in HH:MM:SS format, convert to HH:MM
    return time.substring(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}. ${day} - ${year.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Task / Followup's</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Task / Followup's</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  const displayFollowups = followups.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Task / Followup's</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayFollowups.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No followups today</p>
        ) : (
          displayFollowups.map((followup, index) => {
            const isToday = new Date(followup.reminder_date || followup.created_at).toDateString() === new Date().toDateString();
            return (
              <div 
                key={followup.id || index} 
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-gray-600">
                    {isToday ? 'Today!' : formatDate(followup.reminder_date || followup.created_at)}: 
                  </span>
                  <span className="text-xs text-gray-800">
                    {followup.remark || 'Call after two days'}
                  </span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>
      {showViewAll && (
        <Link
          to="/followups"
          className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      )}
    </div>
  );
};

export default TaskFollowupsWidget;

