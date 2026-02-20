import React, { memo } from 'react';
import { Eye, RefreshCw, Download, Send } from 'lucide-react';

const VoucherTab = memo(({
    lead,
    getConfirmedOption,
    quotationData,
    handleVoucherPreview,
    handleVoucherDownload,
    handleVoucherSend,
    voucherActionLoading
}) => {
    const confirmedOption = getConfirmedOption();
    const itineraryName = confirmedOption?.itinerary_name || quotationData?.itinerary?.itinerary_name || '—';

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vouchers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Option</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Itinerary</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                    Option {confirmedOption?.optionNumber || '1'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {itineraryName}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confirmedOption ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {confirmedOption ? 'Confirmed' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {lead?.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={handleVoucherPreview}
                                            disabled={!!voucherActionLoading}
                                            title="Preview"
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
                                        >
                                            {voucherActionLoading === 'preview' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVoucherDownload}
                                            disabled={!!voucherActionLoading}
                                            title="Download PDF"
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
                                        >
                                            {voucherActionLoading === 'download' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVoucherSend}
                                            disabled={!!voucherActionLoading}
                                            title="Send by Email"
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-50"
                                        >
                                            {voucherActionLoading === 'send' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {!confirmedOption && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs text-blue-700">
                                <strong>Tip:</strong> Go to the <strong>Proposals</strong> tab and <strong>Confirm</strong> an option to finalize this voucher.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

VoucherTab.displayName = 'VoucherTab';
export default VoucherTab;
