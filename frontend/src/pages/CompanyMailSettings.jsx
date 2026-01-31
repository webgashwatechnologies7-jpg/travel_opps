import { useEffect, useState } from 'react';
import { Mail, Save, Send, HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff, Inbox, Link2 } from 'lucide-react';
import Layout from '../components/Layout';
import { companySettingsAPI, googleMailAPI, companyGoogleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CompanyMailSettings = () => {
  const { user } = useAuth();
  const [googleOAuth, setGoogleOAuth] = useState({
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: '',
  });
  const [savingGoogleOAuth, setSavingGoogleOAuth] = useState(false);
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(true);
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

  const fetchGoogleOAuth = async () => {
    try {
      const res = await companyGoogleAPI.getSettings();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setGoogleOAuth({
          google_client_id: d.google_client_id || '',
          google_client_secret: d.google_client_secret || '',
          google_redirect_uri: d.google_redirect_uri || '',
        });
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchGoogleOAuth();
  }, []);

  // Show success/error after Gmail OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('google_connected');
    const error = params.get('error');
    if (connected === 'true') {
      setMessage({ type: 'success', text: 'Gmail connected. You can now receive and sync emails in the CRM.' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (connected === 'false' && error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGoogleOAuth = async (e) => {
    e.preventDefault();
    setSavingGoogleOAuth(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await companyGoogleAPI.updateSettings({
        google_client_id: googleOAuth.google_client_id || null,
        google_client_secret: googleOAuth.google_client_secret || null,
        google_redirect_uri: googleOAuth.google_redirect_uri || null,
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Google OAuth settings saved. You can now use Connect Gmail for receiving.' });
        await fetchGoogleOAuth();
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to save Google OAuth settings' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage({ type: 'error', text: msg || 'Failed to save Google OAuth settings' });
    } finally {
      setSavingGoogleOAuth(false);
    }
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
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage({ type: 'error', text: msg || 'Failed to save mail settings' });
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

            {/* How the flow works — one mail set, all CRM mails in one place */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-base font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                How email integration works
              </h2>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 mb-4">
                <li><strong>Set company mail (below)</strong> — Same Gmail for sending (SMTP + From name/email). This is the mail where replies will come.</li>
                <li><strong>Connect same Gmail for receiving</strong> — Use the &quot;Connect Gmail for receiving&quot; button below so all mails to/from this address sync into the CRM.</li>
                <li><strong>Where you see mails</strong> — Sidebar → <strong>Mail</strong> (inbox), and inside each lead → <strong>Mails</strong> tab. Sync runs every 5 minutes, or click &quot;Sync inbox&quot; on a lead&apos;s Mails tab.</li>
              </ol>
              <p className="text-xs text-green-700">
                Use one company Gmail (e.g. sales@company.com or web.company@gmail.com). Set it here for sending, then connect it for receiving — all CRM-related mails will appear in the CRM.
              </p>
            </div>

            {/* Google OAuth — required for "Connect Gmail for receiving" */}
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setShowGoogleOAuth(!showGoogleOAuth)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <h2 className="text-base font-semibold text-gray-800">
                  Google OAuth (required for Connect Gmail)
                </h2>
                {showGoogleOAuth ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </button>
              {showGoogleOAuth && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">
                    If &quot;Connect Gmail for receiving&quot; shows &quot;Google Client ID not set&quot;, add the credentials below. Get them from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console → APIs &amp; Services → Credentials</a> (create OAuth 2.0 Client ID, type Web application). Add the Redirect URI in the Google project to match the value below. If you are Super Admin and this section does not save, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server .env file instead.
                  </p>
                  <form onSubmit={handleSaveGoogleOAuth} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Google Client ID</label>
                      <input
                        type="text"
                        value={googleOAuth.google_client_id}
                        onChange={(e) => setGoogleOAuth((p) => ({ ...p, google_client_id: e.target.value }))}
                        placeholder="xxxxx.apps.googleusercontent.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Google Client Secret</label>
                      <input
                        type="password"
                        value={googleOAuth.google_client_secret}
                        onChange={(e) => setGoogleOAuth((p) => ({ ...p, google_client_secret: e.target.value }))}
                        placeholder="GOCSPX-..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI (must match Google Console)</label>
                      <input
                        type="text"
                        value={googleOAuth.google_redirect_uri}
                        onChange={(e) => setGoogleOAuth((p) => ({ ...p, google_redirect_uri: e.target.value }))}
                        placeholder="https://145.223.23.45/api/google/callback"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <p className="mt-1 text-xs text-gray-500">Use your server URL + /api/google/callback (e.g. https://yoursite.com/api/google/callback). Add this exact URL in Google Cloud Console under your OAuth client → Authorized redirect URIs.</p>
                    </div>
                    <button
                      type="submit"
                      disabled={savingGoogleOAuth}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
                    >
                      {savingGoogleOAuth ? 'Saving...' : 'Save Google OAuth'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Connect Gmail for receiving — so replies and received mails come into CRM */}
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Inbox className="h-5 w-5 text-blue-600" />
                Receive mails in CRM
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Connect the <strong>same Gmail</strong> you set below (From Email) so that replies and any mails sent to that address sync into the CRM and show in <strong>Mail</strong> and in each lead&apos;s <strong>Mails</strong> tab.
              </p>
              {user?.google_token ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-medium text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    Connected as {user.gmail_email}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                    try {
                      const res = await googleMailAPI.getConnectUrlForRedirect();
                      if (res.data?.url) {
                        window.location.href = res.data.url;
                      } else {
                        setMessage({ type: 'error', text: res.data?.error || 'Could not get connect URL' });
                      }
                    } catch (err) {
                      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to start Gmail connect' });
                    }
                  }}
                    className="w-fit px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Reconnect Gmail
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await googleMailAPI.getConnectUrlForRedirect();
                      if (res.data?.url) {
                        window.location.href = res.data.url;
                      } else {
                        setMessage({ type: 'error', text: res.data?.error || 'Could not get connect URL' });
                      }
                    } catch (err) {
                      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to start Gmail connect' });
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium"
                >
                  <Mail className="h-4 w-4" />
                  Connect Gmail for receiving
                </button>
              )}
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

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Step 6 — Receive replies in CRM</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Use <strong>Connect Gmail for receiving</strong> (above) with the <strong>same Gmail</strong> you set for From Email. After connecting, all mails to/from that address sync into the CRM.</li>
                      <li>View them in sidebar → <strong>Mail</strong>, or inside any lead → <strong>Mails</strong> tab. Sync runs every 5 minutes; you can also click <strong>Sync inbox</strong> on a lead&apos;s Mails tab.</li>
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
