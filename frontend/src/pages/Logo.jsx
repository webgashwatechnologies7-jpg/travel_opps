import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Image as ImageIcon, Save, Upload, X } from 'lucide-react';
import { settingsAPI } from '../services/api';
import api from '../services/api';

const Logo = () => {
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getByKey('company_logo');
      if (response.data.success && response.data.data && response.data.data.value) {
        setLogoPreview(response.data.data.value);
      }
    } catch (err) {
      console.error('Failed to fetch logo:', err);
    } finally {
      setLoading(false);
    }
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      let logoUrl = logoPreview;

      if (logo) {
        // Upload logo file
        const formData = new FormData();
        formData.append('logo', logo);
        
        const uploadResponse = await api.post('/settings/upload-logo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadResponse.data.success) {
          logoUrl = uploadResponse.data.data.logo_url;
        } else {
          throw new Error('Failed to upload logo');
        }
      }

      // Save logo URL to settings
      await settingsAPI.save({
        key: 'company_logo',
        value: logoUrl,
        type: 'string',
        description: 'Company logo URL'
      });

      setMessage({ type: 'success', text: 'Logo saved successfully! It will be updated across the application.' });
      setLogo(null);
    } catch (err) {
      console.error('Failed to save logo:', err);
      setMessage({ type: 'error', text: 'Failed to save logo. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setLogo(null);
    setLogoPreview(null);
    setMessage({ type: '', text: '' });
  };

  if (loading) {
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
            <ImageIcon className="h-8 w-8" />
            Company Logo
          </h1>
          <p className="text-gray-600 mt-2">Upload and manage company logo. Logo will be updated across the application.</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Logo
            </label>
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
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended size: 200x50px or similar. Max file size: 2MB
            </p>
          </div>

          {logoPreview && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !logoPreview}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Logo'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Logo;

