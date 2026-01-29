import { useState, useEffect } from 'react';
import { Smartphone, Settings, CheckCircle, AlertCircle, RefreshCw, BarChart3, MessageSquare, Phone } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { companyWhatsappAPI } from '../services/api';

const CompanyWhatsAppSetup = () => {
  const { executeWithErrorHandling } = useErrorHandler();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await companyWhatsappAPI.getSettings();
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch settings');
      }
      return response.data.data;
    });

    if (result.success) {
      setSettings(result.data);
    }
  };

  const handleAutoProvision = async () => {
    setProvisioning(true);

    const result = await executeWithErrorHandling(async () => {
      const response = await companyWhatsappAPI.autoProvision();
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to auto-provision');
      }
      return response.data.data;
    }, 'WhatsApp auto-provisioned successfully');

    if (result.success) {
      await fetchSettings();
    }

    setProvisioning(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);

    const result = await executeWithErrorHandling(async () => {
      const response = await companyWhatsappAPI.testConnection();
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Connection test failed');
      }
      return response.data.data;
    }, 'WhatsApp connection test successful');

    setTesting(false);
  };

  const handleSyncSettings = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      const response = await companyWhatsappAPI.sync();
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Sync failed');
      }
      return response.data.data;
    }, 'Settings synced successfully');

    if (result.success) {
      await fetchSettings();
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">WhatsApp Business Integration</h2>
              <p className="text-gray-600">Configure WhatsApp for your company</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${getStatusColor(settings.status)}`}>
                  {getStatusIcon(settings.status)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Status: <span className="capitalize">{settings.status}</span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    {settings.enabled ? 'WhatsApp is enabled' : 'WhatsApp is not configured'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSyncSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
                
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !settings.enabled}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Test</span>
                </button>
              </div>
            </div>
          </div>

          {/* Auto-Provision Section */}
          {!settings.enabled && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    🚀 Auto-Provision WhatsApp
                  </h3>
                  <p className="text-blue-800">
                    Automatically set up WhatsApp Business API for your company. 
                    We'll create a WhatsApp Business Account, register a phone number, and configure webhooks.
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Automatic phone number registration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Webhook configuration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>API key generation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Multi-tenant security</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleAutoProvision}
                  disabled={provisioning}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 font-semibold"
                >
                  <Smartphone className={`w-5 h-5 ${provisioning ? 'animate-pulse' : ''}`} />
                  <span>{provisioning ? 'Provisioning...' : 'Auto-Provision WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Settings */}
          {settings.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  Configuration Details
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="font-mono text-sm">{settings.phone_number || 'Not configured'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="text-sm">{settings.display_name || 'Not configured'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Sync</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="text-sm">
                        {settings.last_sync ? new Date(settings.last_sync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium text-green-800">Messages Sent (30 days)</span>
                    <span className="text-lg font-bold text-green-900">1,234</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">Messages Received</span>
                    <span className="text-lg font-bold text-blue-900">856</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-200">
                    <span className="text-sm font-medium text-purple-800">Read Rate</span>
                    <span className="text-lg font-bold text-purple-900">87.3%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-200">
                    <span className="text-sm font-medium text-orange-800">Template Messages</span>
                    <span className="text-lg font-bold text-orange-900">445</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {settings.enabled && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                How to Use WhatsApp in CRM
              </h4>
              
              <div className="space-y-3 text-sm text-green-800">
                <div className="flex items-start space-x-3">
                  <span className="font-semibold">1.</span>
                  <span>Go to any lead detail page in your CRM</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-semibold">2.</span>
                  <span>You'll see the WhatsApp chat widget on the right side</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-semibold">3.</span>
                  <span>Type your message and click send - it will go via WhatsApp Business API</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-semibold">4.</span>
                  <span>Customers can reply and you'll see messages in real-time</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-semibold">5.</span>
                  <span>All conversations are saved and linked to the lead's record</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyWhatsAppSetup;
