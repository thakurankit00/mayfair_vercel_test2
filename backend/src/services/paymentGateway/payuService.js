const crypto = require('crypto');
const axios = require('axios');

class PayUService {
  constructor() {
    this.merchantId = process.env.PAYU_MERCHANT_ID;
    this.secretKey = process.env.PAYU_SECRET_KEY;
    this.salt = process.env.PAYU_SALT;
    this.environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    
    // PayU URLs
    this.baseUrl = this.environment === 'live' 
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';
    
    this.verifyUrl = this.environment === 'live'
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2';
  }

  /**
   * Generate hash for PayU payment
   * @param {Object} params - Payment parameters
   * @returns {string} Generated hash
   */
  generateHash(params) {
    const { key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 } = params;
    
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|${udf2 || ''}|${udf3 || ''}|${udf4 || ''}|${udf5 || ''}||||||${this.salt}`;
    
    console.log('🔐 [PAYU] Hash string:', hashString);
    
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    console.log('🔐 [PAYU] Generated hash:', hash);
    
    return hash;
  }

  /**
   * Verify hash from PayU response
   * @param {Object} params - Response parameters from PayU
   * @returns {boolean} Hash verification result
   */
  verifyHash(params) {
    const { 
      key, txnid, amount, productinfo, firstname, email, 
      udf1, udf2, udf3, udf4, udf5, status, hash 
    } = params;
    
    const hashString = `${this.salt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    console.log('🔐 [PAYU] Verify hash string:', hashString);
    console.log('🔐 [PAYU] Calculated hash:', calculatedHash);
    console.log('🔐 [PAYU] Received hash:', hash);
    
    return calculatedHash === hash;
  }

  /**
   * Create payment parameters for PayU
   * @param {Object} paymentData - Payment information
   * @returns {Object} PayU payment parameters
   */
  createPaymentParams(paymentData) {
    const {
      orderId,
      orderNumber,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo,
      successUrl,
      failureUrl
    } = paymentData;

    const txnid = `TXN_${orderNumber}_${Date.now()}`;
    
    const params = {
      key: this.merchantId,
      txnid,
      amount: amount.toFixed(2),
      productinfo: productInfo || `Order ${orderNumber}`,
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      surl: successUrl,
      furl: failureUrl,
      service_provider: 'payu_paisa',
      udf1: orderId, // Store order ID for reference
      udf2: orderNumber,
      udf3: '', // Can be used for additional data
      udf4: '',
      udf5: ''
    };

    // Generate hash
    params.hash = this.generateHash(params);

    console.log('💳 [PAYU] Payment params created:', {
      ...params,
      hash: params.hash.substring(0, 20) + '...'
    });

    return params;
  }

  /**
   * Get PayU payment form HTML
   * @param {Object} paymentParams - PayU payment parameters
   * @returns {string} HTML form for PayU payment
   */
  getPaymentForm(paymentParams) {
    const formFields = Object.entries(paymentParams)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Processing Payment...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h2>Redirecting to Payment Gateway...</h2>
        <div class="loader"></div>
        <p>Please wait while we redirect you to the secure payment page.</p>
        
        <form id="payuForm" action="${this.baseUrl}" method="post">
          ${formFields}
        </form>
        
        <script>
          // Auto-submit the form
          document.getElementById('payuForm').submit();
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Verify payment with PayU
   * @param {string} txnid - Transaction ID
   * @returns {Object} Payment verification result
   */
  async verifyPayment(txnid) {
    try {
      const command = 'verify_payment';
      const hashString = `${this.merchantId}|${command}|${txnid}|${this.salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const params = {
        key: this.merchantId,
        command,
        hash,
        var1: txnid
      };

      console.log('🔍 [PAYU] Verifying payment:', txnid);

      const response = await axios.post(this.verifyUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      console.log('🔍 [PAYU] Verification response:', response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ [PAYU] Payment verification error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process PayU webhook/callback
   * @param {Object} callbackData - Data from PayU callback
   * @returns {Object} Processed payment result
   */
  processCallback(callbackData) {
    console.log('📞 [PAYU] Processing callback:', callbackData);

    // Verify hash
    const isValidHash = this.verifyHash(callbackData);
    
    if (!isValidHash) {
      console.error('❌ [PAYU] Invalid hash in callback');
      return {
        success: false,
        error: 'Invalid hash verification'
      };
    }

    const {
      txnid,
      status,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1: orderId,
      udf2: orderNumber,
      mihpayid,
      error: errorMsg,
      error_Message
    } = callbackData;

    const paymentResult = {
      transactionId: txnid,
      gatewayTransactionId: mihpayid,
      orderId,
      orderNumber,
      amount: parseFloat(amount),
      status: status.toLowerCase(),
      customerName: firstname,
      customerEmail: email,
      customerPhone: phone,
      productInfo: productinfo,
      error: errorMsg || error_Message,
      rawResponse: callbackData
    };

    console.log('📞 [PAYU] Processed callback result:', paymentResult);

    return {
      success: true,
      data: paymentResult
    };
  }

  /**
   * Get payment status mapping
   * @param {string} payuStatus - PayU status
   * @returns {string} Normalized payment status
   */
  getPaymentStatus(payuStatus) {
    const statusMap = {
      'success': 'completed',
      'failure': 'failed',
      'pending': 'pending',
      'cancel': 'cancelled',
      'tampered': 'failed',
      'bounced': 'failed',
      'dropped': 'failed',
      'in progress': 'pending'
    };

    return statusMap[payuStatus.toLowerCase()] || 'failed';
  }
}

module.exports = PayUService;
