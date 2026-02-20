import React, { memo } from 'react';
import { Mail, RefreshCw, Reply, Send, FileText } from 'lucide-react';

// Helper: sanitize HTML for display (pass-through — defined in parent, reused via prop)
const MailsTab = memo(({
    lead,
    user,
    loadingEmails,
    loadingGmail,
    leadEmails,
    gmailEmails,
    syncingInbox,
    openComposeModal,
    handleSyncInbox,
    openReplyModal,
    rewriteHtmlImageUrls,
    sanitizeEmailHtmlForDisplay,
}) => {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <button
                    onClick={openComposeModal}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md"
                >
                    <Mail className="h-5 w-5" />
                    Compose
                </button>

                {user?.google_token && (
                    <button
                        type="button"
                        onClick={handleSyncInbox}
                        disabled={syncingInbox}
                        className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium border border-gray-300 disabled:opacity-60"
                    >
                        {syncingInbox ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        {syncingInbox ? 'Syncing...' : 'Sync inbox'}
                    </button>
                )}

                {lead?.email && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg border border-gray-200">
                        <span className="text-gray-500 text-sm">ℹ</span>
                        <span className="text-gray-700 font-medium">{lead.email}</span>
                    </div>
                )}
            </div>

            {user?.google_token && (
                <p className="text-sm text-gray-600 mb-2">
                    Received and reply emails appear in &quot;Gmail Conversations&quot; when you connect Gmail in Settings and use &quot;Sync inbox&quot; (or they sync automatically every 5 minutes).
                </p>
            )}

            {/* Email List */}
            {loadingEmails || loadingGmail ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : leadEmails.length === 0 && gmailEmails.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>No mails yet</p>
                    <p className="text-sm mt-1">Click &quot;Compose&quot; to send your first email to the client</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Gmail Conversations */}
                    {gmailEmails.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                Gmail Conversations
                            </h3>
                            <div className="space-y-3">
                                {Object.values(
                                    gmailEmails.reduce((acc, email) => {
                                        const tid = email.thread_id || `single-${email.id}`;
                                        if (!acc[tid]) acc[tid] = [];
                                        acc[tid].push(email);
                                        return acc;
                                    }, {})
                                )
                                    .map((t) => t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
                                    .sort(
                                        (a, b) =>
                                            new Date(b[0]?.created_at || 0) - new Date(a[0]?.created_at || 0)
                                    )
                                    .map((thread) => {
                                        const sorted = [...thread].sort(
                                            (a, b) => new Date(a.created_at) - new Date(b.created_at)
                                        );
                                        const latestEmail = thread[0];
                                        const hasUnread = thread.some(
                                            (e) => e.direction === 'inbound' && !e.is_read
                                        );

                                        return (
                                            <div
                                                key={latestEmail.thread_id || latestEmail.id}
                                                className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${hasUnread ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-red-100 p-2 rounded-lg">
                                                            <Mail className="h-4 w-4 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p
                                                                className={`${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
                                                                    }`}
                                                            >
                                                                {latestEmail.subject}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {thread.length} message{thread.length > 1 ? 's' : ''} &bull; Last
                                                                message {new Date(latestEmail.created_at).toLocaleString()}
                                                                {hasUnread && (
                                                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                                                                        Unread
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReplyModal(thread)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Reply className="h-4 w-4" />
                                                        Reply
                                                    </button>
                                                </div>

                                                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                                    {sorted.map((email) => (
                                                        <div
                                                            key={email.id}
                                                            className={`p-4 ${email.direction === 'inbound' ? 'bg-white' : 'bg-blue-50/50'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2 flex-wrap gap-1">
                                                                <span
                                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${email.direction === 'inbound'
                                                                            ? 'bg-gray-100 text-gray-600'
                                                                            : 'bg-blue-100 text-blue-600'
                                                                        }`}
                                                                >
                                                                    {email.direction === 'inbound' ? 'Received' : 'Sent'}
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    {email.direction === 'outbound' && email.opened_at && (
                                                                        <span
                                                                            className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700"
                                                                            title={`Opened ${new Date(email.opened_at).toLocaleString()}`}
                                                                        >
                                                                            Opened
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(email.created_at).toLocaleString()}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="text-sm text-gray-800 prose prose-sm max-w-none break-words"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: (() => {
                                                                        const raw = email.body || '—';
                                                                        const isHtml = /<[a-z][\s\S]*>/i.test(raw);
                                                                        return isHtml
                                                                            ? rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(raw))
                                                                            : raw
                                                                                .replace(/&/g, '&amp;')
                                                                                .replace(/</g, '&lt;')
                                                                                .replace(/>/g, '&gt;')
                                                                                .replace(/\n/g, '<br/>');
                                                                    })(),
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* System Emails Section */}
                    {leadEmails.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                System Logged Emails
                            </h3>
                            <div className="space-y-3">
                                {leadEmails.map((email) => (
                                    <div
                                        key={email.id}
                                        className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Send className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-800 truncate">{email.to_email}</span>
                                                {email.status === 'failed' && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                        Failed
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-blue-600 font-medium truncate">{email.subject}</p>
                                            <div
                                                className="text-sm text-gray-500 truncate mt-1"
                                                dangerouslySetInnerHTML={{
                                                    __html: rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(email.body || '')),
                                                }}
                                            />
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="text-sm text-gray-500">
                                                {new Date(email.created_at).toLocaleDateString('en-IN')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">by {email.user?.name || 'System'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

MailsTab.displayName = 'MailsTab';
export default MailsTab;
