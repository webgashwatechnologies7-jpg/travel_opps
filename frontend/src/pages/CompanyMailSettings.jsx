import { useEffect, useState } from 'react';
import { Mail, Save, Send, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
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
  const [showSteps, setShowSteps] = useState(true);
  const [showPassword, setShowPassword] = useState(true);

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
          password: data.password ?? '',
          from_address: data.from_address || '',
          from_name: data.from_name || '',
        }));
        setHasPassword(!!data.has_password);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      let text = 'Failed to load mail settings.';
      if (status === 401) text = 'Session expired or unauthorized. Please log in again.';
      else if (status === 404) text = 'Mail settings API not found. Check server URL.';
      else if (status === 500) text = msg ? `Server error: ${msg}` : 'Server error. Check backend logs.';
      else if (msg) text = msg;
      setMessage({ type: 'error', text });
    }
  };

  useEffect(() => {
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
        payload.password = String(formData.password).replace(/\s/g, '');
      }

      const response = await companySettingsAPI.updateMailSettings(payload);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Mail settings saved' });
        await fetchSettings();
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
    const isGmail = (formData.host || '').toLowerCase().includes('gmail');
    if (isGmail && !formData.password && !hasPassword) {
      alert('SMTP Password is required for Gmail.\n\nEnter your Gmail App Password (16-character code) in the SMTP Password field, then click Save Settings, then Send Test Mail.\n\nYour normal Gmail password will not work — use an App Password.');
      return;
    }

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
        payload.password = formData.password.replace(/\s/g, '');
      }

      const response = await companySettingsAPI.testMailSettings(payload);
      const payloadData = response.data || {};
      setTestResult(payloadData.data || null);
      if (!payloadData.success) {
        const msg = payloadData.message || payloadData.error || (payloadData.data?.errors?.join?.(' ') || 'Mail test failed');
        const is535 = /535|Password not accepted|BadCredentials|Username and Password not accepted/i.test(msg);
        const tip = is535
          ? '\n\nTip: Gmail 535 = wrong credentials. (1) Use App Password, not your normal password. (2) Enter the 16-char App Password in the Password field, Save, then Test again.'
          : '';
        setMessage({ type: 'error', text: 'Mail could not be sent. Issue: ' + msg + (tip ? '\n\n' + tip.trim() : '') });
        alert('Mail could not be sent.\n\nIssue: ' + msg + tip);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Mail test failed';
      const is535 = /535|Password not accepted|BadCredentials|Username and Password not accepted/i.test(msg);
      const tip = is535
        ? '\n\nTip: Gmail 535 = wrong credentials. Use App Password, enter it in the Password field, Save, then Test again.'
        : '';
      setMessage({ type: 'error', text: 'Mail could not be sent. Issue: ' + msg + (tip ? '\n\n' + tip.trim() : '') });
      alert('Mail could not be sent.\n\nIssue: ' + msg + tip);
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
              <h1 className="text-xl font-semibold text-gray-800">Email Integration</h1>
            </div>

            {/* Step-by-step guide for Company Admin */}
            <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
              >
                <span className="flex items-center gap-2 font-medium text-gray-800">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  How to set up mail (Step-by-step guide)
                </span>
                {showSteps ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </button>
              {showSteps && (
                <div className="p-4 bg-blue-50/50 border-t border-gray-200 text-sm text-gray-700 space-y-4">
                  <p className="text-gray-600">
                    Company Admin can set up mail by following these steps so the CRM can send emails. First click <strong>Save Settings</strong>, then use <strong>Send Test Mail</strong> below to test.
                  </p>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 1 — Enable company mail</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Check the <strong>Use company mail settings</strong> checkbox in the form below.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 2 — SMTP details (for Gmail)</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>SMTP Host:</strong> <code className="bg-white px-1 rounded">smtp.gmail.com</code></li>
                      <li><strong>SMTP Port:</strong> <code className="bg-white px-1 rounded">587</code></li>
                      <li><strong>Encryption:</strong> Select <code className="bg-white px-1 rounded">TLS</code> (required for Gmail — do not leave as None).</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 3 — Gmail login and App Password</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>SMTP Username:</strong> Your Gmail address (e.g. <code className="bg-white px-1 rounded">yourcompany@gmail.com</code>).</li>
                      <li><strong>SMTP Password:</strong> Use Gmail <strong>App Password</strong> — your normal Gmail password will not work. To create one: Google Account → Security → turn on 2-Step Verification, then generate a new password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">App passwords</a> and enter that 16-character code in the SMTP Password field.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 4 — Sender (From) details</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>From Email:</strong> The email that will appear to the recipient (you can use the same Gmail or a company domain email).</li>
                      <li><strong>From Name:</strong> The name to display (e.g. <code className="bg-white px-1 rounded">TravelOps</code> or your company name).</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 5 — Save and Test</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Click the <strong>Save Settings</strong> button.</li>
                      <li>Enter your email or a test address in <strong>Send Test Mail</strong> and click to send. If the test email arrives in inbox (or Spam), the setup is correct.</li>
                    </ul>
                  </div>

                  <p className="pt-2 text-gray-600 border-t border-gray-200">
                    <strong>Note:</strong> If using a provider other than Gmail (Hostinger, Zoho, etc.), use their SMTP host, port and encryption values (see provider documentation).
                  </p>
                </div>
              )}
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
              <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    id="mail-enabled"
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => handleChange('enabled', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="mail-enabled" className="text-sm font-medium text-gray-800">
                    Use company mail settings
                  </label>
                </div>
                <p className="text-xs text-amber-800 ml-7">
                  <strong>You must check this box</strong> — only then will emails sent from Leads/Mails use these SMTP settings. If unchecked, saved settings will not be used and mail may not send.
                </p>
              </div>

              {/* Saved configuration summary */}
              {(formData.host || formData.username) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <p className="font-medium text-green-800 mb-2">Current saved configuration:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li><strong>Host:</strong> {formData.host || '—'}</li>
                    <li><strong>Port:</strong> {formData.port || '—'} · <strong>Encryption:</strong> {formData.encryption || 'None'}</li>
                    <li><strong>Username:</strong> {formData.username || '—'}</li>
                    <li><strong>Password:</strong> {formData.password ? '•••••••• (set)' : (hasPassword ? '•••••••• (saved — edit above to change)' : '— not set')}</li>
                    <li><strong>From:</strong> {formData.from_address || '—'} ({formData.from_name || '—'})</li>
                  </ul>
                  <p className="mt-2 text-green-700 text-xs">These values are shown in the form above and will stay after save. Check &quot;Use company mail settings&quot; when sending mail.</p>
                </div>
              )}

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
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder={hasPassword ? '********' : 'Enter password'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 p-1 text-gray-500 hover:text-gray-700"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Password will remain visible here after save (use show/hide to mask). Gmail App Password: Google shows it with spaces — you can paste as-is; the system will remove spaces when using it.</p>
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
