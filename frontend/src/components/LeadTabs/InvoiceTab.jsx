import React, { memo } from 'react';
import { Eye, RefreshCw, Download, Send } from 'lucide-react';

const InvoiceTab = memo(({
    loadingHistory,
    queryDetailInvoices,
    handleInvoicePreview,
    handleInvoiceDownload,
    handleInvoiceSend,
    invoiceActionLoading
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoices</h3>
                <p className="text-sm text-gray-500 mb-4">Confirming an option automatically creates an invoice.</p>
                {loadingHistory ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : queryDetailInvoices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No invoices yet</p>
                        <p className="text-sm mt-2">Confirm an option — invoice will be auto-created based on it</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice No.</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Option</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Itinerary</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {queryDetailInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">Option {inv.option_number}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{inv.itinerary_name || '—'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-2"><span className={`text-xs px-2 py-1 rounded ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{inv.status}</span></td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleInvoicePreview(inv.id)}
                                                    disabled={!!invoiceActionLoading}
                                                    title="Preview"
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
                                                >
                                                    {invoiceActionLoading === 'preview' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleInvoiceDownload(inv.id)}
                                                    disabled={!!invoiceActionLoading}
                                                    title="Download PDF"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
                                                >
                                                    {invoiceActionLoading === 'download' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleInvoiceSend(inv.id)}
                                                    disabled={!!invoiceActionLoading}
                                                    title="Send by Email"
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-50"
                                                >
                                                    {invoiceActionLoading === 'send' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
});

InvoiceTab.displayName = 'InvoiceTab';
export default InvoiceTab;
