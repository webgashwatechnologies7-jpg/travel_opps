import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';
import Layout from '../components/Layout';
import AddCorporateModal from '../components/AddCorporateModal';
import { toast } from 'react-toastify';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

const Corporate = () => {
  const [corporates, setCorporates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCorporate, setSelectedCorporate] = useState(null);

  useEffect(() => {
    fetchCorporates();
  }, []);

  const fetchCorporates = async () => {
    try {
      const response = await accountsAPI.getCorporate();
      if (response.data.success) {
        setCorporates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch corporates:', error);
      // Fallback only if no data at all
      if (corporates.length === 0) {
        /*
        const mockCorporates = [
          {
            id: 1,
            companyName: 'Tech Solutions Pvt Ltd',
            industry: 'Information Technology',
            contactPerson: 'Sanjay Mehta',
            designation: 'HR Manager',
            mobile: '+91 98765 43210',
            email: 'sanjay@techsolutions.com',
            queries: 25,
            lastQuery: '2024-01-15',
            city: 'Pune',
            createdBy: 'Agent A',
            creditLimit: '₹5,00,000',
            status: 'Active'
          }
        ];
        setCorporates(mockCorporates);
        */
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCorporate = async (corporateData) => {
    try {
      const response = await accountsAPI.createCorporate(corporateData);
      if (response.data.success) {
        toast.success('Corporate client added successfully');
        fetchCorporates();
      } else {
        toast.error(response.data.message || 'Failed to add corporate client');
      }
    } catch (error) {
      console.error('Error adding corporate:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong while adding the corporate client.';
      toast.error(errorMessage);
    }
  };

  const handleUpdateCorporate = async (corporateData) => {
    try {
      const response = await accountsAPI.updateCorporate(selectedCorporate.id, corporateData);
      if (response.data.success) {
        toast.success('Corporate client updated successfully');
        fetchCorporates();
        setShowEditModal(false);
        setSelectedCorporate(null);
      } else {
        toast.error(response.data.message || 'Failed to update corporate client');
      }
    } catch (error) {
      console.error('Error updating corporate:', error);
      const errorMessage = error.response?.data?.message || 'Something went wrong while updating the corporate client.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCorporate = async (id) => {
    if (window.confirm('Are you sure you want to delete this corporate client?')) {
      try {
        const response = await accountsAPI.deleteCorporate(id);
        if (response.data.success) {
          toast.success('Corporate client deleted successfully');
          fetchCorporates();
        } else {
          toast.error(response.data.message || 'Failed to delete corporate client');
        }
      } catch (error) {
        console.error('Error deleting corporate:', error);
        const errorMessage = error.response?.data?.message || 'Something went wrong while deleting the corporate client.';
        toast.error(errorMessage);
      }
    }
  };

  const filteredCorporates = (corporates || []).filter(corporate =>
    (corporate.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (corporate.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (corporate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (corporate.mobile || '').includes(searchTerm)
  );

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
      <div className="p-4">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Corporate</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search corporate clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Query</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCorporates.map((corporate) => (
                  <tr key={corporate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{corporate.companyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{corporate.contactPerson}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.queries}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.lastQuery}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{corporate.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{corporate.creditLimit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {corporate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCorporate(corporate);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCorporate(corporate.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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
          {filteredCorporates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-2">No corporate clients found</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:underline"
              >
                Add your first corporate client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCorporateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCorporate}
      />

      <AddCorporateModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorporate(null);
        }}
        onSave={handleUpdateCorporate}
        editMode={true}
        initialData={selectedCorporate}
      />
    </Layout>
  );
};

export default Corporate;

