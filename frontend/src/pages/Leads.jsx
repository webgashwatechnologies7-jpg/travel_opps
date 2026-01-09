import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, leadSourcesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { X, ChevronDown, Filter, Eye, Mail, MessageSquare, Edit, MoreVertical } from 'lucide-react';

const Leads = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [activeFilter, setActiveFilter] = useState('total'); // 'total', 'new', 'proposal', etc.
  const [openActionMenu, setOpenActionMenu] = useState(null); // Track which row's action menu is open
  const [formData, setFormData] = useState({
    type: 'Client',
    phone: '',
    email: '',
    client_title: 'Mr.',
    client_name: '',
    destination: '',
    travel_month: 'January',
    from_date: '',
    to_date: '',
    adult: '1',
    child: '0',
    infant: '0',
    source: '',
    priority: 'General Query',
    assigned_to: '',
    service: '',
    remark: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchLeadSources();
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsDropdown && !event.target.closest('.relative')) {
        setShowOptionsDropdown(false);
      }
      if (openActionMenu && !event.target.closest('.relative')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsDropdown, openActionMenu]);

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.list();
      setLeads(response.data.data.leads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const response = await leadSourcesAPI.list();
      const sources = response.data.data || response.data || [];
      // Filter only active lead sources
      const activeSources = sources.filter(source => source.status === 'active');
      setLeadSources(activeSources);
    } catch (err) {
      console.error('Failed to fetch lead sources:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.list();
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Map form data to API format
      const apiData = {
        client_name: `${formData.client_title} ${formData.client_name}`.trim(),
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        destination: formData.destination,
        priority: formData.priority === 'General Query' ? 'warm' : formData.priority.toLowerCase(),
        assigned_to: formData.assigned_to || (currentUser ? currentUser.id : null),
      };
      
      await leadsAPI.create(apiData);
      setShowModal(false);
      // Reset form
      setFormData({
        type: 'Client',
        phone: '',
        email: '',
        client_title: 'Mr.',
        client_name: '',
        destination: '',
        travel_month: 'January',
        from_date: '',
        to_date: '',
        adult: '1',
        child: '0',
        infant: '0',
        source: '',
        priority: 'General Query',
        assigned_to: '',
        service: '',
        remark: '',
      });
      fetchLeads();
    } catch (err) {
      alert('Failed to create lead');
      console.error(err);
    }
  };

  const handleAssign = async (leadId, assignedTo) => {
    try {
      await leadsAPI.assign(leadId, parseInt(assignedTo));
      fetchLeads();
    } catch (err) {
      alert('Failed to assign lead');
    }
  };

  const handleStatusChange = async (leadId, status) => {
    try {
      await leadsAPI.updateStatus(leadId, status);
      fetchLeads();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      followup: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      hot: 'bg-red-100 text-red-800',
      warm: 'bg-yellow-100 text-yellow-800',
      cold: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      proposalSent: leads.filter(l => l.status === 'proposal').length,
      noConnect: 0, // Not in current data model
      hotLead: leads.filter(l => l.priority === 'hot').length,
      proposalConfirmed: leads.filter(l => l.status === 'confirmed' && l.priority === 'hot').length,
      cancel: leads.filter(l => l.status === 'cancelled').length,
      followUp: leads.filter(l => l.status === 'followup').length,
      confirmed: leads.filter(l => l.status === 'confirmed').length,
      postponed: 0, // Not in current data model
      invalid: 0, // Not in current data model
    };
    return stats;
  };

  const stats = calculateStats();

  // Filter leads based on active filter
  const getFilteredLeads = () => {
    if (activeFilter === 'total') {
      return leads;
    } else if (activeFilter === 'new') {
      return leads.filter(l => l.status === 'new');
    } else if (activeFilter === 'proposalSent') {
      return leads.filter(l => l.status === 'proposal');
    } else if (activeFilter === 'noConnect') {
      return []; // Not implemented yet
    } else if (activeFilter === 'hotLead') {
      return leads.filter(l => l.priority === 'hot');
    } else if (activeFilter === 'proposalConfirmed') {
      return leads.filter(l => l.status === 'confirmed' && l.priority === 'hot');
    } else if (activeFilter === 'cancel') {
      return leads.filter(l => l.status === 'cancelled');
    } else if (activeFilter === 'followUp') {
      return leads.filter(l => l.status === 'followup');
    } else if (activeFilter === 'confirmed') {
      return leads.filter(l => l.status === 'confirmed');
    } else if (activeFilter === 'postponed') {
      return []; // Not implemented yet
    } else if (activeFilter === 'invalid') {
      return []; // Not implemented yet
    }
    return leads;
  };

  const filteredLeads = getFilteredLeads();

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format ID helper - formats ID as Q-0005, Q-0004, etc.
  const formatLeadId = (id) => {
    if (!id) return 'N/A';
    return `Q-${String(id).padStart(4, '0')}`;
  };

  // Handle CSV Template Download
  const handleDownloadCSVTemplate = async () => {
    try {
      const response = await leadsAPI.importTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lead_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowOptionsDropdown(false);
    } catch (err) {
      alert('Failed to download CSV template');
      console.error(err);
    }
  };

  // Handle CSV Import
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      await leadsAPI.import(importFile);
      alert('Leads imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      setShowOptionsDropdown(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import CSV');
      console.error(err);
    }
  };

  // Handle Export Data
  const handleExportData = async () => {
    try {
      // Convert leads to CSV
      const headers = ['ID', 'Client Name', 'Email', 'Phone', 'Source', 'Destination', 'Status', 'Priority', 'Assigned To', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
          formatLeadId(lead.id),
          `"${lead.client_name || ''}"`,
          `"${lead.email || ''}"`,
          `"${lead.phone || ''}"`,
          `"${lead.source || ''}"`,
          `"${lead.destination || ''}"`,
          `"${lead.status || ''}"`,
          `"${lead.priority || ''}"`,
          lead.assigned_to || '',
          `"${formatDate(lead.created_at)}"`,
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowOptionsDropdown(false);
    } catch (err) {
      alert('Failed to export data');
      console.error(err);
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

  return (
    <Layout>
      <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Queries</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  assigned_to: currentUser?.id || '',
                });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              + Add New
            </button>
            <div className="relative">
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                Options
                <ChevronDown className="h-4 w-4" />
              </button>
              {showOptionsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleDownloadCSVTemplate}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                  >
                    Download CSV Format
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={handleExportData}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                  >
                    Export Data
                  </button>
                </div>
              )}
            </div>
            <button className="bg-white border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50">
              Load Leads
            </button>
            <button className="bg-white border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-11 gap-3 mb-6 overflow-x-auto">
          <div 
            onClick={() => setActiveFilter('total')}
            className={`bg-gray-800 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'total' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs font-medium">TOTAL</div>
          </div>
          <div 
            onClick={() => setActiveFilter('new')}
            className={`bg-blue-200 text-blue-900 px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'new' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.new}</div>
            <div className="text-xs font-medium">NEW</div>
          </div>
          <div 
            onClick={() => setActiveFilter('proposalSent')}
            className={`bg-orange-200 text-orange-900 px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'proposalSent' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.proposalSent}</div>
            <div className="text-xs font-medium">PROPOSAL SENT</div>
          </div>
          <div 
            onClick={() => setActiveFilter('noConnect')}
            className={`bg-blue-600 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'noConnect' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.noConnect}</div>
            <div className="text-xs font-medium">NO CONNECT</div>
          </div>
          <div 
            onClick={() => setActiveFilter('hotLead')}
            className={`bg-red-500 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'hotLead' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.hotLead}</div>
            <div className="text-xs font-medium">HOT LEAD</div>
          </div>
          <div 
            onClick={() => setActiveFilter('proposalConfirmed')}
            className={`bg-purple-500 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'proposalConfirmed' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.proposalConfirmed}</div>
            <div className="text-xs font-medium">PROPOSAL CON..</div>
          </div>
          <div 
            onClick={() => setActiveFilter('cancel')}
            className={`bg-red-700 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'cancel' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.cancel}</div>
            <div className="text-xs font-medium">CANCEL</div>
          </div>
          <div 
            onClick={() => setActiveFilter('followUp')}
            className={`bg-orange-400 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'followUp' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.followUp}</div>
            <div className="text-xs font-medium">FOLLOW UP</div>
          </div>
          <div 
            onClick={() => setActiveFilter('confirmed')}
            className={`bg-green-500 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'confirmed' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-xs font-medium">CONFIRMED</div>
          </div>
          <div 
            onClick={() => setActiveFilter('postponed')}
            className={`bg-black text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'postponed' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.postponed}</div>
            <div className="text-xs font-medium">POSTPONED</div>
          </div>
          <div 
            onClick={() => setActiveFilter('invalid')}
            className={`bg-red-800 text-white px-4 py-3 rounded-lg text-center min-w-[120px] cursor-pointer transition-all hover:opacity-90 ${activeFilter === 'invalid' ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
          >
            <div className="text-2xl font-bold">{stats.invalid}</div>
            <div className="text-xs font-medium">INVALID</div>
          </div>
        </div>

        {/* Queries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const assignedUser = users.find(u => u.id === lead.assigned_to);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <button 
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            {formatLeadId(lead.id)}
                          </button>
                          {lead.priority === 'hot' && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">HOT</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formData.adult || '1'} Adult {formData.child || '0'} Child {formData.infant || '0'} Infant
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(lead.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.client_name}</div>
                        <div className="text-sm text-gray-600">{lead.phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Client</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lead.destination || 'N/A'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">Full package</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <span>📅</span>
                          <span>{lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A'}</span>
                        </div>
                        <div className="text-xs text-gray-500">Till {lead.travel_start_date ? formatDate(lead.travel_start_date) : 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">Package details</div>
                        <div className="text-xs text-gray-500">Price info</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={lead.assigned_to || (currentUser?.id || '')}
                          onChange={(e) => {
                            if (e.target.value && lead.id) {
                              handleAssign(lead.id, e.target.value);
                            }
                          }}
                        >
                          <option value={currentUser?.id || ''}>
                            Assign to me {currentUser ? `(${currentUser.id})` : ''}
                          </option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.id})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(lead.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          value={lead.status}
                          onChange={(e) => {
                            handleStatusChange(lead.id, e.target.value);
                          }}
                        >
                          <option value="new">New</option>
                          <option value="proposal">Proposal</option>
                          <option value="followup">Follow Up</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === lead.id ? null : lead.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors border border-gray-300"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-700" />
                          </button>
                          {openActionMenu === lead.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-md z-50 py-1">
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  navigate(`/leads/${lead.id}`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <Eye className="h-4 w-4 text-gray-500" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  // Handle email action
                                  if (lead.email) {
                                    window.location.href = `mailto:${lead.email}`;
                                  } else {
                                    alert('No email address available');
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>Email</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  // Handle WhatsApp action
                                  if (lead.phone) {
                                    const whatsappUrl = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`;
                                    window.open(whatsappUrl, '_blank');
                                  } else {
                                    alert('No phone number available');
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD QUERY Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">ADD QUERY</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreate}>
                <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                  {/* TYPE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TYPE
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Client">Client</option>
                      <option value="Agent">Agent</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>

                  {/* MOBILE * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MOBILE *
                    </label>
                    <input
                      type="text"
                      placeholder="Phone / Mobile"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* CLIENT NAME * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CLIENT NAME *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.client_title}
                        onChange={(e) => setFormData({ ...formData, client_title: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        required
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* DESTINATION * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DESTINATION *
                    </label>
                    <input
                      type="text"
                      placeholder="Destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* TRAVEL MONTH */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TRAVEL MONTH
                    </label>
                    <select
                      value={formData.travel_month}
                      onChange={(e) => setFormData({ ...formData, travel_month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>

                  {/* FROM DATE * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FROM DATE *
                    </label>
                    <input
                      type="date"
                      value={formData.from_date}
                      onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* TO DATE * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TO DATE *
                    </label>
                    <input
                      type="date"
                      value={formData.to_date}
                      onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* ADULT * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ADULT *
                    </label>
                    <select
                      value={formData.adult}
                      onChange={(e) => setFormData({ ...formData, adult: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CHILD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CHILD
                    </label>
                    <select
                      value={formData.child}
                      onChange={(e) => setFormData({ ...formData, child: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(11)].map((_, i) => (
                        <option key={i} value={String(i)}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INFANT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      INFANT
                    </label>
                    <select
                      value={formData.infant}
                      onChange={(e) => setFormData({ ...formData, infant: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(11)].map((_, i) => (
                        <option key={i} value={String(i)}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* LEAD SOURCE * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LEAD SOURCE *
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Lead Source</option>
                      {leadSources.map((source) => (
                        <option key={source.id} value={source.name}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PRIORITY * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PRIORITY *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="General Query">General Query</option>
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>

                  {/* ASSIGN TO * */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ASSIGN TO *
                    </label>
                    <select
                      value={formData.assigned_to || (currentUser?.id || '')}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={currentUser?.id || ''}>
                        Assign to me {currentUser ? `(${currentUser.id})` : ''}
                      </option>
                      {users.filter(u => u.id !== currentUser?.id).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SERVICE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SERVICE
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Service</option>
                      <option value="Full Package">Full Package</option>
                      <option value="Hotel Only">Hotel Only</option>
                      <option value="Visa Only">Visa Only</option>
                      <option value="Flight Only">Flight Only</option>
                    </select>
                  </div>

                  {/* REMARK - Full Width */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      REMARK
                    </label>
                    <textarea
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter remarks..."
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Assign Lead</h2>
              <p className="mb-4">Assign lead to user ID:</p>
              <input
                type="number"
                placeholder="User ID"
                id="assignUserId"
                className="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const userId = document.getElementById('assignUserId').value;
                    if (userId && selectedLead) handleAssign(selectedLead.id, parseInt(userId));
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Assign
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showStatusModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Update Status</h2>
              <div className="space-y-2">
                {['new', 'proposal', 'followup', 'confirmed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedLead.id, status)}
                    className="w-full text-left px-4 py-2 border rounded-lg hover:bg-gray-100 capitalize"
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Import CSV Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Import CSV</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleImportCSV} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Download CSV format template first to see the required format.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                    }}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Import
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

export default Leads;

