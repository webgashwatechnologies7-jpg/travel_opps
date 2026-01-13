import axios from 'axios';

// Dynamic API URL based on current domain
const getApiBaseUrl = () => {
  const currentHost = window.location.origin;
  
  // Check if running on local development
  if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    return 'http://127.0.0.1:8000/api';
  }
  
  // For live hosting, use the current domain with backend path
  return `${currentHost}/backend/public/api`;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => {
    // Don't process blob responses through JSON parsing
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  async (error) => {
    // Only redirect on 401 if not already on login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Use replace to avoid adding to history
      window.location.replace('/login');
    }

    // Handle blob error responses - if error response is a blob but should be JSON
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        // Replace blob data with parsed JSON
        error.response.data = errorData;
      } catch (e) {
        // If parsing fails, keep the blob
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
};

// Profile APIs
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updatePassword: (data) => api.put('/profile/password', data),
};

// Dashboard APIs
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  getRevenueGrowthMonthly: () => api.get('/dashboard/revenue-growth-monthly'),
  upcomingTours: () => api.get('/dashboard/upcoming-tours'),
  latestLeadNotes: () => api.get('/dashboard/latest-lead-notes'),
  salesRepsStats: () => api.get('/dashboard/sales-reps-stats'),
  topDestinations: () => api.get('/dashboard/top-destinations'),
  employeePerformance: (month) => api.get('/dashboard/employee-performance', { params: { month } }),
  sourceRoi: (month) => api.get('/dashboard/source-roi', { params: { month } }),
  destinationPerformance: (month) => api.get('/dashboard/destination-performance', { params: { month } }),
};

// Leads APIs
export const leadsAPI = {
  list: (filters = {}) => api.get('/leads', { params: filters }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  assign: (id, assignedTo) => api.put(`/leads/${id}/assign`, { assigned_to: assignedTo }),
  updateStatus: (id, status) => api.put(`/leads/${id}/status`, { status }),
  importTemplate: () => api.get('/leads/import-template', { responseType: 'blob' }),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Lead emails
  getEmails: (leadId) => api.get(`/leads/${leadId}/emails`),
  sendEmail: (leadId, data) => {
    // Check if there's an attachment - use FormData
    if (data.attachment) {
      const formData = new FormData();
      formData.append('to_email', data.to_email);
      formData.append('subject', data.subject);
      formData.append('body', data.body);
      if (data.cc_email) formData.append('cc_email', data.cc_email);
      formData.append('attachment', data.attachment);
      return api.post(`/leads/${leadId}/emails`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/leads/${leadId}/emails`, data);
  },
  getEmail: (leadId, emailId) => api.get(`/leads/${leadId}/emails/${emailId}`),
};

// Followups APIs
export const followupsAPI = {
  today: () => api.get('/followups/today'),
  overdue: () => api.get('/followups/overdue'),
  create: (data) => api.post('/followups', data),
  complete: (id) => api.put(`/followups/${id}/complete`),
};

// Payments APIs
export const paymentsAPI = {
  dueToday: () => api.get('/payments/due-today'),
  pending: () => api.get('/payments/pending'),
  getByLead: (leadId) => api.get(`/payments/lead/${leadId}`),
  create: (data) => api.post('/payments', data),
};

// WhatsApp APIs
export const whatsappAPI = {
  inbox: () => api.get('/whatsapp/inbox'),
  send: (leadId, message) => api.post('/whatsapp/send', { lead_id: leadId, message }),
};

// Targets APIs (Admin only)
export const targetsAPI = {
  get: (userId, month) => api.get(`/targets/${userId}/${month}`),
  create: (data) => api.post('/targets', data),
  updateAchieved: (id, achievedAmount) => api.put(`/targets/${id}/update-achieved`, { achieved_amount: achievedAmount }),
};

// Google Sheets APIs
export const googleSheetsAPI = {
  connect: (sheetUrl, isActive) => api.post('/google-sheets/connect', { sheet_url: sheetUrl, is_active: isActive }),
  status: () => api.get('/google-sheets/status'),
};

// Google Mail APIs
export const googleMailAPI = {
  getConnectUrl: () => `${API_BASE_URL}/google/connect`,
  sendMail: (data) => api.post('/send-gmail', data),
  syncInbox: () => api.get('/sync-inbox'),
  getGmailEmails: (leadId) => api.get(`/leads/${leadId}/gmail-emails`),
};

// Users APIs
export const usersAPI = {
  list: () => api.get('/admin/users'),
  get: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  updateStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { is_active: isActive }),
};

// Permissions APIs
export const permissionsAPI = {
  getRoles: () => api.get('/admin/permissions/roles'),
  getPermissions: () => api.get('/admin/permissions/list'),
  getRolePermissions: (roleName) => api.get(`/admin/permissions/roles/${roleName}`),
  updateRolePermissions: (roleName, permissions) => api.put(`/admin/permissions/roles/${roleName}`, { permissions }),
};

// Company Settings APIs (Admin only)
export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data) => api.put('/admin/settings', data),
  reset: () => api.post('/admin/settings/reset'),
  // New settings API for hotel options and package settings
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get('/settings', { params: { key } }),
  save: (data) => api.post('/settings', data),
  getMaxHotelOptions: () => api.get('/settings/max-hotel-options'),
};

// Suppliers APIs
export const suppliersAPI = {
  list: () => api.get('/suppliers'),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  sendEmail: (data) => api.post('/suppliers/send-email', data),
};

// Hotels APIs
export const hotelsAPI = {
  list: () => api.get('/hotels'),
  get: (id) => api.get(`/hotels/${id}`),
  search: (location, query = '') => api.get('/hotels/search', {
    params: { location, query }
  }),
  getRooms: (hotelId, params = {}) => api.get(`/hotels/${hotelId}/rooms`, {
    params: params
  }),
  create: (data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      return api.post('/hotels', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/hotels', data);
  },
  update: (id, data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      return api.post(`/hotels/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/hotels/${id}`, data);
  },
  delete: (id) => api.delete(`/hotels/${id}`),
  // Hotel rates APIs
  getRates: (hotelId) => api.get(`/hotels/${hotelId}/rates`),
  createRate: (hotelId, data) => api.post(`/hotels/${hotelId}/rates`, data),
  updateRate: (hotelId, rateId, data) => api.put(`/hotels/${hotelId}/rates/${rateId}`, data),
  deleteRate: (hotelId, rateId) => api.delete(`/hotels/${hotelId}/rates/${rateId}`),
  // Hotel import/export APIs
  importHotels: (formData) => api.post('/hotels/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  exportHotels: () => api.get('/hotels/export', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
  downloadImportFormat: () => api.get('/hotels/import-template', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
};

// Activities APIs
export const activitiesAPI = {
  list: () => api.get('/activities'),
  get: (id) => api.get(`/activities/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/activities', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/activities', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/activities/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/activities/${id}`, data);
  },
  delete: (id) => api.delete(`/activities/${id}`),
  // Activity prices APIs
  getPrices: (activityId) => api.get(`/activities/${activityId}/prices`),
  createPrice: (activityId, data) => api.post(`/activities/${activityId}/prices`, data),
  updatePrice: (activityId, priceId, data) => api.put(`/activities/${activityId}/prices/${priceId}`, data),
  deletePrice: (activityId, priceId) => api.delete(`/activities/${activityId}/prices/${priceId}`),
  // Activity import/export APIs
  importActivities: (formData) => api.post('/activities/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  exportActivities: () => api.get('/activities/export', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
  downloadImportFormat: () => api.get('/activities/import-template', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
};

// Transfers APIs
export const transfersAPI = {
  list: () => api.get('/transfers'),
  get: (id) => api.get(`/transfers/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/transfers', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/transfers', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/transfers/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/transfers/${id}`, data);
  },
  delete: (id) => api.delete(`/transfers/${id}`),
  // Transfer prices APIs
  getPrices: (transferId) => api.get(`/transfers/${transferId}/prices`),
  createPrice: (transferId, data) => api.post(`/transfers/${transferId}/prices`, data),
  updatePrice: (transferId, priceId, data) => api.put(`/transfers/${transferId}/prices/${priceId}`, data),
  deletePrice: (transferId, priceId) => api.delete(`/transfers/${transferId}/prices/${priceId}`),
  // Transfer import/export APIs
  importTransfers: (formData) => api.post('/transfers/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  exportTransfers: () => api.get('/transfers/export', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
  downloadImportFormat: () => api.get('/transfers/import-template', {
    responseType: 'blob',
    headers: {
      'Accept': 'text/csv,application/json'
    }
  }),
};

// Day Itineraries APIs
export const dayItinerariesAPI = {
  list: () => api.get('/day-itineraries'),
  get: (id) => api.get(`/day-itineraries/${id}`),
  create: (data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      return api.post('/day-itineraries', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/day-itineraries', data);
  },
  update: (id, data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/day-itineraries/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/day-itineraries/${id}`, data);
  },
  delete: (id) => api.delete(`/day-itineraries/${id}`),
};

// Packages/Itineraries APIs
export const packagesAPI = {
  list: () => api.get('/packages'),
  get: (id) => api.get(`/packages/${id}`),
  create: (data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      return api.post('/packages', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/packages', data);
  },
  update: (id, data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/packages/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/packages/${id}`, data);
  },
  delete: (id) => api.delete(`/packages/${id}`),
};

// Destinations APIs
export const destinationsAPI = {
  list: () => api.get('/destinations'),
  get: (id) => api.get(`/destinations/${id}`),
  create: (data) => api.post('/destinations', data),
  update: (id, data) => api.put(`/destinations/${id}`, data),
  delete: (id) => api.delete(`/destinations/${id}`),
};

// Room Types APIs
export const roomTypesAPI = {
  list: () => api.get('/room-types'),
  get: (id) => api.get(`/room-types/${id}`),
  create: (data) => api.post('/room-types', data),
  update: (id, data) => api.put(`/room-types/${id}`, data),
  delete: (id) => api.delete(`/room-types/${id}`),
};

// Meal Plans APIs
export const mealPlansAPI = {
  list: () => api.get('/meal-plans'),
  get: (id) => api.get(`/meal-plans/${id}`),
  create: (data) => api.post('/meal-plans', data),
  update: (id, data) => api.put(`/meal-plans/${id}`, data),
  delete: (id) => api.delete(`/meal-plans/${id}`),
};

// Lead Sources APIs
export const leadSourcesAPI = {
  list: () => api.get('/lead-sources'),
  get: (id) => api.get(`/lead-sources/${id}`),
  create: (data) => api.post('/lead-sources', data),
  update: (id, data) => api.put(`/lead-sources/${id}`, data),
  delete: (id) => api.delete(`/lead-sources/${id}`),
};

// Expense Types APIs
export const expenseTypesAPI = {
  list: () => api.get('/expense-types'),
  get: (id) => api.get(`/expense-types/${id}`),
  create: (data) => api.post('/expense-types', data),
  update: (id, data) => api.put(`/expense-types/${id}`, data),
  delete: (id) => api.delete(`/expense-types/${id}`),
};

// Package Themes APIs
export const packageThemesAPI = {
  list: () => api.get('/package-themes'),
  get: (id) => api.get(`/package-themes/${id}`),
  create: (data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      return api.post('/package-themes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/package-themes', data);
  },
  update: (id, data) => {
    // Check if data is FormData
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/package-themes/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/package-themes/${id}`, data);
  },
  delete: (id) => api.delete(`/package-themes/${id}`),
};

// Currencies APIs
export const currenciesAPI = {
  list: () => api.get('/currencies'),
  get: (id) => api.get(`/currencies/${id}`),
  create: (data) => api.post('/currencies', data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
};

// Query Detail API
export const queryDetailAPI = {
  getDetail: (id) => api.get(`/queries/${id}/detail`)
};

// Super Admin APIs
export const superAdminAPI = {
  // Companies
  getCompanies: (params = {}) => api.get('/super-admin/companies', { params }),
  getCompany: (id) => api.get(`/super-admin/companies/${id}`),
  createCompany: (data) => api.post('/super-admin/companies', data),
  updateCompany: (id, data) => api.put(`/super-admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/super-admin/companies/${id}`),
  getCompanyStats: () => api.get('/super-admin/companies/stats'),
  // Subscription Plans
  getSubscriptionPlans: () => api.get('/super-admin/subscription-plans'),
  getSubscriptionPlan: (id) => api.get(`/super-admin/subscription-plans/${id}`),
  createSubscriptionPlan: (data) => api.post('/super-admin/subscription-plans', data),
  updateSubscriptionPlan: (id, data) => api.put(`/super-admin/subscription-plans/${id}`, data),
  deleteSubscriptionPlan: (id) => api.delete(`/super-admin/subscription-plans/${id}`),
  // Subscription Plan Features
  getAvailableFeatures: () => api.get('/super-admin/subscription-plans/available-features'),
  getPlanFeatures: (planId) => api.get(`/super-admin/subscription-plans/${planId}/features`),
  updatePlanFeatures: (planId, features) => api.put(`/super-admin/subscription-plans/${planId}/features`, { features }),
};

export default api;

