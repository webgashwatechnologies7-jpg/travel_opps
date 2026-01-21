import { useEffect, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI } from '../services/api';
import SuperAdminLayout from '../components/SuperAdminLayout';

const SuperAdminMailStatus = () => {
  const { user } = useAuth();
  const [toEmail, setToEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    if (!toEmail && user?.email) {
      setToEmail(user.email);
    }
  }, [user?.email, toEmail]);

  const handleSendTest = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await superAdminAPI.mailHealth({ send: 1, to: toEmail });
      const payload = response.data || {};
      setResult(payload.data || null);
      if (!payload.success) {
        setError(payload.message || 'Mail check failed');
      }
      setCheckedAt(new Date());
    } catch (err) {
      setError('Unable to check mail status');
      console.error('Mail health error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mail Status</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Send a test email to verify mail delivery.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">To Email</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSendTest}
                disabled={loading || !toEmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Test Mail'}
              </button>
            </div>

            {checkedAt && (
              <p className="text-xs text-gray-500 mt-3">Last checked: {checkedAt.toLocaleString()}</p>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4 text-sm text-gray-700 space-y-2">
                <div>
                  <span className={`font-semibold ${result.errors?.length ? 'text-red-600' : 'text-green-600'}`}>
                    {result.errors?.length ? 'Not Working' : 'Working'}
                  </span>
                  {result.mailer && <span className="ml-2 text-gray-500">({result.mailer})</span>}
                </div>
                {result.checks && result.checks.length > 0 && (
                  <div>
                    <span className="font-medium">Checks:</span>
                    <div className="text-gray-600">{result.checks.join(' | ')}</div>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div>
                    <span className="font-medium text-red-600">Errors:</span>
                    <div className="text-red-600">{result.errors.join(' | ')}</div>
                  </div>
                )}
                {result.warnings && result.warnings.length > 0 && (
                  <div>
                    <span className="font-medium text-orange-600">Warnings:</span>
                    <div className="text-orange-600">{result.warnings.join(' | ')}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminMailStatus;
