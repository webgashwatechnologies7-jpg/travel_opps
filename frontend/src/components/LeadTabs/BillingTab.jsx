import React, { memo } from 'react';
import { Plus } from 'lucide-react';

const BillingTab = memo(({
    lead,
    getConfirmedOption,
    quotationData,
    paymentSummary,
    payments,
    loadingPayments,
    setPaymentFormData,
    setShowPaymentModal,
    formatDateForDisplay,
}) => {
    const confirmedOption = getConfirmedOption();
    const confirmedOptionNum = confirmedOption?.optionNumber;
    const hotels = quotationData?.hotelOptions?.[confirmedOptionNum?.toString()] || [];
    const packagePrice =
        confirmedOption?.price ||
        hotels.reduce((sum, h) => sum + (parseFloat(h.price) || 0), 0);
    const displayTotal = packagePrice > 0 ? packagePrice : paymentSummary.total_amount;
    const displayDue = Math.max(0, displayTotal - paymentSummary.total_paid);

    return (
        <div className="space-y-6">
            {/* Package Details Section */}
            {confirmedOption ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Package Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Option Number</p>
                            <p className="text-base font-medium text-gray-900">Option {confirmedOptionNum}</p>
                        </div>
                        {quotationData?.itinerary && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-600">Destination</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {quotationData.itinerary.destinations || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Duration</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {quotationData.itinerary.duration || 0} Nights
                                    </p>
                                </div>
                                {lead?.travel_start_date && (
                                    <div>
                                        <p className="text-sm text-gray-600">Travel Dates</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {formatDateForDisplay(lead.travel_start_date)} -{' '}
                                            {lead.travel_end_date ? formatDateForDisplay(lead.travel_end_date) : 'N/A'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                        <div>
                            <p className="text-sm text-gray-600">Total Package Price</p>
                            <p className="text-xl font-bold text-green-600">
                                ₹{packagePrice.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    {hotels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Hotels Included:</p>
                            <div className="space-y-2">
                                {hotels.map((hotel, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded">
                                        <p className="text-sm font-medium text-gray-900">
                                            Day {hotel.day}: {hotel.hotelName || 'Hotel'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {hotel.roomName || 'N/A'} | {hotel.mealPlan || 'N/A'} | ₹
                                            {parseFloat(hotel.price || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        ⚠️ No confirmed package found. Please confirm an option in the Proposals tab first.
                    </p>
                </div>
            )}

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-700">
                        ₹{displayTotal.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                    <p className="text-2xl font-bold text-green-700">
                        ₹{paymentSummary.total_paid.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium">Due Amount</p>
                    <p className="text-2xl font-bold text-red-700">
                        ₹{displayDue.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Add Payment Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        const remainingAmount = Math.max(0, packagePrice - paymentSummary.total_paid);
                        setPaymentFormData({
                            amount: remainingAmount > 0 ? remainingAmount.toString() : '',
                            paid_amount: '',
                            due_date: '',
                        });
                        setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Payment
                </button>
            </div>

            {/* Payment History Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                </div>
                {loadingPayments ? (
                    <div className="p-8 text-center text-gray-500">Loading payments...</div>
                ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No payments recorded yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paid Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Added By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {payment.created_at ? formatDateForDisplay(payment.created_at) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                            ₹{parseFloat(payment.paid_amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                            ₹{parseFloat(
                                                payment.due_amount || payment.amount - payment.paid_amount
                                            ).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {payment.due_date ? formatDateForDisplay(payment.due_date) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${payment.status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : payment.status === 'partial'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {payment.status === 'paid'
                                                    ? 'Paid'
                                                    : payment.status === 'partial'
                                                        ? 'Partial'
                                                        : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {payment.creator?.name || 'N/A'}
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

BillingTab.displayName = 'BillingTab';
export default BillingTab;
