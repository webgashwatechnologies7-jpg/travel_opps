<<<<<<< HEAD
// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const PaymentCollectionTable = () => {
  

//   return (
//     <div className="bg-white rounded-lg shadow p-4">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold text-gray-800">Payment Collection</h2>
//         <span className="text-lg font-bold text-gray-800">
//           {totalAmount.toLocaleString('en-IN')} INR
//         </span>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b bg-gray-50">
//               <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Query ID</th>
//               <th className="text-left py-2 px-3 text-gray-600 font-medium text-xs">Customer Name</th>
//               <th className="text-right py-2 px-3 text-gray-600 font-medium text-xs">Amount</th>
//               <th className="text-center py-2 px-3 text-gray-600 font-medium text-xs">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {payments.length === 0 ? (
//               <tr>
//                 <td colSpan="4" className="text-center py-4 text-gray-500 text-sm">
//                   No payments available
//                 </td>
//               </tr>
//             ) : (
//               payments.slice(0, 5).map((payment, index) => (
//                 <tr key={payment.id || index} className="border-b hover:bg-gray-50 transition-colors">
//                   <td className="py-2 px-3 text-gray-800 font-medium text-xs">
//                     {formatLeadId(payment.lead_id || payment.id)}
//                   </td>
//                   <td className="py-2 px-3 text-gray-700 text-xs">
//                     {payment.lead?.client_name || 'N/A'}
//                   </td>
//                   <td className="py-2 px-3 text-right text-gray-700 text-xs">
//                     {parseFloat(payment.amount || 0).toLocaleString('en-IN')}INR
//                   </td>
//                   <td className="py-2 px-3 text-center">
//                     <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
//                       Cleared
//                     </span>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//       {payments.length > 5 && (
//         <Link
//           to="/payments"
//           className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-800"
//         >
//           View All →
//         </Link>
//       )}
//     </div>
//   );
// };

// export default PaymentCollectionTable;

import React, { useEffect, useState } from "react";
import { paymentsAPI } from '../services/api';

// const paymentData = [
//   {
//     id: "#10022",
//     name: "Ratan Kumar Srivastava",
//     amount: "25000INR",
//     status: "Cleared",
//   },
//   {
//     id: "#10021",
//     name: "Ratan Kumar Srivastava",
//     amount: "25000INR",
//     status: "Cleared",
//   },
//   {
//     id: "#10020",
//     name: "Ratan Kumar Srivastava",
//     amount: "25000INR",
//     status: "Cleared",
//   },
//   {
//     id: "#10019",
//     name: "Ratan Kumar Srivastava",
//     amount: "25000INR",
//     status: "Cleared",
//   },
//   {
//     id: "#10018",
//     name: "Ratan Kumar Srivastava",
//     amount: "25000INR",
//     status: "Cleared",
//   },
// ];

const PaymentCollectionTable = () => {
  const [expanded, setExpanded] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
=======
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentsAPI } from '../services/api';

const PaymentCollectionTable = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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
<<<<<<< HEAD
      console.log("Payment data", paymentsData);
      
      setPaymentData(paymentsData);
      
=======
      setPayments(paymentsData);

>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
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
<<<<<<< HEAD
    <div className="bg-[#F4F6FF] mt-2 rounded-xl p-4 w-full">
=======
    <div className="bg-[#F4F6FF] rounded-xl p-4 w-full h-full flex flex-col">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-gray-900">
          Payment Collection{" "}
<<<<<<< HEAD
          <span className="text-red-500 font-semibold">(383299 INR)</span>
        </h2>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#3B82F6] text-xs font-medium flex items-center gap-1"
        >
          View more
          <span
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
=======
          <span className="text-red-500 font-semibold">
            ({totalAmount.toLocaleString('en-IN')} INR)
          </span>
        </h2>

        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="text-[#3B82F6] text-xs font-medium flex items-center gap-1"
        >
          View more
          <span className="transition-transform duration-200">▼</span>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
        </button>
      </div>

      {/* Table Wrapper */}
      <div
<<<<<<< HEAD
        className={`
          border border-[#E5E7EB] rounded-lg bg-[#F7F8FF]
          transition-all duration-300
          ${expanded ? "h-[500px] overflow-y-auto custom-scroll" : "h-[200px] overflow-hidden"}
        `}
      >
        {/* Table Header */}
        <div className="grid grid-cols-4 text-[#1E40AF] text-[12px] font-medium px-4 py-3 bg-[#F1F3FF]">
=======
        className="
          border border-[#E5E7EB] rounded-lg bg-[#F7F8FF]
          transition-all duration-300 flex-1 min-h-0 overflow-hidden flex flex-col
        "
      >
        {/* Table Header */}
        <div className="grid grid-cols-4 text-[#1E40AF] text-[12px] font-medium px-4 py-3 bg-[#F1F3FF] flex-shrink-0">
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
          <div>Query ID</div>
          <div>Customer Name</div>
          <div>Amount</div>
          <div>Status</div>
        </div>

<<<<<<< HEAD
        {/* Rows */}
        {paymentData.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-4 items-center px-4 py-3 border-t border-[#E5E7EB] text-[12px]"
          >
            {/* Query ID */}
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              {item.id}
              <span className="text-green-500 text-lg leading-none">›</span>
            </div>

            {/* Name */}
            <div className="text-gray-800">{item.name}</div>

            {/* Amount */}
            <div className="font-semibold text-[12px] text-gray-900">{item.amount}</div>

            {/* Status */}
            <div>
              <span className="bg-[#2EA6A6] text-white px-2 py-1 rounded-md text-[10px] font-medium">
                {item.status}
              </span>
            </div>
          </div>
        ))}
=======
        {/* Rows - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scroll pr-2 -mr-2">
          {payments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs">
              No payments available
            </div>
          ) : (
            payments.map((payment, index) => {
            const paymentId = formatLeadId(payment.lead_id || payment.id);
            const customerName = payment.lead?.client_name || payment.client_name || 'N/A';
            const amount = parseFloat(payment.amount || 0).toLocaleString('en-IN');
            const statusText = payment.status || 'Cleared';

            return (
              <div
                key={payment.id || index}
                onClick={() => {
                  const leadId = payment.lead_id || payment.lead?.id;
                  if (leadId) {
                    navigate(`/leads/${leadId}?tab=billing`);
                  }
                }}
                className="grid grid-cols-4 items-center px-4 py-3 border-t border-[#E5E7EB] text-[12px] cursor-pointer hover:bg-gray-50"
              >
                {/* Query ID */}
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  {paymentId}
                  <span className="text-green-500 text-lg leading-none">›</span>
                </div>

                {/* Name */}
                <div className="text-gray-800">{customerName}</div>

                {/* Amount */}
                <div className="font-semibold text-[12px] text-gray-900">{amount} INR</div>

                {/* Status */}
                <div>
                  <span className="bg-[#2EA6A6] text-white px-2 py-1 rounded-md text-[10px] font-medium">
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })
          )}
        </div>
>>>>>>> 685a818 (Added itinerary pricing, frontend updates, and backend improvements)
      </div>
    </div>
  );
};

export default PaymentCollectionTable;
