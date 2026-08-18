const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const inr = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const isConfigured = () =>
  Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL &&
      process.env.BREVO_OPS_EMAIL,
  );

const buildBodies = (order) => {
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const itemLines = items
    .map(
      (item) =>
        `${item.quantity} × ${item.name} (${item.unit || '-'}) — ${inr(item.lineTotal)}`,
    )
    .join('\n');
  const itemRows = items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)} <small>${escapeHtml(item.unit)}</small></td><td>${item.quantity}</td><td>${inr(item.lineTotal)}</td></tr>`,
    )
    .join('');

  const text = [
    `New paid order ${order.publicId}`,
    `Amount: ${inr(order.grandTotal)}`,
    `Payment: ${order.payment?.method || 'paid'}`,
    '',
    `Customer: ${address.receiverName || '-'}`,
    `Mobile: ${address.mobile || '-'}`,
    `Address: ${address.flatNumber || ''}, ${address.addressLine || ''}`,
    address.landmark ? `Landmark: ${address.landmark}` : '',
    '',
    'Items:',
    itemLines || '(none)',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <h2>New paid order ${escapeHtml(order.publicId)}</h2>
    <p><strong>Amount:</strong> ${inr(order.grandTotal)}<br/>
    <strong>Payment:</strong> ${escapeHtml(order.payment?.method || 'paid')}</p>
    <p><strong>Customer:</strong> ${escapeHtml(address.receiverName)}<br/>
    <strong>Mobile:</strong> ${escapeHtml(address.mobile)}<br/>
    <strong>Address:</strong> ${escapeHtml(address.flatNumber)}, ${escapeHtml(address.addressLine)}
    ${address.landmark ? `<br/><strong>Landmark:</strong> ${escapeHtml(address.landmark)}` : ''}</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
      ${itemRows}
    </table>
  `;

  return { text, html };
};

const notifyOpsNewOrder = async (order) => {
  if (!isConfigured()) {
    console.warn('[mail] Brevo skipped: set BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_OPS_EMAIL');
    return;
  }

  const { text, html } = buildBodies(order);
  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_FROM_NAME || 'Sneheal Orders',
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: process.env.BREVO_OPS_EMAIL }],
      subject: `New Sneheal order ${order.publicId}`,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo ${response.status}: ${body.slice(0, 300)}`);
  }
};

module.exports = { notifyOpsNewOrder };
