import { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const PaymentCollectionTable = () => {
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Format ID helper - formats ID as Q-0005, Q-0004, etc.
  const formatLeadId = (id) => {
    if (!id) return 'N/A';
    return `Q-${String(id).padStart(4, '0')}`;
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await paymentsAPI.dueToday();
      const paymentsData = response.data.data?.payments || [];
      setPayments(paymentsData);
      
      // Calculate total
      const total = paymentsData.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      setTotalAmount(total);
    } catch (err) {
      setError('Failed to load payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Collection</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Collection</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Payment Collection</h2>
        <span className="text-lg font-bold text-gray-800">
          {totalAmount.toLocaleString('en-IN')} INR
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Query ID</th>
              <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Customer Name</th>
              <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Amount</th>
              <th className="text-center py-2 px-3 text-gray-600 font-medium text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
                  No payments available
                </td>
              </tr>
            ) : (
              payments.slice(0, 5).map((payment, index) => (
                <tr key={payment.id || index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 text-gray-800 font-medium text-xs">
                    {formatLeadId(payment.lead_id || payment.id)}
                  </td>
                  <td className="py-2 px-3 text-gray-700 text-xs">
                    {payment.lead?.client_name || 'N/A'}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-700 text-xs">
                    {parseFloat(payment.amount || 0).toLocaleString('en-IN')}INR
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      Cleared
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {payments.length > 5 && (
        <Link
          to="/payments"
          className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-800"
        >
          View All →
        </Link>
      )}
    </div>
  );
};

export default PaymentCollectionTable;

