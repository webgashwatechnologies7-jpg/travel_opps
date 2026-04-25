import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { followupsAPI } from '../services/api';
import { toast } from 'react-toastify';
import LogoLoader from '../components/LogoLoader';

// Layout removed - handled by nested routing

const Followups = () => {
  const navigate = useNavigate();
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [overdueFollowups, setOverdueFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      const res = await followupsAPI.list();
      const all = res.data.data.followups || [];
      
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      setTodayFollowups(all.filter(f => f.reminder_date === todayStr));
      setOverdueFollowups(all.filter(f => (f.reminder_date < todayStr || !f.reminder_date) && !f.is_completed));
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
      toast.success('Follow-up marked as complete');
    } catch (err) {
      toast.error('Failed to mark as complete');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    try {
      await followupsAPI.delete(id);
      fetchFollowups();
      toast.success('Follow-up deleted successfully');
    } catch (err) {
      toast.error('Failed to delete follow-up');
    }
  };

  const followups = activeTab === 'today' ? todayFollowups : overdueFollowups;

  return (
    <div className={`p-6 relative page-transition ${loading && todayFollowups.length + overdueFollowups.length > 0 ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && todayFollowups.length === 0 && overdueFollowups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
             <LogoLoader text="Loading followups..." />
          </div>
      ) : (
        <>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Followups</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-6 py-2 rounded-lg ${activeTab === 'today'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Today ({todayFollowups.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-6 py-2 rounded-lg ${activeTab === 'overdue'
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {followups.map((followup) => (
              <tr 
                key={followup.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={(e) => {
                  // Don't navigate if clicking on an action button
                  if (e.target.tagName.toLowerCase() === 'button') return;
                  if (followup.lead_id || followup.lead?.id) {
                    navigate(`/leads/${followup.lead_id || followup.lead.id}?tab=followups`);
                  }
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {followup.lead?.client_name || 'N/A'}
                    </div>
                    {followup.lead?.is_deleted && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">Deleted Lead</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{followup.lead?.phone || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{followup.remark || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {followup.reminder_date} {followup.reminder_time || ''}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{followup.user?.name || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(followup.id);
                      }}
                      className="text-green-600 hover:text-green-900 font-medium mr-4"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(followup.id);
                      }}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
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
        </>
      )}
    </div>
  );
};

export default Followups;
