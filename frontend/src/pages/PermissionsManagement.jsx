import { useEffect, useState } from 'react';
import { superAdminAPI } from '../services/api';
import { Check, X, Save, RefreshCw, CheckSquare, Square } from 'lucide-react';
import SuperAdminLayout from '../components/SuperAdminLayout';

const PermissionsManagement = () => {
  const [plans, setPlans] = useState([]);
  const [planFeatures, setPlanFeatures] = useState({}); // { planId: [features] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({}); // { planId: true/false }
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(null); // Currently selected plan tab
  const [availableFeatures, setAvailableFeatures] = useState({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      // First get available features
      const availableFeaturesResponse = await superAdminAPI.getAvailableFeatures();
      const availableFeaturesData = availableFeaturesResponse.data.success
        ? availableFeaturesResponse.data.data
        : {};
      setAvailableFeatures(availableFeaturesData);

      // Then get plans (with permissions column)
      const response = await superAdminAPI.getSubscriptionPlans();
      if (response.data.success) {
        const plansData = response.data.data;
        setPlans(plansData);

        // Load features for each plan
        const featuresPromises = plansData.map(async (plan) => {
          try {
            // First check if plan has permissions column with feature IDs
            const permissionIds = plan.permissions || [];

            // Get features for this plan
            const featuresResponse = await superAdminAPI.getPlanFeatures(plan.id);
            if (featuresResponse.data.success && featuresResponse.data.data && Array.isArray(featuresResponse.data.data) && featuresResponse.data.data.length > 0) {
              const features = featuresResponse.data.data;

              // Backend already checks permissions column and returns is_enabled correctly
              // Just normalize boolean values
              const normalizedFeatures = features.map(f => ({
                ...f,
                is_enabled: f.is_enabled === true || f.is_enabled === 'true' || f.is_enabled === 1 || f.is_enabled === '1'
              }));

              return { planId: plan.id, features: normalizedFeatures };
            } else {
              // If no features exist, create from available features
              const defaultFeatures = Object.keys(availableFeaturesData).map(key => ({
                feature_key: key,
                feature_name: availableFeaturesData[key].name,
                description: availableFeaturesData[key].description,
                has_limit: availableFeaturesData[key].has_limit || false,
                limit_label: availableFeaturesData[key].limit_label || null,
                is_enabled: false,
                limit_value: null,
              }));
              return { planId: plan.id, features: defaultFeatures };
            }
          } catch {
            // Create default features if API fails
            const defaultFeatures = Object.keys(availableFeaturesData).map(key => ({
              feature_key: key,
              feature_name: availableFeaturesData[key].name,
              description: availableFeaturesData[key].description,
              has_limit: availableFeaturesData[key].has_limit || false,
              limit_label: availableFeaturesData[key].limit_label || null,
              is_enabled: false,
              limit_value: null,
            }));
            return { planId: plan.id, features: defaultFeatures };
          }
        });

        const featuresResults = await Promise.all(featuresPromises);
        const featuresMap = {};
        featuresResults.forEach(({ planId, features }) => {
          featuresMap[planId] = features;
        });
        setPlanFeatures(featuresMap);

        // Set first plan as active tab
        if (plansData.length > 0 && !activeTab) {
          setActiveTab(plansData[0].id);
        }
      }
    } catch {
      setError('Failed to load subscription plans. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (planId, featureIndex) => {
    const updated = { ...planFeatures };
    if (!updated[planId]) updated[planId] = [];
    // Ensure proper boolean toggle
    const currentValue = updated[planId][featureIndex].is_enabled;
    updated[planId][featureIndex].is_enabled = !(currentValue === true || currentValue === 'true' || currentValue === 1);
    setPlanFeatures(updated);
  };

  const updateFeatureLimit = (planId, featureIndex, value) => {
    const updated = { ...planFeatures };
    if (!updated[planId]) updated[planId] = [];
    updated[planId][featureIndex].limit_value = value ? parseInt(value) : null;
    setPlanFeatures(updated);
  };

  const toggleAllFeatures = (planId, enable) => {
    const updated = { ...planFeatures };
    if (!updated[planId]) return;

    // Ensure enable is boolean
    const enableBool = enable === true || enable === 'true' || enable === 1;

    updated[planId] = updated[planId].map(feature => ({
      ...feature,
      is_enabled: enableBool, // Ensure boolean
      // Reset limit if disabling
      limit_value: enableBool ? feature.limit_value : null,
    }));

    setPlanFeatures(updated);
  };

  const areAllFeaturesEnabled = (planId) => {
    if (!planFeatures[planId] || planFeatures[planId].length === 0) return false;
    return planFeatures[planId].every(f => f.is_enabled);
  };

  const areAllFeaturesDisabled = (planId) => {
    if (!planFeatures[planId] || planFeatures[planId].length === 0) return false;
    return planFeatures[planId].every(f => !f.is_enabled);
  };

  const savePlanFeatures = async (planId) => {
    if (!planFeatures[planId] || planFeatures[planId].length === 0) {
      setError('No features available to save. Please refresh the page.');
      return;
    }

    try {
      setSaving({ ...saving, [planId]: true });
      setError('');
      setSuccess('');

      // Prepare features data for API - ensure proper format
      const featuresToSave = planFeatures[planId].map(feature => {
        // Ensure is_enabled is properly converted to boolean
        const isEnabled = feature.is_enabled === true || feature.is_enabled === 'true' || feature.is_enabled === 1;

        const featureData = {
          feature_id: feature.feature_id,
          feature_key: feature.feature_key,
          is_active: isEnabled,
        };

        // Only include limit_value if feature has limit and is enabled
        if (feature.has_limit && isEnabled && feature.limit_value) {
          featureData.limit_value = parseInt(feature.limit_value) || null;
        } else {
          featureData.limit_value = null;
        }

        return featureData;
      });

      const response = await superAdminAPI.updatePlanFeatures(planId, featuresToSave);

      if (response.data.success) {
        const planName = plans.find(p => p.id === planId)?.name || 'plan';
        setSuccess(`Permissions saved successfully for ${planName} plan!`);
        setTimeout(() => setSuccess(''), 5000);

        if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Normalize features from response - ensure is_enabled is boolean
          const normalizedFeatures = response.data.data.map(f => ({
            ...f,
            is_enabled: f.is_enabled === true || f.is_enabled === 'true' || f.is_enabled === 1 || f.is_enabled === '1'
          }));

          // Update features from response
          const updated = { ...planFeatures };
          updated[planId] = normalizedFeatures;
          setPlanFeatures(updated);
        } else {
          // Reload features from API
          try {
            const featuresResponse = await superAdminAPI.getPlanFeatures(planId);
            if (featuresResponse.data.success && featuresResponse.data.data) {
              const updated = { ...planFeatures };
              updated[planId] = featuresResponse.data.data;
              setPlanFeatures(updated);
            } else {
              await fetchPlans();
            }
          } catch {
            await fetchPlans();
            await fetchPlans();
          }
        }
      } else {
        setError(response.data.message || 'Failed to save permissions');
      }
    } catch (err) {
      console.error('Save error details:', err);
      console.error('Error response:', err.response);

      let errorMsg = 'Failed to save permissions';

      if (err.response?.data) {
        if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.errors) {
          const errors = err.response.data.errors;
          if (typeof errors === 'object') {
            const errorArray = Object.values(errors).flat();
            errorMsg = errorArray.join(', ');
          } else {
            errorMsg = JSON.stringify(errors);
          }
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setSaving({ ...saving, [planId]: false });
    }
  };

  const getEnabledCount = (planId) => {
    if (!planFeatures[planId]) return 0;
    return planFeatures[planId].filter(f => f.is_enabled).length;
  };

  const getTotalCount = (planId) => {
    if (!planFeatures[planId]) return 0;
    return planFeatures[planId].length;
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
                <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Set permissions/features for each subscription plan
                </p>
              </div>
              <button
                onClick={fetchPlans}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
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

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Plans Tabs */}
          {plans.length > 0 ? (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setActiveTab(plan.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === plan.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      {plan.name}
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${activeTab === plan.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {getEnabledCount(plan.id)}/{getTotalCount(plan.id)} enabled
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-700 font-medium">No subscription plans found.</p>
              <p className="text-sm text-gray-500 mt-1">
                Create a plan first to assign features and permissions.
              </p>
            </div>
          )}

          {/* Features for active plan */}
          {plans.map((plan) => (
            activeTab === plan.id && (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{plan.name} Plan</h2>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    <p className="text-xl font-semibold text-blue-600 mt-2">
                      ₹{plan.price}/{plan.billing_period}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-blue-900">
                        {getEnabledCount(plan.id)} of {getTotalCount(plan.id)} features enabled
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end mb-3">
                      <button
                        onClick={() => toggleAllFeatures(plan.id, true)}
                        disabled={areAllFeaturesEnabled(plan.id) || !planFeatures[plan.id] || planFeatures[plan.id].length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        title="Check All Features"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Check All
                      </button>
                      <button
                        onClick={() => toggleAllFeatures(plan.id, false)}
                        disabled={areAllFeaturesDisabled(plan.id) || !planFeatures[plan.id] || planFeatures[plan.id].length === 0}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        title="Uncheck All Features"
                      >
                        <Square className="w-4 h-4" />
                        Uncheck All
                      </button>
                    </div>
                    <button
                      onClick={() => savePlanFeatures(plan.id)}
                      disabled={saving[plan.id] || !planFeatures[plan.id] || planFeatures[plan.id].length === 0}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                    >
                      {saving[plan.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save {plan.name} Permissions
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {planFeatures[plan.id] && planFeatures[plan.id].length > 0 ? (
                  <div>
                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">!</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900 mb-1">
                            How to Set Permissions:
                          </h3>
                          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Use <strong>"Check All"</strong> button (green) to enable all features at once</li>
                            <li>Use <strong>"Uncheck All"</strong> button (gray) to disable all features at once</li>
                            <li>Or check ✅ individual boxes for features you want to <strong>enable</strong></li>
                            <li>Set limits (if needed) for features like WhatsApp or Campaigns</li>
                            <li>Click <strong>"Save {plan.name} Permissions"</strong> button when done</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {planFeatures[plan.id].map((feature, index) => (
                        <div
                          key={feature.feature_key}
                          className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${(feature.is_enabled === true || feature.is_enabled === 'true' || feature.is_enabled === 1)
                              ? 'border-green-400 bg-green-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          onClick={() => toggleFeature(plan.id, index)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={feature.is_enabled === true || feature.is_enabled === 'true' || feature.is_enabled === 1}
                              onChange={() => toggleFeature(plan.id, index)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 text-sm mb-1 break-words">
                                    {feature.feature_name}
                                  </h3>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {feature.description}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {(feature.is_enabled === true || feature.is_enabled === 'true' || feature.is_enabled === 1) ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 whitespace-nowrap">
                                      <Check className="w-3 h-3" />
                                      ON
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 flex items-center gap-1 whitespace-nowrap">
                                      <X className="w-3 h-3" />
                                      OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                              {feature.has_limit && (feature.is_enabled === true || feature.is_enabled === 'true' || feature.is_enabled === 1) && (
                                <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    {feature.limit_label || 'Limit'}:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={feature.limit_value || ''}
                                    onChange={(e) =>
                                      updateFeatureLimit(plan.id, index, e.target.value)
                                    }
                                    placeholder="Unlimited"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Leave empty for unlimited
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <p className="text-lg font-medium mb-2">No features available</p>
                      <p className="text-sm">Loading features... Please wait or refresh the page</p>
                    </div>
                    <button
                      onClick={fetchPlans}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            )
          ))}

          {plans.length === 0 && Object.keys(availableFeatures).length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(availableFeatures).map((key) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {availableFeatures[key].name}
                    </h3>
                    <p className="text-xs text-gray-600">{availableFeatures[key].description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default PermissionsManagement;

