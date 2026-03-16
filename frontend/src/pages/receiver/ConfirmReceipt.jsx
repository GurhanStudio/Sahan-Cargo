import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineTruck, HiOutlineBadgeCheck } from 'react-icons/hi';

export default function ConfirmReceipt() {
  const { trackingNumber: urlTracking } = useParams();

  const [step, setStep] = useState('details'); // details, otp, done
  const [tracking, setTracking] = useState(urlTracking || '');
  const [cargo, setCargo] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  // Auto-load cargo when QR code URL includes tracking number
  useEffect(() => {
    if (urlTracking) {
      loadCargo(urlTracking);
    }
  }, [urlTracking]);

  const loadCargo = async (tn) => {
    setError('');
    try {
      const res = await API.get(`/receiver/cargo/${tn || tracking}`);
      setCargo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Cargo not found. Please check your tracking number.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCargo(tracking);
  };

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/receiver/request-otp', {
        tracking_number: cargo.tracking_number
      });
      setPhone(res.data.phone || '');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/receiver/verify-otp', {
        tracking_number: cargo.tracking_number,
        otp_code: otp
      });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isReady = cargo?.current_status === 'RECEIVED_AT_DESTINATION_OFFICE';
  const isDelivered = cargo?.current_status === 'DELIVERED';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mb-3 shadow-lg shadow-emerald-600/20">
            <HiOutlineTruck className="text-2xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Confirm Receipt</h1>
          <p className="text-gray-500 text-sm">Sahan Cargo Tracking System</p>
        </div>

        {/* STEP 1 — No cargo yet: show search form */}
        {!cargo && step === 'details' && (
          <div className="card">
            <p className="text-gray-400 text-sm mb-4">
              Enter your cargo tracking number to confirm receipt:
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSearch} className="space-y-3">
              <input
                className="input-field"
                placeholder="Tracking Number (SC-...)"
                value={tracking}
                onChange={e => setTracking(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary w-full">
                🔍 Find My Cargo
              </button>
            </form>
          </div>
        )}

        {/* STEP 1 — Cargo found: show details + Confirm button */}
        {cargo && step === 'details' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">📦 Cargo Details</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-3 text-sm divide-y divide-gray-800">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Tracking #</span>
                  <span className="font-mono text-primary-400">{cargo.tracking_number}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Sender</span>
                  <span className="text-white">{cargo.sender_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Receiver</span>
                  <span className="text-white font-semibold">{cargo.receiver_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Description</span>
                  <span className="text-white text-right max-w-[200px]">{cargo.description}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Destination</span>
                  <span className="text-white">{cargo.destinationOffice?.office_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  <span className={`status-badge ${
                    isDelivered ? 'bg-emerald-900/50 text-emerald-300' :
                    isReady ? 'bg-amber-900/50 text-amber-300' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {cargo.current_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status-aware action button */}
            {isDelivered ? (
              <div className="card text-center py-4 border-emerald-800 bg-emerald-900/20">
                <p className="text-emerald-400 font-semibold">✅ This cargo has already been delivered.</p>
              </div>
            ) : isReady ? (
              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="btn-success w-full text-lg py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Sending OTP...
                  </span>
                ) : '📱 Confirm Receipt (Send OTP)'}
              </button>
            ) : (
              <div className="card text-center py-4">
                <p className="text-amber-400 font-semibold">⏳ Cargo not yet at destination office</p>
                <p className="text-gray-500 text-sm mt-1">
                  Current status: <span className="text-white">{cargo.current_status?.replace(/_/g, ' ')}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => { setCargo(null); setError(''); }}
              className="btn-secondary w-full text-sm"
            >
              ← Search Again
            </button>
          </div>
        )}

        {/* STEP 2 — Enter OTP */}
        {step === 'otp' && (
          <div className="card">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600/20 rounded-full mb-2">
                <span className="text-2xl">📱</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Enter OTP Code</h2>
              <p className="text-gray-400 text-sm mt-1">
                A 6-digit code was sent to{' '}
                <span className="text-white font-medium">{phone || cargo?.receiver_phone}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">Valid for 10 minutes</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                className="input-field text-center text-3xl tracking-[0.6em] font-mono"
                maxLength="6"
                pattern="\d{6}"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-success w-full text-lg py-3 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </span>
                ) : '✅ Verify & Confirm Delivery'}
              </button>
            </form>

            <button
              onClick={() => { setStep('details'); setOtp(''); setError(''); }}
              className="btn-secondary w-full text-sm mt-3"
            >
              ← Back
            </button>
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === 'done' && (
          <div className="card text-center py-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600/20 rounded-full mb-4">
              <HiOutlineBadgeCheck className="text-5xl text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Delivery Confirmed!</h2>
            <p className="text-gray-400 mb-1">
              Cargo <span className="font-mono text-white">{cargo?.tracking_number}</span>
            </p>
            <p className="text-gray-500 text-sm">has been successfully delivered to <span className="text-white">{cargo?.receiver_name}</span>.</p>
            <p className="text-gray-500 text-xs mt-4">Thank you for using Sahan Cargo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
