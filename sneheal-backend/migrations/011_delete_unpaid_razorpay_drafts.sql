-- Remove unpaid Razorpay checkout drafts. Confirmed / paid orders are kept.
-- order_items and payments cascade on order delete.

DELETE FROM orders
 WHERE status = 'awaiting_payment';
