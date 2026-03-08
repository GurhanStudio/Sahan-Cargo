import { useState } from 'react';
import API from '../../api/axios';
import { HiOutlineTruck, HiOutlineBadgeCheck } from 'react-icons/hi';

export default function ConfirmReceipt() {
  const [step, setStep] = useState('details'); // details, otp, done
  const [tracking, setTracking] = useState('');
  const [cargo, setCargo] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract tracking from URL if present
  useState(() => {
    const path = window.location.pathname;
    const match = path.match(/\/receiver\/confirm\/(SC-[\w-]+)/);
    if (match) {
      setTracking(match[1]);
      loadCargo(match[1]);
    }
  }, []);

  const loadCargo = async (tn) => {
    try {
      const res = await API.get(`/receiver/cargo/${tn || tracking}`);
      setCargo(res.data);
      setError('');
    } catch (err) { setError(err.response?.data?.message || 'Cargo not found'); }
  };

  const handleSearch = (e) => { e.preventDefault(); loadCargo(); };

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await API.post('/receiver/request-otp', { tracking_number: cargo.tracking_number });
      setStep('otp');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/receiver/verify-otp', { tracking_number: cargo.tracking_number, otp_code: otp });
      setStep('done');
    } catch (err) { setError(err.response?.data?.message || 'OTP verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-3">
            <HiOutlineTruck className="text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Confirm Receipt</h1>
          <p className="text-gray-500 text-sm">Sahan Cargo Tracking System</p>
        </div>

        {!cargo && step === 'details' && (
          <div className="card">
            <p className="text-gray-400 text-sm mb-4">Enter your cargo tracking number or scan the QR code:</p>
            {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleSearch} className="space-y-3">
              <input className="input-field" placeholder="Tracking Number (SC-...)" value={tracking} onChange={e => setTracking(e.target.value)} required />
              <button type="submit" className="btn-primary w-full">Find My Cargo</button>
            </form>
          </div>
        )}

        {cargo && step === 'details' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">📦 Cargo Details</h2>
              {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">{error}</div>}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Sender</span><span className="text-white">{cargo.sender_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Receiver</span><span className="text-white font-semibold">{cargo.receiver_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Description</span><span className="text-white">{cargo.description}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Destination</span><span className="text-white">{cargo.destinationOffice?.office_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span>
                  <span className="status-badge bg-amber-900/50 text-amber-300">{cargo.current_status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
            <button onClick={handleRequestOTP} disabled={loading || cargo.current_status !== 'RECEIVED_AT_DESTINATION_OFFICE'} className="btn-success w-full text-lg py-3 disabled:opacity-50">
              {loading ? 'Sending OTP...' : cargo.current_status === 'DELIVERED' ? '✅ Already Delivered' : cargo.current_status !== 'RECEIVED_AT_DESTINATION_OFFICE' ? '⏳ Not Ready for Pickup' : '📱 Confirm Receipt'}
            </button>
            {cargo.current_status !== 'RECEIVED_AT_DESTINATION_OFFICE' && cargo.current_status !== 'DELIVERED' && (
              <p className="text-center text-gray-500 text-xs">Your cargo has not reached the destination office yet.</p>
            )}
          </div>
        )}

        {step === 'otp' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-2">Enter OTP</h2>
            <p className="text-gray-400 text-sm mb-4">A verification code has been sent to your phone.</p>
            {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input className="input-field text-center text-2xl tracking-[0.5em] font-mono" maxLength="6" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} required />
              <button type="submit" disabled={loading} className="btn-success w-full text-lg py-3">
                {loading ? 'Verifying...' : '✅ Verify & Confirm'}
              </button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="card text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600/20 rounded-full mb-4">
              <HiOutlineBadgeCheck className="text-4xl text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Delivery Confirmed!</h2>
            <p className="text-gray-400">Your cargo has been successfully delivered. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
}
