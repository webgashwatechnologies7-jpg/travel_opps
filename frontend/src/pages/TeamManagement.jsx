import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
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
  Key,
  Info,
  Eye
} from 'lucide-react';
import { companySettingsAPI } from '../services/api';

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
    permissions: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Allow deep-links like ?tab=users|branches|roles from Staff Management menu
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['users', 'branches', 'roles'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

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
      permissions: []
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
          roles: formData.roles || [],
          is_active: formData.is_active,
          password: formData.password,
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
      address: item.address || ''
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


  const openModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const isPermissionsModal = modalType === 'role-permissions' || modalType === 'user-permissions';

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
      {notification.text && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
          <div
            className={`px-4 py-3 rounded shadow-lg text-sm transition-all duration-300 ${
              notification.type === 'success'
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
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
                onClick={() => setActiveTab('branches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'branches'
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            branch.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{user.name.charAt(0)}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">ID: {user.employee_id || 'N/A'}</div>
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active
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
                <button
                  onClick={() => openModal('role')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Role
                </button>
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(role, 'role')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openRolePermissions(role)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Permissions"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(role, 'role')}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingItem ? `Edit ${modalType}` : `Add ${modalType}`}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isPermissionsModal ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {modalType === 'role-permissions' ? 'Role Permissions' : 'User Permissions'}
                      </h3>
                      <p className="text-sm text-gray-600">
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {permissionsList.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{permission.name}</span>
                        </label>
                      ))}
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
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamManagement;
