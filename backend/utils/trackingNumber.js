const crypto = require('crypto');

/**
 * Generate a unique tracking number
 * Format: SC-YYYYMMDD-XXXXXX (e.g., SC-20260308-A3F8B1)
 */
function generateTrackingNumber() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SC-${dateStr}-${random}`;
}

module.exports = { generateTrackingNumber };
