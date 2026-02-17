import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { Search, Plus, Edit, X, Trash2, Eye, RefreshCw } from 'lucide-react';
import { suppliersAPI } from '../services/api';

// Helper for checking permissions
const hasPermission = (user, permission) => {
  if (!user) return false;
  // Super Admin bypass
  if (user.is_super_admin) return true;
  // Check granular permission
  if (user.permissions && user.permissions.includes(permission)) return true;
  return false;
};

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    company_name: '',
    title: 'Mr.',
    first_name: '',
    last_name: '',
    email: '',
    code: '+91',
    mobile: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);

  // Supplier details + financial summary modal
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailsPeriod, setDetailsPeriod] = useState('yearly'); // 'weekly' | 'monthly' | 'yearly'
  const [financialSummary, setFinancialSummary] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.list();
      setSuppliers(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      // If API fails, show empty state or error
      if (err.response?.status === 404) {
        // API endpoint might not exist yet, show empty state
        setSuppliers([]);
      } else {
        setError('Failed to load suppliers');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSupplierId(null);
    setIsModalOpen(true);
    setFormData({
      city: '',
      company_name: '',
      title: 'Mr.',
      first_name: '',
      last_name: '',
      email: '',
      code: '+91',
      mobile: '',
      address: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplierId(null);
    setFormData({
      city: '',
      company_name: '',
      title: 'Mr.',
      first_name: '',
      last_name: '',
      email: '',
      code: '+91',
      mobile: '',
      address: ''
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
      const supplierData = {
        city: formData.city,
        company_name: formData.company_name,
        title: formData.title,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_code: formData.code,
        mobile: formData.mobile,
        address: formData.address
      };

      if (editingSupplierId) {
        // Update existing supplier
        await suppliersAPI.update(editingSupplierId, supplierData);
        setError('');
      } else {
        // Create new supplier
        await suppliersAPI.create(supplierData);
        setError('');
      }

      await fetchSuppliers(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || (editingSupplierId ? 'Failed to update supplier' : 'Failed to add supplier'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplierId(supplier.id);
    setIsModalOpen(true);

    // Extract mobile number and code if mobile contains code
    let mobileNumber = supplier.mobile || '';
    let phoneCode = supplier.phone_code || supplier.code || '+91';

    // If mobile already contains code, extract it
    if (mobileNumber && mobileNumber.startsWith('+')) {
      const parts = mobileNumber.split(' ');
      if (parts.length > 1) {
        phoneCode = parts[0];
        mobileNumber = parts.slice(1).join(' ');
      } else {
        // Try to extract code from mobile number
        const codeMatch = mobileNumber.match(/^(\+\d{1,3})/);
        if (codeMatch) {
          phoneCode = codeMatch[1];
          mobileNumber = mobileNumber.substring(codeMatch[1].length).trim();
        }
      }
    }

    // Pre-fill form with supplier data
    setFormData({
      city: supplier.city || '',
      company_name: supplier.company_name || supplier.company || '',
      title: supplier.title || 'Mr.',
      first_name: supplier.first_name || '',
      last_name: supplier.last_name || '',
      email: supplier.email || '',
      code: phoneCode,
      mobile: mobileNumber === 'Not Provided' ? '' : mobileNumber,
      address: supplier.address || ''
    });
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      await suppliersAPI.delete(supplierId);
      await fetchSuppliers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete supplier');
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const company = supplier.company || supplier.company_name || '';
    const name = supplier.name || `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    return company.toLowerCase().includes(searchLower) || name.toLowerCase().includes(searchLower);
  });

  // Format supplier name for display
  const formatSupplierName = (supplier) => {
    if (supplier.name) return supplier.name;
    const title = supplier.title || '';
    const firstName = supplier.first_name || '';
    const lastName = supplier.last_name || '';
    return `${title} ${firstName} ${lastName}`.trim() || 'N/A';
  };

  const handleOpenDetails = async (supplier, period = 'yearly') => {
    setSelectedSupplier(supplier);
    setDetailsPeriod(period);
    setIsDetailsModalOpen(true);
    await loadFinancialSummary(supplier.id, period);
  };

  const loadFinancialSummary = async (supplierId, period = detailsPeriod) => {
    try {
      setDetailsLoading(true);
      setDetailsError('');
      const res = await suppliersAPI.financialSummary(supplierId, period);
      setFinancialSummary(res.data?.data?.financial_summary || null);
    } catch (err) {
      console.error('Failed to load supplier financial summary', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to load supplier financial summary';
      setDetailsError(msg);
      setFinancialSummary(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Format mobile for display
  const formatMobile = (supplier) => {
    if (supplier.mobile === 'Not Provided' || !supplier.mobile) return 'Not Provided';
    const code = supplier.phone_code || supplier.code || '';
    return code ? `${code} ${supplier.mobile}` : supplier.mobile;
  };

  // Format location for display
  const formatLocation = (supplier) => {
    return supplier.location || supplier.city || 'N/A';
  };

  // Format date for display
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
          <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
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
            {/* Add New Button */}
            {hasPermission(user, 'suppliers.create') && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add New
              </button>
            )}
          </div>
        </div>

        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOpenDetails(supplier, 'yearly')}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.company || supplier.company_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatSupplierName(supplier)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatMobile(supplier)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatLocation(supplier)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!hasPermission(user, 'suppliers.status')) return;
                            try {
                              const newStatus = (supplier.status === 'active' || !supplier.status) ? 'inactive' : 'active';
                              await suppliersAPI.update(supplier.id, { ...supplier, status: newStatus });
                              fetchSuppliers();
                              toast.success(`Status updated to ${newStatus}`);
                            } catch (err) {
                              toast.error('Failed to update status');
                            }
                          }}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${(supplier.status === 'active' || !supplier.status)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                          disabled={!hasPermission(user, 'suppliers.status')}
                        >
                          {(supplier.status === 'active' || !supplier.status) ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(supplier.updated_at || supplier.last_update)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenDetails(supplier, 'yearly')}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded mr-1"
                          title="View details & financial summary"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {hasPermission(user, 'suppliers.edit') && (
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        {hasPermission(user, 'suppliers.delete') && (
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded ml-2"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Supplier Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingSupplierId ? 'Edit Supplier' : 'Add Supplier'}
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
                  {/* Row 1: City and Company Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City (type slowly)
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Title and First Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <select
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Last Name and Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 4: Code, Mobile, and Address */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+91"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile
                      </label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter address"
                      />
                    </div>
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
                    {saving ? (editingSupplierId ? 'Updating...' : 'Saving...') : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supplier Details & Financial Summary Modal */}
        {isDetailsModalOpen && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {formatSupplierName(selectedSupplier)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedSupplier.company || selectedSupplier.company_name || 'Supplier'} &bull;{' '}
                    {formatLocation(selectedSupplier)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedSupplier(null);
                    setFinancialSummary(null);
                    setDetailsError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact</h3>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Name:</span>{' '}
                      {formatSupplierName(selectedSupplier)}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">Email:</span>{' '}
                      {selectedSupplier.email || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">Mobile:</span>{' '}
                      {formatMobile(selectedSupplier)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Company</h3>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Company:</span>{' '}
                      {selectedSupplier.company || selectedSupplier.company_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">Location:</span>{' '}
                      {formatLocation(selectedSupplier)}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-medium">Address:</span>{' '}
                      {selectedSupplier.address || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Financial Summary
                      </h3>
                      <p className="text-xs text-gray-500">
                        Kitna business hua, kitna dena / lena hai
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Period toggle */}
                      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium overflow-hidden">
                        {[
                          { key: 'weekly', label: 'Week' },
                          { key: 'monthly', label: 'Month' },
                          { key: 'yearly', label: 'Year' },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setDetailsPeriod(item.key);
                              loadFinancialSummary(selectedSupplier.id, item.key);
                            }}
                            className={`px-3 py-1.5 border-l first:border-l-0 ${detailsPeriod === item.key
                              ? 'bg-blue-600 text-white'
                              : 'bg-transparent text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => loadFinancialSummary(selectedSupplier.id, detailsPeriod)}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        title="Refresh summary"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {detailsLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    )}

                    {!detailsLoading && detailsError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {detailsError}
                      </div>
                    )}

                    {!detailsLoading && !detailsError && financialSummary && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Total Business
                          </p>
                          <p className="mt-2 text-xl font-bold text-blue-900">
                            ₹ {financialSummary.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-1 text-xs text-blue-700">
                            Revenue from confirmed leads
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                            Cost to Supplier
                          </p>
                          <p className="mt-2 text-xl font-bold text-amber-900">
                            ₹ {financialSummary.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-1 text-xs text-amber-700">
                            Total supplier cost in this period
                          </p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                            Profit (Before Loss)
                          </p>
                          <p className="mt-2 text-xl font-bold text-emerald-900">
                            ₹ {financialSummary.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-1 text-xs text-emerald-700">
                            Revenue - Cost
                          </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                            Loss (Cancelled)
                          </p>
                          <p className="mt-2 text-xl font-bold text-red-900">
                            ₹ {financialSummary.loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            Estimated loss from cancelled leads
                          </p>
                        </div>
                        <div className="bg-sky-50 border border-sky-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                            Net Profit
                          </p>
                          <p className="mt-2 text-xl font-bold text-sky-900">
                            ₹ {financialSummary.net_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="mt-1 text-xs text-sky-700">
                            Profit - Loss
                          </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:col-span-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                                Kitna Dena (Payables)
                              </p>
                              <p className="mt-1 text-lg font-bold text-orange-900">
                                ₹ {financialSummary.dena.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                Kitna Lena (Receivables)
                              </p>
                              <p className="mt-1 text-lg font-bold text-emerald-900">
                                ₹ {financialSummary.lena.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                Balance (Lena - Dena)
                              </p>
                              <p className="mt-1 text-lg font-bold text-indigo-900">
                                ₹ {financialSummary.summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!detailsLoading && !detailsError && !financialSummary && (
                      <p className="text-sm text-gray-500">
                        No financial data available yet for this supplier.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Suppliers;
