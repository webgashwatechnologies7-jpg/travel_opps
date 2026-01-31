import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw, Inbox } from 'lucide-react';
import Layout from '../components/Layout';
import { googleMailAPI } from '../services/api';

const EmailInbox = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const fetchInbox = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const response = await googleMailAPI.getEmailInbox();
      if (response.data?.success && response.data?.data?.emails) {
        setEmails(response.data.data.emails);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error('Failed to fetch email inbox:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncInbox = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      await googleMailAPI.syncInbox();
      setSyncMessage({ type: 'success', text: 'Inbox synced. Refreshing list.' });
      await fetchInbox();
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const openLeadMails = (leadId) => {
    navigate(`/leads/${leadId}?tab=mails`);
  };

  const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent?.trim() || tmp.innerText?.trim() || '';
  };

  const snippet = (body, maxLen = 80) => {
    const text = stripHtml(body || '');
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Mail className="h-7 w-7 text-blue-600" />
            Email Inbox
          </h1>
          <div className="flex items-center gap-2">
            {syncMessage && (
              <span className={`text-sm ${syncMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {syncMessage.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleSyncInbox}
              disabled={loading || syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync inbox'}
            </button>
            <button
              type="button"
              onClick={fetchInbox}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Recent sent and received emails. Connect Gmail in Settings and use &quot;Sync inbox&quot; on a lead&apos;s Mails tab so replies appear here and in the lead.
        </p>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Inbox className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Conversations ({emails.length})</h2>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
            {emails.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No emails yet</p>
                <p className="text-sm mt-1">
                  Open a lead → Mails tab → Compose to send. Connect Gmail in Settings and sync so received and reply emails appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {emails.map((email) => (
                  <li key={email.id}>
                    <button
                      type="button"
                      onClick={() => email.lead_id && openLeadMails(email.lead_id)}
                      className="w-full text-left p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {email.lead?.client_name || 'Unknown'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {email.direction === 'inbound' ? 'Received' : 'Sent'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate mt-0.5">{email.subject}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {email.direction === 'inbound' ? email.from_email : email.to_email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {snippet(email.body)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {email.created_at ? new Date(email.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                      {email.lead_id && (
                        <div className="flex-shrink-0 text-blue-600 flex items-center gap-1 text-sm font-medium">
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailInbox;
