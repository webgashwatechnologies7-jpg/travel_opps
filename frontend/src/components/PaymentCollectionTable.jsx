import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { paymentsAPI } from '../services/api';

/**
 * Premium Payment Collection Table
 * High-Density Executive Suite Styling
 */
const PaymentCollectionTable = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatLeadId = (id) => id ? `Q-${String(id).padStart(4, '0')}` : 'N/A';

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await paymentsAPI.dueToday();
        const paymentsData = response.data.data?.payments || [];
        setPayments(paymentsData);
        setTotalAmount(paymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0));
      } catch (err) {
        setError('Failed to load dues');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full h-full flex flex-col relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Payment Collection</h2>
            <span className="bg-rose-50 text-rose-500 text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse border border-rose-100 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-rose-500" /> LIVE
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: {totalAmount.toLocaleString('en-IN')} INR</p>
        </div>
        <button
          onClick={() => navigate("/payments")}
          className="text-[#2C55D4] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-all group"
        >
          View More <ChevronDown size={12} strokeWidth={3} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1 mt-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-xs font-bold">{error}</div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30 grayscale saturate-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100 px-4 py-2 rounded-xl">
              No payments due
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-bold text-slate-300 uppercase tracking-widest border-b border-gray-50 text-left">
                <th className="pb-3 pr-2">ID</th>
                <th className="pb-3 pr-2">NAME</th>
                <th className="pb-3 pr-2 text-center">AMOUNT</th>
                <th className="pb-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, index) => (
                <tr
                  key={p.id || index}
                  onClick={() => {
                    const leadId = p.lead_id || p.lead?.id;
                    if (leadId) navigate(`/leads/${leadId}?tab=billing`);
                  }}
                  className="border-b last:border-0 border-gray-50/50 group cursor-pointer hover:bg-slate-50 transition-all"
                >
                  <td className="py-2.5 font-bold text-slate-400 text-[10px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg group-hover:bg-[#2C55D4] group-hover:text-white transition-colors">
                      {formatLeadId(p.lead_id || p.id)}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600 text-[11px] font-semibold truncate uppercase tracking-tight max-w-[120px]">
                    {p.lead?.client_name || p.client_name || 'N/A'}
                  </td>
                  <td className="py-2.5 font-bold text-[11px] text-gray-800 text-center tabular-nums">
                    ₹{parseFloat(p.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="bg-[#2EA6A6]/10 text-[#2EA6A6] px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tight shadow-sm border border-[#2EA6A6]/20">
                      {p.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentCollectionTable;
