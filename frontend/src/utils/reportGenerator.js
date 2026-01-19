// Advanced Report Generator for PDF and Excel

export const generatePDFReport = (clientData, reportData, dateRange) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Client Payment Report - ${clientData.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .client-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          color: #007bff;
          font-size: 14px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .status-paid {
          background-color: #d4edda;
          color: #155724;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        .monthly-breakdown {
          margin-bottom: 30px;
        }
        .payment-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .method-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #007bff;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Client Payment Report</h1>
        <h2>${clientData.name}</h2>
        <p>Report Period: ${dateRange.start} to ${dateRange.end}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="client-info">
        <h3>Client Information</h3>
        <p><strong>Name:</strong> ${clientData.name}</p>
        <p><strong>Email:</strong> ${clientData.email}</p>
        <p><strong>Mobile:</strong> ${clientData.mobile}</p>
        <p><strong>City:</strong> ${clientData.city}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Payments</h3>
          <div class="value">${reportData.summary.totalPayments}</div>
        </div>
        <div class="summary-card">
          <h3>Total Amount</h3>
          <div class="value">${reportData.summary.totalAmount}</div>
        </div>
        <div class="summary-card">
          <h3>Average Payment</h3>
          <div class="value">${reportData.summary.averagePayment}</div>
        </div>
        <div class="summary-card">
          <h3>Pending Amount</h3>
          <div class="value">${reportData.summary.pendingAmount}</div>
        </div>
      </div>

      <h3>Payment History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Method</th>
            <th>Description</th>
            <th>Invoice No.</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.payments.map(payment => `
            <tr>
              <td>${payment.date}</td>
              <td>${payment.amount}</td>
              <td><span class="status-${payment.status.toLowerCase()}">${payment.status}</span></td>
              <td>${payment.method}</td>
              <td>${payment.description}</td>
              <td>${payment.invoiceNo}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="monthly-breakdown">
        <h3>Monthly Breakdown</h3>
        ${reportData.monthlyBreakdown.map(month => `
          <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; margin-bottom: 5px; border-radius: 3px;">
            <span><strong>${month.month}</strong></span>
            <span>${month.payments} payments | ${month.amount}</span>
          </div>
        `).join('')}
      </div>

      <h3>Payment Methods</h3>
      <div class="payment-methods">
        ${Object.entries(reportData.paymentMethods).map(([method, data]) => `
          <div class="method-card">
            <h4>${method}</h4>
            <p>${data.count} payments</p>
            <p><strong>${data.amount}</strong></p>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>This report was generated automatically from the CRM Travel System</p>
        <p>For any queries, please contact the system administrator</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `client-report-${clientData.name.replace(/\s+/g, '-')}-${dateRange.start}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const generateExcelReport = (clientData, reportData, dateRange) => {
  // Create CSV content
  const csvHeaders = ['Date', 'Amount', 'Status', 'Method', 'Description', 'Query ID', 'Invoice No.'];
  const csvRows = reportData.payments.map(payment => [
    payment.date,
    payment.amount.replace('₹', ''), // Remove currency symbol for Excel
    payment.status,
    payment.method,
    payment.description,
    payment.queryId || '',
    payment.invoiceNo
  ]);

  // Create CSV content
  const csvContent = [
    `CLIENT PAYMENT REPORT - ${clientData.name}`,
    `Report Period: ${dateRange.start} to ${dateRange.end}`,
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
    'CLIENT INFORMATION',
    `Name,${clientData.name}`,
    `Email,${clientData.email}`,
    `Mobile,${clientData.mobile}`,
    `City,${clientData.city}`,
    '',
    'PAYMENT SUMMARY',
    `Total Payments,${reportData.summary.totalPayments}`,
    `Total Amount,${reportData.summary.totalAmount.replace('₹', '')}`,
    `Average Payment,${reportData.summary.averagePayment.replace('₹', '')}`,
    `Pending Payments,${reportData.summary.pendingPayments}`,
    `Pending Amount,${reportData.summary.pendingAmount.replace('₹', '')}`,
    `Last Payment Date,${reportData.summary.lastPaymentDate}`,
    '',
    'PAYMENT DETAILS',
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
    'MONTHLY BREAKDOWN',
    'Month,Payments,Amount',
    ...reportData.monthlyBreakdown.map(month => 
      `"${month.month}",${month.payments},"${month.amount.replace('₹', '')}"`
    ),
    '',
    'PAYMENT METHODS',
    'Method,Count,Amount',
    ...Object.entries(reportData.paymentMethods).map(([method, data]) => 
      `"${method}",${data.count},"${data.amount.replace('₹', '')}"`
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `client-report-${clientData.name.replace(/\s+/g, '-')}-${dateRange.start}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const generateDetailedReport = (clientData, reportData, dateRange) => {
  // Generate comprehensive report with all details
  const detailedReportData = {
    client: clientData,
    summary: reportData.summary,
    payments: reportData.payments,
    monthlyBreakdown: reportData.monthlyBreakdown,
    paymentMethods: reportData.paymentMethods,
    metadata: {
      reportPeriod: dateRange,
      generatedOn: new Date().toISOString(),
      generatedBy: 'CRM Travel System',
      version: '1.0'
    }
  };

  // Create JSON file for detailed analysis
  const jsonContent = JSON.stringify(detailedReportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `client-detailed-report-${clientData.name.replace(/\s+/g, '-')}-${dateRange.start}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
