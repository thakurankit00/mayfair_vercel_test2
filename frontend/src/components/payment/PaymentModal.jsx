import React, { useState, useEffect } from 'react';
import { restaurantApiService, paymentApi } from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, order, onPaymentInitiated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
<<<<<<< HEAD
    if (isOpen && order) {
=======
    if (isOpen && order) {s
>>>>>>> origin/feature/booking-chart
      // Pre-fill customer info if available
      setCustomerInfo({
        name: order.customerName || '',
        email: order.customerEmail || '',
        phone: order.customerPhone || ''
      });
    }
  }, [isOpen, order]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      setError('Customer name is required');
      return false;
    }
    if (!customerInfo.email.trim()) {
      setError('Customer email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handlePaymentRequest = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      console.log('💳 [PAYMENT] Requesting payment for order:', order.id);
      
      // First, request payment (update order status)
      const paymentRequestResponse = await restaurantApiService.requestPayment(order.id);
      
      if (!paymentRequestResponse.success) {
        throw new Error(paymentRequestResponse.error?.message || 'Failed to request payment');
      }

      // Create payment intent
      const paymentIntentResponse = await paymentApi.createPaymentIntent({
        orderId: order.id,
        amount: order.total_amount,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone
      });

      if (paymentIntentResponse.success) {
        console.log('💳 [PAYMENT] Payment intent created:', paymentIntentResponse.data);
        
        // Open PayU payment form in new window
        const paymentWindow = window.open('', 'payuPayment', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (paymentWindow) {
          // Create form HTML
          const formFields = Object.entries(paymentIntentResponse.data.paymentParams)
            .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
            .join('\n');

          const formHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Processing Payment...</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
                .loader { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .order-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: left; }
                .order-info h4 { margin: 0 0 10px 0; color: #333; }
                .order-info p { margin: 5px 0; color: #666; }
                .amount { font-size: 1.2em; font-weight: bold; color: #28a745; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Redirecting to Payment Gateway...</h2>
                <div class="loader"></div>
                
                <div class="order-info">
                  <h4>Order Details</h4>
                  <p><strong>Order:</strong> ${order.order_number}</p>
                  <p><strong>Table:</strong> ${order.table_number}</p>
                  <p><strong>Amount:</strong> <span class="amount">₹${order.total_amount}</span></p>
                </div>
                
                <p>Please wait while we redirect you to the secure payment page.</p>
                <p><small>If you are not redirected automatically, please click the "Pay Now" button below.</small></p>
                
                <form id="payuForm" action="${paymentIntentResponse.data.paymentUrl}" method="post">
                  ${formFields}
                  <button type="submit" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-top: 20px;">
                    Pay Now
                  </button>
                </form>
              </div>
              
              <script>
                // Auto-submit the form after 3 seconds
                setTimeout(function() {
                  document.getElementById('payuForm').submit();
                }, 3000);
              </script>
            </body>
            </html>
          `;

          paymentWindow.document.write(formHtml);
          paymentWindow.document.close();

          // Monitor payment window
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              console.log('💳 [PAYMENT] Payment window closed');
              // Refresh order status
              if (onPaymentInitiated) {
                onPaymentInitiated();
              }
            }
          }, 1000);

          onClose();
        } else {
          setError('Unable to open payment window. Please check your popup blocker settings.');
        }
      } else {
        setError(paymentIntentResponse.error?.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error initiating payment:', error);
      setError(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Process Payment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="payment-modal-content">
          {order && (
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="order-details">
                <div className="detail-row">
                  <span>Order Number:</span>
                  <span>{order.order_number}</span>
                </div>
                <div className="detail-row">
                  <span>Table:</span>
                  <span>{order.table_number}</span>
                </div>
                <div className="detail-row">
                  <span>Items:</span>
                  <span>{order.items?.length || 0} items</span>
                </div>
                <div className="detail-row total-row">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="customer-info-form">
            <h3>Customer Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={customerInfo.name}
                onChange={handleInputChange}
                placeholder="Enter customer's full name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                placeholder="Enter customer's email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                placeholder="Enter customer's phone number"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="payment-modal-actions">
          <button 
            onClick={onClose} 
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handlePaymentRequest} 
            className="pay-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                💳 Proceed to Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
