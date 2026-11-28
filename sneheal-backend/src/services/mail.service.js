const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const inr = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const mapsUrlFromCoords = (coords) => {
  const lat = Number(coords?.latitude);
  const lng = Number(coords?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return '';
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
};

const isConfigured = () =>
  Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL &&
      process.env.BREVO_OPS_EMAIL,
  );

const buildBodies = (order) => {
  const address = order.address || {};
  const mapsUrl = mapsUrlFromCoords(order.coords);
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

  const isDoctorCall = order.prescriptionMode === 'doctor_consultation';

  const text = [
    `New order ${order.publicId}`,
    isDoctorCall
      ? `🩺 DOCTOR CONSULTATION REQUESTED (Doctor call to customer needed before dispatch)`
      : order.prescriptionUrl
      ? `⚠️ PRESCRIPTION REQUIRED ORDER`
      : '',
    order.prescriptionUrl ? `Prescription image: ${order.prescriptionUrl}` : '',
    `Amount: ${inr(order.grandTotal)}`,
    `Payment: Cash on Delivery`,
    '',
    `Customer: ${address.receiverName || '-'}`,
    `Mobile: ${address.mobile || '-'}`,
    `Address: ${address.flatNumber || ''}, ${address.addressLine || ''}`,
    address.landmark ? `Landmark: ${address.landmark}` : '',
    mapsUrl ? `Go to location: ${mapsUrl}` : '',
    '',
    'Items:',
    itemLines || '(none)',
  ]
    .filter(Boolean)
    .join('\n');

  const rxHtml = isDoctorCall
    ? `<div style="background:#F0FDFA;border:1px solid #99F6E4;padding:12px;border-radius:8px;margin:12px 0;">
         <p style="color:#0F766E;font-weight:bold;margin:0 0 8px 0;">🩺 DOCTOR CONSULTATION REQUESTED (FREE)</p>
         <p style="margin:0;color:#115E59;">Customer does not have a paper prescription. Sneheal doctor must call customer at <strong>${escapeHtml(address.mobile || '-')}</strong> to review symptoms and prescribe medicines before dispatching.</p>
       </div>`
    : order.prescriptionUrl
    ? `<div style="background:#FEF2F2;border:1px solid #FCA5A5;padding:12px;border-radius:8px;margin:12px 0;">
         <p style="color:#DC2626;font-weight:bold;margin:0 0 8px 0;">⚠️ PRESCRIPTION REQUIRED ORDER (Pharmacist review needed)</p>
         <p style="margin:0 0 8px 0;"><strong>Attached Prescription:</strong> <a href="${escapeHtml(order.prescriptionUrl)}" target="_blank">Open Full Image</a></p>
         <img src="${escapeHtml(order.prescriptionUrl)}" alt="Prescription" style="max-width:280px;height:auto;border-radius:6px;border:1px solid #E5E7EB;display:block;" />
       </div>`
    : '';

  const html = `
    <h2>New order ${escapeHtml(order.publicId)}</h2>
    ${rxHtml}
    <p><strong>Amount:</strong> ${inr(order.grandTotal)}<br/>
    <strong>Payment:</strong> Cash on Delivery</p>
    <p><strong>Customer:</strong> ${escapeHtml(address.receiverName)}<br/>
    <strong>Mobile:</strong> ${escapeHtml(address.mobile)}<br/>
    <strong>Address:</strong> ${escapeHtml(address.flatNumber)}, ${escapeHtml(address.addressLine)}
    ${address.landmark ? `<br/><strong>Landmark:</strong> ${escapeHtml(address.landmark)}` : ''}
    ${mapsUrl ? `<br/><strong>Go to location:</strong> <a href="${escapeHtml(mapsUrl)}">Open in Google Maps</a>` : ''}</p>
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
      subject: `${order.prescriptionMode === 'doctor_consultation' ? '🩺 [DOCTOR CALL NEEDED] ' : order.prescriptionUrl ? '⚠️ [Rx REQUIRED] ' : ''}New Sneheal order ${order.publicId}`,
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
