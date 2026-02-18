import axios from 'axios';
import { API_BASE_URL } from './apiBase';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});



api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send frontend host for domain-based auth (main vs company domain)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      config.headers['X-Request-Host'] = hostname || '';
      // Send subdomain for local multi-tenant requests
      if (hostname && hostname.endsWith('.localhost')) {
        const subdomain = hostname.split('.')[0];
        if (subdomain && subdomain !== 'localhost') {
          config.headers['X-Subdomain'] = subdomain;
        }
      }
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
    // Don't redirect on 401 when viewing public landing page (no auth required)
    const isPublicLandingPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/landing-page/');
    const isLoginPage = window.location.pathname.includes('/login');
    if (error.response?.status === 401 && !isLoginPage && !isPublicLandingPage) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      window.location.replace('/login');
    }

    // Handle blob error responses - if error response is a blob but should be JSON
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        // Check if it's JSON or HTML error page
        if (text.startsWith('{') || text.startsWith('[')) {
          const errorData = JSON.parse(text);
          // Replace blob data with parsed JSON
          error.response.data = errorData;
        } else if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
          // HTML error page received instead of JSON
          error.response.data = {
            success: false,
            message: 'Server returned HTML error page instead of JSON',
            error: 'Invalid response format'
          };
        }
      } catch (e) {
        // If parsing fails, create a generic error
        error.response.data = {
          success: false,
          message: 'Unable to process error response',
          error: 'Invalid response format'
        };
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
  confirmOption: (id, data) => api.post(`/leads/${id}/confirm-option`, data),
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

// Calls APIs
export const callsAPI = {
  list: (filters = {}) => api.get('/calls', { params: filters }),
  get: (id) => api.get(`/calls/${id}`),
  getLeadHistory: (leadId) => api.get(`/leads/${leadId}/calls`),
  addNote: (callId, note) => api.post(`/calls/${callId}/notes`, { note }),
  updateNote: (callId, noteId, note) => api.put(`/calls/${callId}/notes/${noteId}`, { note }),
  clickToCall: (data) => api.post('/calls/click-to-call', data),
  getRecording: (callId) => api.get(`/calls/${callId}/recording`, { responseType: 'blob' }),
  getMappings: () => api.get('/calls/mappings'),
  createMapping: (data) => api.post('/calls/mappings', data),
  updateMapping: (id, data) => api.put(`/calls/mappings/${id}`, data),
  deleteMapping: (id) => api.delete(`/calls/mappings/${id}`),
};

// Payments APIs
export const paymentsAPI = {
  dueToday: () => api.get('/payments/due-today'),
  pending: () => api.get('/payments/pending'),
  getByLead: (leadId) => api.get(`/payments/lead/${leadId}`),
  create: (data) => api.post('/payments', data),
};

// Followups APIs
export const followupsAPI = {
  today: () => api.get('/followups/today'),
  overdue: () => api.get('/followups/overdue'),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  complete: (id) => api.put(`/followups/${id}/complete`),
  delete: (id) => api.delete(`/followups/${id}`),
};

// Documents APIs
export const documentsAPI = {
  list: (params = {}) => api.get('/documents', { params }),
  upload: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

// Vouchers APIs
export const vouchersAPI = {
  preview: (leadId) => api.get(`/vouchers/lead/${leadId}/preview`, { responseType: 'blob' }),
  download: (leadId) => api.get(`/vouchers/lead/${leadId}/download`, { responseType: 'blob' }),
  send: (leadId, data = {}) => api.post(`/vouchers/lead/${leadId}/send`, data),
};

// Lead Invoices (preview PDF, send by email)
export const leadInvoicesAPI = {
  preview: (leadId, invoiceId) => api.get(`/leads/${leadId}/invoices/${invoiceId}/preview`, { responseType: 'blob' }),
  download: (leadId, invoiceId) => api.get(`/leads/${leadId}/invoices/${invoiceId}/download`, { responseType: 'blob' }),
  send: (leadId, invoiceId, data = {}) => api.post(`/leads/${leadId}/invoices/${invoiceId}/send`, data),
};

// Follow-up API (for client details)
export const followUpAPI = {
  getClientFollowUps: (clientId) => api.get(`/clients/${clientId}/follow-ups`),
  create: (data) => api.post('/follow-ups', data),
  update: (id, data) => api.put(`/follow-ups/${id}`, data),
  delete: (id) => api.delete(`/follow-ups/${id}`),
};

// WhatsApp APIs
export const whatsappAPI = {
  inbox: () => api.get('/whatsapp/inbox'),
  inboxByUser: (userId) => api.get(`/whatsapp/inbox-by-user/${userId}`),
  send: (leadId, message) => api.post('/whatsapp/send', { lead_id: leadId, message }),
  sendMedia: (leadId, file, caption) => {
    const form = new FormData();
    form.append('lead_id', leadId);
    form.append('media_file', file);
    if (caption) form.append('caption', caption);
    return api.post('/whatsapp/send-media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  messages: (leadId, params = {}) => api.get(`/whatsapp/messages/${leadId}`, { params }),
};

// Marketing Templates
export const marketingTemplatesAPI = {
  list: () => api.get('/marketing/templates'),
  create: (data) => api.post('/marketing/templates', data),
  get: (id) => api.get(`/marketing/templates/${id}`),
  update: (id, data) => api.put(`/marketing/templates/${id}`, data),
  delete: (id) => api.delete(`/marketing/templates/${id}`),
  duplicate: (id) => api.post(`/marketing/templates/${id}/duplicate`),
};

// Marketing Dashboard
export const marketingAPI = {
  dashboard: (params = {}) => api.get('/marketing/dashboard', { params }),
};

// Email Campaigns (Marketing)
export const marketingEmailCampaignsAPI = {
  list: (params = {}) => api.get('/marketing/email-campaigns', { params }),
  create: (data) => api.post('/marketing/email-campaigns', data),
  update: (id, data) => api.put(`/marketing/email-campaigns/${id}`, data),
  delete: (id) => api.delete(`/marketing/email-campaigns/${id}`),
  send: (id) => api.post(`/marketing/email-campaigns/${id}/send`),
};

// WhatsApp Campaigns (Marketing)
export const marketingWhatsappCampaignsAPI = {
  list: (params = {}) => api.get('/marketing/whatsapp/campaigns', { params }),
  create: (data) => api.post('/marketing/whatsapp/campaigns', data),
  update: (id, data) => api.put(`/marketing/whatsapp/campaigns/${id}`, data),
  delete: (id) => api.delete(`/marketing/whatsapp/campaigns/${id}`),
  send: (id) => api.post(`/marketing/whatsapp/campaigns/${id}/send`),
};

// Client Groups (Marketing)
export const clientGroupsAPI = {
  list: () => api.get('/marketing/client-groups'),
  create: (data) => api.post('/marketing/client-groups', data),
  get: (id) => api.get(`/marketing/client-groups/${id}`),
  update: (id, data) => api.put(`/marketing/client-groups/${id}`, data),
  delete: (id) => api.delete(`/marketing/client-groups/${id}`),
  addClients: (id, clientIds) => api.post(`/marketing/client-groups/${id}/add-clients`, { client_ids: clientIds }),
  getClients: (id) => api.get(`/marketing/client-groups/${id}/clients`),
};

// Landing Pages (Marketing)
export const landingPagesAPI = {
  list: () => api.get('/marketing/landing-pages'),
  get: (id) => api.get(`/marketing/landing-pages/${id}`),
  create: (data) => api.post('/marketing/landing-pages', data),
  update: (id, data) => api.put(`/marketing/landing-pages/${id}`, data),
  updateSections: (id, sections) => api.put(`/marketing/landing-pages/${id}`, { sections }),
  delete: (id) => api.delete(`/marketing/landing-pages/${id}`),
  publish: (id) => api.post(`/marketing/landing-pages/${id}/publish`),
  preview: (id) => api.get(`/marketing/landing-pages/${id}/preview`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/marketing/landing-pages/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Public landing page (no auth required)
export const publicLandingPageAPI = {
  get: (slug) => api.get(`/public/marketing/landing-page/${slug}`),
  submitEnquiry: (slug, data) => api.post(`/public/marketing/landing-page/${slug}/enquiry`, data),
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
  /** Get Google OAuth URL with signed state (requires auth). Use this then redirect to returned url to avoid "User not found" on callback. */
  getConnectUrlForRedirect: () => api.get('/google/connect-url'),
  /** Legacy: direct URL to /google/connect (no auth on redirect, may cause "User not found" on callback). */
  getConnectUrl: () => {
    const base = `${API_BASE_URL}/google/connect`;
    if (typeof window === 'undefined') {
      return base;
    }
    const hostname = window.location.hostname || '';
    if (hostname.endsWith('.localhost')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'localhost') {
        return `${base}?subdomain=${encodeURIComponent(subdomain)}`;
      }
    }
    return base;
  },
  sendMail: (data) => api.post('/send-gmail', data),
  sendMailWithAttachment: (data) => {
    const form = new FormData();
    form.append('to', data.to || data.to_email);
    form.append('to_email', data.to_email);
    form.append('subject', data.subject);
    form.append('body', data.body);
    if (data.lead_id != null) form.append('lead_id', data.lead_id);
    if (data.thread_id) form.append('thread_id', data.thread_id);
    if (data.attachment) form.append('attachment', data.attachment);
    return api.post('/send-gmail', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  syncInbox: () => api.get('/sync-inbox'),
  getEmailInbox: (params) => api.get('/emails/inbox', { params: params || {} }),
  markEmailsRead: (data) => api.post('/emails/mark-read', data),
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
  update: (data) => api.put('/settings/update', data),
  reset: () => api.post('/admin/settings/reset'),
  // New settings API for hotel options and package settings
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get('/settings', { params: { key } }),
  save: (data) => api.post('/settings', data),
  getMaxHotelOptions: () => api.get('/settings/max-hotel-options'),
  // Company details from companies table
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data) => api.put('/settings/company', data),
};

// Sidebar menu (dynamic from backend)
export const menuAPI = {
  get: () => api.get('/menu'),
  update: (menu) => api.put('/menu', { menu }),
};

// Content / labels (dynamic - Phase 1 & 2)
export const contentAPI = {
  getAll: () => api.get('/content'),
  getByKeys: (keys) => api.get('/content', { params: { keys: Array.isArray(keys) ? keys.join(',') : keys } }),
  update: (content) => api.put('/content', { content }),
};

// Suppliers APIs
export const suppliersAPI = {
  list: () => api.get('/suppliers'),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  sendEmail: (data) => api.post('/suppliers/send-email', data),
  financialSummary: (supplierId, period = 'yearly', extraParams = {}) =>
    api.get(`/suppliers/${supplierId}/financial-summary`, {
      params: { period, ...extraParams },
    }),
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

// Itinerary Pricing APIs
export const itineraryPricingAPI = {
  get: (packageId) => api.get(`/packages/${packageId}/pricing`),
  save: (packageId, data) => api.put(`/packages/${packageId}/pricing`, data),
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
  getLiveRate: (from) => api.get('/currencies/live-rate', { params: { from } }),
  setPrimary: (id) => api.put(`/currencies/${id}/set-primary`),
};

// Query Detail API
export const queryDetailAPI = {
  getDetail: (id) => api.get(`/queries/${id}/detail`)
};

// Accounts APIs
export const accountsAPI = {
  // Get all account types
  getClients: () => api.get('/accounts/clients'),
  getAgents: () => api.get('/accounts/agents'),
  getCorporate: () => api.get('/accounts/corporate'),

  // Get cities for autocomplete
  getCities: (search) => api.get('/accounts/cities', { params: { search } }),

  // CRUD operations for clients
  getClient: (id) => api.get(`/accounts/clients/${id}`),
  createClient: (data) => api.post('/accounts/clients', data),
  updateClient: (id, data) => api.put(`/accounts/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/accounts/clients/${id}`),

  // CRUD operations for agents
  createAgent: (data) => api.post('/accounts/agents', data),
  updateAgent: (id, data) => api.put(`/accounts/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/accounts/agents/${id}`),

  // CRUD operations for corporate
  createCorporate: (data) => api.post('/accounts/corporate', data),
  updateCorporate: (id, data) => api.put(`/accounts/corporate/${id}`, data),
  deleteCorporate: (id) => api.delete(`/accounts/corporate/${id}`),
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
  verifyCompanyDns: (id) => api.post(`/super-admin/companies/${id}/verify-dns`),
  mailHealth: (params = {}) => api.get('/super-admin/mail/health', { params }),
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

// Services APIs
export const servicesAPI = {
  list: (filters = {}) => api.get('/services', { params: filters }),
  get: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getActive: () => api.get('/services/active'),
};

// Company Settings APIs
export const companySettingsAPI = {
  // Users management
  getUsers: (params = {}) => api.get('/company-settings/users', { params }),
  getUserDetails: (id) => api.get(`/company-settings/users/${id}`),
  getUserPerformance: (id) => api.get(`/company-settings/users/${id}/performance`),
  getTeamReport: (params = {}) => api.get('/company-settings/team-reports', { params }),
  createUser: (data) => api.post('/company-settings/users', data),
  updateUser: (id, data) => api.put(`/company-settings/users/${id}`, data),
  deleteUser: (id) => api.delete(`/company-settings/users/${id}`),

  // Branches management
  getBranches: (params = {}) => api.get('/company-settings/branches', { params }),
  createBranch: (data) => api.post('/company-settings/branches', data),
  updateBranch: (id, data) => api.put(`/company-settings/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/company-settings/branches/${id}`),

  // Roles management
  getRoles: () => api.get('/company-settings/roles'),
  createRole: (data) => api.post('/company-settings/roles', data),
  updateRole: (id, data) => api.put(`/company-settings/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/company-settings/roles/${id}`),
  // Permissions management
  getPermissions: () => api.get('/company-settings/permissions'),
  getRolePermissions: (roleId) => api.get(`/company-settings/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId, permissions) => api.put(`/company-settings/roles/${roleId}/permissions`, { permissions }),
  getUserPermissions: (userId) => api.get(`/company-settings/users/${userId}/permissions`),
  updateUserPermissions: (userId, permissions) => api.put(`/company-settings/users/${userId}/permissions`, { permissions }),

  // Statistics
  getStats: () => api.get('/company-settings/stats'),
  // Subscription details
  getSubscription: () => api.get('/company-settings/subscription'),
  // Mail settings
  getMailSettings: () => api.get('/company-settings/mail-settings'),
  updateMailSettings: (data) => api.put('/company-settings/mail-settings', data),
  testMailSettings: (data) => api.post('/company-settings/mail-settings/test', data),
};

// Company WhatsApp settings APIs
export const companyWhatsappAPI = {
  getSettings: () => api.get('/company/whatsapp/settings'),
  updateSettings: (data) => api.put('/company/whatsapp/settings', data),
  autoProvision: () => api.post('/company/whatsapp/auto-provision'),
  sync: () => api.post('/company/whatsapp/sync'),
  testConnection: () => api.post('/company/whatsapp/test-connection'),
};

// Company Google (Gmail) settings APIs
export const companyGoogleAPI = {
  getSettings: () => api.get('/company/google/settings'),
  updateSettings: (data) => api.put('/company/google/settings', data),
};

// Notifications APIs
export const notificationsAPI = {
  savePushToken: (data) => api.post('/notifications/tokens', data),
  deletePushToken: (data) => api.delete('/notifications/tokens', { data }),
  sendPush: (data) => api.post('/notifications/push', data),
  sendEmail: (data) => {
    if (data instanceof FormData) {
      return api.post('/notifications/email', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/notifications/email', data);
  },
};

// Quotations APIs
export const quotationsAPI = {
  list: (params = {}) => api.get('/quotations', { params }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  download: (id) => api.get(`/quotations/${id}/download`, { responseType: 'blob' }),
  preview: (id) => api.get(`/quotations/${id}/preview`, { responseType: 'blob' }),
  send: (id, data) => api.post(`/quotations/${id}/send`, data),
};


// Master Points (Inclusions, Exclusions, Terms)
export const masterPointsAPI = {
  list: (type) => api.get('/master-points', { params: { type } }),
  create: (data) => api.post('/master-points', data),
  update: (id, data) => api.put(`/master-points/${id}`, data),
  delete: (id) => api.delete(`/master-points/${id}`),
};

export default api;

