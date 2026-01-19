import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, leadSourcesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import QueryInfoTooltip from '../components/QueryInfoTooltip';
import QueryActionMenu from '../components/QueryActionMenu';
import { 
  X, ChevronDown, Filter, Eye, Mail, MessageSquare, Edit, MoreVertical, 
  Plus, Search, Users, Calendar, MapPin, Phone, AlertTriangle,
  CheckCircle, Clock, FileText, Send, Trash2, UserPlus
} from 'lucide-react';

const EnhancedLeads = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    source: '',
    destination: '',
    priority: 'general',
    assigned_to: '',
    remark: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchLeadSources();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.list({
        status: activeFilter === 'all' ? null : activeFilter,
        search: searchTerm
      });
      setLeads(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const response = await leadSourcesAPI.list();
      setLeadSources(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lead sources:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleActionMenu = (action, lead, data = null) => {
    switch (action) {
      case 'view':
        navigate(`/leads/${lead.id}`);
        break;
      case 'edit':
        navigate(`/leads/${lead.id}/edit`);
        break;
      case 'assign':
        setSelectedLead(lead);
        setShowAssignModal(true);
        break;
      case 'status':
        updateLeadStatus(lead.id, data.id);
        break;
      case 'priority':
        updateLeadPriority(lead.id, data.id);
        break;
      case 'email':
        window.location.href = `mailto:${lead.email}`;
        break;
      case 'whatsapp':
        // Open WhatsApp chat
        navigate(`/leads/${lead.id}?tab=whatsapp`);
        break;
      case 'call':
        window.open(`tel:${lead.phone}`);
        break;
      case 'followup':
        scheduleFollowup(lead.id);
        break;
      case 'proposal':
        navigate(`/proposals/create?lead_id=${lead.id}`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${lead.client_name}?`)) {
          deleteLead(lead.id);
        }
        break;
    }
    setOpenActionMenu(null);
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      await leadsAPI.updateStatus(leadId, { status });
      fetchLeads(); // Refresh list
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const updateLeadPriority = async (leadId, priority) => {
    try {
      await leadsAPI.update(leadId, { priority });
      fetchLeads(); // Refresh list
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const deleteLead = async (leadId) => {
    try {
      await leadsAPI.delete(leadId);
      fetchLeads(); // Refresh list
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const scheduleFollowup = (leadId) => {
    const followupData = {
      lead_id: leadId,
      followup_date: new Date().toISOString().split('T')[0],
      notes: 'Followup scheduled',
      type: 'call'
    };
    
    // This would call your followup API
    console.log('Scheduling followup:', followupData);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      followup: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      hot: 'bg-red-100 text-red-800',
      warm: 'bg-orange-100 text-orange-800',
      cold: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getSourceColor = (source) => {
    const colors = {
      facebook: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      website: 'bg-purple-100 text-purple-800',
      email: 'bg-indigo-100 text-indigo-800',
      referral: 'bg-cyan-100 text-cyan-800',
      walkin: 'bg-orange-100 text-orange-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesFilter = activeFilter === 'all' || lead.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleActionMenuClick = (event, lead) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    setActionMenuPosition({
      top: rect.bottom,
      left: rect.right
    });
    setOpenActionMenu(lead.id);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
                <p className="text-gray-600 mt-1">Manage and track all your leads</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filters */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span>Filters</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-2">
                        {['all', 'new', 'proposal', 'followup', 'confirmed', 'cancelled'].map(filter => (
                          <button
                            key={filter}
                            onClick={() => {
                              setActiveFilter(filter);
                              setShowFilters(false);
                            }}
                            className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${
                              activeFilter === filter ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Create Lead Button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Lead</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
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
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QueryInfoTooltip lead={lead} field={null}>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {lead.client_name?.charAt(0) || 'L'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{lead.client_name}</div>
                                <div className="text-sm text-gray-500">ID: {lead.id}</div>
                              </div>
                            </div>
                          </QueryInfoTooltip>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {lead.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <QueryInfoTooltip lead={lead} field={null}>
                                  <span className="text-blue-600 hover:text-blue-800">{lead.email}</span>
                                </QueryInfoTooltip>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <QueryInfoTooltip lead={lead} field={null}>
                                  <span className="text-blue-600 hover:text-blue-800">{lead.phone}</span>
                                </QueryInfoTooltip>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QueryInfoTooltip lead={lead} field={null}>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                              {lead.status}
                            </span>
                          </QueryInfoTooltip>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QueryInfoTooltip lead={lead} field={null}>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(lead.priority)}`}>
                              {lead.priority === 'hot' && '🔥 '}
                              {lead.priority}
                            </span>
                          </QueryInfoTooltip>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QueryInfoTooltip lead={lead} field={null}>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSourceColor(lead.source)}`}>
                              {lead.source}
                            </span>
                          </QueryInfoTooltip>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {lead.assigned_to_name || 'Unassigned'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onClick={(e) => handleActionMenuClick(e, lead)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openActionMenu === lead.id && (
                              <QueryActionMenu
                                lead={lead}
                                isVisible={true}
                                onAction={handleAction}
                                onClose={() => setOpenActionMenu(null)}
                                position={actionMenuPosition}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedLeads;
