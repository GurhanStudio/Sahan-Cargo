const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generate QR code image for a cargo tracking number
 * @param {string} trackingNumber
 * @param {string} baseUrl - the base URL for receiver confirmation
 * @returns {Promise<string>} - relative path to saved QR image
 */
async function generateQRCode(trackingNumber, baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'qrcodes');

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const url = `${baseUrl}/receiver/confirm/${trackingNumber}`;
  const filename = `qr_${trackingNumber}.png`;
  const filepath = path.join(uploadsDir, filename);

  await QRCode.toFile(filepath, url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  return `/uploads/qrcodes/${filename}`;
}

module.exports = { generateQRCode };
