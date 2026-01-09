import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Edit, X, Trash2 } from 'lucide-react';
import { packageThemesAPI } from '../services/api';

const PackageTheme = () => {
  const [packageThemes, setPackageThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageThemeId, setEditingPackageThemeId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: null,
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState(null);

  useEffect(() => {
    fetchPackageThemes();
  }, []);

  const fetchPackageThemes = async () => {
    try {
      setLoading(true);
      const response = await packageThemesAPI.list();
      setPackageThemes(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setPackageThemes([]);
      } else {
        setError('Failed to load package themes');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingPackageThemeId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      icon: null,
      status: 'active'
    });
    setIconPreview(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackageThemeId(null);
    setFormData({
      name: '',
      icon: null,
      status: 'active'
    });
    setIconPreview(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        icon: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const themeData = new FormData();
      themeData.append('name', formData.name);
      if (formData.icon) {
        themeData.append('icon', formData.icon);
      }
      themeData.append('status', formData.status);

      if (editingPackageThemeId) {
        await packageThemesAPI.update(editingPackageThemeId, themeData);
        setError('');
      } else {
        await packageThemesAPI.create(themeData);
        setError('');
      }

      await fetchPackageThemes();
      handleCloseModal();
    } catch (err) {
      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        setError(errorMessages || err.response?.data?.message || 'Validation failed');
      } else {
        setError(err.response?.data?.message || (editingPackageThemeId ? 'Failed to update package theme' : 'Failed to add package theme'));
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (packageTheme) => {
    setEditingPackageThemeId(packageTheme.id);
    setIsModalOpen(true);
    
    setFormData({
      name: packageTheme.name || '',
      icon: null,
      status: packageTheme.status || 'active'
    });
    setIconPreview(packageTheme.icon || null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package theme?')) return;

    try {
      await packageThemesAPI.delete(id);
      await fetchPackageThemes();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete package theme');
      console.error(err);
    }
  };

  const filteredPackageThemes = packageThemes.filter(packageTheme => {
    const name = packageTheme.name || '';
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
          <h1 className="text-3xl font-bold text-gray-800">Package Theme</h1>
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

        {/* Package Themes Table */}
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
                {filteredPackageThemes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No package themes found
                    </td>
                  </tr>
                ) : (
                  filteredPackageThemes.map((packageTheme) => (
                    <tr key={packageTheme.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {packageTheme.icon && (
                            <img 
                              src={packageTheme.icon} 
                              alt={packageTheme.name}
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">{packageTheme.name || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          packageTheme.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {packageTheme.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{packageTheme.created_by_name || 'Travbizz Travel IT Solutions'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(packageTheme.updated_at || packageTheme.last_update)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(packageTheme)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(packageTheme.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Package Theme Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingPackageThemeId ? 'Edit Theme' : 'Add Theme'}
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
                  {/* Theme Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter theme name"
                      required
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon (128 x 128)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      {iconPreview && (
                        <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                          <img 
                            src={iconPreview} 
                            alt="Icon preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Recommended size: 128 x 128 pixels</p>
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
                    {saving ? (editingPackageThemeId ? 'Updating...' : 'Saving...') : 'Save'}
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

export default PackageTheme;

