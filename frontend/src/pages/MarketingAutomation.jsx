import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Bot,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Settings,
  Clock,
  Users,
  Mail,
  MessageSquare
} from 'lucide-react';

const MarketingAutomation = () => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      // Mock data for now
      const mockAutomations = [
        {
          id: 1,
          name: 'Welcome Email Series',
          trigger: 'New Lead',
          status: 'active',
          leads_processed: 156,
          conversion_rate: 12.5,
          created_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'Follow-up SMS',
          trigger: 'No Response',
          status: 'active',
          leads_processed: 89,
          conversion_rate: 8.3,
          created_at: '2024-01-20'
        }
      ];
      setAutomations(mockAutomations);
    } catch (err) {
      setError('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Automation</h1>
            <p className="text-gray-600 mt-1">Set up automated marketing workflows</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Automations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {automations.filter(a => a.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leads Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {automations.reduce((sum, a) => sum + a.leads_processed, 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {automations.length > 0 
                    ? (automations.reduce((sum, a) => sum + a.conversion_rate, 0) / automations.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Automation Rules */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Automation Rules</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {automations.length > 0 ? (
              automations.map((automation) => (
                <div key={automation.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <Bot className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{automation.name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Trigger: <span className="font-medium">{automation.trigger}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Created: {new Date(automation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Leads Processed</p>
                        <p className="text-lg font-semibold text-gray-900">{automation.leads_processed}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                        <p className="text-lg font-semibold text-gray-900">{automation.conversion_rate}%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className={`p-2 rounded-lg ${
                          automation.status === 'active' 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                          {automation.status === 'active' ? 
                            <Pause className="w-4 h-4" /> : 
                            <Play className="w-4 h-4" />
                          }
                        </button>
                        <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No automation rules yet</p>
                <p className="text-sm text-gray-500 mt-2">Create your first automation rule to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Automation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Automation Rule</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter rule name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Event
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select trigger event</option>
                    <option value="new_lead">New Lead Created</option>
                    <option value="no_response">No Response for 3 Days</option>
                    <option value="lead_converted">Lead Converted</option>
                    <option value="form_submitted">Form Submitted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select action</option>
                    <option value="send_email">Send Email</option>
                    <option value="send_sms">Send SMS</option>
                    <option value="assign_lead">Assign to Sales Rep</option>
                    <option value="update_status">Update Lead Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select template</option>
                    <option value="1">Welcome Email</option>
                    <option value="2">Follow Up SMS</option>
                    <option value="3">Promotional Offer</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="mr-2"
                    defaultChecked
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (rule will be executed automatically)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Automation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarketingAutomation;
