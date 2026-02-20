import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Edit, X, Trash2 } from 'lucide-react';
import { mealPlansAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MealPlan = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMealPlanId, setEditingMealPlanId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.is_super_admin || user?.roles?.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return ['Admin', 'Company Admin', 'Super Admin'].includes(roleName);
  });

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const response = await mealPlansAPI.list();
      setMealPlans(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setMealPlans([]);
      } else {
        setError('Failed to load meal plans');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingMealPlanId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      status: 'active'
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMealPlanId(null);
    setFormData({
      name: '',
      status: 'active'
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingMealPlanId) {
        await mealPlansAPI.update(editingMealPlanId, formData);
        setError('');
      } else {
        await mealPlansAPI.create(formData);
        setError('');
      }

      await fetchMealPlans();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || (editingMealPlanId ? 'Failed to update meal plan' : 'Failed to add meal plan'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mealPlan) => {
    setEditingMealPlanId(mealPlan.id);
    setIsModalOpen(true);

    setFormData({
      name: mealPlan.name || '',
      status: mealPlan.status || 'active'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) return;

    try {
      await mealPlansAPI.delete(id);
      await fetchMealPlans();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meal plan');
      console.error(err);
    }
  };

  const filteredMealPlans = mealPlans.filter(mealPlan => {
    const name = mealPlan.name || '';
    const searchLower = searchTerm.toLowerCase();
    return name.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Meal Plan</h1>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            {/* Action Button */}
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Plus className="h-5 w-5" />
              Add New
            </button>
          </div>
        </div>

        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Meal Plans Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMealPlans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No meal plans found
                    </td>
                  </tr>
                ) : (
                  filteredMealPlans.map((mealPlan) => (
                    <tr key={mealPlan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mealPlan.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${mealPlan.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {mealPlan.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mealPlan.created_by_name || 'Travbizz Travel IT Solutions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(mealPlan.updated_at || mealPlan.last_update)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(mealPlan)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(mealPlan.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Meal Plan Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingMealPlanId ? 'Edit Meal Plan' : 'Add Meal Plan'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave}>
                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meal plan name"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (editingMealPlanId ? 'Updating...' : 'Saving...') : 'Save'}
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

export default MealPlan;

