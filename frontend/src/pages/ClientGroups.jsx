import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MoreVertical,
  Download,
  Upload,
  UserPlus,
  Settings,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const ClientGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/marketing/client-groups');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load client groups');
      // Fallback to mock data for demonstration
      const mockGroups = [
        {
          id: 1,
          name: 'VIP Clients',
          description: 'High-value clients with premium services',
          client_count: 45,
          type: 'premium',
          created_at: '2024-01-15',
          created_by: 'John Doe',
          status: 'active',
          total_revenue: 125000,
          avg_booking_value: 2500
        },
        {
          id: 2,
          name: 'Corporate Groups',
          description: 'Business clients and corporate bookings',
          client_count: 32,
          type: 'corporate',
          created_at: '2024-01-12',
          created_by: 'Jane Smith',
          status: 'active',
          total_revenue: 89000,
          avg_booking_value: 1800
        },
        {
          id: 3,
          name: 'Family Travelers',
          description: 'Family vacation packages and group tours',
          client_count: 78,
          type: 'family',
          created_at: '2024-01-10',
          created_by: 'Mike Johnson',
          status: 'active',
          total_revenue: 156000,
          avg_booking_value: 1200
        },
        {
          id: 4,
          name: 'International Tours',
          description: 'Clients interested in international destinations',
          client_count: 23,
          type: 'international',
          created_at: '2024-01-08',
          created_by: 'Sarah Wilson',
          status: 'inactive',
          total_revenue: 67000,
          avg_booking_value: 3200
        },
        {
          id: 5,
          name: 'Weekend Getaways',
          description: 'Short trip and weekend vacation clients',
          client_count: 56,
          type: 'leisure',
          created_at: '2024-01-05',
          created_by: 'Tom Brown',
          status: 'active',
          total_revenue: 45000,
          avg_booking_value: 800
        }
      ];
      setGroups(mockGroups);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      status: group.status
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/marketing/client-groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setGroups(groups.map(g => 
          g.id === selectedGroup.id ? { ...g, ...formData } : g
        ));
        setShowEditModal(false);
        setSelectedGroup(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update client group');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      premium: 'bg-purple-100 text-purple-800',
      corporate: 'bg-blue-100 text-blue-800',
      family: 'bg-green-100 text-green-800',
      international: 'bg-orange-100 text-orange-800',
      leisure: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
                <h1 className="text-3xl font-bold text-gray-900">Client Groups</h1>
                <p className="text-gray-600 mt-1">Manage your client groups and segmentations</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  <span>Add Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Groups</p>
                  <p className="text-3xl font-bold mt-2">{groups.length}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{groups.reduce((sum, g) => sum + g.client_count, 0)} Total Clients</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Groups</p>
                  <p className="text-3xl font-bold mt-2">{groups.filter(g => g.status === 'active').length}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Currently Active</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold mt-2">
                    ${groups.reduce((sum, g) => sum + g.total_revenue, 0).toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>All Time</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Booking</p>
                  <p className="text-3xl font-bold mt-2">
                    ${Math.round(groups.reduce((sum, g) => sum + g.avg_booking_value, 0) / groups.length || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Per Client</span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Groups Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Client Groups</h2>
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
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{group.name}</div>
                            <div className="text-sm text-gray-500">{group.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(group.type)}`}>
                            {group.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{group.client_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">${group.total_revenue.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">${group.avg_booking_value.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(group.status)}`}>
                            {group.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{group.created_by}</div>
                            <div className="text-xs text-gray-500">{new Date(group.created_at).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedGroup(group);
                                setShowViewModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEdit(group)}
                              className="text-green-600 hover:text-green-900" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600" title="More">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No client groups found</p>
                        <p className="text-sm text-gray-500 mt-2">Create your first client group to get started</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Client Group</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter group description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Group Modal */}
      {showViewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedGroup.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{selectedGroup.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Clients</p>
                  <p className="font-medium">{selectedGroup.client_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-medium">{selectedGroup.created_by}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{selectedGroup.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">${selectedGroup.total_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Average Booking</p>
                  <p className="text-2xl font-bold text-green-900">${selectedGroup.avg_booking_value.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedGroup);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientGroups;