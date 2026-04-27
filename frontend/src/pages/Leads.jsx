import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leadsAPI, leadSourcesAPI, usersAPI, googleSheetsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
// Layout removed - handled by nested routing
import { X, Search, Upload, Download, RefreshCw, ChevronDown, Filter, Eye, Mail, MessageSquare, Edit, MoreVertical, History, Plus, TrendingUp, BarChart3, Calendar, FileSpreadsheet, LayoutGrid, List, User, Trash2, ArrowUpDown, Lock, Loader2 } from 'lucide-react';
import LeadCard from '../components/Quiries/LeadCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import LogoLoader from '../components/LogoLoader';

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
  date_of_birth: '',
  marriage_anniversary: '',
});

const Leads = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [activeFilter, setActiveFilter] = useState('total'); // 'total', 'new', 'proposal', etc.
  const [destinationFilter, setDestinationFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [assignedNameFilter, setAssignedNameFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({
    from_date: '',
    to_date: '',
    travel_month: '',
    source: '',
    service: '',
    adult: '',
    description: '',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('month');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(null); // Track which row's action menu is open
  const [formData, setFormData] = useState(getDefaultFormData);
  // Pagination state
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: localStorage.getItem('leads_per_page') ? parseInt(localStorage.getItem('leads_per_page')) : 8,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(localStorage.getItem('leads_per_page') ? parseInt(localStorage.getItem('leads_per_page')) : 8);
  const [viewType, setViewType] = useState(() => localStorage.getItem('leads_view_type') || 'grid');

  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [backendStats, setBackendStats] = useState(null);

  const fetchLeadSources = useCallback(async () => {
    try {
      const response = await leadSourcesAPI.list();
      if (response.data?.success) {
        setLeadSources(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch lead sources:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.list();
      if (response.data?.success) {
        setUsers(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showModal || showAssignModal || showStatusModal || showImportModal || showGoogleSheetModal || isBulkAssignModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showAssignModal, showStatusModal, showImportModal, showGoogleSheetModal, isBulkAssignModalOpen]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectLead = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads?`)) return;
    try {
      await leadsAPI.bulkDelete(selectedLeadIds);
      toast.success(`${selectedLeadIds.length} leads deleted successfully`);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err) {
      toast.error('Failed to delete leads');
    }
  };

  const handleBulkAssign = async (userId) => {
    try {
      await leadsAPI.bulkAssign(selectedLeadIds, parseInt(userId));
      toast.success(`${selectedLeadIds.length} leads assigned successfully`);
      setSelectedLeadIds([]);
      setIsBulkAssignModalOpen(false);
      fetchLeads();
    } catch (err) {
      toast.error('Failed to assign leads');
    }
  };

  const userRoles = currentUser?.roles?.map(r => typeof r === 'string' ? r : r.name) || [];
  const canAssign = userRoles.some(r => ['Admin', 'Company Admin', 'Super Admin', 'Manager', 'Team Leader'].includes(r));
  const isEmployee = userRoles.some(r => ['Employee', 'Sales Rep'].includes(r));

  useEffect(() => {
    fetchLeadSources();
    fetchUsers();
  }, [fetchLeadSources, fetchUsers]);

  //Consolidated Fetch logic: URL is the source of truth
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(location.search);
      const filter = params.get('filter') || 'total';
      const dest = params.get('destination') || '';
      const page = parseInt(params.get('page') || '1');
      const assigned_to = params.get('assigned_to') || '';

      let apiParams = {
        page,
        per_page: perPage,
        destination: dest,
        assigned_to: assigned_to,
        ...advancedFilters
      };

      // Map filter key to API parameters
      if (filter === 'new') apiParams.status = 'new';
      else if (filter === 'proposalSent') apiParams.status = 'proposal';
      else if (filter === 'followUp') apiParams.status = 'followup';
      else if (filter === 'confirmed') apiParams.status = 'confirmed';
      else if (filter === 'cancel') apiParams.status = 'cancelled';
      else if (filter === 'processing') apiParams.status = 'processing';
      else if (filter === 'hotLead') apiParams.priority = 'hot';
      else if (filter === 'assignedToMe') apiParams.assigned_to = currentUser?.id;
      else if (filter === 'unassigned') apiParams.unassigned = 1;
      else if (filter === 'today') apiParams.today = 1;

      // Smart Status Translation (for Search bar if used)
      const lowerQuery = dest.toLowerCase().trim();
      if (lowerQuery === 'booked') { apiParams.status = 'confirmed'; apiParams.destination = ''; }
      else if (lowerQuery === 'proposal sent') { apiParams.status = 'proposal'; apiParams.destination = ''; }
      else if (lowerQuery === 'under process') { apiParams.status = 'processing'; apiParams.destination = ''; }

      const response = await leadsAPI.list(apiParams);
      if (response.data?.success) {
        setLeads(response.data.data.leads || []);
        setPagination(response.data.data.pagination || pagination);
        setBackendStats(response.data.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [location.search, perPage, advancedFilters, currentUser?.id]);

  // Trigger fetch whenever URL search changes
  useEffect(() => {
    fetchLeads();
    // Update local state to match URL for UI consistency
    const params = new URLSearchParams(location.search);
    setActiveFilter(params.get('filter') || 'total');
    setDestinationFilter(params.get('destination') || '');
    setAssignedToFilter(params.get('assigned_to') || '');
    setCurrentPage(parseInt(params.get('page') || '1'));
  }, [location.search, fetchLeads]);

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics, analyticsTimeframe, location.search]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params = new URLSearchParams(location.search);
      const filter = params.get('filter') || 'total';
      
      let analyticsParams = {
        timeframe: analyticsTimeframe,
        destination: destinationFilter,
        assigned_to: assignedToFilter,
        ...advancedFilters
      };

      if (filter === 'new') analyticsParams.status = 'new';
      else if (filter === 'proposalSent') analyticsParams.status = 'proposal';
      else if (filter === 'followUp') analyticsParams.status = 'followup';
      else if (filter === 'confirmed') analyticsParams.status = 'confirmed';
      else if (filter === 'cancel') analyticsParams.status = 'cancelled';
      else if (filter === 'processing') analyticsParams.status = 'processing';
      else if (filter === 'hotLead') analyticsParams.priority = 'hot';
      else if (filter === 'assignedToMe') analyticsParams.assigned_to = currentUser?.id;
      else if (filter === 'unassigned') analyticsParams.unassigned = 1;
      else if (filter === 'today') analyticsParams.today = 1;

      const response = await leadsAPI.analytics(analyticsParams);
      if (response.data?.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Helper to change filters via URL
  const handleFilterChange = (filterId) => {
    const params = new URLSearchParams(location.search);
    if (filterId === 'total') params.delete('filter');
    else params.set('filter', filterId);
    params.delete('page'); // Reset to page 1 on filter change
    navigate({ search: params.toString() }, { replace: true });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    if (newPage === 1) params.delete('page');
    else params.set('page', newPage);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handlePerPageChange = (e) => {
    const val = parseInt(e.target.value);
    setPerPage(val);
    localStorage.setItem('leads_per_page', val);
    const params = new URLSearchParams(location.search);
    params.set('page', 1);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleSearch = () => {
    const params = new URLSearchParams(location.search);
    if (destinationFilter) params.set('destination', destinationFilter);
    else params.delete('destination');
    params.delete('page');
    navigate({ search: params.toString() }, { replace: true });
  };

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

  useEffect(() => {
    localStorage.setItem('leads_view_type', viewType);
  }, [viewType]);


  const handleCreate = useCallback(async (e) => {
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
        service: formData.service || null,
        date_of_birth: formData.date_of_birth || null,
        marriage_anniversary: formData.marriage_anniversary || null,
      };

      const response = await leadsAPI.create(apiData);

      // Fix: Clear any old localStorage proposals if this ID was previously used
      const newLead = response?.data?.data?.lead || response?.data?.lead;
      if (newLead?.id) {
        localStorage.removeItem(`lead_${newLead.id}_proposals`);
      }

      setShowModal(false);
      setFormData(getDefaultFormData());
      fetchLeads();
      toast.success('Lead created successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create lead';
      toast.error(errorMessage);
      console.error(err);
    }
  }, [formData, currentUser, fetchLeads]);

  const handleAssign = useCallback(async (leadId, assignedTo) => {
    try {
      await leadsAPI.assign(leadId, parseInt(assignedTo));
      fetchLeads();
      setShowAssignModal(false);
      setSelectedLead(null);
      toast.success('Lead assigned successfully');
    } catch (err) {
      toast.error('Failed to assign lead');
    }
  }, [fetchLeads]);

  const handleOpenAssignModal = useCallback((leadId) => {
    const lead = leads.find(l => l.id === leadId);
    setSelectedLead(lead);
    setShowAssignModal(true);
  }, [leads]);

  const handleStatusChange = useCallback(async (leadId, status) => {
    try {
      // Only send allowed backend statuses
      const allowedStatuses = ['processing', 'proposal', 'followup', 'confirmed', 'cancelled'];
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
  }, [fetchLeads]);

  const handleOpenStatusModal = useCallback((leadId) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead?.status === 'confirmed') return;
    setSelectedLead(lead);
    setShowStatusModal(true);
  }, [leads]);

  const handleDelete = useCallback(async (leadId) => {
    try {
      await leadsAPI.delete(leadId);

      // Fix: Clean up localStorage when a lead is deleted
      localStorage.removeItem(`lead_${leadId}_proposals`);

      fetchLeads();
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error('Failed to delete lead');
      console.error(err);
    }
  }, [fetchLeads]);

  const getStatusColor = useCallback((status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      followup: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const getPriorityColor = useCallback((priority) => {
    const colors = {
      hot: 'bg-red-100 text-red-800',
      warm: 'bg-yellow-100 text-yellow-800',
      cold: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  }, []);

  // Calculate summary statistics â€” memoized to avoid recalculation on unrelated renders
  const stats = useMemo(() => {
    if (backendStats) return backendStats;
    
    // Fallback to page-wise only if backend stats haven't arrived yet
    const today = new Date();
    const isSameDay = (date) => {
      const d = new Date(date);
      return d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate();
    };
    return {
      total: pagination.total,
      new: leads.filter(l => l.status === 'new').length,
      processing: leads.filter(l => l.status === 'processing').length,
      proposalSent: leads.filter(l => l.status === 'proposal').length,
      noConnect: 0,
      hotLead: leads.filter(l => l.priority === 'hot').length,
      cancel: leads.filter(l => l.status === 'cancelled').length,
      followUp: leads.filter(l => l.status === 'followup').length,
      confirmed: leads.filter(l => l.status === 'confirmed').length,
      today: leads.filter(l => l.created_at && isSameDay(l.created_at)).length,
      unassigned: leads.filter(l => !l.assigned_to).length,
      assignedToMe: leads.filter(l => {
        const id = l.assigned_to?.id ?? l.assigned_to_id ?? l.assigned_to;
        return Number(id) === currentUser?.id;
      }).length,
    };
  }, [leads, backendStats, pagination.total, currentUser?.id]);

  // Filter leads based on active filter â€” memoized so it only recalculates when leads or filter changes
  const filteredLeads = useMemo(() => {
    let result = [];
    if (activeFilter === 'assigned_name') {
      const target = (assignedNameFilter || '').toLowerCase().trim();
      if (!target) {
        result = leads;
      } else {
        result = leads.filter((lead) => {
          const assignedName =
            lead.assigned_to?.name ||
            lead.assigned_to_name ||
            lead.assigned_user_name ||
            '';
          const nameValue = assignedName.toLowerCase().trim();
          return nameValue === target || nameValue.includes(target);
        });
      }
    }
    else if (activeFilter === 'assigned_to') {
      const target = Number(assignedToFilter);
      if (!Number.isFinite(target)) {
        result = leads;
      } else {
        result = leads.filter((lead) => {
          const assigned = lead.assigned_to?.id ?? lead.assigned_to_id ?? lead.assigned_to;
          return Number(assigned) === target;
        });
      }
    }
    else if (activeFilter === 'destination') {
      const target = (destinationFilter || '').toLowerCase().trim();
      if (!target) {
        result = leads;
      } else {
        result = leads.filter((lead) => {
          const value = (lead.destination || '').toLowerCase().trim();
          const assignedName = (lead.assigned_to?.name || lead.assigned_user?.name || '').toLowerCase().trim();
          return value.includes(target) || assignedName.includes(target);
        });
      }
    }
    else if (activeFilter === 'total') {
      result = leads;
    } else if (activeFilter === 'today') {
      const today = new Date();
      result = leads.filter(l => {
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
      result = leads.filter(l => l.created_at && new Date(l.created_at) >= startOfWeek);
    } else if (activeFilter === 'monthly') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      result = leads.filter(l => l.created_at && new Date(l.created_at) >= startOfMonth);
    } else if (activeFilter === 'yearly') {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      result = leads.filter(l => l.created_at && new Date(l.created_at) >= startOfYear);
    } else if (activeFilter === 'pending') {
      result = leads.filter(l => l.status === 'proposal');
    } else if (activeFilter === 'closed') {
      result = leads.filter(l => l.status === 'cancelled');
    } else if (activeFilter === 'hot') {
      result = leads.filter(l => l.priority === 'hot');
    } else if (activeFilter === 'new') {
      result = leads.filter(l => l.status === 'new');
    } else if (activeFilter === 'processing') {
      result = leads.filter(l => l.status === 'processing');
    } else if (activeFilter === 'proposalSent') {
      result = leads.filter(l => l.status === 'proposal');
    } else if (activeFilter === 'noConnect') {
      result = [];
    } else if (activeFilter === 'hotLead') {
      result = leads.filter(l => l.priority === 'hot');
    } else if (activeFilter === 'proposalConfirmed') {
      result = leads.filter(l => l.status === 'confirmed' && l.priority === 'hot');
    } else if (activeFilter === 'cancel') {
      result = leads.filter(l => l.status === 'cancelled');
    } else if (activeFilter === 'followUp') {
      result = leads.filter(l => l.status === 'followup');
    } else if (activeFilter === 'confirmed') {
      result = leads.filter(l => l.status === 'confirmed');
    } else if (activeFilter === 'postponed') {
      result = [];
    } else if (activeFilter === 'invalid') {
      result = [];
    } else if (activeFilter === 'birthdays') {
      const today = new Date();
      result = leads.filter(l => l.date_of_birth && new Date(l.date_of_birth).getMonth() === today.getMonth());
    } else if (activeFilter === 'anniversaries') {
      const today = new Date();
      result = leads.filter(l => l.marriage_anniversary && new Date(l.marriage_anniversary).getMonth() === today.getMonth());
    } else if (activeFilter === 'unassigned') {
      result = leads.filter(l => !l.assigned_to && !l.assigned_to_id);
    } else if (activeFilter === 'assignedToMe') {
      result = leads.filter(l => {
        const id = l.assigned_to?.id ?? l.assigned_to_id ?? l.assigned_to;
        return Number(id) === currentUser?.id;
      });
    } else {
      result = leads;
    }

    // Apply sorting
    if (sortConfig.key) {
      return [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Custom comparisons for complex keys
        if (sortConfig.key === 'assigned_to') {
          aValue = a.assigned_to?.name || a.assigned_to_name || a.assignedUser?.name || '';
          bValue = b.assigned_to?.name || b.assigned_to_name || b.assignedUser?.name || '';
        }

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, activeFilter, sortConfig, assignedNameFilter, assignedToFilter, destinationFilter, currentUser]);

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
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Source', 'Destination', 'Status', 'Priority', 'Assigned To', 'Created At'];
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

  const handleRefresh = () => {
    setAdvancedFilters({
      from_date: '',
      to_date: '',
      travel_month: '',
      source: '',
      service: '',
      adult: '',
      description: '',
    });
    navigate('/leads', { replace: true });
  };

  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyAdvancedFilters = () => {
    fetchLeads();
  };

  return (
    <div className={`p-6 bg-[#F8FAFC] min-h-screen relative page-transition ${loading && leads.length > 0 ? 'opacity-80' : ''}`}>
      {/* Full-screen loader only for initial load (when leads list is empty) */}
      {loading && leads.length === 0 && (
        <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
          <LogoLoader text="Initializing CRM..." />
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-50">
        <div className="animate-in-scale">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Queries</h1>
          <p className="text-slate-500 font-semibold text-xs mt-1 uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-[2px] bg-blue-600 rounded-full"></span>
            {stats.total} total opportunities
          </p>
        </div>

        <div className="flex items-center gap-3 relative animate-in-scale" style={{ animationDelay: '100ms' }}>
          <div className="relative group">
            <button
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              className="flex items-center gap-2.5 bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <MoreVertical size={16} />
              <span>Options</span>
            </button>

            {showOptionsDropdown && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[1000] py-2 animate-in-scale overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.2em]">Data Management</p>
                </div>
                <button
                  onClick={() => { setShowImportModal(true); setShowOptionsDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 font-bold"
                >
                  <Upload size={16} />
                  Import (CSV)
                </button>
                <button
                  onClick={() => { setShowGoogleSheetModal(true); setShowOptionsDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-3 font-bold"
                >
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  Google Sheets
                </button>
                <div className="h-px bg-slate-100 my-1 mx-4"></div>
                <button
                  onClick={handleExportData}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 font-bold"
                >
                  <Download size={16} />
                  Export All
                </button>

                {selectedLeadIds.length > 0 && (
                  <>
                    <div className="h-px bg-slate-100 my-1 mx-4"></div>
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[.2em]">Bulk Actions ({selectedLeadIds.length})</p>
                    </div>
                    <button
                      onClick={() => { setIsBulkAssignModalOpen(true); setShowOptionsDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-3 font-bold"
                    >
                      <User size={16} />
                      Bulk Assign
                    </button>
                    <button
                      onClick={() => { handleBulkDelete(); setShowOptionsDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3 font-bold"
                    >
                      <Trash2 size={16} />
                      Bulk Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* In-Header Bulk Actions Toolbar */}
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50/80 p-1.5 rounded-2xl border border-blue-200 animate-in fade-in zoom-in-95 duration-300 shadow-sm ring-4 ring-blue-500/5">
              <div className="px-3 py-1 flex items-center gap-2 border-r border-blue-200 mr-1">
                <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-blue-500/20">
                  {selectedLeadIds.length}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">Selected</span>
              </div>

              <div className="flex items-center gap-1.5 px-1">
                <button
                  onClick={() => setIsBulkAssignModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                >
                  <User size={14} />
                  Bulk Assign
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest shadow-sm"
                >
                  <Trash2 size={14} />
                  Bulk Delete
                </button>

                <button
                  onClick={() => setSelectedLeadIds([])}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Clear Selection"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { setFormData({ ...getDefaultFormData(), assigned_to: currentUser?.id || '' }); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Query</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-xl transition-all ${viewType === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded-xl transition-all ${viewType === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Action/Filter Bar Area */}
      <div className="sticky top-4 z-40 mb-8 space-y-3">
        {/* Search & Main Actions Row */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 transition-all duration-300">
          <div className="flex-1 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, phone, destination, status or staff..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex gap-2 p-1 lg:p-0">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all border ${showAdvancedFilters
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                }`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[1.5rem] text-sm font-black shadow-lg transition-all border ${showAnalytics
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200'
                : 'bg-white border-slate-100 text-emerald-600 hover:bg-emerald-50'
                }`}
            >
              <TrendingUp size={18} />
              <span>{showAnalytics ? 'Close Stats' : 'Stats'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center justify-center w-12 h-12 border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all active:rotate-180 duration-500 shadow-sm"
              title="Reset Filters"
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              onClick={() => handleSearch()}
              className="btn-primary text-white px-8 py-3.5 rounded-[1.5rem] text-sm font-black active:scale-95 transition-all"
            >
              Go!
            </button>
          </div>
        </div>

        {/* Quick Filter Tabs Row */}
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-3 overflow-x-auto scrollbar-hide no-scrollbar transition-all duration-300">
          {[
            { id: 'total', label: 'All', key: 'total', color: 'from-blue-600 to-blue-700 shadow-blue-200 hover:shadow-blue-300', icon: LayoutGrid },
            { id: 'assignedToMe', label: 'My Leads', key: 'assignedToMe', color: 'from-indigo-600 to-indigo-700 shadow-indigo-200 hover:shadow-indigo-300', icon: User },
            { id: 'today', label: 'Today', key: 'today', color: 'from-emerald-600 to-emerald-700 shadow-emerald-200 hover:shadow-emerald-300', icon: Calendar },
            { id: 'unassigned', label: 'Unassigned', key: 'unassigned', color: 'from-slate-700 to-slate-800 shadow-slate-200 hover:shadow-slate-300', icon: Lock },
            { id: 'new', label: 'New', key: 'new', color: 'from-sky-500 to-sky-600 shadow-sky-200 hover:shadow-sky-300', icon: Plus },
            { id: 'processing', label: 'Processing', key: 'processing', color: 'from-blue-400 to-blue-500 shadow-blue-100 hover:shadow-blue-200', icon: Loader2 },
            { id: 'confirmed', label: 'Booked', key: 'confirmed', color: 'from-green-600 to-green-700 shadow-green-200 hover:shadow-green-300', icon: BarChart3 },
            { id: 'proposalSent', label: 'Proposal', key: 'proposalSent', color: 'from-amber-500 to-amber-600 shadow-amber-200 hover:shadow-amber-300', icon: FileSpreadsheet },
            { id: 'hotLead', label: 'Hot', key: 'hotLead', color: 'from-rose-500 to-rose-600 shadow-rose-200 hover:shadow-rose-300', icon: TrendingUp },
            { id: 'cancel', label: 'Declined', key: 'cancel', color: 'from-gray-500 to-gray-600 shadow-gray-200 hover:shadow-gray-300', icon: X },
            { id: 'followUp', label: 'Follow Up', key: 'followUp', color: 'from-purple-600 to-purple-700 shadow-purple-200 hover:shadow-purple-300', icon: RefreshCw },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border flex items-center gap-1.5 whitespace-nowrap active:scale-95 group relative overflow-hidden flex-shrink-0 ${activeFilter === filter.id
                ? `bg-gradient-to-br ${filter.color} text-white border-transparent shadow-md scale-105 z-10`
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-700'
                }`}
            >
              <filter.icon size={13} className={`${activeFilter === filter.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} flex-shrink-0`} strokeWidth={activeFilter === filter.id ? 3 : 2} />
              <span className="relative z-10">{filter.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all flex-shrink-0 ${activeFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats[filter.key] || 0}
              </span>
              
              {/* Subtle animated shine for active tab */}
              {activeFilter === filter.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] skew-x-12"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Expandable Area */}
      {showAdvancedFilters && (
        <div className="mt-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">From Date</label>
              <input
                type="date"
                name="from_date"
                value={advancedFilters.from_date}
                onChange={handleAdvancedFilterChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">To Date</label>
              <input
                type="date"
                name="to_date"
                value={advancedFilters.to_date}
                onChange={handleAdvancedFilterChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Travel Month</label>
              <select
                name="travel_month"
                value={advancedFilters.travel_month}
                onChange={handleAdvancedFilterChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Months</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Lead Source</label>
              <select
                name="source"
                value={advancedFilters.source}
                onChange={handleAdvancedFilterChange}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Sources</option>
                {leadSources?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Service</label>
              <input
                type="text"
                name="service"
                value={advancedFilters.service}
                onChange={handleAdvancedFilterChange}
                placeholder="e.g. Activities"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Pax (Adult)</label>
              <input
                type="number"
                name="adult"
                value={advancedFilters.adult}
                onChange={handleAdvancedFilterChange}
                placeholder="Count"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Assign To</label>
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">All Staff</option>
                {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider ml-1">Description</label>
              <input
                type="text"
                name="description"
                value={advancedFilters.description}
                onChange={handleAdvancedFilterChange}
                placeholder="Search in remark..."
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Visualization Section */}
      {showAnalytics && (
        <div className="mt-6 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Left Side: Chart */}
            <div className="lg:w-2/3 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={24} />
                    Query Growth Trends
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Monitoring lead volume and success rate</p>
                </div>

                <div className="flex items-center bg-blue-50/50 p-1.5 rounded-xl border border-blue-100">
                  {['day', 'week', 'month', 'year'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all ${analyticsTimeframe === tf
                          ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsLoading ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <LogoLoader text="Generating Graphics..." compact={true} />
                </div>
              ) : analyticsData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 700 }}
                      />
                      <Bar
                        name="Total Queries"
                        dataKey="total"
                        fill="url(#colorTotal)"
                        radius={[6, 6, 0, 0]}
                        barSize={analyticsTimeframe === 'day' ? 24 : 32}
                      />
                      <Bar
                        name="Confirmed"
                        dataKey="confirmed"
                        fill="url(#colorConfirmed)"
                        radius={[6, 6, 0, 0]}
                        barSize={analyticsTimeframe === 'day' ? 24 : 32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  <BarChart3 className="text-gray-200 mb-4" size={48} />
                  <p className="text-sm font-bold text-gray-400">No data points available</p>
                </div>
              )}
            </div>

            {/* Right Side: Insights */}
            <div className="lg:w-1/3 bg-gray-50/30 p-6 sm:p-8 flex flex-col gap-6">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-500" />
                Quick Insights
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-1">Conversion Efficiency</p>
                  <div className="flex items-end justify-between">
                    <h5 className="text-3xl font-black text-gray-900">
                      {analyticsData.length > 0
                        ? Math.round((analyticsData.reduce((acc, curr) => acc + (curr.confirmed || 0), 0) / (analyticsData.reduce((acc, curr) => acc + (curr.total || 0), 0) || 1)) * 100)
                        : 0}%
                    </h5>
                    <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${analyticsData.length > 0 ? Math.min(100, (analyticsData.reduce((acc, curr) => acc + (curr.confirmed || 0), 0) / (analyticsData.reduce((acc, curr) => acc + (curr.total || 0), 0) || 1)) * 100) : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-1">Peak Performance</p>
                  {analyticsData.length > 0 ? (
                    <div>
                      <h5 className="text-xl font-bold text-blue-600">
                        {analyticsData.reduce((prev, current) => (prev.total > current.total) ? prev : current).label}
                      </h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Busy Period Identified</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Awaiting more data...</p>
                  )}
                </div>

                <div className="bg-blue-600 p-5 rounded-2xl border border-blue-500 shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]">
                  <p className="text-[11px] font-bold text-blue-100 uppercase tracking-tight mb-1">Total Success</p>
                  <h5 className="text-3xl font-black text-white">
                    {analyticsData.reduce((acc, curr) => acc + (curr.confirmed || 0), 0)}
                  </h5>
                  <p className="text-[10px] text-blue-200 font-bold uppercase mt-1">Leads Won Overall</p>
                </div>
              </div>

              <div className="mt-auto bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                  ðŸ’¡ Pro-Tip: Comparison helps identify seasonal peaks. Use it to plan your marketing spend!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End of Analytics if open */}

      {!showAnalytics && (
        <div className="relative min-h-[500px]">
          {/* Localized Loader Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-start pt-32 rounded-3xl animate-in fade-in duration-300">
              <div className="p-10 bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-4 animate-in-scale">
                <LogoLoader text="Syncing Records..." compact={true} />
              </div>
            </div>
          )}

          {/* Main Leads Area */}
          <div className="leads-content-container">
            {filteredLeads.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-slate-200 mx-4 mt-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100">
                  <LayoutGrid className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-600 text-xl font-bold mb-2">No queries found</h3>
                <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">
                  We couldn't find any leads matching your current selection. Try a different filter.
                </p>
              </div>
            ) : (
              <div className="relative">
                {viewType === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mt-6">
                    {filteredLeads.map((lead) => {
                      const assignee = lead.assigned_user || lead.assignedUser || lead.assigned_to;
                      const assigneeRole = assignee?.user_type === 'agent' ? 'Agent' :
                        (assignee?.roles?.[0]?.name || (typeof assignee?.roles?.[0] === 'string' ? assignee.roles[0] : null));

                      const assignedUserName =
                        (assignee?.name ? `${assignee.name}${assigneeRole ? ` (${assigneeRole})` : ''}` : null) ||
                        lead.assigned_name ||
                        lead.assigned_to_name ||
                        lead.assigned_user_name ||
                        "Unassigned";

                      return (
                        <LeadCard
                          id={lead.id}
                          key={lead.id}
                          name={lead.client_name}
                          isSelected={selectedLeadIds.includes(lead.id)}
                          onSelect={toggleSelectLead}
                          phone={lead.phone || "N/A"}
                          email={lead.email}
                          tag={
                            lead.status === "confirmed"
                              ? "Booked"
                              : lead.status === "new"
                                ? "New"
                                : lead.status === "processing"
                                  ? "Under Process"
                                  : ""
                          }
                          location={lead.destination || "N/A"}
                          date={formatDate(lead.created_at)}
                          amount={lead.amount || 0}
                          status={lead.status}
                          assignedTo={lead.assignedUser || lead.assigned_user || lead.assigned_to}
                          assignedName={assignedUserName}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          onStatusChange={handleOpenStatusModal}
                          onAssign={handleOpenAssignModal}
                          onAddNote={() => navigate(`/leads/${lead.id}?tab=followups`)}
                          onDelete={() => handleDelete(lead.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-5 w-12">
                              <input
                                type="checkbox"
                                checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                              />
                            </th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Client Detail</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned To</th>
                            <th className="px-2 py-5 text-right w-16 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredLeads.map((lead) => {
                            const isSelected = selectedLeadIds.includes(lead.id);
                            const assignee = lead.assigned_user || lead.assignedUser || lead.assigned_to;
                            const assigneeRole = assignee?.user_type === 'agent' ? 'Agent' :
                              (assignee?.roles?.[0]?.name || (typeof assignee?.roles?.[0] === 'string' ? assignee.roles[0] : null));

                            const assignedUserName =
                              (assignee?.name ? `${assignee.name}${assigneeRole ? ` (${assigneeRole})` : ''}` : null) ||
                              lead.assigned_name ||
                              lead.assigned_to_name ||
                              lead.assigned_user_name ||
                              "Unassigned";

                            return (
                              <tr
                                key={lead.id}
                                className={`${isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'} border-b border-slate-50 transition-colors group cursor-pointer`}
                                onClick={() => navigate(`/leads/${lead.id}`)}
                              >
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectLead(lead.id)}
                                    className="w-5 h-5 rounded border-2 border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px] shadow-sm transform group-hover:scale-110 transition-transform">
                                      {lead.client_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{lead.client_name}</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                    <span>{lead.phone || 'No Phone'}</span>
                                    <span>â€¢</span>
                                    <span>{formatDate(lead.created_at)}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                      <Search size={12} className="text-slate-400" />
                                    </div>
                                    <span className="text-xs font-semibold">{lead.destination || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs font-black text-slate-700">â‚¹{Number(lead.amount || 0).toLocaleString()}</div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Package Value</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${lead.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                                    lead.status === 'followup' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                                      lead.status === 'cancelled' ? 'bg-rose-100 text-rose-600 border border-rose-200' :
                                        lead.status === 'processing' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' :
                                          'bg-blue-100 text-blue-600 border border-blue-200'
                                    }`}>
                                    {lead.status === 'confirmed' ? 'Booked' : lead.status === 'processing' ? 'Under Process' : lead.status || 'New'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200">
                                      {assignedUserName.substring(0, 1)}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600">{assignedUserName}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => navigate(`/leads/${lead.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                                      <LayoutGrid size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete query of ${lead.client_name}?`)) {
                                          handleDelete(lead.id);
                                        }
                                      }}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Delete Lead"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* Shared Pagination for Grid & Table */}
                {pagination.last_page >= 1 && (
                  <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center text-sm text-slate-500">
                      Showing <span className="font-bold text-slate-800 mx-1">{pagination.from || 0}-{pagination.to || 0}</span> of <span className="font-bold text-slate-800 mx-1">{pagination.total || 0}</span> leads
                    </div>

                    <div className="flex items-center gap-3 px-6 border-l border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queries Per Page:</span>
                      <select
                                          onChange={handlePerPageChange}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        {[8, 10, 20, 50, 100].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Prev
                      </button>
                      
                      <div className="flex items-center gap-1.5">
                        {[...Array(pagination.last_page)].map((_, i) => {
                          const page = i + 1;
                          if (page === 1 || page === pagination.last_page || (page >= currentPage - 2 && page <= currentPage + 2)) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${page === currentPage
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          }
                          if (page === 2 || page === pagination.last_page - 1) {
                            return <span key={page} className="text-slate-300 px-0.5 text-xs">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.last_page}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Action Bar - Floating */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">
                {selectedLeadIds.length}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Selected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBulkAssignModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <User size={16} />
                Bulk Assign
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-rose-600/20"
              >
                <Trash2 size={16} />
                Bulk Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedLeadIds([])}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                title="Clear Selection"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[160] p-4 transition-all animate-in-fade">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-in-scale border border-slate-100">
            <div className="flex justify-between items-center p-8 border-b border-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800">Bulk Assignment</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Select staff for {selectedLeadIds.length} leads</p>
              </div>
              <button
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-wider ml-1">Choose Sales Representative</label>
              <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleBulkAssign(u.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 font-black transition-colors shadow-sm">
                      {u.name?.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 group-hover:text-blue-700">{u.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.user_type === 'agent' ? 'Agent' : (u.roles?.[0]?.name || 'Staff')}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center bg-slate-50 py-3 rounded-xl border border-slate-100">
                ðŸ’¡ High-volume assignment may take a moment to sync.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD QUERY Modal */}
      <Dialog
        visible={showModal}
        onHide={() => setShowModal(false)}
        modal
        dismissableMask
        style={{ width: '90%', maxWidth: '700px' }}
        header={
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800">New Query</span>
            <span className="text-slate-400 text-xs font-medium mt-1">Fill in the details to create a new opportunity</span>
          </div>
        }
        contentClassName="p-0 overflow-hidden rounded-b-2xl"
        headerClassName="p-6 border-b border-slate-100"
        footer={
          <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
            <Button
              label="Cancel"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-bold text-sm h-auto"
            />
            <Button
              label="Create Query"
              onClick={(e) => {
                const form = document.getElementById('newQueryForm');
                if (form) form.requestSubmit();
              }}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm border-none h-auto"
            />
          </div>
        }
      >
        <div className="p-0">
          <form id="newQueryForm" onSubmit={handleCreate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* CLIENT NAME * */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Client Name & Title *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.client_title}
                  onChange={(e) => setFormData({ ...formData, client_title: e.target.value })}
                  className="w-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
                <input
                  type="text"
                  placeholder="Required Name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none"
                />
              </div>
            </div>

            {/* MOBILE * */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Mobile Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: val });
                }}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none"
              />
            </div>

            {/* MAIL ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Mail ID (Email)
              </label>
              <input
                type="email"
                placeholder="customer@email.com (Optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none"
              />
            </div>

            {/* LEAD SOURCE * */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Lead Source *
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none appearance-none cursor-pointer"
              >
                <option value="">Select Source</option>
                {leadSources?.map((source) => (
                  <option key={source.id} value={source.name}>{source.name}</option>
                ))}
              </select>
            </div>

            {/* ASSIGN TO * */}
            {canAssign && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Assign To *
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select Staff</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.user_type === 'agent' ? 'Agent' : (user.roles?.[0]?.name || 'Staff')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Divider */}
            <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                Additional Details (Optional)
              </h3>
            </div>

            {/* DESTINATION */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Destination
              </label>
              <input
                type="text"
                placeholder="e.g. Maldives"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              />
            </div>

            {/* TYPE */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              >
                <option value="Client">Client</option>
                <option value="Agent">Agent</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            {/* DATE OF BIRTH */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              />
            </div>

            {/* ANNIVERSARY */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Anniversary
              </label>
              <input
                type="date"
                value={formData.marriage_anniversary}
                onChange={(e) => setFormData({ ...formData, marriage_anniversary: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              />
            </div>

            {/* FROM DATE */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Travel From
              </label>
              <input
                type="date"
                value={formData.from_date}
                onChange={(e) => {
                  const newFromDate = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    from_date: newFromDate,
                    to_date: prev.to_date && prev.to_date < newFromDate ? newFromDate : prev.to_date
                  }));
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              />
            </div>

            {/* TO DATE */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Travel To
              </label>
              <input
                type="date"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                min={formData.from_date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              />
            </div>

            {/* ADULTS / CHILDREN */}
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Adults</label>
                <select
                  value={formData.adult}
                  onChange={(e) => setFormData({ ...formData, adult: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none"
                >
                  {[...Array(20)].map((_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Child</label>
                <select
                  value={formData.child}
                  onChange={(e) => setFormData({ ...formData, child: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none"
                >
                  {[...Array(11)].map((_, i) => <option key={i} value={String(i)}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Infant</label>
                <select
                  value={formData.infant}
                  onChange={(e) => setFormData({ ...formData, infant: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none"
                >
                  {[...Array(11)].map((_, i) => <option key={i} value={String(i)}>{i}</option>)}
                </select>
              </div>
            </div>

            {/* PRIORITY */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              >
                <option value="General Query">General Query</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>

            {/* SERVICE */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Service
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none"
              >
                <option value="">Select Service</option>
                <option value="Full Package">Full Package</option>
                <option value="Hotel Only">Hotel Only</option>
                <option value="Cab Only">Cab Only</option>
                <option value="Activities only">Activities only</option>
                <option value="Visa Only">Visa Only</option>
                <option value="Flight Only">Flight Only</option>
              </select>
            </div>

            {/* REMARK */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Remarks
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-semibold outline-none h-24 resize-none"
                placeholder="Enter any additional notes..."
              />
            </div>
          </form>
        </div>
      </Dialog>

      {/* Assign Modal - Now Premium & Draggable */}
      <Dialog
        visible={showAssignModal && !!selectedLead}
        onHide={() => {
          setShowAssignModal(false);
          setSelectedLead(null);
        }}
        modal
        draggable
        dismissableMask
        style={{ width: '95%', maxWidth: '450px' }}
        header={
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800">Assign Lead</span>
            <span className="text-slate-400 text-xs font-medium mt-1">Select a team member to handle this opportunity</span>
          </div>
        }
        contentClassName="p-0 overflow-hidden rounded-b-2xl"
        headerClassName="p-6 border-b border-slate-100"
        footer={
          <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
            <Button
              label="Cancel"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedLead(null);
              }}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-bold text-sm h-auto"
            />
            <Button
              label="Assign Lead"
              onClick={() => {
                const userId = document.getElementById('assignUserId').value;
                if (userId && selectedLead) {
                  handleAssign(selectedLead.id, parseInt(userId));
                } else {
                  toast.warning('Please select a user');
                }
              }}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm border-none h-auto"
            />
          </div>
        }
      >
        <div className="p-8">
          <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider ml-1">Choose Sales Representative</label>
          <div className="relative">
            <select
              id="assignUserId"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none appearance-none cursor-pointer"
              defaultValue={currentUser?.id || ''}
            >
              <option value={currentUser?.id || ''}>
                {currentUser?.name ? `${currentUser.name} (${userRoles[0] || 'Staff'})` : 'Select User'}
              </option>
              {users.filter(u => u.id !== currentUser?.id).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.user_type === 'agent' ? 'Agent' : (user.roles?.[0]?.name || 'Staff')})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={18} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
            ðŸ’¡ Assigned staff will receive an instant notification.
          </p>
        </div>
      </Dialog>

      {/* Status Modal - Now Premium & Draggable */}
      <Dialog
        visible={showStatusModal && !!selectedLead}
        onHide={() => {
          setShowStatusModal(false);
          setSelectedLead(null);
        }}
        modal
        draggable
        dismissableMask
        style={{ width: '95%', maxWidth: '400px' }}
        header={
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800">Update Status</span>
            <span className="text-slate-400 text-xs font-medium mt-1">Move this lead to a different stage</span>
          </div>
        }
        contentClassName="p-0 overflow-hidden rounded-b-2xl"
        headerClassName="p-6 border-b border-slate-100"
      >
        <div className="p-6 space-y-3">
          {['processing', 'proposal', 'followup', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(selectedLead.id, status)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${status === 'confirmed' ? 'bg-emerald-500' :
                  status === 'cancelled' ? 'bg-rose-500' :
                    status === 'processing' ? 'bg-indigo-500' :
                      status === 'proposal' ? 'bg-amber-500' :
                        'bg-orange-500'
                  } shadow-sm`}></div>
                <span className="font-bold text-slate-700 group-hover:text-blue-700 capitalize">
                  {status === 'processing' ? 'Under Process' :
                    status === 'proposal' ? 'Proposal Sent' :
                      status === 'confirmed' ? 'Booked' :
                        status === 'cancelled' ? 'Declined' :
                          status}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <TrendingUp size={14} className="text-blue-500" />
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              setShowStatusModal(false);
              setSelectedLead(null);
            }}
            className="w-full mt-2 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Dialog>

      {/* Google Sheet Integration Modal */}
      <GoogleSheetModal
        onClose={() => setShowGoogleSheetModal(false)}
        onSyncComplete={() => fetchLeads()}
        visible={showGoogleSheetModal}
      />

      {/* Import CSV Modal */}

      <Dialog visible={showImportModal} showCloseIcon={false} header={() => (
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
      )}>

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
      </Dialog>
    </div>
  );
};

// Google Sheet Integration Modal Component
const GoogleSheetModal = ({ onClose, onSyncComplete, visible }) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState({
    connected: false,
    sheet_url: '',
    is_active: true,
    last_synced_at: null
  });
  const [url, setUrl] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await googleSheetsAPI.status();
      if (res.data?.success) {
        setConnection(res.data.data);
        setUrl(res.data.data.sheet_url || '');
      }
    } catch (e) {
      console.error("Failed to fetch Google Sheet status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!url) {
      toast.warning("Please enter a Google Sheet URL");
      return;
    }

    try {
      setLoading(true);
      const res = await googleSheetsAPI.connect(url, true);
      if (res.data?.success) {
        toast.success("Google Sheet connected successfully!");
        fetchStatus();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to connect Google Sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await googleSheetsAPI.sync();
      if (res.data?.success) {
        toast.success("Sync completed successfully!");
        fetchStatus();
        if (onSyncComplete) onSyncComplete();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Sync failed. Make sure the sheet is public (anyone with link can view).");
    } finally {
      setSyncing(false);
    }
  };

  return (

    <Dialog visible={visible} showCloseIcon={false}
      header={() => (<div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Google Sheet Integration</h2>
            <p className="text-xs text-green-600 font-medium">Auto-import leads from your spreadsheet</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>)}
      style={{ margin: 0, padding: 0 }}
      contentClassName='p-0 m-0'
    >
      <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Connection Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${connection.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></div>
              <span className={`font-bold ${connection.connected ? 'text-green-600' : 'text-gray-500'}`}>
                {connection.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
          {connection.last_synced_at && (
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Last Synced</span>
              <span className="text-xs font-semibold text-gray-700">
                {new Date(connection.last_synced_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Spreadsheet Link (Published as CSV)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${loading ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                  }`}
              >
                {loading ? 'Saving...' : connection.connected ? 'Update' : 'Connect'}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="font-bold text-blue-600 block mb-1">To connect:</span>
              1. Open your sheet &gt; File &gt; Share &gt; <strong>Publish to web</strong>.
              <br />
              2. Select <strong>"Whole Document"</strong> and <strong>"CSV"</strong> then copy the link here.
            </p>
          </div>
        </form>

        {/* Actions */}
        {connection.connected && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${syncing ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
            >
              {syncing ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Executing Smart Sync...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Import Now (Smart Sync)
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2 italic">
              * Sync will only add new leads. Existing phone/email combos will be skipped.
            </p>
          </div>
        )}
      </div>
    </Dialog>

  );
};

export default Leads;
