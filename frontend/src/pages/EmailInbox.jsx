import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw, Inbox, Reply, X } from 'lucide-react';
import Layout from '../components/Layout';
import { googleMailAPI } from '../services/api';
import { rewriteHtmlImageUrls, sanitizeEmailHtmlForDisplay } from '../utils/imageUrl';

const EmailInbox = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyForm, setReplyForm] = useState({ to_email: '', subject: '', body: '' });
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const response = await googleMailAPI.getEmailInbox();
      const list = response.data?.success && response.data?.data?.emails ? response.data.data.emails : [];
      setEmails(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch email inbox:', err);
      setEmails([]);
      return [];
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
      const list = await fetchInbox();
      const tid = selectedThread?.[0]?.thread_id;
      if (tid && list.length) {
        const updated = list.filter(e => e.thread_id === tid);
        if (updated.length) setSelectedThread(updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // Auto-refresh inbox every 60 seconds so sent/received mails show without manual sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInbox();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Group emails by thread_id
  const threads = emails.reduce((acc, email) => {
    const tid = email.thread_id || `single-${email.id}`;
    if (!acc[tid]) acc[tid] = [];
    acc[tid].push(email);
    return acc;
  }, {});

  const threadList = Object.values(threads).map(t => t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

  const openLeadMails = (leadId) => {
    navigate(`/leads/${leadId}?tab=mails`);
  };

  const openThread = (thread) => {
    setSelectedThread(thread);
    setShowReplyForm(false);
    setReplyForm({ to_email: '', subject: '', body: '' });
  };

  const startReply = (thread) => {
    const sorted = [...thread].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const lastMsg = sorted[sorted.length - 1];
    const replyTo = lastMsg.direction === 'inbound' ? lastMsg.from_email : lastMsg.to_email;
    const subj = lastMsg.subject?.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject || ''}`;
    setReplyForm({ to_email: replyTo, subject: subj, body: '' });
    setReplyAttachment(null);
    setShowReplyForm(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyForm.to_email || !replyForm.subject || !replyForm.body) {
      alert('Please fill To, Subject and Body');
      return;
    }
    setSendingReply(true);
    try {
      const payload = {
        to: replyForm.to_email,
        to_email: replyForm.to_email,
        subject: replyForm.subject,
        body: replyForm.body,
        lead_id: selectedThread?.[0]?.lead_id || null,
        thread_id: selectedThread?.[0]?.thread_id || null
      };
      const res = replyAttachment
        ? await googleMailAPI.sendMailWithAttachment({ ...payload, attachment: replyAttachment })
        : await googleMailAPI.sendMail(payload);
      if (res.data?.success || res.data?.message) {
        alert('Reply sent successfully!');
        setShowReplyForm(false);
        setReplyForm({ to_email: '', subject: '', body: '' });
        setReplyAttachment(null);
        const freshRes = await googleMailAPI.getEmailInbox();
        const fresh = freshRes.data?.data?.emails || [];
        setEmails(fresh);
        const tid = selectedThread?.[0]?.thread_id;
        if (tid) {
          const same = fresh.filter(e => e.thread_id === tid);
          if (same.length) setSelectedThread(same.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        }
      } else {
        alert('Failed to send: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to send reply: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingReply(false);
    }
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

  const renderBody = (body) => {
    if (!body || typeof body !== 'string') return '—';
    const raw = body.trim();
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);
    const safe = isHtml
      ? rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(raw))
      : raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    return safe;
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
          Click any conversation to see all messages and reply. Connect Gmail in Settings and use &quot;Sync inbox&quot; so sent/received emails appear here.
        </p>

        <div className="flex gap-4 flex-1" style={{ minHeight: 400 }}>
          {/* Conversation list */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex-1 min-w-0">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-gray-500" />
              <h2 className="font-semibold text-gray-800">Conversations ({threadList.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
              {threadList.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No emails yet</p>
                  <p className="text-sm mt-1">Connect Gmail in Settings, send mail from a lead&apos;s Mails tab, then Sync inbox.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {threadList.map((thread) => {
                    const latest = thread[0];
                    return (
                      <li key={latest.thread_id || latest.id}>
                        <button
                          type="button"
                          onClick={() => openThread(thread)}
                          className={`w-full text-left p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors ${selectedThread?.[0]?.id === latest.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 truncate">
                                {latest.lead?.client_name || latest.from_email || latest.to_email || 'Unknown'}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {thread.length} msg
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 truncate mt-0.5">{latest.subject}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {latest.created_at ? new Date(latest.created_at).toLocaleString() : ''}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Thread detail + Reply */}
          <div className="bg-white rounded-lg shadow border border-gray-200 flex-1 min-w-0 flex flex-col overflow-hidden">
            {selectedThread ? (
              <>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 truncate">{selectedThread[0]?.subject}</h3>
                  <div className="flex items-center gap-2">
                    {selectedThread[0]?.lead_id && (
                      <button
                        type="button"
                        onClick={() => openLeadMails(selectedThread[0].lead_id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Open in Lead
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startReply(selectedThread)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    <button type="button" onClick={() => setSelectedThread(null)} className="text-gray-500 hover:text-gray-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {[...selectedThread].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((email) => (
                    <div key={email.id} className={`p-4 rounded-lg ${email.direction === 'inbound' ? 'bg-white border border-gray-200' : 'bg-blue-50 border border-blue-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${email.direction === 'inbound' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                          {email.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(email.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{email.direction === 'inbound' ? email.from_email : email.to_email}</p>
                      <div
                        className="text-sm text-gray-800 prose prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: renderBody(email.body) }}
                      />
                    </div>
                  ))}
                </div>
                {showReplyForm && (
                  <form onSubmit={handleSendReply} className="p-4 border-t bg-gray-50 space-y-3">
                    <input
                      type="email"
                      value={replyForm.to_email}
                      onChange={(e) => setReplyForm({ ...replyForm, to_email: e.target.value })}
                      placeholder="To"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      value={replyForm.subject}
                      onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })}
                      placeholder="Subject"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                    <textarea
                      value={replyForm.body}
                      onChange={(e) => setReplyForm({ ...replyForm, body: e.target.value })}
                      placeholder="Your reply..."
                      className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                      />
                      {replyAttachment && <span className="text-xs text-gray-500 mt-1 block">{replyAttachment.name}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={sendingReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                        {sendingReply ? 'Sending…' : 'Send Reply'}
                      </button>
                      <button type="button" onClick={() => setShowReplyForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Click a conversation to view messages and reply</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailInbox;
