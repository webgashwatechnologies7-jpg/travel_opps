import { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
// Layout removed - handled by nested routing
import { useSettings } from '../contexts/SettingsContext';
import LogoLoader from '../components/LogoLoader';
import { Dialog } from 'primereact/dialog';
import { User, Calendar, MapPin, CheckCircle, Clock, Image as ImageIcon, X } from 'lucide-react';

const Payments = () => {
  const { currency } = useSettings();
  const [dueToday, setDueToday] = useState([]);
  const [pending, setPending] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await paymentsAPI.list();
      const all = res.data.data.payments || [];
      setAllPayments(all);
      
      // Filter due today: where due_date is today (local time)
      const todayStr = new Date().toISOString().split('T')[0];
      setDueToday(all.filter(p => p.due_date && p.due_date.startsWith(todayStr)));
      
      // Filter pending: where status is 'pending'
      setPending(all.filter(p => p.status === 'pending'));
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const payments = activeTab === 'all' ? allPayments : activeTab === 'pending' ? pending : dueToday;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  return (
    <div className={`p-6 relative page-transition ${loading && dueToday.length + pending.length + allPayments.length > 0 ? 'opacity-80' : ''}`}>
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      {loading && dueToday.length === 0 && pending.length === 0 && allPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
             <LogoLoader text="Checking payments..." />
          </div>
      ) : (
        <>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Payments</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg transition-all ${activeTab === 'all'
              ? 'bg-gray-800 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All ({allPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg transition-all ${activeTab === 'pending'
              ? 'bg-yellow-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('due-today')}
            className={`px-6 py-2 rounded-lg transition-all ${activeTab === 'due-today'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Due Today ({dueToday.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b"
                  onClick={() => handleRowClick(payment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{payment.lead?.client_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{payment.lead?.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {(() => {
                      if (!payment.lead?.travel_start_date || !payment.lead?.travel_end_date) return 'N/A';
                      const start = new Date(payment.lead.travel_start_date);
                      const end = new Date(payment.lead.travel_end_date);
                      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                      return `${diffDays}N/${diffDays + 1}D`;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{currency?.name || 'INR'} {Number(payment.amount).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-600 font-semibold">Paid: {currency?.name || 'INR'} {Number(payment.paid_amount).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-800">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {(payment.lead?.assigned_user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {payment.lead?.assigned_user?.name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-800">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                        {(payment.creator?.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      {payment.creator?.name || 'System'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-gray-50">
              <p className="text-lg">No payments found in this category</p>
            </div>
          )}
        </div>
        </>
      )}

      {/* Payment Detail Modal */}
      <Dialog 
        header={`Payment Details - ${selectedPayment?.lead?.client_name || 'N/A'}`} 
        visible={showDetailModal} 
        style={{ width: '600px' }} 
        onHide={() => setShowDetailModal(false)}
        className="payment-modal"
      >
        {selectedPayment && (
          <div className="p-4 space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">{currency?.name || 'INR'} {Number(selectedPayment.amount).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 uppercase font-bold mb-1">Paid Amount</p>
                <p className="text-lg font-bold text-green-700">{currency?.name || 'INR'} {Number(selectedPayment.paid_amount).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-bold mb-1">Balance Due</p>
                <p className="text-lg font-bold text-blue-700">{currency?.name || 'INR'} {Number(selectedPayment.amount - selectedPayment.paid_amount).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Trip Details */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" /> Trip & Package Details
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Destination / Package</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedPayment.lead?.destination || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {(() => {
                      if (!selectedPayment.lead?.travel_start_date || !selectedPayment.lead?.travel_end_date) return 'N/A';
                      const start = new Date(selectedPayment.lead.travel_start_date);
                      const end = new Date(selectedPayment.lead.travel_end_date);
                      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                      return `${diffDays} Night(s) / ${diffDays + 1} Day(s)`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Pax Details</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {selectedPayment.lead?.adults || 0} Adult(s), {selectedPayment.lead?.children || 0} Child(s)
                    {selectedPayment.lead?.infants > 0 && `, ${selectedPayment.lead.infants} Infant(s)`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Travel Dates</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(selectedPayment.lead?.travel_start_date)} - {formatDate(selectedPayment.lead?.travel_end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned Employee</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <User className="h-3 w-3" /> {selectedPayment.lead?.assigned_user?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Approved/Created By</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {selectedPayment.creator?.name || 'System'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Status & Date */}
            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Created On: {formatDate(selectedPayment.created_at)}</span>
              </div>
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${getStatusColor(selectedPayment.status)}`}>
                {selectedPayment.status}
              </span>
            </div>

            {/* Screenshot Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-500" /> Payment Proof / Screenshot
              </h4>
              {selectedPayment.receipt ? (
                <div className="border rounded-lg p-2 bg-white flex justify-center overflow-hidden">
                  <img 
                    src={selectedPayment.receipt} 
                    alt="Payment Receipt" 
                    className="max-h-[300px] object-contain hover:scale-105 transition-transform duration-300 pointer-events-auto"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => window.open(selectedPayment.receipt, '_blank')}
                  />
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm italic">No receipt provided for this payment.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Payments;

