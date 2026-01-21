import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companySettingsAPI } from '../services/api';
import Layout from '../components/Layout';
import { ArrowLeft, User, Mail, Phone, Building, Shield, Calendar, Edit, Save, X, MapPin, Users, PhoneCall, CheckCircle, ClipboardList } from 'lucide-react';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState('');
  const [selectedRange, setSelectedRange] = useState('month');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    is_active: true
  });

  useEffect(() => {
    fetchUserDetails();
    fetchUserPerformance();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      console.log('Fetching user details for ID:', id);
      
      // Fetch user details
      const userResponse = await companySettingsAPI.getUserDetails(id);
      console.log('User response:', userResponse);
      
      if (userResponse && userResponse.data && userResponse.data.success) {
        setUser(userResponse.data.data);
        setEditForm({
          name: userResponse.data.data.name,
          email: userResponse.data.data.email,
          phone: userResponse.data.data.phone || '',
          employee_id: userResponse.data.data.employee_id || '',
          address: userResponse.data.data.address || '',
          city: userResponse.data.data.city || '',
          state: userResponse.data.data.state || '',
          country: userResponse.data.data.country || '',
          postal_code: userResponse.data.data.postal_code || '',
          is_active: userResponse.data.data.is_active
        });
      } else {
        console.log('Using mock user data');
        // Use mock data if API fails
        const mockUser = {
          id: id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 98765 43210',
          employee_id: 'EMP001',
          branch: {
            id: 1,
            name: 'Head Office',
            code: 'HO001'
          },
          roles: [
            { id: 1, name: 'Admin' },
            { id: 2, name: 'Sales' }
          ],
          address: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postal_code: '400001',
          is_active: true,
          created_at: '2024-01-15',
          last_login: '2024-01-20 10:30:00',
          email_verified: true,
          phone_verified: false
        };

        setUser(mockUser);
        setEditForm({
          name: mockUser.name,
          email: mockUser.email,
          phone: mockUser.phone,
          employee_id: mockUser.employee_id,
          address: mockUser.address,
          city: mockUser.city,
          state: mockUser.state,
          country: mockUser.country,
          postal_code: mockUser.postal_code,
          is_active: mockUser.is_active
        });
      }

    } catch (error) {
      console.error('Failed to fetch user details:', error);
      
      // Fallback to mock data if API fails
      const mockUser = {
        id: id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        employee_id: 'EMP001',
        branch: {
          id: 1,
          name: 'Head Office',
          code: 'HO001'
        },
        roles: [
          { id: 1, name: 'Admin' },
          { id: 2, name: 'Sales' }
        ],
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400001',
        is_active: true,
        created_at: '2024-01-15',
        last_login: '2024-01-20 10:30:00',
        email_verified: true,
        phone_verified: false
      };

      setUser(mockUser);
      setEditForm({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        employee_id: mockUser.employee_id,
        address: mockUser.address,
        city: mockUser.city,
        state: mockUser.state,
        country: mockUser.country,
        postal_code: mockUser.postal_code,
        is_active: mockUser.is_active
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPerformance = async () => {
    try {
      const response = await companySettingsAPI.getUserPerformance(id);
      if (response?.data?.success) {
        setPerformance(response.data.data);
      } else {
        setPerformanceError('Failed to load performance data');
      }
    } catch (error) {
      console.error('Failed to fetch user performance:', error);
      setPerformanceError('Failed to load performance data');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleEditUser = () => {
    setEditingUser(true);
  };

  const handleSaveUser = async () => {
    try {
      const response = await companySettingsAPI.updateUser(id, editForm);
      if (response.data.success) {
        setUser({
          ...user,
          ...editForm
        });
        setEditingUser(false);
        alert('User updated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      employee_id: user.employee_id || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      postal_code: user.postal_code || '',
      is_active: user.is_active
    });
    setEditingUser(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-600">The user you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/company-settings/team-management')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Team Management
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/company-settings/team-management')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                {!editingUser ? (
                  <button
                    onClick={handleEditUser}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit User"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveUser}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Save Changes"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editingUser ? (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <input
                        type="text"
                        name="employee_id"
                        value={editForm.employee_id}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <input
                        type="text"
                        name="address"
                        value={editForm.address}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">City</p>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">State</p>
                      <input
                        type="text"
                        name="state"
                        value={editForm.state}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Country</p>
                      <input
                        type="text"
                        name="country"
                        value={editForm.country}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Postal Code</p>
                      <input
                        type="text"
                        name="postal_code"
                        value={editForm.postal_code}
                        onChange={handleEditFormChange}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {user.email_verified && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded ml-2">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{user.phone || 'N/A'}</p>
                      {user.phone_verified && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded ml-2">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium text-gray-900">{user.employee_id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Branch</p>
                      <p className="font-medium text-gray-900">{user.branch?.name || 'N/A'}</p>
                      {user.branch?.code && (
                        <p className="text-xs text-gray-500">Code: {user.branch.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Roles</p>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map(role => (
                          <span key={role.id} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {role.name}
                          </span>
                        )) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{user.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-medium text-gray-900">{user.created_at || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-900">{user.last_login || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{user.roles?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Branch</p>
                <p className="text-lg font-bold text-gray-900">{user.branch?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Email Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {user.email_verified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Phone Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {user.phone_verified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
              <div className="flex items-center space-x-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedRange === range
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {performanceLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : performanceError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {performanceError}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Assigned Leads</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.assigned_to_user ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ClipboardList className="h-6 w-6 text-indigo-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Leads Contacted</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.contacted_leads ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <PhoneCall className="h-6 w-6 text-orange-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Calls Made</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.calls_count ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Bookings Confirmed</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.confirmed_by_user ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Assigned By</h3>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {performance?.ranges?.[selectedRange]?.assigned_by_breakdown?.length ? (
                        performance.ranges[selectedRange].assigned_by_breakdown.map((item) => (
                          <div key={item.user_id ?? item.name} className="flex items-center justify-between text-sm text-gray-700">
                            <span>{item.name}</span>
                            <span className="font-semibold text-gray-900">{item.count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No assignments found for this period.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Activity Summary</h3>
                    </div>
                    <div className="px-4 py-3 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Followups</span>
                        <span className="font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.followups_count ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Leads Assigned By User</span>
                        <span className="font-semibold text-gray-900">
                          {performance?.ranges?.[selectedRange]?.assigned_by_user ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Calls</h3>
                  </div>
                  <div className="px-4 py-3">
                    {performance?.ranges?.[selectedRange]?.recent_calls?.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-left text-gray-500">
                            <tr>
                              <th className="py-2 pr-4">Lead</th>
                              <th className="py-2 pr-4">Phone</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2 pr-4">Duration</th>
                              <th className="py-2 pr-4">Recording</th>
                              <th className="py-2">Date</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            {performance.ranges[selectedRange].recent_calls.map((call) => (
                              <tr key={call.id} className="border-t border-gray-100">
                                <td className="py-2 pr-4">{call.lead_name || 'N/A'}</td>
                                <td className="py-2 pr-4">{call.lead_phone || 'N/A'}</td>
                                <td className="py-2 pr-4">{call.call_status || 'N/A'}</td>
                                <td className="py-2 pr-4">
                                  {call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}
                                </td>
                                <td className="py-2 pr-4">
                                  {call.recording_url ? (
                                    <a
                                      href={call.recording_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    'N/A'
                                  )}
                                </td>
                                <td className="py-2">
                                  {call.created_at ? new Date(call.created_at).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No call logs found for this period.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;
