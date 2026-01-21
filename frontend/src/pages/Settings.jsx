import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, RotateCcw, Save, Hotel, Mail, Bell, Info, MessageCircle } from 'lucide-react';
import { settingsAPI, googleMailAPI, notificationsAPI, companyWhatsappAPI, companyGoogleAPI } from '../services/api';

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
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [pushSending, setPushSending] = useState(false);
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [testPush, setTestPush] = useState({
    title: 'CRM Notification',
    body: 'This is a test push notification.',
  });
  const [whatsappForm, setWhatsappForm] = useState({
    whatsapp_phone_number_id: '',
    whatsapp_api_key: '',
    whatsapp_business_account_id: '',
    whatsapp_app_secret: '',
    whatsapp_verify_token: '',
    whatsapp_enabled: false,
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState({ type: '', text: '' });
  const [whatsappCompanyId, setWhatsappCompanyId] = useState(null);
  const [googleForm, setGoogleForm] = useState({
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: '',
    google_enabled: false,
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSaving, setGoogleSaving] = useState(false);
  const [googleMessage, setGoogleMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (settings) {
      setFormData({
        sidebar_color: settings.sidebar_color || '#2765B0',
        dashboard_background_color: settings.dashboard_background_color || '#D8DEF5',
        header_background_color: settings.header_background_color || '#D8DEF5',
      });
    }
    fetchMaxHotelOptions();
    fetchWhatsappSettings();
    fetchGoogleSettings();
  }, [settings]);

  const fetchWhatsappSettings = async () => {
    setWhatsappLoading(true);
    try {
      const response = await companyWhatsappAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data || {};
        setWhatsappCompanyId(data.company_id || null);
        setWhatsappForm({
          whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
          whatsapp_api_key: data.whatsapp_api_key || '',
          whatsapp_business_account_id: data.whatsapp_business_account_id || '',
          whatsapp_app_secret: data.whatsapp_app_secret || data.whatsapp_webhook_secret || '',
          whatsapp_verify_token: data.whatsapp_verify_token || '',
          whatsapp_enabled: Boolean(data.enabled),
        });
      }
    } catch (error) {
      setWhatsappMessage({ type: 'error', text: 'Failed to load WhatsApp settings.' });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const fetchGoogleSettings = async () => {
    setGoogleLoading(true);
    try {
      const response = await companyGoogleAPI.getSettings();
      if (response.data.success) {
        const data = response.data.data || {};
        setGoogleForm({
          google_client_id: data.google_client_id || '',
          google_client_secret: data.google_client_secret || '',
          google_redirect_uri: data.google_redirect_uri || '',
          google_enabled: Boolean(data.google_enabled),
        });
      }
    } catch (error) {
      setGoogleMessage({ type: 'error', text: 'Failed to load Gmail settings.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const generateVerifyToken = () => {
    const randomToken = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    setWhatsappForm(prev => ({ ...prev, whatsapp_verify_token: randomToken }));
  };

  const copyToClipboard = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      setWhatsappMessage({ type: 'success', text: successMessage });
    } catch (error) {
      setWhatsappMessage({ type: 'error', text: 'Copy failed. Please copy manually.' });
    }
  };

  const saveWhatsappSettings = async () => {
    setWhatsappSaving(true);
    setWhatsappMessage({ type: '', text: '' });
    try {
      await companyWhatsappAPI.updateSettings({
        whatsapp_phone_number_id: whatsappForm.whatsapp_phone_number_id,
        whatsapp_api_key: whatsappForm.whatsapp_api_key,
        whatsapp_business_account_id: whatsappForm.whatsapp_business_account_id,
        whatsapp_webhook_secret: whatsappForm.whatsapp_app_secret,
        whatsapp_app_secret: whatsappForm.whatsapp_app_secret,
        whatsapp_verify_token: whatsappForm.whatsapp_verify_token,
        whatsapp_enabled: whatsappForm.whatsapp_enabled,
      });
      setWhatsappMessage({ type: 'success', text: 'WhatsApp settings saved successfully.' });
    } catch (error) {
      const messageText = error.response?.data?.message || 'Failed to save WhatsApp settings.';
      setWhatsappMessage({ type: 'error', text: messageText });
    } finally {
      setWhatsappSaving(false);
    }
  };

  const saveGoogleSettings = async () => {
    setGoogleSaving(true);
    setGoogleMessage({ type: '', text: '' });
    try {
      await companyGoogleAPI.updateSettings({
        google_client_id: googleForm.google_client_id,
        google_client_secret: googleForm.google_client_secret,
        google_redirect_uri: googleForm.google_redirect_uri,
        google_enabled: googleForm.google_enabled,
      });
      setGoogleMessage({ type: 'success', text: 'Gmail settings saved successfully.' });
    } catch (error) {
      const messageText = error.response?.data?.message || 'Failed to save Gmail settings.';
      setGoogleMessage({ type: 'error', text: messageText });
    } finally {
      setGoogleSaving(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook${whatsappCompanyId ? `?company_id=${whatsappCompanyId}` : ''}`
    : '';

  const FieldHelp = ({ title, steps }) => (
    <span className="relative group inline-flex items-center ml-2">
      <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
      <div className="hidden group-hover:block absolute z-20 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg -left-6 top-6">
        <div className="text-sm font-semibold text-gray-800 mb-2">{title}</div>
        <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
    </span>
  );

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

  // Check if user has admin access
  const roleValues = [
    user?.role,
    ...(user?.roles?.map(role => (typeof role === 'string' ? role : role?.name)) || [])
  ].filter(Boolean);
  const normalizedRoles = roleValues.map(role => role.toString().toLowerCase());
  const isSettingsAdmin = Boolean(
    user?.is_super_admin
    || normalizedRoles.some(role => [
      'admin',
      'company admin',
      'super admin',
      'companyadmin',
      'superadmin'
    ].includes(role))
  );

  if (!isSettingsAdmin) {
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

  const sendTestEmail = async () => {
    if (!testEmail.to || !testEmail.subject || !testEmail.body) {
      setNotificationMessage({ type: 'error', text: 'Please fill all test email fields.' });
      return;
    }

    setEmailSending(true);
    setNotificationMessage({ type: '', text: '' });

    try {
      await notificationsAPI.sendEmail(testEmail);
      setNotificationMessage({ type: 'success', text: 'Test email sent successfully.' });
    } catch (error) {
      const messageText = error.response?.data?.message || 'Failed to send test email.';
      setNotificationMessage({ type: 'error', text: messageText });
    } finally {
      setEmailSending(false);
    }
  };

  const sendTestPush = async () => {
    if (!testPush.title || !testPush.body) {
      setNotificationMessage({ type: 'error', text: 'Please fill all push notification fields.' });
      return;
    }

    setPushSending(true);
    setNotificationMessage({ type: '', text: '' });

    try {
      await notificationsAPI.sendPush(testPush);
      setNotificationMessage({ type: 'success', text: 'Test push sent to your account.' });
    } catch (error) {
      const messageText = error.response?.data?.message || 'Failed to send test push.';
      setNotificationMessage({ type: 'error', text: messageText });
    } finally {
      setPushSending(false);
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
          <div className="mb-4 text-sm text-gray-600">
            Fill the Gmail setup below before connecting.
          </div>

          {googleMessage.text && (
            <div
              className={`mb-4 p-3 rounded-lg ${googleMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}
            >
              {googleMessage.text}
            </div>
          )}

          {googleLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client ID
                  <FieldHelp
                    title="Where to get Client ID"
                    steps={[
                      'Google Cloud Console > APIs & Services > Credentials',
                      'Create OAuth Client ID (Web)',
                      'Copy the Client ID from the credentials list'
                    ]}
                  />
                </label>
                <input
                  type="text"
                  value={googleForm.google_client_id}
                  onChange={(e) => setGoogleForm(prev => ({ ...prev, google_client_id: e.target.value }))}
                  placeholder="e.g. 1234567890-xxxxx.apps.googleusercontent.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client Secret
                  <FieldHelp
                    title="Where to get Client Secret"
                    steps={[
                      'Google Cloud Console > APIs & Services > Credentials',
                      'Open your OAuth Client',
                      'Copy Client Secret'
                    ]}
                  />
                </label>
                <input
                  type="password"
                  value={googleForm.google_client_secret}
                  onChange={(e) => setGoogleForm(prev => ({ ...prev, google_client_secret: e.target.value }))}
                  placeholder="Paste client secret"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URI
                  <FieldHelp
                    title="Add Redirect URI"
                    steps={[
                      'Google Cloud Console > APIs & Services > Credentials',
                      'Open OAuth Client',
                      'Add this Redirect URI in Authorized redirect URIs'
                    ]}
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleForm.google_redirect_uri}
                    onChange={(e) => setGoogleForm(prev => ({ ...prev, google_redirect_uri: e.target.value }))}
                    placeholder="http://127.0.0.1:8000/api/google/callback"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(googleForm.google_redirect_uri || `${window.location.origin.replace(':3000', ':8000')}/api/google/callback`, 'Redirect URI copied')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="google_enabled"
                  type="checkbox"
                  checked={googleForm.google_enabled}
                  onChange={(e) => setGoogleForm(prev => ({ ...prev, google_enabled: e.target.checked }))}
                  className="h-4 w-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="google_enabled" className="text-sm text-gray-700">
                  Enable Gmail for this company
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveGoogleSettings}
                  disabled={googleSaving}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {googleSaving ? 'Saving...' : 'Save Gmail Settings'}
                </button>
              </div>
            </div>
          )}
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

        {/* Notifications Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Send test push notifications and emails to validate setup.
          </p>

          {notificationMessage.text && (
            <div
              className={`mb-4 p-3 rounded-lg ${notificationMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}
            >
              {notificationMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Test Push Notification</h3>
              <input
                type="text"
                value={testPush.title}
                onChange={(e) => setTestPush(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Push title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={testPush.body}
                onChange={(e) => setTestPush(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Push message"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={sendTestPush}
                disabled={pushSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pushSending ? 'Sending...' : 'Send Test Push'}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Send Test Email</h3>
              <input
                type="email"
                value={testEmail.to}
                onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="Recipient email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={testEmail.subject}
                onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={testEmail.body}
                onChange={(e) => setTestEmail(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email message"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={sendTestEmail}
                disabled={emailSending}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSending ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">WhatsApp Business Integration</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Add your company WhatsApp API details here. Each company can enter their own Meta credentials.
          </p>

          {whatsappMessage.text && (
            <div
              className={`mb-4 p-3 rounded-lg ${whatsappMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}
            >
              {whatsappMessage.text}
            </div>
          )}

          {whatsappLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                  <FieldHelp
                    title="Where to find Phone Number ID"
                    steps={[
                      'Open Meta Developers > Your App',
                      'Go to WhatsApp > Getting Started',
                      'Copy the Phone Number ID from the setup panel'
                    ]}
                  />
                </label>
                <input
                  type="text"
                  value={whatsappForm.whatsapp_phone_number_id}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                  placeholder="e.g. 123456789012345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Access Token
                  <FieldHelp
                    title="How to generate Permanent Token"
                    steps={[
                      'Meta Developers > Business Settings',
                      'System Users > Add user and generate token',
                      'Select whatsapp_business_messaging & whatsapp_business_management'
                    ]}
                  />
                </label>
                <input
                  type="password"
                  value={whatsappForm.whatsapp_api_key}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                  placeholder="Paste permanent access token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID
                  <FieldHelp
                    title="Where to find Business Account ID"
                    steps={[
                      'Meta Developers > WhatsApp > Getting Started',
                      'Look for WABA ID / Business Account ID',
                      'Copy the ID shown in the dashboard'
                    ]}
                  />
                </label>
                <input
                  type="text"
                  value={whatsappForm.whatsapp_business_account_id}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_business_account_id: e.target.value }))}
                  placeholder="WABA ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Secret
                  <FieldHelp
                    title="Where to find App Secret"
                    steps={[
                      'Meta Developers > App Settings > Basic',
                      'Click “Show” next to App Secret',
                      'Copy and paste here'
                    ]}
                  />
                </label>
                <input
                  type="password"
                  value={whatsappForm.whatsapp_app_secret}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_app_secret: e.target.value }))}
                  placeholder="App secret from Meta"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Verify Token
                  <FieldHelp
                    title="What is Verify Token?"
                    steps={[
                      'Generate a random token here',
                      'Paste the same token in Meta Webhooks',
                      'Used to verify webhook connection'
                    ]}
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={whatsappForm.whatsapp_verify_token}
                    onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_verify_token: e.target.value }))}
                    placeholder="Click generate or paste your own"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={generateVerifyToken}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(whatsappForm.whatsapp_verify_token, 'Verify token copied')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                  <FieldHelp
                    title="Where to set Webhook URL"
                    steps={[
                      'Meta Developers > Webhooks',
                      'Add callback URL from here',
                      'Subscribe to messages events'
                    ]}
                  />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL copied')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="whatsapp_enabled"
                  type="checkbox"
                  checked={whatsappForm.whatsapp_enabled}
                  onChange={(e) => setWhatsappForm(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                />
                <label htmlFor="whatsapp_enabled" className="text-sm text-gray-700">
                  Enable WhatsApp for this company
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveWhatsappSettings}
                  disabled={whatsappSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {whatsappSaving ? 'Saving...' : 'Save WhatsApp Settings'}
                </button>
              </div>
            </div>
          )}
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

