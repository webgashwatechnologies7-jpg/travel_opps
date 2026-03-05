import { useEffect, useState } from 'react';
import { superAdminAPI } from '../services/api';
import { Plus, Edit, Trash2, Search, Eye, Clock, XCircle, CheckCircle } from 'lucide-react';
import SuperAdminLayout from '../components/SuperAdminLayout';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    subscription_plan_id: '',
    subscription_start_date: new Date().toISOString().split('T')[0],
    subscription_end_date: '',
    notes: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    send_credentials_email: true,
  });

  useEffect(() => {
    fetchCompanies();
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await superAdminAPI.getSubscriptionPlans();
      if (response.data.success) {
        setSubscriptionPlans(response.data.data);
      }
    } catch (err) {
      console.error('Subscription plans error:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getCompanies({ search: searchTerm });
      if (response.data.success) {
        setCompanies(response.data.data.data || response.data.data);
      }
    } catch (err) {
      setError('Failed to load companies');
      console.error('Companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCompanies();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handlePlanChange = (planId) => {
    const selectedPlan = subscriptionPlans.find(p => p.id === parseInt(planId));
    let endDate = '';

    if (selectedPlan) {
      const start = new Date(formData.subscription_start_date || new Date());
      const planName = selectedPlan.name.toLowerCase();

      if (planName.includes('month')) {
        start.setMonth(start.getMonth() + 1);
        endDate = start.toISOString().split('T')[0];
      } else if (planName.includes('year')) {
        start.setFullYear(start.getFullYear() + 1);
        endDate = start.toISOString().split('T')[0];
      }
    }

    setFormData({
      ...formData,
      subscription_plan_id: planId,
      subscription_end_date: endDate
    });
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      subdomain: '',
      domain: '',
      email: '',
      phone: '',
      address: '',
      subscription_plan_id: '',
      subscription_start_date: new Date().toISOString().split('T')[0],
      subscription_end_date: '',
      notes: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      send_credentials_email: true,
    });
    setShowAddModal(true);
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      subdomain: company.subdomain,
      domain: company.domain || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      subscription_plan_id: company.subscription_plan_id || '',
      subscription_start_date: company.subscription_start_date || '',
      subscription_end_date: company.subscription_end_date || '',
      notes: company.notes || '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      send_credentials_email: false,
    });
    setShowEditModal(true);
  };

  const handleView = async (company) => {
    try {
      const response = await superAdminAPI.getCompany(company.id);
      if (response.data.success) {
        setSelectedCompany(response.data.data);
        setShowViewModal(true);
      }
    } catch (err) {
      setError('Failed to load company details');
    }
  };

  const handleDeleteClick = (company) => {
    setDeleteTarget(company);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await superAdminAPI.deleteCompany(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete company');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDns = async (company) => {
    if (!window.confirm(`Verify DNS for ${company.name} and activate? This will send a Go Live email.`)) {
      return;
    }

    try {
      await superAdminAPI.verifyCompanyDns(company.id);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify DNS');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (showAddModal) {
        await superAdminAPI.createCompany(formData);
        setShowAddModal(false);
      } else if (showEditModal) {
        await superAdminAPI.updateCompany(selectedCompany.id, formData);
        setShowEditModal(false);
      }
      fetchCompanies();
      setFormData({
        name: '',
        subdomain: '',
        domain: '',
        email: '',
        phone: '',
        address: '',
        subscription_plan_id: '',
        subscription_start_date: '',
        subscription_end_date: '',
        notes: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        send_credentials_email: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to save company'
      );
    }
  };

  const generateSubdomain = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name) => {
    setFormData({ ...formData, name });
    if (showAddModal && !formData.subdomain) {
      setFormData({ ...formData, name, subdomain: generateSubdomain(name) });
    }
  };

  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all registered companies</p>
              </div>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subdomain URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNS Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-600 font-mono">
                          {company.crm_url
                            ? company.crm_url.replace(/^https?:\/\//, '')
                            : company.domain?.split('.').length > 2
                              ? company.domain
                              : `crm.${company.domain || ''}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Subdomain: {company.subdomain}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{company.domain || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{company.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={
                            company.crm_url ||
                            (company.domain?.split('.').length > 2
                              ? `https://${company.domain}`
                              : `https://crm.${company.domain || ''}`)
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {company.crm_url
                            ? company.crm_url.replace(/^https?:\/\//, '')
                            : company.domain?.split('.').length > 2
                              ? company.domain
                              : `crm.${company.domain || ''}`}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${company.dns_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : company.dns_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {company.dns_status || 'pending'}
                          </span>
                          {company.dns_status !== 'active' && (
                            <button
                              onClick={() => handleVerifyDns(company)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Verify DNS"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${company.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : company.status === 'suspended'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {company.status}
                          </span>
                          {company.subscription_plan && (
                            <span className="text-xs text-gray-500">
                              {company.subscription_plan.name}
                            </span>
                          )}
                          {company.subscription_end_date && (
                            <div className="flex items-center gap-1 text-xs">
                              {new Date(company.subscription_end_date) < new Date() ? (
                                <>
                                  <XCircle className="w-3 h-3 text-red-500" />
                                  <span className="text-red-600">Expired</span>
                                </>
                              ) : new Date(company.subscription_end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? (
                                <>
                                  <Clock className="w-3 h-3 text-orange-500" />
                                  <span className="text-orange-600">
                                    Expires {new Date(company.subscription_end_date).toLocaleDateString()}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500">
                                  Expires {new Date(company.subscription_end_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(company)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(company)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(company)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showAddModal ? 'Add New Company' : 'Edit Company'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-4" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subdomain *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subdomain}
                      onChange={(e) =>
                        setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                      }
                      pattern="[a-z0-9-]+"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="gashwa"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Internal subdomain identifier
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Domain *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="crm.gashwatechnologies.com"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-semibold">
                      CRM URL will be: {formData.domain?.split('.').length > 2 ? formData.domain : `crm.${formData.domain || 'yourdomain.com'}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscription Plan *
                    </label>
                    <select
                      required
                      value={formData.subscription_plan_id}
                      onChange={(e) => setFormData({ ...formData, subscription_plan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Plan</option>
                      {subscriptionPlans
                        .filter((plan) => plan.is_active)
                        .map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - ₹{plan.price}/{plan.billing_period}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscription Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.subscription_start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, subscription_start_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscription End Date
                    </label>
                    <input
                      type="date"
                      value={formData.subscription_end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, subscription_end_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {showAddModal && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Name *
                        </label>
                        <input
                          type="text"
                          required={showAddModal}
                          value={formData.admin_name}
                          onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Email *
                        </label>
                        <input
                          type="email"
                          required={showAddModal}
                          value={formData.admin_email}
                          onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                          name="admin_email_new"
                          autoComplete="off"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Password *
                        </label>
                        <input
                          type="password"
                          required={showAddModal}
                          value={formData.admin_password}
                          onChange={(e) =>
                            setFormData({ ...formData, admin_password: e.target.value })
                          }
                          name="admin_password_new"
                          autoComplete="new-password"
                          minLength={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.send_credentials_email}
                            onChange={(e) =>
                              setFormData({ ...formData, send_credentials_email: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Send login credentials via email
                          </span>
                        </label>
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showAddModal ? 'Create Company' : 'Update Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedCompany.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">CRM URL</label>
                    <p className="text-lg text-blue-600 font-mono">
                      {selectedCompany.crm_url
                        ? selectedCompany.crm_url.replace(/^https?:\/\//, '')
                        : selectedCompany.domain?.split('.').length > 2
                          ? selectedCompany.domain
                          : `crm.${selectedCompany.domain || ''}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subdomain</label>
                    <p className="text-lg text-gray-900">{selectedCompany.subdomain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Domain</label>
                    <p className="text-lg text-gray-900">{selectedCompany.domain || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg text-gray-900">{selectedCompany.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-lg text-gray-900">{selectedCompany.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedCompany.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedCompany.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {selectedCompany.status}
                    </span>
                  </div>
                  {selectedCompany.users && selectedCompany.users.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Users</label>
                      <ul className="mt-2 space-y-1">
                        {selectedCompany.users.map((user) => (
                          <li key={user.id} className="text-gray-900">
                            {user.name} ({user.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* Red Header */}
              <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete Company</h2>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold text-sm mb-1">⚠️ This action is permanent and cannot be undone!</p>
                  <p className="text-red-700 text-sm">The following data will be permanently deleted:</p>
                  <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>All Users & Permissions</li>
                    <li>All Leads & Itineraries</li>
                    <li>WhatsApp Chats & Messages</li>
                    <li>Tickets, Branches, Services</li>
                    <li>Company Settings & Data</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 text-sm mb-1">You are about to delete this company:</p>
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <p className="font-bold text-gray-900 text-lg">{deleteTarget.name}</p>
                    <p className="text-gray-500 text-sm">{deleteTarget.email || deleteTarget.domain}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                    disabled={deleteLoading}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-60"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Yes, Delete It
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default CompanyManagement;

