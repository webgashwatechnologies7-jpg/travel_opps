import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, RotateCcw, Save, Hotel, Mail, Bell, Upload, X, Building, Phone, MapPin, Globe, Image as ImageIcon, Copy } from 'lucide-react';
import api, { settingsAPI, googleMailAPI, notificationsAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { t } = useContent();
  const { settings, updateSettings, resetSettings, loadSettings, loading: settingsLoading } = useSettings();
  const [formData, setFormData] = useState({
    sidebar_color: '#2765B0',
    dashboard_background_color: '#D8DEF5',
    header_background_color: '#D8DEF5',
  });

  // Company Info State
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: ''
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [maxHotelOptions, setMaxHotelOptions] = useState(4);
  const [savingItinerarySettings, setSavingItinerarySettings] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [testingWebToLead, setTestingWebToLead] = useState(false);


  useEffect(() => {
    if (settings) {
      setFormData({
        sidebar_color: settings.sidebar_color || settings.sidebar_color1 || '#2765B0',
        dashboard_background_color: settings.dashboard_background_color || '#D8DEF5',
        header_background_color: settings.header_background_color || '#D8DEF5',
      });
      // Company details are now loaded from companies table via fetchCompanyDetails()
      // setCompanyForm({
      //   company_name: settings.company_name || '',
      //   company_address: settings.company_address || '',
      //   company_phone: settings.company_phone || '',
      //   company_email: settings.company_email || '',
      //   company_website: settings.company_website || ''
      // });
      // Logo is now loaded from companies table via fetchCompanyDetails()
      // setLogoPreview(settings.company_logo || null);
    }
    fetchMaxHotelOptions();
    fetchCompanyDetails();
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

  const fetchCompanyDetails = async () => {
    try {
      const response = await settingsAPI.getCompany();
      if (response.data?.success && response.data?.data) {
        const company = response.data.data;
        setCompanyForm({
          company_name: company.name || '',
          company_address: company.address || '',
          company_phone: company.phone || '',
          company_email: company.email || '',
          company_website: ''
        });
        if (company.logo) {
          setLogoPreview(company.logo);
        }
        if (company.favicon) {
          setFaviconPreview(company.favicon);
          // Apply to tab immediately
          const faviconEl = document.getElementById('favicon');
          if (faviconEl) {
            faviconEl.href = company.favicon;
          }
        }
        if (company.api_key) {
          setApiKey(company.api_key);
        }
      }
    } catch (err) {
      console.error('Failed to fetch company details:', err);
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

  const testWebToLeadAPI = async () => {
    try {
      setTestingWebToLead(true);
      const testData = {
        api_key: apiKey,
        name: "Test Name",
        phone: "+91-9000000000",
        destination: "Test Destination",
        email: "test@example.com",
        source: "CRM Settings Test",
        campaign_name: "API Integration Test",
        remark: "This is an automated test lead from the CRM Settings."
      };

      const response = await fetch(`${window.location.origin}/api/leads/web-to-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`API Test Successful! Lead Created (ID: ${result.data.lead_id})`);
      } else {
        toast.error(`API Error: ${result.message}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      toast.error('Failed to connect to API endpoint.');
    } finally {
      setTestingWebToLead(false);
    }
  };



  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setMessage({ type: '', text: '' });
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'company_phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setCompanyForm(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size should be less than 2MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage({ type: '', text: '' });
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    setMessage({ type: 'info', text: 'Click "Save Settings" to confirm logo removal.' });
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Favicon size should be less than 2MB' });
        return;
      }
      setFavicon(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result);
        // Instant preview in browser tab
        const faviconEl = document.getElementById('favicon');
        if (faviconEl) {
          faviconEl.href = reader.result;
        }
      };
      reader.readAsDataURL(file);
      setMessage({ type: '', text: '' });
    }
  };

  const handleRemoveFavicon = () => {
    setFavicon(null);
    setFaviconPreview(null);
    // Reset to default/settings favicon
    const faviconEl = document.getElementById('favicon');
    if (faviconEl) {
      faviconEl.href = '/vite.svg';
    }
    setMessage({ type: 'info', text: 'Click "Save Settings" to confirm favicon removal.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let logoUrl = logoPreview;

      // Handle Logo Upload
      if (logo) {
        const logoData = new FormData();
        logoData.append('logo', logo);

        const uploadResponse = await api.post('/settings/upload-logo', logoData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadResponse.data.success) {
          logoUrl = uploadResponse.data.data.logo_url;
        } else {
          throw new Error('Failed to upload logo');
        }
      }

      // Save company details to companies table
      const companyData = {
        name: companyForm.company_name,
        address: companyForm.company_address,
        phone: companyForm.company_phone,
        email: companyForm.company_email,
        logo: logoPreview === null ? null : (logoUrl || logoPreview)
      };

      // Handle Favicon
      let faviconUrl = faviconPreview;
      if (favicon) {
        const faviconData = new FormData();
        faviconData.append('logo', favicon); // Using same endpoint
        const uploadResponse = await api.post('/settings/upload-logo', faviconData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadResponse.data.success) {
          faviconUrl = uploadResponse.data.data.logo_url;
        }
      }
      companyData.favicon = faviconPreview === null ? null : (faviconUrl || faviconPreview);

      const companyResult = await settingsAPI.updateCompany(companyData);

      if (!companyResult.data?.success) {
        throw new Error(companyResult.data?.message || 'Failed to update company details');
      }

      // Save theme colors to settings table
      const themeSettings = {
        sidebar_color: formData.sidebar_color,
        sidebar_color1: formData.sidebar_color,
        sidebar_color2: formData.sidebar_color,
        dashboard_background_color: formData.dashboard_background_color,
        header_background_color: formData.header_background_color,
      };

      const result = await updateSettings(themeSettings);
      if (result.success) {
        setMessage({ type: 'success', text: t('settings.settings_updated') });
        // Refresh company details in form
        fetchCompanyDetails();
        // Refresh global settings context (updates sidebar/header logo)
        loadSettings();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred while updating settings' });
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
            <Building className="w-8 h-8" />
            Company Settings
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

            {/* Logo Section */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Company Logo
              </h2>

              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Logo
                    </label>
                  </div>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 200x50px. Max: 2MB.
                </p>
              </div>

              {logoPreview && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-center w-fit">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Favicon Section */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Company Favicon
              </h2>

              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="hidden"
                      id="favicon-upload"
                    />
                    <label
                      htmlFor="favicon-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Favicon
                    </label>
                  </div>
                  {faviconPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveFavicon}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 32x32px. Max: 2MB.
                </p>
              </div>

              {faviconPreview && (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center justify-center w-fit">
                  <img
                    src={faviconPreview}
                    alt="Favicon Preview"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Company Info Section */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Company Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="company_name"
                      value={companyForm.company_name}
                      onChange={handleCompanyChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <textarea
                      name="company_address"
                      value={companyForm.company_address}
                      onChange={handleCompanyChange}
                      rows="3"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="company_phone"
                        value={companyForm.company_phone}
                        onChange={handleCompanyChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="company_email"
                        value={companyForm.company_email}
                        onChange={handleCompanyChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="company_website"
                      value={companyForm.company_website}
                      onChange={handleCompanyChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="www.company.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Application Theme Label */}
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-blue-600" />
              Customize your dashboard colors
            </h2>

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

        {/* Webhook Developer Settings */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Website Integration (Web-to-Lead API)</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Copy the API endpoint and keys below to connect your landing pages, ads, or external logic straight to the CRM.
            All incoming leads will automatically flow into the CRM.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Unique API Key</label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={apiKey || 'Generating...'}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success('API Key copied to clipboard!');
                  }}
                  className="p-2.5 bg-indigo-600 text-white rounded-none rounded-r-lg hover:bg-indigo-700 flex items-center justify-center border border-indigo-600"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL (POST)</label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/leads/web-to-lead`}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/leads/web-to-lead`);
                    toast.success('Endpoint copied!');
                  }}
                  className="p-2.5 bg-indigo-600 text-white rounded-none rounded-r-lg hover:bg-indigo-700 flex items-center justify-center border border-indigo-600"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">You can trigger a test API request to check if leads are flowing successfully.</span>
              <button
                onClick={testWebToLeadAPI}
                disabled={testingWebToLead || !apiKey}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Sends a dummy lead to verify connection"
              >
                {testingWebToLead ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Test Connection (Create Test Lead)
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">
                API Payload Parameters (JSON)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-3">Parameter Name</th>
                      <th className="px-4 py-3">Data Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-white">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">api_key</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Required</span></td>
                      <td className="px-4 py-3">Your unique API Key provided above. Used for authentication.</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">name</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Required</span></td>
                      <td className="px-4 py-3">Full name of the customer/lead.</td>
                    </tr>
                    <tr className="border-b bg-white">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">phone</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Required</span></td>
                      <td className="px-4 py-3">Phone or WhatsApp number of the customer.</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">destination</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Required</span></td>
                      <td className="px-4 py-3">The location the customer wants to travel to (e.g., "Shimla", "Dubai").</td>
                    </tr>
                    <tr className="border-b bg-white">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">email</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Optional</span></td>
                      <td className="px-4 py-3">Email address of the customer.</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800 text-purple-600">source</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Optional</span></td>
                      <td className="px-4 py-3">Source of lead. <br /><span className="text-xs text-gray-500">Examples: "Facebook Ads", "Instagram", "Website", "WhatsApp Bot".</span></td>
                    </tr>
                    <tr className="border-b bg-white">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800 text-purple-600">campaign_name</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Optional</span></td>
                      <td className="px-4 py-3">Name of your active marketing campaign. <br /><span className="text-xs text-gray-500">Example: "Summer Sale 2026".</span></td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">remark</td>
                      <td className="px-4 py-3 text-blue-600">String</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Optional</span></td>
                      <td className="px-4 py-3">Any extra message, note, or details provided by the customer.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="mt-8">
              <h3 className="text-base font-semibold text-gray-800 mb-3 border-b pb-2">How to map Lead Source? (Integration Examples)</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    For Custom Website / Landing Pages (HTML, React, Wordpress)
                  </h4>
                  <p className="text-sm text-blue-900 mb-2">When sending data via your frontend Javascript or PHP Backend to our API endpoint, simply include the <code>source</code> and <code>campaign_name</code> parameters in your API request body JSON.</p>
                  <pre className="text-xs bg-white p-2 rounded border border-blue-200 text-gray-700 overflow-x-auto">
                    {`{
  "api_key": "your_api_key_here",
  "name": "John Doe",
  "phone": "+919876543210",
  "destination": "Goa",
  "source": "Website Landing Page",
  "campaign_name": "Goa Package Offer"
}`}
                  </pre>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    For Facebook / Instagram Lead Ads (via Zapier / Webhooks)
                  </h4>
                  <p className="text-sm text-purple-900 mb-2">
                    If you use tools like Zapier or Make.com to catch Facebook Leads:
                    Configure your "Webhooks by Zapier" (POST method). Map Facebook's "Campaign Name" to our <code>campaign_name</code> parameter, and set a static text "Facebook Leads" or "Instagram Ads" in the <code>source</code> parameter.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    For WhatsApp Chatbots (e.g. Wati, Interakt, Manychat)
                  </h4>
                  <p className="text-sm text-green-900 mb-2">
                    In your Chatbot's flow builder, use the "HTTP Request / API Call" block.
                    Send the collected customer answers to our endpoint and statically set <code>source: "WhatsApp Chatbot"</code> in the request payload.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

