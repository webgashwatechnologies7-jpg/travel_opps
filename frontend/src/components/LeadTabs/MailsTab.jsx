import React, { memo, useState } from 'react';
import { Mail, RefreshCw, Reply, Send, FileText } from 'lucide-react';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedThreads, setExpandedThreads] = useState({});
    const itemsPerPage = 5;

    const toggleThread = (tid) => {
        setExpandedThreads(prev => ({
            ...prev,
            [tid]: !prev[tid]
        }));
    };

    // Process and Group Gmail Emails into Threads
    const groupedThreads = Object.values(
        (gmailEmails || []).reduce((acc, email) => {
            const tid = email.thread_id || `single-${email.id}`;
            if (!acc[tid]) acc[tid] = [];
            acc[tid].push(email);
            return acc;
        }, {})
    )
        .map((t) => t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        .sort((a, b) => new Date(b[0]?.created_at || 0) - new Date(a[0]?.created_at || 0));

    const totalPages = Math.ceil(groupedThreads.length / itemsPerPage);
    const displayedThreads = groupedThreads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <button
                    onClick={openComposeModal}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md transition-all active:scale-95"
                >
                    <Mail className="h-5 w-5" />
                    Compose
                </button>

                {user?.google_token && (
                    <button
                        type="button"
                        onClick={handleSyncInbox}
                        disabled={syncingInbox}
                        className="bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium border border-gray-300 disabled:opacity-60 shadow-sm"
                    >
                        {syncingInbox ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Sync inbox
                    </button>
                )}

                {lead?.email && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-400 text-sm">To:</span>
                        <span className="text-gray-700 font-medium">{lead.email}</span>
                    </div>
                )}
            </div>

            {/* Content List */}
            {loadingEmails || loadingGmail ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : leadEmails.length === 0 && gmailEmails.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No mails found</p>
                    <p className="text-sm">Mails sent from the system or synced from Gmail will appear here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Gmail Threads Section */}
                    {groupedThreads.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    Gmail Conversations ({groupedThreads.length})
                                </h3>
                                {totalPages > 1 && (
                                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {displayedThreads.map((thread) => {
                                    const latestEmail = thread[0];
                                    const tid = latestEmail.thread_id || latestEmail.id;
                                    const isExpanded = expandedThreads[tid];
                                    const hasUnread = thread.some(e => e.direction === 'inbound' && !e.is_read);

                                    return (
                                        <div key={tid} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${hasUnread ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-200'}`}>
                                            {/* Thread Header */}
                                            <div 
                                                className="p-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer flex justify-between items-center group"
                                                onClick={() => toggleThread(tid)}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className={`p-2 rounded-lg ${hasUnread ? 'bg-blue-100' : 'bg-gray-100 grayscale'}`}>
                                                        <Mail className={`h-5 w-5 ${hasUnread ? 'text-blue-600' : 'text-gray-500'}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                                {latestEmail.subject || '(No Subject)'}
                                                            </p>
                                                            {hasUnread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                            <span>{thread.length} message{thread.length > 1 ? 's' : ''}</span>
                                                            <span>&bull;</span>
                                                            <span>{isExpanded ? 'Collapse' : 'Click to read'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400 hidden sm:block">
                                                        {new Date(latestEmail.created_at).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); openReplyModal(thread); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Reply to thread"
                                                    >
                                                        <Reply className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Thread Messages */}
                                            {isExpanded && (
                                                <div className="divide-y divide-gray-100 border-t border-gray-100 bg-white">
                                                    {[...thread].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map((email) => (
                                                        <div key={email.id} className={`p-5 ${email.direction === 'inbound' ? 'bg-white' : 'bg-blue-50/30'}`}>
                                                            <div className="flex justify-between items-center mb-4">
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider ${
                                                                    email.direction === 'inbound' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                    {email.direction === 'inbound' ? 'Inbox' : 'Sent'}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(email.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div 
                                                                className="text-sm text-gray-800 prose prose-sm max-w-none leading-relaxed"
                                                                dangerouslySetInnerHTML={{ 
                                                                    __html: (() => {
                                                                        const raw = email.body || '—';
                                                                        const isHtml = /<[a-z][\s\S]*>/i.test(raw);
                                                                        return isHtml 
                                                                            ? rewriteHtmlImageUrls(sanitizeEmailHtmlForDisplay(raw))
                                                                            : raw.replace(/\n/g, '<br/>');
                                                                    })()
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Pagination Buttons */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-1.5 pt-6">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white text-gray-600 transition-colors"
                                        >
                                            <span className="sr-only">Previous</span>
                                            &laquo;
                                        </button>
                                        
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            // Simple logic to show current, first, last, and neighbors
                                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-lg border font-medium transition-all ${
                                                            currentPage === page 
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="text-gray-400 px-1">...</span>;
                                            }
                                            return null;
                                        })}

                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white text-gray-600 transition-colors"
                                        >
                                            <span className="sr-only">Next</span>
                                            &raquo;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* System Emails Section (Logged) */}
                    {leadEmails.length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                System Logs ({leadEmails.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {leadEmails.slice(0, 4).map((email) => (
                                    <div key={email.id} className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Send className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{email.subject}</p>
                                            <p className="text-xs text-gray-500">{new Date(email.created_at).toLocaleDateString()}</p>
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
