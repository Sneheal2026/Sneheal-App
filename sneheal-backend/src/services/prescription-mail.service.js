const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const userRepo = require('../repositories/user.repository');
const addressRepo = require('../repositories/address.repository');

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isConfigured = () =>
  Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_FROM_EMAIL &&
      process.env.BREVO_OPS_EMAIL,
  );

/**
 * Send the scanned prescription image + user details to the ops inbox.
 * Runs in the background — caller must .catch() so scan never fails.
 */
const notifyOpsPrescriptionScan = async ({ userId, buffer, mimetype }) => {
  if (!isConfigured()) {
    console.warn('[mail] Brevo skipped (prescription scan): set BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_OPS_EMAIL');
    return;
  }

  const [user, addresses] = await Promise.all([
    userRepo.findById(userId),
    addressRepo.findByUserId(userId),
  ]);

  const address = addresses[0] || null;
  const username = user?.username || 'Unknown';
  const phone = user?.phone || 'N/A';
  const scannedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const fileName = mimetype?.includes('png') ? 'prescription.png' : 'prescription.jpg';

  const text = [
    'New Prescription Scan',
    '',
    `User: ${username}`,
    `Phone: ${phone}`,
    `User ID: ${userId}`,
    '',
    address ? `Receiver: ${address.receiverName || '-'}` : '',
    address ? `Mobile: ${address.mobile || '-'}` : '',
    address ? `Address: ${address.flatNumber || ''}, ${address.addressLine || ''}` : '',
    address?.landmark ? `Landmark: ${address.landmark}` : '',
    '',
    `Scanned at: ${scannedAt}`,
    '',
    'Prescription image is attached.',
  ]
    .filter(Boolean)
    .join('\n');

  const addressHtml = address
    ? `<tr>
         <td style="padding:8px;font-weight:bold;vertical-align:top;">Address</td>
         <td style="padding:8px;">
           ${escapeHtml(address.receiverName || '-')}<br/>
           ${escapeHtml(address.mobile || '-')}<br/>
           ${escapeHtml(address.flatNumber || '')}, ${escapeHtml(address.addressLine || '')}
           ${address.landmark ? `<br/>Landmark: ${escapeHtml(address.landmark)}` : ''}
         </td>
       </tr>`
    : '';

  const html = `
    <h2>New Prescription Scan</h2>
    <table style="border-collapse:collapse;width:100%;max-width:520px;">
      <tr>
        <td style="padding:8px;font-weight:bold;">User</td>
        <td style="padding:8px;">${escapeHtml(username)}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:bold;">Phone</td>
        <td style="padding:8px;">${escapeHtml(phone)}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:bold;">User ID</td>
        <td style="padding:8px;">${userId}</td>
      </tr>
      ${addressHtml}
      <tr>
        <td style="padding:8px;font-weight:bold;">Scanned at</td>
        <td style="padding:8px;">${escapeHtml(scannedAt)}</td>
      </tr>
    </table>
    <p><em>Prescription image is attached.</em></p>
  `;

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_FROM_NAME || 'Sneheal Prescriptions',
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: process.env.BREVO_OPS_EMAIL }],
      subject: `Prescription Scan — ${username} (${phone})`,
      htmlContent: html,
      textContent: text,
      attachment: [
        {
          content: buffer.toString('base64'),
          name: fileName,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo ${response.status}: ${body.slice(0, 300)}`);
  }
};

module.exports = { notifyOpsPrescriptionScan };
