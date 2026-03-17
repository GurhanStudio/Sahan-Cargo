import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';
import API from '../../api/axios';
import toast from 'react-hot-toast';

// This page handles ONLY the LOADED_ON_AIRCRAFT checkpoint.
// The previous scan step (RECEIVED_AT_ORIGIN_AIRPORT) is on /airport/scan.

export default function LoadOnAircraft() {
  const [tracking, setTracking]   = useState('');
  const [cargo, setCargo]         = useState(null);
  const [condition, setCondition] = useState('GOOD');
  const [note, setNote]           = useState('');
  const [photo, setPhoto]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract once so it is a stable useEffect dependency.
  // Fires on fresh mount AND when QRDispatch navigates to this page
  // with a new ?tracking= param while the component is already mounted.
  const trackingFromUrl = searchParams.get('tracking');

  useEffect(() => {
    if (trackingFromUrl) {
      setTracking(trackingFromUrl);
      fetchCargo(trackingFromUrl);
    }
  }, [trackingFromUrl]);

  const fetchCargo = async (trackingNumber) => {
    setTracking(trackingNumber);
    try {
      const res = await API.get(`/cargo/track/${trackingNumber}`);
      setCargo(res.data);
      toast.success('Cargo found!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cargo not found');
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (tracking.trim()) fetchCargo(tracking.trim());
  };

  // Is cargo exactly at the status before our target?
  const isReady = () => cargo?.current_status === EXPECTED_CURRENT;

  // Already past this step?
  const alreadyLoaded = () => {
    const flow = [
      'REGISTERED', 'RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT',
      'ARRIVED_AT_DESTINATION_AIRPORT', 'RECEIVED_AT_DESTINATION_OFFICE', 'DELIVERED',
    ];
    const curr = flow.indexOf(cargo?.current_status);
    const tgt  = flow.indexOf(TARGET);
    return curr >= tgt;
  };

  const handleConfirm = async () => {
    if (!isReady()) {
      toast.error('Cargo is not ready to be loaded on aircraft.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('checkpoint_name', TARGET);
      fd.append('condition_status', condition);
      if (note)  fd.append('note', note);
      if (photo) fd.append('photo', photo);

      await API.post(`/checkpoint/${cargo.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Loaded on Aircraft confirmed! ✈️');
      resetScan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkpoint update failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setCargo(null);
    setTracking('');
    setCondition('GOOD');
    setNote('');
    setPhoto(null);
    // Clear ?tracking= from URL so the scanner/search UI shows cleanly.
    navigate({ search: '' }, { replace: true });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="page-title">🛫 Load on Aircraft</h1>

      {/* Scanner / Search — shown when no cargo loaded */}
      {!cargo && (
        <>
          <div className="card">
            <QRScanner onScan={fetchCargo} onError={(e) => toast.error(e)} />
          </div>
          <div className="card">
            <p className="text-sm text-gray-400 mb-3">Or enter tracking number manually:</p>
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <input
                className="input-field flex-1"
                placeholder="SC-20260308-XXXXXX"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>
        </>
      )}

      {/* Cargo found */}
      {cargo && (
        <div className="space-y-4">
          {/* Details card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Cargo Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Tracking:</span><p className="font-mono text-primary-400">{cargo.tracking_number}</p></div>
              <div><span className="text-gray-500">Status:</span><p className="text-amber-400">{cargo.current_status?.replace(/_/g, ' ')}</p></div>
              <div><span className="text-gray-500">Sender:</span><p className="text-white">{cargo.sender_name}</p></div>
              <div><span className="text-gray-500">Receiver:</span><p className="text-white">{cargo.receiver_name}</p></div>
              <div><span className="text-gray-500">From:</span><p>{cargo.originOffice?.office_name}</p></div>
              <div><span className="text-gray-500">To:</span><p>{cargo.destinationOffice?.office_name}</p></div>
              <div><span className="text-gray-500">Priority:</span>
                <p className={cargo.priority === 'HIGH_VALUE' ? 'text-red-400 font-semibold' : ''}>{cargo.priority}</p>
              </div>
              <div><span className="text-gray-500">Weight:</span><p>{cargo.weight} kg</p></div>
            </div>
          </div>

          {/* Already loaded / further along */}
          {alreadyLoaded() && (
            <div className="card text-center py-8">
              <p className="text-emerald-400 text-lg font-semibold mb-1">✅ Already loaded</p>
              <p className="text-gray-500 text-sm">
                Current status: <span className="text-white">{cargo.current_status?.replace(/_/g, ' ')}</span>
              </p>
            </div>
          )}

          {/* Confirm LOADED_ON_AIRCRAFT */}
          {isReady() && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">
                Confirm: <span className="text-indigo-400">LOADED ON AIRCRAFT</span>
              </h2>
              <div className="space-y-4">
                {/* Condition */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Condition</label>
                  <div className="flex gap-3">
                    {['GOOD', 'DAMAGED', 'DISPUTE'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCondition(c)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          condition === c
                            ? c === 'GOOD'    ? 'bg-emerald-600 text-white'
                            : c === 'DAMAGED' ? 'bg-red-600 text-white'
                            :                  'bg-amber-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {c === 'GOOD' ? '✅' : c === 'DAMAGED' ? '❌' : '⚠️'} {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo: required for HIGH_VALUE or if not GOOD */}
                {(condition !== 'GOOD' || cargo.priority === 'HIGH_VALUE') && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Photo {cargo.priority === 'HIGH_VALUE' && '(Required for HIGH_VALUE)'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      className="input-field"
                    />
                  </div>
                )}

                {/* Note: required if not GOOD */}
                {condition !== 'GOOD' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Note (Required)</label>
                    <textarea
                      className="input-field"
                      rows="2"
                      placeholder="Describe the issue..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="btn-primary w-full text-lg py-3"
                >
                  {loading ? 'Confirming...' : '🛫 Confirm Loaded on Aircraft'}
                </button>
              </div>
            </div>
          )}

          {/* Wrong stage */}
          {!isReady() && !alreadyLoaded() && (
            <div className="card text-center py-8">
              <p className="text-amber-400 text-lg font-semibold mb-1">⚠️ Not ready</p>
              <p className="text-gray-500 text-sm">
                Cargo is at <span className="text-white">{cargo.current_status?.replace(/_/g, ' ')}</span>.
                It must be <span className="text-primary-400">RECEIVED AT ORIGIN AIRPORT</span> first.
              </p>
            </div>
          )}

          <button onClick={resetScan} className="btn-secondary w-full">
            ← Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
