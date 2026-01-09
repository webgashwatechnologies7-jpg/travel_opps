import { useEffect, useState } from 'react';
import { superAdminAPI } from '../services/api';
import { Plus, Edit, Trash2, Check, X, Settings } from 'lucide-react';
import SuperAdminLayout from '../components/SuperAdminLayout';

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    billing_period: 'monthly',
    max_users: '',
    max_leads: '',
    features: [],
    is_active: true,
    sort_order: 0,
  });
  const [newFeature, setNewFeature] = useState('');
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [availableFeatures, setAvailableFeatures] = useState({});
  const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchAvailableFeatures();
  }, []);

  const fetchAvailableFeatures = async () => {
    try {
      const response = await superAdminAPI.getAvailableFeatures();
      if (response.data.success) {
        setAvailableFeatures(response.data.data);
      }
    } catch (err) {
      console.error('Available features error:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getSubscriptionPlans();
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (err) {
      setError('Failed to load subscription plans');
      console.error('Plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      billing_period: 'monthly',
      max_users: '',
      max_leads: '',
      features: [],
      is_active: true,
      sort_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      billing_period: plan.billing_period,
      max_users: plan.max_users || '',
      max_leads: plan.max_leads || '',
      features: plan.features || [],
      is_active: plan.is_active,
      sort_order: plan.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) {
      return;
    }

    try {
      await superAdminAPI.deleteSubscriptionPlan(id);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleManageFeatures = async (plan) => {
    setSelectedPlanForFeatures(plan);
    try {
      const response = await superAdminAPI.getPlanFeatures(plan.id);
      if (response.data.success) {
        setPlanFeatures(response.data.data);
        setShowFeaturesModal(true);
      }
    } catch (err) {
      setError('Failed to load plan features');
    }
  };

  const handleSaveFeatures = async () => {
    try {
      await superAdminAPI.updatePlanFeatures(selectedPlanForFeatures.id, planFeatures);
      setShowFeaturesModal(false);
      setError('');
      fetchPlans();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(', ')
            : 'Failed to save features'
      );
    }
  };

  const toggleFeature = (index) => {
    const updated = [...planFeatures];
    updated[index].is_enabled = !updated[index].is_enabled;
    setPlanFeatures(updated);
  };

  const updateFeatureLimit = (index, value) => {
    const updated = [...planFeatures];
    updated[index].limit_value = value ? parseInt(value) : null;
    setPlanFeatures(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const submitData = {
        ...formData,
        max_users: formData.max_users || null,
        max_leads: formData.max_leads || null,
        price: parseFloat(formData.price),
        sort_order: parseInt(formData.sort_order),
      };

      if (editingPlan) {
        await superAdminAPI.updateSubscriptionPlan(editingPlan.id, submitData);
      } else {
        await superAdminAPI.createSubscriptionPlan(submitData);
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(', ')
            : 'Failed to save plan'
      );
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
                <p className="text-sm text-gray-600 mt-1">Manage subscription plans and features</p>
              </div>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Plan
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

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No subscription plans found. Create your first plan!
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow p-6 border-2 ${
                    plan.is_active ? 'border-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        ₹{plan.price}
                        <span className="text-sm text-gray-500 font-normal">
                          /{plan.billing_period}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        plan.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Users:</span>
                      <span className="font-medium">
                        {plan.max_users ? plan.max_users : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Leads:</span>
                      <span className="font-medium">
                        {plan.max_leads ? plan.max_leads : 'Unlimited'}
                      </span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleManageFeatures(plan)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Features
                    </button>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: editingPlan ? formData.slug : generateSlug(e.target.value),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                      }
                      pattern="[a-z0-9-]+"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Period *
                    </label>
                    <select
                      required
                      value={formData.billing_period}
                      onChange={(e) =>
                        setFormData({ ...formData, billing_period: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Users (leave empty for unlimited)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_users}
                      onChange={(e) =>
                        setFormData({ ...formData, max_users: e.target.value || '' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Leads (leave empty for unlimited)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_leads}
                      onChange={(e) =>
                        setFormData({ ...formData, max_leads: e.target.value || '' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                        placeholder="Add feature"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
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
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Features Management Modal */}
        {showFeaturesModal && selectedPlanForFeatures && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Features - {selectedPlanForFeatures.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Enable or disable features for this subscription plan
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {planFeatures.map((feature, index) => (
                    <div
                      key={feature.feature_key}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={feature.is_enabled}
                              onChange={() => toggleFeature(index)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {feature.feature_name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          {feature.has_limit && feature.is_enabled && (
                            <div className="mt-3 ml-8">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {feature.limit_label || 'Limit'}:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={feature.limit_value || ''}
                                onChange={(e) =>
                                  updateFeatureLimit(index, e.target.value)
                                }
                                placeholder="Unlimited"
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Leave empty for unlimited
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {feature.is_enabled ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                              Enabled
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeaturesModal(false);
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFeatures}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Features
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

export default SubscriptionManagement;

