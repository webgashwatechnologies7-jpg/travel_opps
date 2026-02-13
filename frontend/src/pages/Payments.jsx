import { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useSettings } from '../contexts/SettingsContext';

const Payments = () => {
  const { currency } = useSettings();
  const [dueToday, setDueToday] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState('due-today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const [dueTodayRes, pendingRes] = await Promise.all([
        paymentsAPI.dueToday(),
        paymentsAPI.pending(),
      ]);
      setDueToday(dueTodayRes.data.data.payments || []);
      setPending(pendingRes.data.data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const payments = activeTab === 'due-today' ? dueToday : pending;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Payments</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('due-today')}
            className={`px-6 py-2 rounded-lg ${activeTab === 'due-today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Due Today ({dueToday.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg ${activeTab === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Pending ({pending.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.lead?.client_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{payment.lead?.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{currency?.name || 'INR'} {payment.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{currency?.name || 'INR'} {payment.paid_amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{payment.due_date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="text-center py-8 text-gray-500">No payments found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Payments;

