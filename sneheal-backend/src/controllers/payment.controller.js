const crypto = require('crypto');
const orderService = require('../services/order.service');
const razorpayService = require('../services/razorpay.service');
const { success } = require('../utils/response');

const verifyPayment = async (req, res) => {
  const data = await orderService.verifyPayment(req.user.sub, req.body);
  return success(res, 'Payment verified successfully', data);
};

const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  razorpayService.verifyWebhookSignature(rawBody, signature);

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
  }

  const eventId =
    req.headers['x-razorpay-event-id'] ||
    payload.id ||
    crypto.createHash('sha256').update(rawBody).digest('hex');

  await orderService.handleWebhook({
    eventId: String(eventId),
    event: payload.event,
    payload,
  });

  return success(res, 'Webhook processed');
};

module.exports = {
  verifyPayment,
  handleWebhook,
};
