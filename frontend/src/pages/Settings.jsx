import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, RotateCcw, Save, Hotel, Mail } from 'lucide-react';
import { settingsAPI, googleMailAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { settings, updateSettings, resetSettings, loading: settingsLoading } = useSettings();
  const [formData, setFormData] = useState({
    sidebar_color: '#2765B0',
    dashboard_background_color: '#D8DEF5',
    header_background_color: '#D8DEF5',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [maxHotelOptions, setMaxHotelOptions] = useState(4);
  const [savingItinerarySettings, setSavingItinerarySettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        sidebar_color: settings.sidebar_color || '#2765B0',
        dashboard_background_color: settings.dashboard_background_color || '#D8DEF5',
        header_background_color: settings.header_background_color || '#D8DEF5',
      });
    }
    fetchMaxHotelOptions();
  }, [settings]);

  const fetchMaxHotelOptions = async () => {
    try {
      const response = await settingsAPI.getMaxHotelOptions();
      if (response.data.success && response.data.data?.max_hotel_options) {
        setMaxHotelOptions(response.data.data.max_hotel_options);
      }
    } catch (err) {
      console.error('Failed to fetch max hotel options:', err);
    }
  };

  const saveItinerarySettings = async () => {
    try {
      setSavingItinerarySettings(true);
      await settingsAPI.save({
        key: 'max_hotel_options',
        value: maxHotelOptions.toString(),
        type: 'integer',
        description: 'Maximum number of hotel options allowed per day in itinerary'
      });
      setMessage({ type: 'success', text: 'Itinerary settings saved successfully!' });
    } catch (err) {
      console.error('Failed to save itinerary settings:', err);
      setMessage({ type: 'error', text: 'Failed to save itinerary settings. Please try again.' });
    } finally {
      setSavingItinerarySettings(false);
    }
  };

<<<<<<< HEAD
  // Check if user is Admin
  const isAdmin = user?.role === 'Admin' || user?.roles?.some(role => role.name === 'Admin') || false;
=======
  // Check if user has admin access (support different role shapes/names)
  const roleValues = [
    user?.role,
    user?.role_name,
    user?.roleName,
    user?.user_role,
    ...(user?.roles?.map(role => (typeof role === 'string' ? role : role?.name)) || [])
  ].filter(Boolean);
  const normalizedRoles = roleValues.map(role => role.toString().toLowerCase());
  const hasAdminRole = normalizedRoles.some(role => role.includes('admin'));
  const hasSettingsPermission = Array.isArray(user?.permissions)
    && user.permissions.some(permission => permission?.toString().toLowerCase() === 'manage_company_settings');
  const isSettingsAdmin = Boolean(user?.is_super_admin || hasAdminRole || hasSettingsPermission);
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">You do not have permission to access this page. Admin access required.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateSettings(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await resetSettings();
      if (result.success) {
        setFormData({
          sidebar_color: '#2765B0',
          dashboard_background_color: '#D8DEF5',
          header_background_color: '#D8DEF5',
        });
        setMessage({ type: 'success', text: 'Settings reset to default values!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to reset settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while resetting settings' });
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Company Settings
          </h1>
          <p className="text-gray-600 mt-2">Customize your dashboard colors</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Sidebar Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sidebar Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.sidebar_color}
                  onChange={(e) => handleChange('sidebar_color', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.sidebar_color}
                  onChange={(e) => handleChange('sidebar_color', e.target.value)}
                  placeholder="#2765B0"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div
                  className="w-16 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: formData.sidebar_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #2765B0</p>
            </div>

            {/* Dashboard Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dashboard Background Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.dashboard_background_color}
                  onChange={(e) => handleChange('dashboard_background_color', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.dashboard_background_color}
                  onChange={(e) => handleChange('dashboard_background_color', e.target.value)}
                  placeholder="#D8DEF5"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div
                  className="w-16 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: formData.dashboard_background_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #D8DEF5</p>
            </div>

            {/* Header Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header Background Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.header_background_color}
                  onChange={(e) => handleChange('header_background_color', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.header_background_color}
                  onChange={(e) => handleChange('header_background_color', e.target.value)}
                  placeholder="#D8DEF5"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div
                  className="w-16 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: formData.header_background_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #D8DEF5</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Preview</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Sidebar</p>
              <div
                className="h-32 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: formData.sidebar_color }}
              ></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Dashboard & Header</p>
              <div
                className="h-32 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: formData.dashboard_background_color }}
              ></div>
            </div>
          </div>
        </div>

        {/* Email Template Settings */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Email Template Settings</h2>
            </div>
            <a
              href="/email-templates"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage Templates →
            </a>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Select the email template to use when sending quotations to clients
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Email Template
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="template-1"
                onChange={async (e) => {
                  try {
                    await settingsAPI.save({
                      key: 'selected_email_template',
                      value: e.target.value,
                      type: 'string',
                      description: 'Selected email template for sending quotations'
                    });
                    setMessage({ type: 'success', text: 'Email template updated successfully!' });
                  } catch (err) {
                    setMessage({ type: 'error', text: 'Failed to update email template' });
                  }
                }}
              >
                <option value="template-1">Professional Classic</option>
                <option value="template-2">3D Premium Card</option>
                <option value="template-3">3D Floating Boxes</option>
                <option value="template-4">3D Layered Design</option>
                <option value="template-5">Adventure Travel</option>
                <option value="template-6">Beach Paradise</option>
                <option value="template-7">Elegant Package</option>
                <option value="template-8">Modern Elegant</option>
                <option value="template-9">Minimalist</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This template will be used when sending quotations via email
              </p>
            </div>
          </div>
        </div>

        {/* Gmail Connection Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-800">Gmail Integration</h2>
            </div>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Connect your Gmail account to send and receive emails directly from the CRM.
          </p>
          <div className="flex items-center gap-4">
            {user?.google_token ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
                  Connected as {user.gmail_email}
                </div>
                <button
                  onClick={() => window.location.href = googleMailAPI.getConnectUrl()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium w-fit"
                >
                  Reconnect Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = googleMailAPI.getConnectUrl()}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Connect Gmail Account
              </button>
            )}
          </div>
        </div>
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hotel className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Itinerary Settings</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">Configure settings for itinerary management</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Hotel Options Per Day
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Set the maximum number of hotel options that can be added per day in an itinerary.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxHotelOptions}
                  onChange={(e) => setMaxHotelOptions(parseInt(e.target.value) || 1)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">option(s)</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Current value: {maxHotelOptions} option(s) per day
              </p>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={saveItinerarySettings}
                disabled={savingItinerarySettings}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {savingItinerarySettings ? 'Saving...' : 'Save Itinerary Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

