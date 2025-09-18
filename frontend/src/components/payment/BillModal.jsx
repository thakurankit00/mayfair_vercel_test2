import React, { useState, useEffect } from 'react';
import { restaurantApiService } from '../../services/api';
import './BillModal.css';

const BillModal = ({ isOpen, onClose, order, onBillGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      generateBill();
    }
  }, [isOpen, order]);

  const generateBill = async () => {
    if (!order) return;

    setLoading(true);
    setError('');

    try {
      console.log('🧾 [BILL] Generating bill for order:', order.id);
      
      const response = await restaurantApiService.generateBill(order.id);
      
      if (response.success) {
        setBill(response.data.bill);
        console.log('🧾 [BILL] Bill generated successfully:', response.data.bill);
        
        if (onBillGenerated) {
          onBillGenerated(response.data.bill);
        }
      } else {
        setError(response.error?.message || 'Failed to generate bill');
      }
    } catch (error) {
      console.error('❌ [BILL] Error generating bill:', error);
      setError(error.response?.data?.error?.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
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
                    <span>{bill.billNumber}</span>
                  </div>
                  <div className="bill-info-row">
                    <span>Order No:</span>
                    <span>{bill.orderNumber}</span>
                  </div>
                  <div className="bill-info-row">
                    <span>{bill.orderType === 'room-service' ? 'Room:' : 'Table:'}</span>
                    <span>
                      {bill.orderType === 'room-service' 
                        ? `${bill.roomNumber} (${bill.guestName})`
                        : bill.tableNumber
                      }
                    </span>
                  </div>
                  {bill.orderType && (
                    <div className="bill-info-row">
                      <span>Type:</span>
                      <span>{bill.orderType === 'room-service' ? 'Room Service' : 'Dine-In'}</span>
                    </div>
                  )}
                  <div className="bill-info-row">
                    <span>Date:</span>
                    <span>{formatDate(bill.generatedAt)}</span>
                  </div>
                  {bill.waiterName && (
                    <div className="bill-info-row">
                      <span>Waiter:</span>
                      <span>{bill.waiterName}</span>
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
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-{formatCurrency(bill.discount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Tax (12%):</span>
                  <span>{formatCurrency(bill.taxAmount)}</span>
                </div>
                {bill.serviceCharge > 0 && (
                  <div className="summary-row">
                    <span>Service Charge:</span>
                    <span>{formatCurrency(bill.serviceCharge)}</span>
                  </div>
                )}
                <div className="summary-row total-row">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(bill.totalAmount)}</span>
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
                <p>Generated by: {bill.generatedBy.name}</p>
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
