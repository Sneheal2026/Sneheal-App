const Razorpay = require('razorpay');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

let client = null;

const getClient = () => {
  if (client) return client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new AppError(503, 'Payment gateway is not configured');
  }

  client = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return client;
};

const getKeyId = () => process.env.RAZORPAY_KEY_ID;

const createRazorpayOrder = async ({ amountPaise, receipt, notes }) => {
  const order = await getClient().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: String(receipt).slice(0, 40),
    notes: notes || {},
  });
  return order;
};

const fetchPayment = async (paymentId) => {
  return getClient().payments.fetch(paymentId);
};

const verifyCheckoutSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpaySignature || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError(400, 'Invalid payment signature');
  }
};

const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError(503, 'Webhook secret is not configured');
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError(400, 'Invalid webhook signature');
  }
};

module.exports = {
  getKeyId,
  createRazorpayOrder,
  fetchPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};
