/**
 * Mock OTP Service
 * In production, replace with Twilio or another SMS provider.
 */

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to receiver phone (mock)
 * @param {string} phone
 * @param {string} otp
 */
async function sendOTP(phone, otp) {
  console.log('═══════════════════════════════════════');
  console.log('📱 MOCK OTP SERVICE');
  console.log(`   Phone: ${phone}`);
  console.log(`   OTP Code: ${otp}`);
  console.log('═══════════════════════════════════════');
  return true;
}

module.exports = { generateOTP, sendOTP };
