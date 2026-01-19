import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { 
  Mail,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  Download
} from 'lucide-react';

const EmailCampaigns = () => {
  const { error, loading, setError, handleError, clearError, executeWithErrorHandling } = useErrorHandler();
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    template_id: '',
    lead_ids: [],
    send_immediately: false,
    scheduled_at: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await executeWithErrorHandling(async () => {
      const [campaignsResponse, templatesResponse, leadsResponse] = await Promise.all([
        fetch('/api/marketing/email-campaigns'),
        fetch('/api/marketing/templates'),
        fetch('/api/leads?per_page=50&page=1')
      ]);

      const campaignsData = await campaignsResponse.json();
      const templatesData = await templatesResponse.json();
      const leadsData = await leadsResponse.json();

      if (!campaignsData.success) throw new Error(campaignsData.message || 'Failed to fetch campaigns');
      if (!templatesData.success) throw new Error(templatesData.message || 'Failed to fetch templates');
      if (!leadsData.success) throw new Error(leadsData.message || 'Failed to fetch leads');

      setCampaigns(campaignsData.data?.data || []);
      setTemplates(templatesData.data || []);
      setLeads(leadsData.data?.data || []);
    }, 'Data loaded successfully');
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/marketing/email-campaigns');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.data.data || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load email campaigns');
      // Fallback to mock data for demonstration
      const mockCampaigns = [
        {
          id: 1,
          name: 'Welcome Series 2024',
          subject: 'Welcome to Our Travel Services',
          template_id: 1,
          status: 'sent',
          sent_count: 156,
          open_rate: 68.5,
          click_rate: 12.3,
          created_at: '2024-01-15',
          created_by: 'John Doe',
          leads: ['John Smith', 'Jane Doe', 'Mike Johnson']
        },
        {
          id: 2,
          name: 'Summer Promotion',
          subject: 'Summer Travel Deals - Up to 30% Off',
          template_id: 2,
          status: 'active',
          sent_count: 89,
          open_rate: 45.2,
          click_rate: 8.7,
          created_at: '2024-01-10',
          created_by: 'Jane Smith',
          leads: ['Alice Brown', 'Bob Wilson', 'Charlie Davis']
        },
        {
          id: 3,
          name: 'Monthly Newsletter',
          subject: 'Travel Tips & Destinations',
          template_id: 3,
          status: 'scheduled',
          sent_count: 0,
          open_rate: 0,
          click_rate: 0,
          scheduled_at: '2024-02-01',
          created_by: 'Mike Johnson',
          leads: ['David Lee', 'Emma Wilson', 'Frank Brown']
        }
      ];
      setCampaigns(mockCampaigns);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/marketing/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data || []);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load templates');
      // Fallback to mock data
      const mockTemplates = [
        {
          id: 1,
          name: 'Welcome Email',
          subject: 'Welcome to Our Travel Services'
        },
        {
          id: 2,
          name: 'Promotional Email',
          subject: 'Special Discount - 20% Off'
        },
        {
          id: 3,
          name: 'Newsletter Template',
          subject: 'Monthly Travel Newsletter'
        }
      ];
      setTemplates(mockTemplates);
    }
  };

  const fetchLeads = async () => {
    try {
      // Implement pagination for large datasets
      const response = await fetch('/api/leads?per_page=50&page=1');
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data.data || []);
      } else {
        console.error('Failed to fetch leads');
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      // Fallback to mock data
      const mockLeads = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1234567890',
          status: 'active'
        },
        {
          id: 2,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '+1234567891',
          status: 'active'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+1234567892',
          status: 'inactive'
        },
        {
          id: 4,
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+1234567893',
          status: 'active'
        },
        {
          id: 5,
          name: 'Tom Brown',
          email: 'tom.brown@example.com',
          phone: '+1234567894',
          status: 'active'
        }
      ];
      setLeads(mockLeads);
    }
  };

  const handleCreate = () => {
    setSelectedCampaign(null);
    setFormData({
      name: '',
      subject: '',
      template_id: '',
      lead_ids: [],
      send_immediately: false,
      scheduled_at: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      template_id: campaign.template_id,
      lead_ids: campaign.lead_ids || [],
      send_immediately: campaign.status === 'sent',
      scheduled_at: campaign.scheduled_at || ''
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await fetch(`/api/marketing/email-campaigns${selectedCampaign?.id ? `/${selectedCampaign.id}` : ''}`, {
        method: selectedCampaign ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save campaign');
      }
      
      return data;
    }, selectedCampaign ? 'Campaign updated successfully' : 'Campaign created successfully');

    if (result.success) {
      let campaignId = selectedCampaign?.id || result.data?.id || Date.now();
      
      // Update local state
      if (selectedCampaign) {
        setCampaigns(campaigns.map(c => 
          c.id === selectedCampaign.id ? { ...c, ...formData } : c
        ));
      } else {
        setCampaigns([...campaigns, { ...formData, id: campaignId }]);
      }
      
      // If send_immediately is true, send the campaign
      if (formData.send_immediately && campaignId) {
        await handleSendCampaign(campaignId);
      }
      
      setShowCreateModal(false);
      setSelectedCampaign(null);
      setFormData({
        name: '',
        subject: '',
        template_id: '',
        lead_ids: [],
        send_immediately: false,
        scheduled_at: ''
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const result = await executeWithErrorHandling(async () => {
        const response = await fetch(`/api/marketing/email-campaigns/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to delete campaign');
        }
        
        return data;
      }, 'Campaign deleted successfully');

      if (result.success) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    }
  };

  const handleSendCampaign = async (id) => {
    await executeWithErrorHandling(async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/send`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to send campaign');
      }
      
      return data;
    }, 'Campaign sending started');

    // Update local state
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: 'sending' } : c
    ));
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
                <p className="text-gray-600 mt-1">Create and manage your email campaigns</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Campaigns Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Email Campaigns</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Click Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-xs text-gray-500">{campaign.subject}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {templates.find(t => t.id === campaign.template_id)?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{campaign.lead_ids?.length || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{campaign.sent_count}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{campaign.open_rate}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{campaign.click_rate}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(campaign.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{campaign.created_by}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEdit(campaign)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {campaign.status === 'scheduled' && (
                              <button 
                                onClick={() => handleSendCampaign(campaign.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Send Now"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600" title="More">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No email campaigns found</p>
                        <p className="text-sm text-gray-500 mt-2">Create your first campaign to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create Email Campaign</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCampaign(null);
                  setFormData({
                    name: '',
                    subject: '',
                    template_id: '',
                    lead_ids: [],
                    send_immediately: false,
                    scheduled_at: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template
                  </label>
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData({...formData, template_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Leads
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {leads.map(lead => (
                      <div key={lead.id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value={formData.lead_ids?.includes(lead.id)}
                          onChange={(e) => {
                            const leadIds = formData.lead_ids || [];
                            if (e.target.checked) {
                              setFormData({...formData, lead_ids: [...leadIds, lead.id]});
                            } else {
                              setFormData({...formData, lead_ids: leadIds.filter(id => id !== lead.id)});
                            }
                          }}
                          className="mr-2"
                        />
                        <label className="flex-1">
                          <span className="text-sm text-gray-900">{lead.name}</span>
                          <span className="text-xs text-gray-500">{lead.email}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="schedule"
                        value="now"
                        checked={!formData.scheduled_at}
                        onChange={(e) => setFormData({...formData, send_immediately: true, scheduled_at: ''})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Send Now</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="schedule"
                        value="later"
                        checked={!!formData.scheduled_at}
                        onChange={(e) => setFormData({...formData, send_immediately: false, scheduled_at: new Date().toISOString().slice(0, 16)})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Schedule Later</span>
                    </label>
                  </div>
                  {formData.scheduled_at && (
                    <input
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCampaign(null);
                    setFormData({
                      name: '',
                      subject: '',
                      template_id: '',
                      lead_ids: [],
                      send_immediately: false,
                      scheduled_at: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmailCampaigns;
