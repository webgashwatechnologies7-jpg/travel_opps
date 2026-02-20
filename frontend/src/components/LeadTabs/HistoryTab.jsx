import React, { memo } from 'react';

const HistoryTab = memo(({ loadingHistory, activityTimeline }) => {
    return (
        <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Query History</h3>
            <p className="text-sm text-gray-500 mb-4">
                All activity for this query — payments, followups, calls, confirmations — is shown here.
            </p>
            {loadingHistory ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : activityTimeline.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No history yet</div>
            ) : (
                <div className="space-y-0 border-l-2 border-gray-200 pl-6 ml-2">
                    {activityTimeline.map((item, idx) => (
                        <div key={idx} className="relative pb-6 last:pb-0">
                            <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded ${item.type === 'payment'
                                                ? 'bg-green-100 text-green-800'
                                                : item.type === 'followup'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : item.type === 'call'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {item.title}
                                    </span>
                                    {item.user?.name && (
                                        <span className="text-xs text-gray-500">by {item.user.name}</span>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">
                                        {item.created_at
                                            ? new Date(item.created_at).toLocaleString('en-IN', {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })
                                            : ''}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

HistoryTab.displayName = 'HistoryTab';
export default HistoryTab;
