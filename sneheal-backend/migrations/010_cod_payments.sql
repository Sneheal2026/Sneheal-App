-- COD-only payments: allow null gateway ids and pending cash collection

ALTER TABLE payments
  MODIFY razorpay_order_id VARCHAR(40) NULL,
  MODIFY provider VARCHAR(20) NOT NULL DEFAULT 'cod',
  MODIFY status ENUM('created', 'authorized', 'captured', 'failed', 'refunded', 'pending')
    NOT NULL DEFAULT 'created';
