import React, { memo, useState } from 'react';
import { Mail, RefreshCw, Reply, Send, FileText } from 'lucide-react';
import { getDisplayImageUrl } from '../../utils/imageUrl';

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
    const [currentLogPage, setCurrentLogPage] = useState(1);
    const [expandedThreads, setExpandedThreads] = useState({});
    const itemsPerPage = 5;

    const toggleThread = (tid) => {
        setExpandedThreads(prev => ({
            ...prev,
            [tid]: !prev[tid]
        }));
    };

    // Process and Group Gmail Emails into Threads (Latest on top)
    const groupedThreads = Object.values(
        (gmailEmails || []).reduce((acc, email) => {
            const tid = email.thread_id || `single-${email.id}`;
            if (!acc[tid]) acc[tid] = [];
            acc[tid].push(email);
            return acc;
        }, {})
    )
        .map((t) => t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
        .sort((a, b) => {
            const dateA = new Date(a[0]?.created_at || 0);
            const dateB = new Date(b[0]?.created_at || 0);
            return dateB - dateA; // Descending: Newest first
        });

    // Sort Lead Emails (System Logs) - Newest First
    const sortedLeadEmails = [...(leadEmails || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalPages = Math.ceil(groupedThreads.length / itemsPerPage);
    const displayedThreads = groupedThreads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalLogPages = Math.ceil(sortedLeadEmails.length / 6);
    const displayedLogs = sortedLeadEmails.slice((currentLogPage - 1) * 6, currentLogPage * 6);

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
                                                            {email.attachment_path && (
                                                                <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-sm">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                                        <span className="text-sm font-medium text-gray-700 truncate" title={email.attachment_name}>
                                                                            {email.attachment_name || 'Attachment'}
                                                                        </span>
                                                                    </div>
                                                                    <a
                                                                        href={getDisplayImageUrl('storage/' + email.attachment_path)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors flex items-center gap-1 shrink-0"
                                                                    >
                                                                        Download / View
                                                                    </a>
                                                                </div>
                                                            )}
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
                    {sortedLeadEmails.length > 0 && (
                        <div className="space-y-4 pt-8 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    System Logs ({sortedLeadEmails.length})
                                </h3>
                                {totalLogPages > 1 && (
                                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">Page {currentLogPage} of {totalLogPages}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {displayedLogs.map((email) => {
                                    const lid = `log-${email.id}`;
                                    const isExpanded = expandedThreads[lid];
                                    return (
                                        <div key={email.id} className="col-span-1 md:col-span-1 lg:col-span-1">
                                            <div 
                                                onClick={() => toggleThread(lid)}
                                                className={`p-4 bg-white border rounded-xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer group ${isExpanded ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                                                        <Send className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex justify-between items-start gap-1">
                                                            <p className="text-sm font-bold text-gray-800 truncate">{email.subject || '(No Subject)'}</p>
                                                            {email.opened_at && (
                                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[8px] font-bold rounded uppercase">Opened</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(email.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                
                                                <div 
                                                    className={`text-xs text-gray-500 leading-tight transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] mt-2 pt-2 border-t border-gray-100 overflow-y-auto' : 'max-h-8 line-clamp-2 mt-1'}`}
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

                                                {isExpanded && email.attachment_path && (
                                                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                            <span className="text-xs font-medium text-gray-700 truncate" title={email.attachment_name}>
                                                                {email.attachment_name || 'Attachment'}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={getDisplayImageUrl('storage/' + email.attachment_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors flex items-center gap-1 shrink-0"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                )}
                                                
                                                {!isExpanded && (
                                                    <div className="text-[10px] text-blue-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view full message &rarr;</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {totalLogPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <button
                                        disabled={currentLogPage === 1}
                                        onClick={() => setCurrentLogPage(p => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white disabled:opacity-30"
                                    >
                                        &larr; Prev
                                    </button>
                                    <button
                                        disabled={currentLogPage === totalLogPages}
                                        onClick={() => setCurrentLogPage(p => p + 1)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white disabled:opacity-30"
                                    >
                                        Next &rarr;
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

MailsTab.displayName = 'MailsTab';
export default MailsTab;
