import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoLoader from '../components/LogoLoader';
// Layout removed - handled by nested routing
import {
  Users,
  Building,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  Mail,
  Phone,
  User as UserIcon,
  Eye,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Key,
  Clock,
  Activity,
  Calendar
} from 'lucide-react';
import { companySettingsAPI } from '../services/api';
import { Dialog } from 'primereact/dialog';

const TeamManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('user'); // user, branch, role
  const [editingItem, setEditingItem] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Data states
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [notification, setNotification] = useState({ type: '', text: '', title: '', visible: false });
  const [permissionsList, setPermissionsList] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const isManager = user?.roles?.some(r => (typeof r === 'string' ? r === 'Manager' : r.name === 'Manager'));

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    employee_id: '',
    branch_id: '',
    roles: [],
    is_active: true,
    password: '',
    address: '',
    code: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    permissions: [],
    reports_to: ''
  });

  useEffect(() => {
    fetchInitialData();
    // Refresh data every 60 seconds to update online status
    const interval = setInterval(fetchInitialData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Allow deep-links like ?tab=users|branches|roles from Staff Management menu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['users', 'branches', 'roles', 'teams'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Poll for user status updates every 30 seconds to keep "Online" status fresh
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'teams') {
      const interval = setInterval(() => {
        companySettingsAPI.getUsers().then(res => {
          if (res.data.success) setUsers(res.data.data);
        });
        companySettingsAPI.getStats().then(res => {
          if (res.data.success) setStats(res.data.data);
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      const [usersRes, branchesRes, rolesRes, statsRes, permissionsRes] = await Promise.all([
        companySettingsAPI.getUsers(),
        companySettingsAPI.getBranches(),
        companySettingsAPI.getRoles(),
        companySettingsAPI.getStats(),
        companySettingsAPI.getPermissions()
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (permissionsRes.data.success) setPermissionsList(permissionsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      employee_id: '',
      branch_id: '',
      roles: [],
      is_active: true,
      password: '',
      address: '',
      code: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      permissions: [],
      reports_to: ''
    });
  };

  const showNotification = (type, text) => {
    setNotification({
      type,
      text,
      title: type === 'success' ? 'Success' : 'Alert',
      visible: true,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 2500);
    setTimeout(() => {
      setNotification({ type: '', text: '', title: '', visible: false });
    }, 3000);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      let submitData = {};

      if (modalType === 'user') {
        // Validate required fields
        if (!formData.password && !editingItem) {
          showNotification('error', 'Password is required for new users.');
          return;
        }

        submitData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          employee_id: formData.employee_id,
          branch_id: formData.branch_id || null,
          is_active: formData.is_active,
          password: formData.password,
          reports_to: formData.reports_to || null,
          role: formData.roles?.[0] || null, // Send primary role as 'role' for backend
          roles: formData.roles || [],
        };
        if (editingItem) {
          response = await companySettingsAPI.updateUser(editingItem.id, submitData);
        } else {
          response = await companySettingsAPI.createUser(submitData);
        }
      } else if (modalType === 'branch') {
        submitData = {
          name: formData.name,
          address: formData.address || null,
        };
        if (editingItem) {
          response = await companySettingsAPI.updateBranch(editingItem.id, submitData);
        } else {
          response = await companySettingsAPI.createBranch(submitData);
        }
      } else if (modalType === 'role') {
        submitData = {
          name: formData.name,
        };
        if (editingItem) {
          response = await companySettingsAPI.updateRole(editingItem.id, submitData);
        } else {
          response = await companySettingsAPI.createRole(submitData);
        }
      }

      if (response.data.success) {
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchInitialData();
        showNotification('success', response.data.message || 'Saved successfully!');
      } else {
        showNotification('error', response.data.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      showNotification('error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, modalType, editingItem, fetchInitialData, resetForm]);

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setModalType(type);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      email: item.email || '',
      phone: item.phone || '',
      employee_id: item.employee_id || '',
      branch_id: item.branch_id || '',
      roles: item.roles?.map(r => r.name) || [],
      is_active: item.is_active ?? true,
      password: '',
      address: item.address || '',
      reports_to: item.reports_to || ''
    });
    setShowModal(true);
  };

  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleDelete = async (item, type) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      let response;
      if (type === 'user') {
        response = await companySettingsAPI.deleteUser(item.id);
      } else if (type === 'branch') {
        response = await companySettingsAPI.deleteBranch(item.id);
      } else if (type === 'role') {
        response = await companySettingsAPI.deleteRole(item.id);
      }

      if (response.data.success) {
        fetchInitialData();
        showNotification('success', 'Deleted successfully!');
      } else {
        showNotification('error', response.data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      showNotification('error', 'Failed to delete. Please try again.');
    }
  };

  const openRolePermissions = async (role) => {
    setEditingItem(role);
    setModalType('role-permissions');
    setSelectedPermissions([]);
    setShowModal(true);
    setPermissionsLoading(true);
    try {
      const response = await companySettingsAPI.getRolePermissions(role.id);
      if (response.data.success) {
        setSelectedPermissions(response.data.data || []);
      }
    } catch (err) {
      showNotification('error', 'Failed to load role permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const openUserPermissions = async (user) => {
    setEditingItem(user);
    setModalType('user-permissions');
    setSelectedPermissions([]);
    setShowModal(true);
    setPermissionsLoading(true);
    try {
      const response = await companySettingsAPI.getUserPermissions(user.id);
      if (response.data.success) {
        setSelectedPermissions(response.data.data || []);
      }
    } catch (err) {
      showNotification('error', 'Failed to load user permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    );
  };

  const toggleAllPermissions = () => {
    if (selectedPermissions.length === permissionsList.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissionsList.map((p) => p.id));
    }
  };

  const savePermissions = async () => {
    if (!editingItem) return;
    try {
      setPermissionsLoading(true);
      if (modalType === 'role-permissions') {
        await companySettingsAPI.updateRolePermissions(editingItem.id, selectedPermissions);
        showNotification('success', 'Role permissions updated');
      } else if (modalType === 'user-permissions') {
        await companySettingsAPI.updateUserPermissions(editingItem.id, selectedPermissions);
        showNotification('success', 'User permissions updated');
      }
      fetchInitialData();
      setShowModal(false);
      setEditingItem(null);
    } catch (err) {
      showNotification('error', 'Failed to update permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleShowUserDetails = async (userId) => {
    try {
      const response = await companySettingsAPI.getUserDetails(userId);
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      showNotification('error', 'Failed to fetch user details');
    }
  };

  const openLoginLogs = async (user, page = 1, filters = null) => {
    setEditingItem(user);
    setModalType('login-logs');
    setShowModal(true);
    setLogsLoading(true);
    
    const params = { page };
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;

    try {
      const response = await companySettingsAPI.getUserLoginLogs(user.id, params);
      if (response.data.success) {
        setLoginLogs(response.data.data.data || []);
        setLoginPagination(response.data.data);
        setPresenceSummary(response.data.summary || { formatted_time: '0h 0m', logout_count: 0, login_count: 0 });
      }
    } catch (err) {
      console.error('Failed to load login logs:', err);
      showNotification('error', 'Failed to load login logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const [loginPagination, setLoginPagination] = useState(null);
  const [presenceSummary, setPresenceSummary] = useState({ formatted_time: '0h 0m', logout_count: 0, login_count: 0, is_absent: false, period_label: 'Today' });
  const [logFilter, setLogFilter] = useState({ from_date: '', to_date: '', type: 'today' });

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Active';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (loginAt, logoutAt) => {
    if (!loginAt || !logoutAt) return 'Ongoing';
    const login = new Date(loginAt);
    const logout = new Date(logoutAt);
    const diffMs = logout - login;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };


  const openModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const isPermissionsModal = modalType === 'role-permissions' || modalType === 'user-permissions';

  return (
    <div className={`relative page-transition ${loading && users.length > 0 ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
             <LogoLoader text="Loading team data..." />
          </div>
      ) : (
        <>
      {notification.text && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
          <div
            className={`px-4 py-3 rounded shadow-lg text-sm transition-all duration-300 ${notification.type === 'success'
              ? 'bg-white border border-green-200 text-gray-900'
              : 'bg-white border border-red-200 text-gray-900'
              } ${notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            <div className="text-xs text-gray-500">TravelOps</div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{notification.title}</div>
                <div className="text-sm text-gray-700">{notification.text}</div>
              </div>
              <button
                type="button"
                onClick={() => setNotification({ type: '', text: '', title: '', visible: false })}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-6" style={{ backgroundColor: '#D8DEF5', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your company users, branches, and roles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_users || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_users || 0}</p>
              </div>
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_branches || 0}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_branches || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </div>
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  All Team
                </div>
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Branches
                </div>
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Roles
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Branches Tab Content */}
        {activeTab === 'branches' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search branches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {!isManager && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal('branch')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Add Branch
                    </button>
                    <button
                      onClick={() => openModal('user')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                      <Users className="h-4 w-4" />
                      Add User
                    </button>
                    <button
                      onClick={() => openModal('role')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                    >
                      <Shield className="h-4 w-4" />
                      Add Role
                    </button>
                  </div>
                )}
                {isManager && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal('user')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                      <Users className="h-4 w-4" />
                      Add User
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Branches Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.filter(branch => {
                    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      branch.code.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === 'all' ||
                      (statusFilter === 'active' && branch.is_active) ||
                      (statusFilter === 'inactive' && !branch.is_active);
                    return matchesSearch && matchesStatus;
                  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{branch.address || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.users_count || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${branch.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!isManager && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(branch, 'branch')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(branch, 'branch')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button
                  onClick={() => openModal('user')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.filter(user => {
                    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === 'all' ||
                      (statusFilter === 'active' && user.is_active) ||
                      (statusFilter === 'inactive' && !user.is_active);
                    return matchesSearch && matchesStatus;
                  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                              {user.profile_picture ? (
                                <img src={user.profile_picture} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <span className="text-sm font-bold text-blue-600 uppercase">{user.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${user.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              {user.name}
                              {user.is_online && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Online</span>}
                            </div>
                            {!user.is_online && user.last_seen_at && (
                              <div className="text-[10px] text-gray-400 font-medium italic mt-0.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Last seen: {formatDateTime(user.last_seen_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.branch?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.roles?.map(role => role.name).join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user, 'user')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openUserPermissions(user)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Permissions"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/company-settings/users/${user.id}`)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="View User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openLoginLogs(user)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Login History"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user, 'user')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams Tab Content (Hierarchical View) */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {users
              .filter(u => u.roles?.some(r => (typeof r === 'string' ? r === 'Manager' : r.name === 'Manager')))
              .map(manager => (
                <div key={manager.id} className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                  {/* Manager Header */}
                  <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="bg-white/20 h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center border border-white/20 shadow-inner">
                          {manager.profile_picture ? (
                            <img src={manager.profile_picture} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <UserCheck className="h-6 w-6" />
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-blue-600 shadow-sm ${manager.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{manager.name}</h3>
                          {manager.is_online && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase backdrop-blur-sm">Online</span>}
                        </div>
                        <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Manager</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4">
                        <p className="text-xs text-blue-200 uppercase">Team Summary</p>
                        <p className="text-sm font-medium">
                          {users.filter(u => u.reports_to == manager.id).length} TLs |
                          {users.filter(u => {
                            const tlIds = users.filter(usr => usr.reports_to == manager.id).map(usr => usr.id);
                            return tlIds.includes(parseInt(u.reports_to));
                          }).length} Members
                        </p>
                      </div>
                      <button
                        onClick={() => openLoginLogs(manager)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20"
                        title="Login History"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(manager, 'user')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Team Leaders Section */}
                  <div className="p-4 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {users
                        .filter(u => u.reports_to == manager.id && u.roles?.some(r => (typeof r === 'string' ? r === 'Team Leader' : r.name === 'Team Leader')))
                        .map(tl => (
                          <div key={tl.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            {/* TL Info */}
                            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden text-blue-600 border border-blue-200 shadow-sm font-bold">
                                    {tl.profile_picture ? (
                                      <img src={tl.profile_picture} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                      tl.name.charAt(0)
                                    )}
                                  </div>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${tl.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-800">{tl.name}</h4>
                                    {tl.is_online && <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold uppercase">Online</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium tracking-wide">TEAM LEADER</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openLoginLogs(tl)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Login History"
                                >
                                  <Clock className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(tl, 'user')}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Change Manager/Details"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Employees under this TL */}
                            <div className="p-4 flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  Team Members ({users.filter(u => u.reports_to == tl.id).length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {users
                                  .filter(u => u.reports_to == tl.id)
                                  .map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                                      <div className="flex items-center gap-3">
                                        <div className="relative">
                                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-gray-500 text-xs font-semibold border border-gray-200 shadow-sm">
                                            {emp.profile_picture ? (
                                              <img src={emp.profile_picture} className="h-full w-full object-cover" alt="" />
                                            ) : (
                                              emp.name.charAt(0)
                                            )}
                                          </div>
                                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${emp.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-gray-700">{emp.name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                            {emp.roles?.map(r => r.name).join(', ')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                          onClick={() => openLoginLogs(emp)}
                                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                          title="Login History"
                                        >
                                          <Clock className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleEdit(emp, 'user')}
                                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                          title="Change Team Leader/Details"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                {users.filter(u => u.reports_to == tl.id).length === 0 && (
                                  <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-xs text-gray-400 italic">No members assigned</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {users.filter(u => u.reports_to == manager.id && u.roles?.some(r => (typeof r === 'string' ? r === 'Team Leader' : r.name === 'Team Leader'))).length === 0 && (
                        <div className="lg:col-span-2 py-8 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No Team Leaders assigned to {manager.name}</p>
                          <button
                            onClick={() => openModal('user')}
                            className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
                          >
                            Assign a Team Leader
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Unassigned Staff Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-200 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Unassigned Staff</h3>
                    <p className="text-gray-500 text-xs">Users not reporting to anyone</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {users
                    .filter(u => !u.reports_to && !u.roles?.some(r => (typeof r === 'string' ? ['Super Admin', 'Admin', 'Company Admin', 'Manager'].includes(r) : ['Super Admin', 'Admin', 'Company Admin', 'Manager'].includes(r.name))))
                    .map(emp => (
                      <div key={emp.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-gray-500 font-bold border border-gray-200">
                              {emp.profile_picture ? (
                                <img src={emp.profile_picture} className="h-full w-full object-cover" alt="" />
                              ) : (
                                emp.name.charAt(0)
                              )}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${emp.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-800">{emp.name}</p>
                              {emp.is_online && <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold uppercase">Online</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.roles?.map(r => r.name).join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-all">
                          <button
                            onClick={() => openLoginLogs(emp)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Login History"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(emp, 'user')}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Assign Supervisor/Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {users.filter(u => !u.reports_to && !u.roles?.some(r => (typeof r === 'string' ? ['Super Admin', 'Admin', 'Company Admin', 'Manager'].includes(r) : ['Super Admin', 'Admin', 'Company Admin', 'Manager'].includes(r.name)))).length === 0 && (
                    <div className="col-span-full py-4 text-center text-gray-400 text-sm italic">
                      All staff members are assigned to a team.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab Content */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {!isManager && (
                  <button
                    onClick={() => openModal('role')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Role
                  </button>
                )}
              </div>
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles
                    .filter(role =>
                      role.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .map((role) => (
                      <tr key={role.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.map(permission => (
                              <span key={permission} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                {permission}
                              </span>
                            )) || 'No permissions defined'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {users.filter(user => user.roles?.some(userRole => userRole.name === role.name)).length} users
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!isManager && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openRolePermissions(role)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Permissions"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(role, 'role')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(role, 'role')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <Dialog visible={showModal} className='bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto' header={()=>(
  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                  {modalType === 'login-logs' ? (
                    <><Clock className="h-5 w-5 text-amber-500" /> User Login History</>
                  ) : editingItem ? `Edit ${modalType}` : `Add ${modalType}`}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
        )} 
        
        showCloseIcon={false}
        >
 {modalType === 'login-logs' ? (
                <div className="p-6">
                  <div className="mb-6 flex flex-col gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-amber-900 leading-tight">Activity Log</h3>
                        <p className="text-sm text-amber-700 font-medium">Tracking history for <span className="underline decoration-amber-300 font-bold">{editingItem?.name}</span></p>
                      </div>
                      <div className="flex bg-white/50 p-1 rounded-full border border-amber-200/50 shadow-inner">
                        <button 
                           onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              const filters = { from_date: today, to_date: today };
                              setLogFilter({ ...filters, type: 'today' });
                              openLoginLogs(editingItem, 1, filters);
                           }}
                           className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${logFilter.type === 'today' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                        >Today</button>
                        <button 
                           onClick={() => {
                              const d = new Date();
                              const today = d.toISOString().split('T')[0];
                              const weekAgo = new Date(d.setDate(d.getDate() - 7)).toISOString().split('T')[0];
                              const filters = { from_date: weekAgo, to_date: today };
                              setLogFilter({ ...filters, type: 'week' });
                              openLoginLogs(editingItem, 1, filters);
                           }}
                           className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${logFilter.type === 'week' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                        >Weekly</button>
                        <button 
                           onClick={() => {
                              const d = new Date();
                              const today = d.toISOString().split('T')[0];
                              const monthAgo = new Date(d.setMonth(d.getMonth() - 1)).toISOString().split('T')[0];
                              const filters = { from_date: monthAgo, to_date: today };
                              setLogFilter({ ...filters, type: 'month' });
                              openLoginLogs(editingItem, 1, filters);
                           }}
                           className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${logFilter.type === 'month' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                        >Monthly</button>
                        <button 
                           onClick={() => {
                              setLogFilter({ ...logFilter, type: 'custom' });
                           }}
                           className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${logFilter.type === 'custom' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-100'}`}
                        >
                          <Calendar className="h-3 w-3" /> Custom
                        </button>
                      </div>
                    </div>

                    {logFilter.type === 'custom' && (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm animate-in fade-in slide-in-from-top-2 border-l-4 border-l-amber-500">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">From Date</label>
                          <input 
                            type="date" 
                            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            value={logFilter.from_date}
                            onChange={(e) => setLogFilter({ ...logFilter, from_date: e.target.value })}
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">To Date</label>
                          <input 
                            type="date" 
                            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-100 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            value={logFilter.to_date}
                            onChange={(e) => setLogFilter({ ...logFilter, to_date: e.target.value })}
                          />
                        </div>
                        <button 
                          disabled={!logFilter.from_date || !logFilter.to_date || logsLoading}
                          onClick={() => openLoginLogs(editingItem, 1, logFilter)}
                          className="bg-amber-900 text-white p-2 rounded-lg hover:bg-black disabled:opacity-50 h-fit mt-4 transition-all shadow-md active:scale-95"
                        >
                          {logsLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div> : <Search className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-200/20 py-1 px-3 rounded-md w-fit">
                        <Filter className="h-3 w-3" /> Selected Period: {presenceSummary.period_label}
                    </div>
                  </div>

                  {presenceSummary.is_absent && (
                    <div className="bg-red-50 border border-red-100 p-6 rounded-xl mb-6 flex flex-col items-center text-center gap-3 animate-pulse">
                      <div className="p-3 bg-red-100 rounded-full">
                        <X className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-red-900 uppercase">No Activity Recorded</h4>
                        <p className="text-[11px] text-red-700 font-bold uppercase mt-1">This employee was likely on leave (chuti) during this time.</p>
                      </div>
                    </div>
                  )}

                  {/* Today's Summary Section */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col items-center transition-all hover:bg-blue-50 group">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Time</span>
                      </div>
                      <p className="text-xl font-black text-blue-900">{presenceSummary.formatted_time}</p>
                      <p className="text-[9px] text-blue-400 font-bold uppercase mt-1">{logFilter.type === 'today' ? 'Today' : 'Total Range'}</p>
                    </div>

                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-col items-center transition-all hover:bg-amber-50 group">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-3.5 w-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Work Count</span>
                      </div>
                      <p className="text-xl font-black text-amber-900">{presenceSummary.login_count}</p>
                      <p className="text-[9px] text-amber-400 font-bold uppercase mt-1">Total Sessions</p>
                    </div>

                    <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex flex-col items-center transition-all hover:bg-red-50 group">
                      <div className="flex items-center gap-2 mb-1">
                        <ToggleRight className="h-3.5 w-3.5 text-red-600 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Finished</span>
                      </div>
                      <p className="text-xl font-black text-red-900">{presenceSummary.logout_count}</p>
                      <p className="text-[9px] text-red-400 font-bold uppercase mt-1">Logouts</p>
                    </div>
                  </div>

                  {logsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                       <LogoLoader text="Fetching records..." compact={true} />
                    </div>
                  ) : loginLogs.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-3">
                        {loginLogs.map((log) => (
                          <div key={log.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-amber-200 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${log.logout_at ? 'bg-gray-300' : 'bg-green-500 animate-pulse'}`}></div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${log.logout_at ? 'text-gray-400' : 'text-green-600'}`}>
                                  {log.logout_at ? 'Completed Session' : 'Currently Online'}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gray-100">
                                <Clock className="h-3 w-3" />
                                {calculateDuration(log.login_at, log.logout_at)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100/50">
                                <p className="text-[9px] text-blue-400 font-bold uppercase mb-1">Login Timestamp</p>
                                <p className="text-xs font-bold text-blue-900">{formatDateTime(log.login_at)}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Logout Timestamp</p>
                                <p className={`text-xs font-bold ${log.logout_at ? 'text-gray-900' : 'text-green-600 italic'}`}>
                                  {log.logout_at ? formatDateTime(log.logout_at) : 'Active Now'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">IP:</span>
                                  <span className="text-[10px] font-mono font-bold text-gray-600">{log.ip_address || '---'}</span>
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-300 font-medium truncate max-w-[150px]">{log.user_agent}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-gray-100">
                        <Clock className="h-8 w-8 text-gray-300" />
                      </div>
                      <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-1">No Activity Found</h4>
                      <p className="text-gray-500 text-[10px] font-bold uppercase">No records found for the selected period.</p>
                    </div>
                  )}

                  {loginPagination && loginPagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        Page {loginPagination.current_page} <span className="text-gray-200 mx-1">/</span> {loginPagination.last_page}
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={loginPagination.current_page === 1 || logsLoading}
                          onClick={() => openLoginLogs(editingItem, loginPagination.current_page - 1, logFilter)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-gray-200 shadow-sm"
                        >
                          <ChevronLeft className="h-3 w-3" /> Previous
                        </button>
                        <button
                          disabled={loginPagination.current_page === loginPagination.last_page || logsLoading}
                          onClick={() => openLoginLogs(editingItem, loginPagination.current_page + 1, logFilter)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-gray-200 shadow-sm"
                        >
                          Next <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setLogFilter({ from_date: '', to_date: '', type: 'today' });
                      }}
                      className="px-8 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black font-bold text-sm shadow-xl shadow-gray-200 transition-all active:scale-95"
                    >
                      Dismiss History
                    </button>
                  </div>
                </div>
              ) : isPermissionsModal ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {modalType === 'role-permissions' ? 'Role Permissions' : 'User Permissions'}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium pb-2 border-b-2 border-blue-100 inline-block">
                        {editingItem?.name || editingItem?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {selectedPermissions.length === permissionsList.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {permissionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LogoLoader compact={true} text="Loading permissions..." />
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                      {(() => {
                        // Group permissions
                        const grouped = {};
                        permissionsList.forEach(p => {
                          const parts = p.name.split('.');
                          const groupName = parts[0];
                          if (!grouped[groupName]) {
                            grouped[groupName] = [];
                          }
                          grouped[groupName].push(p);
                        });

                        return Object.entries(grouped).map(([group, perms]) => {
                          // Find the main permission for the group (e.g. "leads_management")
                          const mainPerm = perms.find(p => p.name === group);
                          const subPerms = perms.filter(p => p.name !== group);

                          // Sort sub-permissions: create, edit, delete
                          const sortOrder = { 'create': 1, 'edit': 2, 'delete': 3 };
                          subPerms.sort((a, b) => {
                            const actionA = a.name.split('.')[1] || '';
                            const actionB = b.name.split('.')[1] || '';
                            return (sortOrder[actionA] || 99) - (sortOrder[actionB] || 99);
                          });

                          return (
                            <div key={group} className="mb-6 bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                <h4 className="font-semibold text-gray-800 capitalize">
                                  {group.replace(/_/g, ' ')}
                                </h4>
                                {mainPerm && (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(mainPerm.id)}
                                      onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        let newSelected = [...selectedPermissions];

                                        // Toggle main permission
                                        if (isChecked) {
                                          if (!newSelected.includes(mainPerm.id)) newSelected.push(mainPerm.id);
                                          // Auto-select all sub-permissions if checking main
                                          subPerms.forEach(sp => {
                                            if (!newSelected.includes(sp.id)) newSelected.push(sp.id);
                                          });
                                        } else {
                                          newSelected = newSelected.filter(id => id !== mainPerm.id);
                                          // Auto_deselect sub-permissions if unchecking main
                                          subPerms.forEach(sp => {
                                            newSelected = newSelected.filter(id => id !== sp.id);
                                          });
                                        }
                                        setSelectedPermissions(newSelected);
                                      }}
                                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Enable Module</span>
                                  </label>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-2">
                                {subPerms.map((permission) => {
                                  const action = permission.name.split('.')[1];
                                  return (
                                    <label
                                      key={permission.id}
                                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(permission.id)}
                                        onChange={() => togglePermission(permission.id)}
                                        // Disable sub-permissions if main permission is not checked (optional, but good UX)
                                        disabled={mainPerm && !selectedPermissions.includes(mainPerm.id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                      />
                                      <span className="text-sm text-gray-700 capitalize">
                                        {action || permission.name}
                                      </span>
                                    </label>
                                  );
                                })}
                                {subPerms.length === 0 && !mainPerm && perms.map(p => (
                                  <label
                                    key={p.id}
                                    className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.includes(p.id)}
                                      onChange={() => togglePermission(p.id)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {p.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={savePermissions}
                      disabled={permissionsLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div>
                    <div className="p-6">
                      {modalType === 'role' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => {
                                const nextName = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  name: nextName,
                                  slug: generateSlug(nextName),
                                }));
                              }}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role Slug *</label>
                            <input
                              type="text"
                              value={formData.slug}
                              required
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                            />
                          </div>
                        </div>
                      ) : modalType === 'branch' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Address</label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : modalType === 'user' && selectedUser ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                name="user_email_new"
                                autoComplete="off"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                              <select
                                value={formData.branch_id}
                                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Branch</option>
                                {branches.map(branch => (
                                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                              <select
                                multiple
                                value={formData.roles}
                                onChange={(e) => setFormData({ ...formData, roles: Array.from(e.target.selectedOptions).map(option => option.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {roles.map(role => (
                                  <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                              <input
                                type="text"
                                value={formData.employee_id}
                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                              <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                name="user_password_new"
                                autoComplete="new-password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                              <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                              <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                              <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                              <input
                                type="text"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.roles?.some(r => ['Employee', 'Employe', 'Sales Rep'].includes(r))
                                  ? 'Reports To (Team Leader/Manager)'
                                  : 'Reports To (Supervisor/Manager)'}
                              </label>
                              <select
                                value={formData.reports_to}
                                onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">None (Top Level)</option>
                                {users.filter(u => {
                                  if (u.id === editingItem?.id) return false;
                                  const roles = formData.roles || [];
                                  const isStaff = roles.some(r => ['Employee', 'Employe', 'Sales Rep'].includes(r));
                                  const isTL = roles.includes('Team Leader');

                                  if (isStaff) {
                                    // Employees report to TLs or Managers
                                    return u.roles?.some(r => ['Team Leader', 'Manager'].includes(typeof r === 'string' ? r : r.name));
                                  } else if (isTL) {
                                    // TLs report to Managers
                                    return u.roles?.some(r => ['Manager', 'Admin', 'Company Admin'].includes(typeof r === 'string' ? r : r.name));
                                  } else {
                                    // Others report to Managers/Admins
                                    return u.roles?.some(r => ['Manager', 'Admin', 'Company Admin'].includes(typeof r === 'string' ? r : r.name));
                                  }
                                }).map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.roles?.map(r => typeof r === 'string' ? r : r.name).join(', ')})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                              name="user_email_new"
                              autoComplete="off"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <select
                              value={formData.branch_id}
                              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Branch</option>
                              {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                            <select
                              multiple
                              value={formData.roles}
                              onChange={(e) => setFormData({ ...formData, roles: Array.from(e.target.selectedOptions).map(option => option.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={formData.is_active}
                              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                              type="text"
                              value={formData.employee_id}
                              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              name="user_password_new"
                              autoComplete="new-password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {formData.roles?.some(r => ['Employee', 'Employe', 'Sales Rep'].includes(r))
                                ? 'Reports To (Team Leader/Manager)'
                                : 'Reports To (Supervisor/Manager)'}
                            </label>
                            <select
                              value={formData.reports_to}
                              onChange={(e) => setFormData({ ...formData, reports_to: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">None (Top Level)</option>
                              {users.filter(u => {
                                if (u.id === editingItem?.id) return false;
                                const roles = formData.roles || [];
                                const isStaff = roles.some(r => ['Employee', 'Employe', 'Sales Rep'].includes(r));
                                const isTL = roles.includes('Team Leader');

                                if (isStaff) {
                                  // Employees report to TLs or Managers
                                  return u.roles?.some(r => ['Team Leader', 'Manager'].includes(typeof r === 'string' ? r : r.name));
                                } else if (isTL) {
                                  // TLs report to Managers
                                  return u.roles?.some(r => ['Manager', 'Admin', 'Company Admin'].includes(typeof r === 'string' ? r : r.name));
                                } else {
                                  // Others report to Managers/Admins
                                  return u.roles?.some(r => ['Manager', 'Admin', 'Company Admin'].includes(typeof r === 'string' ? r : r.name));
                                }
                              }).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.roles?.map(r => typeof r === 'string' ? r : r.name).join(', ')})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-4 mt-6">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                        >
                          {editingItem ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            setEditingItem(null);
                            resetForm();
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
        </Dialog>
      
      </div>
        </>
      )}
    </div>
  );
};

export default TeamManagement;
