import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leadsAPI, leadSourcesAPI, usersAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { X, ChevronDown, Filter, Eye, Mail, MessageSquare, Edit, MoreVertical, History, Plus } from 'lucide-react';
import LeadCard from '../components/Quiries/LeadCard';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const getCurrentMonth = () => MONTHS[new Date().getMonth()];
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getDefaultFormData = () => ({
  type: 'Client',
  phone: '',
  email: '',
  client_title: '',
  client_name: '',
  destination: '',
  travel_month: getCurrentMonth(),
  from_date: getTodayDate(),
  to_date: getTodayDate(),
  adult: '1',
  child: '0',
  infant: '0',
  source: '',
  priority: 'General Query',
  assigned_to: '',
  service: '',
  remark: '',
});

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
  const [destinationFilter, setDestinationFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [assignedNameFilter, setAssignedNameFilter] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState(null); // Track which row's action menu is open
  const [formData, setFormData] = useState(getDefaultFormData);
  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
  const canAssign = userRoles.some(r => ['Admin', 'Company Admin', 'Super Admin', 'Manager', 'Team Leader'].includes(r));
  const isEmployee = userRoles.some(r => ['Employee', 'Sales Rep'].includes(r));

  useEffect(() => {
    fetchLeadSources();
    fetchUsers();
    fetchLeads();
  }, []);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const assignedName = params.get('assigned_name');
    if (assignedName) {
      setAssignedNameFilter(assignedName);
      const normalized = assignedName.toLowerCase().trim();
      const matchedUser = users.find((u) => {
        const name = (u.name || '').toLowerCase().trim();
        return name && name === normalized;
      });
      if (matchedUser?.id) {
        setAssignedToFilter(String(matchedUser.id));
        setActiveFilter('assigned_to');
        fetchLeads({ assigned_to: matchedUser.id });
      } else {
        setActiveFilter('assigned_name');
        fetchLeads();
      }
      return;
    }
    const assignedTo = params.get('assigned_to');
    if (assignedTo) {
      setAssignedToFilter(assignedTo);
      setActiveFilter('assigned_to');
      fetchLeads({ assigned_to: assignedTo });
      return;
    }
    const destination = params.get('destination');
    if (destination) {
      setDestinationFilter(destination);
      setActiveFilter('destination');
      fetchLeads({ destination });
      return;
    }
    if (params.get('today') === '1') {
      setActiveFilter('today');
      fetchLeads();
      return;
    }
    const range = params.get('range');
    if (range === 'week') {
      setActiveFilter('weekly');
      fetchLeads();
      return;
    }
    if (range === 'month') {
      setActiveFilter('monthly');
      fetchLeads();
      return;
    }
    if (range === 'year') {
      setActiveFilter('yearly');
      fetchLeads();
      return;
    }
    const status = params.get('status');
    if (status === 'new') {
      setActiveFilter('new');
      fetchLeads({ status: 'new' });
      return;
    }
    if (status === 'proposal') {
      setActiveFilter('pending');
      fetchLeads({ status: 'proposal' });
      return;
    }
    if (status === 'cancelled') {
      setActiveFilter('closed');
      fetchLeads({ status: 'cancelled' });
      return;
    }
    const priority = params.get('priority');
    if (priority === 'hot') {
      setActiveFilter('hot');
      fetchLeads({ priority: 'hot' });
      return;
    }
    setDestinationFilter('');
    setAssignedToFilter('');
    setAssignedNameFilter('');
    fetchLeads();
  }, [location.search, users]);

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

  const fetchLeads = async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      const params = { ...filters, per_page: 20, page };
      const response = await leadsAPI.list(params);

      // Handle different response structures
      let leadsData = [];
      let paginationData = null;
      if (response.data?.data?.leads) {
        // Standard paginated response: { success: true, data: { leads: [...], pagination: {...} } }
        leadsData = response.data.data.leads;
        paginationData = response.data.data.pagination;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Direct array response: { success: true, data: [...] }
        leadsData = response.data.data;
      } else if (response.data?.leads) {
        // Alternative structure: { success: true, leads: [...] }
        leadsData = response.data.leads;
      } else if (Array.isArray(response.data)) {
        // Direct array: [...]
        leadsData = response.data;
      }

      setLeads(leadsData);
      if (paginationData) {
        setPagination(paginationData);
      }
      setCurrentPage(page);
    } catch {
      setLeads([]);
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
      // Map form data to API format (travel_start_date, travel_end_date so Query detail shows From/To Date & Travel Month)
      const apiData = {
        client_name: `${formData.client_title} ${formData.client_name}`.trim(),
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        destination: formData.destination,
        priority: formData.priority === 'General Query' ? 'warm' : formData.priority.toLowerCase(),
        assigned_to: formData.assigned_to || (currentUser ? currentUser.id : null),
        travel_start_date: formData.from_date || null,
        travel_end_date: formData.to_date || null,
        adult: formData.adult ? parseInt(formData.adult, 10) : 1,
        child: formData.child ? parseInt(formData.child, 10) : 0,
        infant: formData.infant ? parseInt(formData.infant, 10) : 0,
        remark: formData.remark || null,
      };

      await leadsAPI.create(apiData);
      setShowModal(false);
      setFormData(getDefaultFormData());
      fetchLeads();
      toast.success('Lead created successfully');
    } catch (err) {
      toast.error('Failed to create lead');
      console.error(err);
    }
  };

  const handleAssign = async (leadId, assignedTo) => {
    try {
      await leadsAPI.assign(leadId, parseInt(assignedTo));
      fetchLeads();
      setShowAssignModal(false);
      setSelectedLead(null);
      toast.success('Lead assigned successfully');
    } catch (err) {
      toast.error('Failed to assign lead');
    }
  };

  const handleOpenAssignModal = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setSelectedLead(lead);
    setShowAssignModal(true);
  };

  const handleStatusChange = async (leadId, status) => {
    try {
      // Only send allowed backend statuses
      const allowedStatuses = ['proposal', 'followup', 'confirmed', 'cancelled'];
      const normalizedStatus = status?.toLowerCase();
      const finalStatus = allowedStatuses.includes(normalizedStatus) ? normalizedStatus : 'proposal';

      await leadsAPI.updateStatus(leadId, finalStatus);
      fetchLeads();
      setShowStatusModal(false);
      setSelectedLead(null);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleOpenStatusModal = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setSelectedLead(lead);
    setShowStatusModal(true);
  };

  const handleDelete = async (leadId) => {
    try {
      await leadsAPI.delete(leadId);
      fetchLeads();
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error('Failed to delete lead');
      console.error(err);
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
    const today = new Date();
    const isSameDay = (date) => {
      const d = new Date(date);
      return d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate();
    };
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const inRange = (date, start) => {
      const d = new Date(date);
      return d >= start;
    };
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
      today: leads.filter(l => l.created_at && isSameDay(l.created_at)).length,
      weekly: leads.filter(l => l.created_at && inRange(l.created_at, startOfWeek)).length,
      monthly: leads.filter(l => l.created_at && inRange(l.created_at, startOfMonth)).length,
      yearly: leads.filter(l => l.created_at && inRange(l.created_at, startOfYear)).length,
      postponed: 0, // Not in current data model
      invalid: 0, // Not in current data model
    };
    return stats;
  };

  const stats = calculateStats();

  // Filter leads based on active filter
  const getFilteredLeads = () => {
    if (activeFilter === 'assigned_name') {
      const target = (assignedNameFilter || '').toLowerCase().trim();
      if (!target) return leads;
      return leads.filter((lead) => {
        const assignedName =
          lead.assigned_to?.name ||
          lead.assigned_to_name ||
          lead.assigned_user_name ||
          '';
        const nameValue = assignedName.toLowerCase().trim();
        return nameValue === target || nameValue.includes(target);
      });
    }
    if (activeFilter === 'assigned_to') {
      const target = Number(assignedToFilter);
      if (!Number.isFinite(target)) return leads;
      return leads.filter((lead) => {
        const assigned = lead.assigned_to?.id ?? lead.assigned_to_id ?? lead.assigned_to;
        return Number(assigned) === target;
      });
    }
    if (activeFilter === 'destination') {
      const target = (destinationFilter || '').toLowerCase().trim();
      if (!target) return leads;
      return leads.filter((lead) => {
        const value = (lead.destination || '').toLowerCase().trim();
        return value === target || value.includes(target);
      });
    }
    if (activeFilter === 'total') {
      return leads;
    } else if (activeFilter === 'today') {
      const today = new Date();
      return leads.filter(l => {
        if (!l.created_at) return false;
        const d = new Date(l.created_at);
        return d.getFullYear() === today.getFullYear()
          && d.getMonth() === today.getMonth()
          && d.getDate() === today.getDate();
      });
    } else if (activeFilter === 'weekly') {
      const today = new Date();
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return leads.filter(l => l.created_at && new Date(l.created_at) >= startOfWeek);
    } else if (activeFilter === 'monthly') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return leads.filter(l => l.created_at && new Date(l.created_at) >= startOfMonth);
    } else if (activeFilter === 'yearly') {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return leads.filter(l => l.created_at && new Date(l.created_at) >= startOfYear);
    } else if (activeFilter === 'pending') {
      return leads.filter(l => l.status === 'proposal');
    } else if (activeFilter === 'closed') {
      return leads.filter(l => l.status === 'cancelled');
    } else if (activeFilter === 'hot') {
      return leads.filter(l => l.priority === 'hot');
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
      toast.error('Failed to download CSV template');
      console.error(err);
    }
  };

  // Handle CSV Import
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.warning('Please select a CSV file');
      return;
    }

    try {
      await leadsAPI.import(importFile);
      toast.success('Leads imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      setShowOptionsDropdown(false);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
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
      toast.error('Failed to export data');
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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Queries</h1>
          <button
            type="button"
            onClick={() => { setFormData(getDefaultFormData()); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            Add Query
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={destinationFilter}
                onChange={(e) => {
                  setDestinationFilter(e.target.value);
                  setActiveFilter(e.target.value ? 'destination' : 'total');
                }}
                placeholder="Search by destination"
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="total">All Queries ({stats.total})</option>
              <option value="today">Today ({stats.today})</option>
              <option value="new">New ({stats.new})</option>
              <option value="proposalSent">Proposal Sent ({stats.proposalSent})</option>
              <option value="noConnect">No Connect ({stats.noConnect})</option>
              <option value="hotLead">Hot Lead ({stats.hotLead})</option>
              <option value="proposalConfirmed">Proposal Conn. ({stats.proposalConfirmed})</option>
              <option value="cancel">Cancel ({stats.cancel})</option>
              <option value="followUp">Follow ups ({stats.followUp})</option>
              <option value="confirmed">Confirmed ({stats.confirmed})</option>
              <option value="postponed">Postponed ({stats.postponed})</option>
              <option value="invalid">Invalid ({stats.invalid})</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <History size={16} />
              Refresh
            </button>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-2">No leads found</p>
            <p className="text-gray-400 text-sm">Click "+ Add New" to create your first lead</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLeads.map((lead) => {
                // Get assigned user name from various possible fields
                // Backend returns assignedUser relationship or assigned_user object
                const assignedUserName =
                  lead.assignedUser?.name ||
                  lead.assigned_user?.name ||
                  lead.assigned_to?.name ||
                  lead.assigned_to_name ||
                  lead.assigned_user_name ||
                  null;

                return (
                  <LeadCard
                    id={lead.id}
                    key={lead.id}
                    name={lead.client_name}
                    phone={lead.phone || "N/A"}
                    email={lead.email}
                    tag={
                      lead.status === "confirmed"
                        ? "Confirmed"
                        : lead.status === "new"
                          ? "New"
                          : ""
                    }
                    location={lead.destination || "N/A"}
                    date={formatDate(lead.created_at)}
                    amount={lead.amount || 0}
                    status={lead.status}
                    assignedTo={lead.assignedUser || lead.assigned_user || lead.assigned_to}
                    assignedUserName={assignedUserName}
                    onAssign={canAssign ? handleOpenAssignModal : null}
                    onStatusChange={handleOpenStatusModal}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6 bg-white rounded-lg shadow px-4 py-3">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{((currentPage - 1) * pagination.per_page) + 1}</span>–<span className="font-semibold">{Math.min(currentPage * pagination.per_page, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> leads
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { fetchLeads({}, currentPage - 1); }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let page;
                    if (pagination.last_page <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= pagination.last_page - 2) {
                      page = pagination.last_page - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => fetchLeads({}, page)}
                        className={`px-3 py-1.5 text-sm border rounded-md ${page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { fetchLeads({}, currentPage + 1); }}
                    disabled={currentPage === pagination.last_page}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

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
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
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
                        <option value="">Title</option>
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

                  {/* FROM DATE * - only current date and future */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FROM DATE *
                    </label>
                    <input
                      type="date"
                      value={formData.from_date}
                      onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* TO DATE * - only current date and future, and not before FROM DATE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TO DATE *
                    </label>
                    <input
                      type="date"
                      value={formData.to_date}
                      onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                      min={formData.from_date || new Date().toISOString().split('T')[0]}
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
                  {!userRoles.some(r => ['Employee', 'Sales Rep'].includes(r)) && (
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
                  )}

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
              <p className="mb-4">Assign lead to:</p>
              <select
                id="assignUserId"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                defaultValue={currentUser?.id || ''}
              >
                <option value={currentUser?.id || ''}>
                  {currentUser?.name || 'Select User'}
                </option>
                {users.filter(u => u.id !== currentUser?.id).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const userId = document.getElementById('assignUserId').value;
                    if (userId && selectedLead) {
                      handleAssign(selectedLead.id, parseInt(userId));
                    } else {
                      toast.warning('Please select a user');
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedLead(null);
                  }}
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
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedLead(null);
                }}
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

