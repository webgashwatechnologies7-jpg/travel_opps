import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { contentAPI } from '../services/api';

const ContentContext = createContext(null);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
};

/**
 * Default fallbacks when API fails or key is missing (Phase 2 fallback).
 */
const DEFAULT_CONTENT = {
  'marketing.dashboard.title': 'Marketing Dashboard',
  'marketing.dashboard.subtitle': 'Manage your campaigns and track performance',
  'marketing.dashboard.search_placeholder': 'Search campaigns...',
  'marketing.dashboard.time_filter': 'This Month',
  'marketing.dashboard.new_campaign': '+ New Campaign',
  'marketing.dashboard.card_campaigns': 'Jan. Campaigns',
  'marketing.dashboard.card_leads': 'Jan. Leads',
  'marketing.dashboard.card_emails': 'Emails Sent',
  'marketing.dashboard.card_response': 'Response Rate',
  'marketing.dashboard.start_marketing': 'Start Marketing',
  'marketing.dashboard.customers': 'Customers',
  'marketing.dashboard.plan_trip': 'Plan a Trip',
  'marketing.dashboard.birthdays': 'Birthdays',
  'marketing.dashboard.anniversaries': 'Anniversaries',
  'marketing.dashboard.campaign_performance': 'Campaign Performance',
  'marketing.dashboard.view_all': 'View All',
  'marketing.dashboard.channel_performance': 'Channel Performance',
  'marketing.dashboard.chart_placeholder': 'Performance chart will appear here',
  'marketing.dashboard.channel_email': 'Email',
  'marketing.dashboard.channel_sms': 'SMS',
  'marketing.dashboard.channel_whatsapp': 'WhatsApp',
  'marketing.dashboard.recent_campaigns': 'Recent Campaigns',
  'common.view_more': 'View more',
  'common.view_all': 'View All',
  'common.create': 'Create',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.search': 'Q Search',
  'common.filter': 'Filter',
  'common.select': 'Select',
  'common.flight_search': 'Flight Search',
  'common.hotel_search': 'Hotel Search',
  'common.refresh': 'Refresh',
  'common.loading': 'Loading...',
  'common.no_data': 'No data available',
  'validation.required': 'This field is required',
  'validation.invalid_email': 'Invalid email address',

  // Settings (Phase 3)
  'settings.page_title': 'Company Settings',
  'settings.subtitle': 'Customize your dashboard colors',
  'settings.sidebar_color': 'Sidebar Color',
  'settings.dashboard_bg_color': 'Dashboard Background Color',
  'settings.header_bg_color': 'Header Background Color',
  'settings.save_settings': 'Save Settings',
  'settings.saving': 'Saving...',
  'settings.reset_to_default': 'Reset to Default',
  'settings.settings_updated': 'Settings updated successfully!',
  'settings.settings_reset': 'Settings reset to default values!',
  'settings.preview': 'Preview',
  'settings.sidebar': 'Sidebar',
  'settings.dashboard_and_header': 'Dashboard & Header',
  'settings.email_template_settings': 'Email Template Settings',
  'settings.manage_templates': 'Manage Templates →',
  'settings.email_template_help': 'Select the email template to use when sending quotations to clients',
  'settings.default_email_template': 'Default Email Template',
  'settings.template_used_for_quotations': 'This template will be used when sending quotations via email',
  'settings.email_template_updated': 'Email template updated successfully!',
  'settings.gmail_integration': 'Gmail Integration',
  'settings.gmail_help': 'Connect your Gmail account to send and receive emails directly from the CRM.',
  'settings.connected_as': 'Connected as',
  'settings.reconnect_account': 'Reconnect Account',
  'settings.connect_gmail': 'Connect Gmail Account',
  'settings.itinerary_settings': 'Itinerary Settings',
  'settings.itinerary_help': 'Configure settings for itinerary management',
  'settings.max_hotel_options': 'Maximum Hotel Options Per Day',
  'settings.max_hotel_help': 'Set the maximum number of hotel options that can be added per day in an itinerary.',
  'settings.options_per_day': 'option(s) per day',
  'settings.save_itinerary_settings': 'Save Itinerary Settings',
  'settings.itinerary_saved': 'Itinerary settings saved successfully!',
  'settings.no_permission': 'You do not have permission to access this page. Admin access required.',
  'settings.reset_confirm': 'Are you sure you want to reset all settings to default values?',
};

export const ContentProvider = ({ children }) => {
  const { user } = useAuth();
  const [content, setContent] = useState({ ...DEFAULT_CONTENT });
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await contentAPI.getAll();
      if (response.data?.success && response.data.data && typeof response.data.data === 'object') {
        setContent(prev => ({ ...DEFAULT_CONTENT, ...response.data.data }));
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      // Keep DEFAULT_CONTENT on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent, user]);

  /**
   * t(key) - get content by key. Returns value from API, or fallback, or key itself.
   * Usage: t('marketing.dashboard.title') => "Marketing Dashboard"
   */
  const t = useCallback((key, fallback = null) => {
    if (!key || typeof key !== 'string') return fallback ?? '';
    const value = content[key];
    if (value !== undefined && value !== null && value !== '') return value;
    return fallback ?? DEFAULT_CONTENT[key] ?? key;
  }, [content]);

  const value = {
    content,
    loading,
    t,
    loadContent,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};
