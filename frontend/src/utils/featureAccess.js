/**
 * Feature Access Utility
 * Check if company has access to specific features based on subscription plan
 */

let companyFeatures = null;

/**
 * Initialize company features
 */
export const initCompanyFeatures = (features) => {
  companyFeatures = features;
};

/**
 * Check if feature is available
 */
export const hasFeature = (featureKey) => {
  if (!companyFeatures) {
    return false;
  }
  
  const feature = companyFeatures.find(f => f.feature_key === featureKey);
  return feature ? feature.is_enabled : false;
};

/**
 * Get feature limit
 */
export const getFeatureLimit = (featureKey) => {
  if (!companyFeatures) {
    return null;
  }
  
  const feature = companyFeatures.find(f => f.feature_key === featureKey);
  return feature ? feature.limit_value : null;
};

/**
 * Check if feature has unlimited access
 */
export const isFeatureUnlimited = (featureKey) => {
  const limit = getFeatureLimit(featureKey);
  return limit === null || limit === undefined;
};

/**
 * Feature keys constants
 */
export const FEATURES = {
  LEADS_MANAGEMENT: 'leads_management',
  LEADS_IMPORT_EXPORT: 'leads_import_export',
  FOLLOWUPS: 'followups',
  PAYMENTS: 'payments',
  ITINERARIES: 'itineraries',
  DAY_ITINERARIES: 'day_itineraries',
  HOTELS: 'hotels',
  ACTIVITIES: 'activities',
  TRANSFERS: 'transfers',
  SUPPLIERS: 'suppliers',
  DESTINATIONS: 'destinations',
  EMAIL_TEMPLATES: 'email_templates',
  GMAIL_INTEGRATION: 'gmail_integration',
  WHATSAPP: 'whatsapp',
  CAMPAIGNS: 'campaigns',
  GOOGLE_SHEETS_SYNC: 'google_sheets_sync',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  PERFORMANCE_TRACKING: 'performance_tracking',
  TARGETS: 'targets',
  EXPENSES: 'expenses',
  USER_MANAGEMENT: 'user_management',
  PERMISSIONS: 'permissions',
  COMPANY_SETTINGS: 'company_settings',
  API_ACCESS: 'api_access',
  CUSTOM_DOMAIN: 'custom_domain',
  WHITE_LABEL: 'white_label',
  PRIORITY_SUPPORT: 'priority_support',
};

