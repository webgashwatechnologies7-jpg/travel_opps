import React, { memo } from 'react';
import { Eye, RefreshCw, Download, Send } from 'lucide-react';

const VoucherTab = memo(({
    lead,
    getConfirmedOption,
    quotationData,
    proposals = [],
    handleVoucherPreview,
    handleVoucherDownload,
    handleVoucherSend,
    voucherActionLoading
}) => {
    const confirmedOption = proposals.find(p => p.confirmed === true || p.is_confirmed === true);
    
    // If there's a confirmed option, only show that one.
    // Otherwise, show all available proposals.
    let displayProposals = [];
    if (confirmedOption) {
        displayProposals = [confirmedOption];
    } else if (proposals.length > 0) {
        displayProposals = proposals;
    } else {
        displayProposals = [ { id: null, itinerary_name: quotationData?.itinerary?.itinerary_name, is_confirmed: false } ];
    }

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vouchers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proposal</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Itinerary</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayProposals.map((prop, idx) => (
                                <tr key={prop.id || idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {prop.itinerary_name || `Option ${idx + 1}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {prop.routing || prop.destinations || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(prop.is_confirmed || prop.confirmed) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {(prop.is_confirmed || prop.confirmed) ? 'Confirmed' : 'Proposal'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 font-bold">
                                        ₹{prop.price?.toLocaleString('en-IN') || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleVoucherPreview(prop.id)}
                                                disabled={!!voucherActionLoading}
                                                title="Preview"
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
                                            >
                                                {voucherActionLoading === `preview-${prop.id}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleVoucherDownload(prop.id)}
                                                disabled={!!voucherActionLoading}
                                                title="Download PDF"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
                                            >
                                                {voucherActionLoading === `download-${prop.id}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleVoucherSend(prop.id)}
                                                disabled={!!voucherActionLoading}
                                                title="Send by Email"
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-50"
                                            >
                                                {voucherActionLoading === `send-${prop.id}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {displayProposals.length === 0 && (
                        <div className="mt-4 p-4 text-center text-gray-500 text-sm italic">
                            No proposals available for this lead.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

VoucherTab.displayName = 'VoucherTab';
export default VoucherTab;
