import { useEffect, useState } from 'react';
import { Mail, Save, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { companySettingsAPI } from '../services/api';

const CompanyMailSettings = () => {
  const [formData, setFormData] = useState({
    enabled: false,
    mailer: 'smtp',
    host: '',
    port: '587',
    encryption: 'tls',
    username: '',
    password: '',
    from_address: '',
    from_name: '',
  });
  const [hasPassword, setHasPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await companySettingsAPI.getMailSettings();
        if (response.data.success) {
          const data = response.data.data;
          setFormData((prev) => ({
            ...prev,
            enabled: !!data.enabled,
            mailer: data.mailer || 'smtp',
            host: data.host || '',
            port: data.port ? String(data.port) : '587',
            encryption: data.encryption || '',
            username: data.username || '',
            password: '',
            from_address: data.from_address || '',
            from_name: data.from_name || '',
          }));
          setHasPassword(!!data.has_password);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load mail settings' });
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const payload = {
        enabled: formData.enabled,
        mailer: formData.mailer,
        host: formData.host,
        port: formData.port ? Number(formData.port) : undefined,
        encryption: formData.encryption || null,
        username: formData.username || null,
        from_address: formData.from_address || null,
        from_name: formData.from_name || null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await companySettingsAPI.updateMailSettings(payload);
      if (response.data.success) {
        setHasPassword(!!response.data.data.has_password);
        setFormData((prev) => ({ ...prev, password: '' }));
        setMessage({ type: 'success', text: 'Mail settings saved' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save mail settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage({ type: '', text: '' });
      setTestResult(null);
      const payload = {
        to: testEmail,
        enabled: formData.enabled,
        mailer: formData.mailer,
        host: formData.host,
        port: formData.port ? Number(formData.port) : undefined,
        encryption: formData.encryption || null,
        username: formData.username || null,
        from_address: formData.from_address || null,
        from_name: formData.from_name || null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await companySettingsAPI.testMailSettings(payload);
      const payloadData = response.data || {};
      setTestResult(payloadData.data || null);
      if (!payloadData.success) {
        setMessage({ type: 'error', text: payloadData.message || 'Mail test failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Mail test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-800">Mail Setup</h1>
            </div>

            {message.text && (
              <div
                className={`mb-4 px-4 py-3 rounded ${
                  message.type === 'success'
                    ? 'bg-green-100 border border-green-300 text-green-700'
                    : 'bg-red-100 border border-red-300 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="mail-enabled"
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="mail-enabled" className="text-sm font-medium text-gray-700">
                  Use company mail settings
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    placeholder="587"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                  <select
                    value={formData.encryption}
                    onChange={(e) => handleChange('encryption', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">None</option>
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder={hasPassword ? '********' : 'Enter password'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                  <input
                    type="email"
                    value={formData.from_address}
                    onChange={(e) => handleChange('from_address', e.target.value)}
                    placeholder="noreply@company.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) => handleChange('from_name', e.target.value)}
                    placeholder="Company Name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Send Test Mail</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !testEmail}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {testing ? 'Sending...' : 'Send Test Mail'}
                </button>
              </div>

              {testResult && (
                <div className="mt-4 text-sm text-gray-700 space-y-2">
                  <div>
                    <span className={`font-semibold ${testResult.errors?.length ? 'text-red-600' : 'text-green-600'}`}>
                      {testResult.errors?.length ? 'Not Working' : 'Working'}
                    </span>
                    {testResult.mailer && <span className="ml-2 text-gray-500">({testResult.mailer})</span>}
                  </div>
                  {testResult.checks && testResult.checks.length > 0 && (
                    <div>
                      <span className="font-medium">Checks:</span>
                      <div className="text-gray-600">{testResult.checks.join(' | ')}</div>
                    </div>
                  )}
                  {testResult.errors && testResult.errors.length > 0 && (
                    <div>
                      <span className="font-medium text-red-600">Errors:</span>
                      <div className="text-red-600">{testResult.errors.join(' | ')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyMailSettings;
