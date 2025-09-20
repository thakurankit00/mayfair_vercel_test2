import React, { useState, useEffect } from 'react';
import { restaurantApiService } from '../../services/api';
import './BillModal.css';

const BillModal = ({ isOpen, onClose, order, onBillGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order && !bill) {
      // Only generate bill if we don't already have one
      if (order.bill) {
        // If order already has a bill, use it
        setBill(order.bill);
      } else {
        // Generate new bill
        generateBill();
      }
    }
  }, [isOpen, order]);

  const generateBill = async () => {
    if (!order || loading) return; // Prevent duplicate requests

    setLoading(true);
    setError('');

    try {
      console.log('🧾 [BILL] Generating bill for order:', order.id);

      const billData = await restaurantApiService.generateBill(order.id);

      console.log('🧾 [BILL] Bill response:', billData);

      // The API returns the bill object directly after response.data.data processing
      if (billData && billData.bill) {
        setBill(billData.bill);
        console.log('🧾 [BILL] Bill generated successfully:', billData.bill);

        if (onBillGenerated) {
          onBillGenerated(billData.bill);
        }
      } else {
        console.error('🧾 [BILL] Invalid bill data structure:', billData);
        setError('Invalid bill data received from server');
      }
    } catch (error) {
      console.error('❌ [BILL] Error generating bill:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate bill';

      // Handle specific error cases
      if (error.response?.data?.error?.code === 'ORDER_NOT_READY_FOR_BILLING') {
        setError('This order has already been billed or is not ready for billing.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    // Get the bill content element
    const billContent = document.getElementById('bill-print-area');
    if (!billContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    // Write the bill content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .bill-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .bill-header h3 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #333;
            }
            .bill-header p {
              margin: 0 0 20px 0;
              color: #666;
              font-size: 14px;
            }
            .bill-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              max-width: 400px;
              margin: 0 auto;
            }
            .bill-info-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .bill-info-row span:first-child {
              font-weight: 600;
              color: #555;
            }
            .bill-items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .bill-items-table th,
            .bill-items-table td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .bill-items-table th {
              background-color: #f8f9fa;
              font-weight: 600;
              color: #555;
              text-transform: uppercase;
              font-size: 11px;
            }
            .bill-items-table td:nth-child(2),
            .bill-items-table td:nth-child(3),
            .bill-items-table td:nth-child(4),
            .bill-items-table th:nth-child(2),
            .bill-items-table th:nth-child(3),
            .bill-items-table th:nth-child(4) {
              text-align: right;
            }
            .item-name {
              font-weight: 600;
              color: #333;
            }
            .bill-summary {
              border-top: 2px solid #333;
              padding-top: 20px;
              margin-top: 20px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 12px;
            }
            .summary-row span:last-child {
              font-weight: 600;
            }
            .total-row {
              border-top: 1px solid #ddd;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 14px;
              font-weight: 700;
            }
            .bill-footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 11px;
            }
            .bill-footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          ${billContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bill-modal-overlay">
      <div className="bill-modal">
        <div className="bill-modal-header">
          <h2>Order Bill</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="bill-modal-content">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Generating bill...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={generateBill} className="retry-button">
                Retry
              </button>
            </div>
          )}

          {bill && (
            <div className="bill-content" id="bill-print-area">
              <div className="bill-header">
                <h3>Mayfair Hotel</h3>
                <p>Restaurant Bill</p>
                <div className="bill-info">
                  <div className="bill-info-row">
                    <span>Bill No:</span>
                    <span>{bill.orderId?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="bill-info-row">
                    <span>Order No:</span>
                    <span>{bill.orderNumber}</span>
                  </div>
                  <div className="bill-info-row">
                    <span>Table:</span>
                    <span>{bill.table?.number || 'N/A'}</span>
                  </div>
                  <div className="bill-info-row">
                    <span>Date:</span>
                    <span>{formatDate(bill.generatedAt)}</span>
                  </div>
                  {bill.generatedBy?.name && (
                    <div className="bill-info-row">
                      <span>Generated By:</span>
                      <span>{bill.generatedBy.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bill-items">
                <table className="bill-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="item-name">{item.name}</div>
                          {item.description && (
                            <div className="item-description">{item.description}</div>
                          )}
                          {item.specialInstructions && (
                            <div className="item-instructions">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bill-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(bill.summary?.subtotal || 0)}</span>
                </div>
                {bill.summary?.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-{formatCurrency(bill.summary.discount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Tax (12%):</span>
                  <span>{formatCurrency(bill.summary?.tax || 0)}</span>
                </div>
                {bill.summary?.serviceCharge > 0 && (
                  <div className="summary-row">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(bill.summary.serviceCharge)}</span>
                  </div>
                )}
                <div className="summary-row total-row">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(bill.summary?.total || 0)}</span>
                </div>
              </div>

              {bill.specialInstructions && (
                <div className="bill-notes">
                  <h4>Special Instructions:</h4>
                  <p>{bill.specialInstructions}</p>
                </div>
              )}

              <div className="bill-footer">
                <p>Thank you for dining with us!</p>
                <p>Generated by: {bill.generatedBy?.name || 'System'}</p>
              </div>
            </div>
          )}
        </div>

        {bill && (
          <div className="bill-modal-actions">
            <button onClick={handlePrintBill} className="print-button">
              🖨️ Print Bill
            </button>
            <button onClick={onClose} className="close-bill-button">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillModal;
