import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, RotateCcw, Save, Hotel, Mail, Bell } from 'lucide-react';
import { settingsAPI, googleMailAPI, notificationsAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { t } = useContent();
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
  const [sendingTestPush, setSendingTestPush] = useState(false);

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
      setMessage({ type: 'success', text: t('settings.itinerary_saved') });
    } catch (err) {
      console.error('Failed to save itinerary settings:', err);
      setMessage({ type: 'error', text: 'Failed to save itinerary settings. Please try again.' });
    } finally {
      setSavingItinerarySettings(false);
    }
  };



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
        setMessage({ type: 'success', text: t('settings.settings_updated') });
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
    if (!window.confirm(t('settings.reset_confirm'))) {
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
        setMessage({ type: 'success', text: t('settings.settings_reset') });
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
          <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            <SettingsIcon className="w-8 h-8" />
            {t('settings.page_title')}
          </h1>
          <p className="mt-2 text-gray-600">{t('settings.subtitle')}</p>
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

        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
          <div className="space-y-6">
            {/* Sidebar Color */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.sidebar_color')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.sidebar_color}
                  onChange={(e) => handleChange('sidebar_color', e.target.value)}
                  className="w-24 h-12 border border-gray-300 rounded cursor-pointer"
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
                  className="w-16 h-12 border border-gray-300 rounded"
                  style={{ backgroundColor: formData.sidebar_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #2765B0</p>
            </div>

            {/* Dashboard Background Color */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.dashboard_bg_color')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.dashboard_background_color}
                  onChange={(e) => handleChange('dashboard_background_color', e.target.value)}
                  className="w-24 h-12 border border-gray-300 rounded cursor-pointer"
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
                  className="w-16 h-12 border border-gray-300 rounded"
                  style={{ backgroundColor: formData.dashboard_background_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #D8DEF5</p>
            </div>

            {/* Header Background Color */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.header_bg_color')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.header_background_color}
                  onChange={(e) => handleChange('header_background_color', e.target.value)}
                  className="w-24 h-12 border border-gray-300 rounded cursor-pointer"
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
                  className="w-16 h-12 border border-gray-300 rounded"
                  style={{ backgroundColor: formData.header_background_color }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Default: #D8DEF5</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? t('settings.saving') : t('settings.save_settings')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              {t('settings.reset_to_default')}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">{t('settings.preview')}</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="mb-2 text-sm text-gray-600">{t('settings.sidebar')}</p>
              <div
                className="h-32 border-2 border-gray-300 rounded-lg"
                style={{ backgroundColor: formData.sidebar_color }}
              ></div>
            </div>
            <div className="flex-1">
              <p className="mb-2 text-sm text-gray-600">{t('settings.dashboard_and_header')}</p>
              <div
                className="h-32 border-2 border-gray-300 rounded-lg"
                style={{ backgroundColor: formData.dashboard_background_color }}
              ></div>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Push notifications</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Send a test notification to this device to verify push is working. You will receive it when the tab is in background or from the system.
          </p>
          <button
            type="button"
            disabled={sendingTestPush}
            onClick={async () => {
              setSendingTestPush(true);
              setMessage({ type: '', text: '' });
              try {
                const res = await notificationsAPI.sendPush({
                  title: 'Test notification',
                  body: 'If you see this, push notifications are working.',
                });
                if (res.data?.success) {
                  setMessage({ type: 'success', text: 'Test notification sent. Check your device or browser.' });
                } else {
                  setMessage({ type: 'error', text: res.data?.message || 'Failed to send test notification.' });
                }
              } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Failed to send test notification.';
                setMessage({ type: 'error', text: msg });
              } finally {
                setSendingTestPush(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell className="w-4 h-4" />
            {sendingTestPush ? 'Sending…' : 'Send test notification'}
          </button>
        </div>

        {/* Email Template Settings */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">{t('settings.email_template_settings')}</h2>
            </div>
            <a
              href="/email-templates"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t('settings.manage_templates')}
            </a>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            {t('settings.email_template_help')}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.default_email_template')}
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
                    setMessage({ type: 'success', text: t('settings.email_template_updated') });
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
              <p className="mt-1 text-xs text-gray-500">
                {t('settings.template_used_for_quotations')}
              </p>
            </div>
          </div>
        </div>

        {/* Gmail Connection Section */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-800">{t('settings.gmail_integration')}</h2>
            </div>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            {t('settings.gmail_help')}
          </p>
          <div className="flex items-center gap-4">
            {user?.google_token ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-medium text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  {t('settings.connected_as')} {user.gmail_email}
                </div>
                <button
                  onClick={() => window.location.href = googleMailAPI.getConnectUrl()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 w-fit"
                >
                  {t('settings.reconnect_account')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = googleMailAPI.getConnectUrl()}
                className="flex items-center gap-2 px-6 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
              >
                <Mail className="w-4 h-4" />
                {t('settings.connect_gmail')}
              </button>
            )}
          </div>
        </div>
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Hotel className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">{t('settings.itinerary_settings')}</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">{t('settings.itinerary_help')}</p>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t('settings.max_hotel_options')}
              </label>
              <p className="mb-2 text-xs text-gray-500">
                {t('settings.max_hotel_help')}
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
                <span className="text-sm text-gray-600">{t('settings.options_per_day')}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Current value: {maxHotelOptions} {t('settings.options_per_day')}
              </p>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={saveItinerarySettings}
                disabled={savingItinerarySettings}
                className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {savingItinerarySettings ? t('settings.saving') : t('settings.save_itinerary_settings')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

