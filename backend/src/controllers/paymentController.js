const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const PayUService = require('../services/paymentGateway/payuService');

const payuService = new PayUService();

/**
 * Create payment intent for order
 * POST /api/v1/payments/create-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, customerName, customerEmail, customerPhone } = req.body;
    const userId = req.user.id;

    console.log('💳 [PAYMENT] Creating payment intent:', { orderId, amount, userId });

    // Validate required fields
    if (!orderId || !amount || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Order ID, amount, customer name, and email are required'
        }
      });
    }

    // Get order details
    const order = await db('orders')
      .select('*')
      .where('id', orderId)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check if order is ready for payment
    if (!['ready', 'billed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_READY',
          message: 'Order is not ready for payment'
        }
      });
    }

    // Check if payment already exists
    const existingPayment = await db('payments')
      .where('order_id', orderId)
      .where('status', 'completed')
      .first();

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_ALREADY_EXISTS',
          message: 'Payment already completed for this order'
        }
      });
    }

    // Create payment record
    const paymentId = uuidv4();
    const paymentReference = `PAY_${order.order_number}_${Date.now()}`;

    const paymentData = {
      id: paymentId,
      payment_reference: paymentReference,
      order_id: orderId,
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'INR',
      payment_method: 'online',
      payment_gateway: 'payu',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('payments').insert(paymentData);

    // Create PayU payment parameters
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const paymentParams = payuService.createPaymentParams({
      orderId,
      orderNumber: order.order_number,
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      productInfo: `Restaurant Order ${order.order_number}`,
      successUrl: `${baseUrl}/payment/success`,
      failureUrl: `${baseUrl}/payment/failure`
    });

    // Update order status to payment_pending
    await db('orders')
      .where('id', orderId)
      .update({
        status: 'payment_pending',
        updated_at: new Date()
      });

    console.log('💳 [PAYMENT] Payment intent created:', paymentReference);

    return res.status(201).json({
      success: true,
      data: {
        paymentId,
        paymentReference,
        paymentParams,
        paymentUrl: payuService.baseUrl
      },
      message: 'Payment intent created successfully'
    });

  } catch (error) {
    console.error('❌ [PAYMENT] Create intent error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create payment intent'
      }
    });
  }
};

/**
 * Get payment form HTML for PayU
 * GET /api/v1/payments/:paymentId/form
 */
const getPaymentForm = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment details
    const payment = await db('payments')
      .select('payments.*', 'orders.order_number')
      .join('orders', 'payments.order_id', 'orders.id')
      .where('payments.id', paymentId)
      .first();

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_PENDING',
          message: 'Payment is not in pending status'
        }
      });
    }

    // Create PayU payment parameters
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const paymentParams = payuService.createPaymentParams({
      orderId: payment.order_id,
      orderNumber: payment.order_number,
      amount: payment.amount,
      customerName: req.user.first_name + ' ' + req.user.last_name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || '',
      productInfo: `Restaurant Order ${payment.order_number}`,
      successUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/payments/callback/success`,
      failureUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/v1/payments/callback/failure`
    });

    // Generate HTML form
    const formHtml = payuService.getPaymentForm(paymentParams);

    res.setHeader('Content-Type', 'text/html');
    return res.send(formHtml);

  } catch (error) {
    console.error('❌ [PAYMENT] Get form error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to generate payment form'
      }
    });
  }
};

/**
 * Handle PayU success callback
 * POST /api/v1/payments/callback/success
 */
const handleSuccessCallback = async (req, res) => {
  try {
    console.log('✅ [PAYMENT] Success callback received:', req.body);

    const callbackResult = payuService.processCallback(req.body);

    if (!callbackResult.success) {
      console.error('❌ [PAYMENT] Invalid callback:', callbackResult.error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?error=invalid_callback`);
    }

    const paymentData = callbackResult.data;
    const { orderId, transactionId, gatewayTransactionId, amount, status } = paymentData;

    // Update payment record
    const paymentStatus = payuService.getPaymentStatus(status);
    
    await db('payments')
      .where('order_id', orderId)
      .update({
        gateway_transaction_id: gatewayTransactionId,
        status: paymentStatus,
        paid_at: paymentStatus === 'completed' ? new Date() : null,
        gateway_response: JSON.stringify(req.body),
        updated_at: new Date()
      });

    // Update order status
    if (paymentStatus === 'completed') {
      await db('orders')
        .where('id', orderId)
        .update({
          status: 'paid',
          updated_at: new Date()
        });

      // Emit socket event for payment success
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        const order = await db('orders').where('id', orderId).first();
        socketHandler.emitPaymentStatusUpdate({
          orderId,
          orderNumber: order.order_number,
          paymentStatus: 'completed',
          amount,
          transactionId
        });
      }

      console.log('✅ [PAYMENT] Payment completed successfully:', transactionId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/success?orderId=${orderId}&txnId=${transactionId}`);
    } else {
      console.log('❌ [PAYMENT] Payment failed:', transactionId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?orderId=${orderId}&txnId=${transactionId}`);
    }

  } catch (error) {
    console.error('❌ [PAYMENT] Success callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?error=callback_error`);
  }
};

/**
 * Handle PayU failure callback
 * POST /api/v1/payments/callback/failure
 */
const handleFailureCallback = async (req, res) => {
  try {
    console.log('❌ [PAYMENT] Failure callback received:', req.body);

    const callbackResult = payuService.processCallback(req.body);

    if (callbackResult.success) {
      const paymentData = callbackResult.data;
      const { orderId, transactionId, gatewayTransactionId, status } = paymentData;

      // Update payment record
      const paymentStatus = payuService.getPaymentStatus(status);
      
      await db('payments')
        .where('order_id', orderId)
        .update({
          gateway_transaction_id: gatewayTransactionId,
          status: paymentStatus,
          gateway_response: JSON.stringify(req.body),
          updated_at: new Date()
        });

      // Update order status back to billed
      await db('orders')
        .where('id', orderId)
        .update({
          status: 'billed',
          updated_at: new Date()
        });

      console.log('❌ [PAYMENT] Payment failed:', transactionId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?orderId=${orderId}&txnId=${transactionId}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?error=callback_error`);

  } catch (error) {
    console.error('❌ [PAYMENT] Failure callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/failure?error=callback_error`);
  }
};

/**
 * Get payment status
 * GET /api/v1/payments/:paymentId/status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await db('payments')
      .select('payments.*', 'orders.order_number', 'orders.status as order_status')
      .join('orders', 'payments.order_id', 'orders.id')
      .where('payments.id', paymentId)
      .first();

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        paymentReference: payment.payment_reference,
        orderId: payment.order_id,
        orderNumber: payment.order_number,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.payment_method,
        gatewayTransactionId: payment.gateway_transaction_id,
        paidAt: payment.paid_at,
        createdAt: payment.created_at
      }
    });

  } catch (error) {
    console.error('❌ [PAYMENT] Get status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to get payment status'
      }
    });
  }
};

/**
 * Get payment history for user
 * GET /api/v1/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    let query = db('payments')
      .select(
        'payments.*',
        'orders.order_number',
        'orders.status as order_status',
        'orders.placed_at'
      )
      .join('orders', 'payments.order_id', 'orders.id')
      .where('payments.user_id', userId)
      .orderBy('payments.created_at', 'desc');

    if (status) {
      query = query.where('payments.status', status);
    }

    const offset = (page - 1) * limit;
    const payments = await query.limit(limit).offset(offset);

    const totalCount = await db('payments')
      .where('user_id', userId)
      .modify((builder) => {
        if (status) builder.where('status', status);
      })
      .count('* as count')
      .first();

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalCount.count),
          pages: Math.ceil(totalCount.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ [PAYMENT] Get history error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to get payment history'
      }
    });
  }
};

/**
 * Verify payment with PayU
 * POST /api/v1/payments/:paymentId/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await db('payments')
      .where('id', paymentId)
      .first();

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    if (!payment.gateway_transaction_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_TRANSACTION_ID',
          message: 'No gateway transaction ID found'
        }
      });
    }

    // Verify with PayU
    const verificationResult = await payuService.verifyPayment(payment.gateway_transaction_id);

    return res.status(200).json({
      success: true,
      data: {
        paymentId,
        verificationResult
      }
    });

  } catch (error) {
    console.error('❌ [PAYMENT] Verify error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to verify payment'
      }
    });
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentForm,
  handleSuccessCallback,
  handleFailureCallback,
  getPaymentStatus,
  getPaymentHistory,
  verifyPayment
};
