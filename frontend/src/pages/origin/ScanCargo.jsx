import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRScanner from '../../components/QRScanner';
import API from '../../api/axios';
import toast from 'react-hot-toast';

// Maps each role to the single checkpoint it is responsible for confirming.
// AIRPORT_CARGO handles RECEIVED_AT_ORIGIN_AIRPORT here — that's it.
// Loading onto aircraft (LOADED_ON_AIRCRAFT) is handled exclusively by /airport/load-aircraft.
const ROLE_CHECKPOINT = {
  AIRPORT_CARGO:       'RECEIVED_AT_ORIGIN_AIRPORT',
  DESTINATION_AIRPORT: 'ARRIVED_AT_DESTINATION_AIRPORT',
  DESTINATION_OFFICE:  'RECEIVED_AT_DESTINATION_OFFICE',
};

const ROLE_TITLE = {
  AIRPORT_CARGO:       '✈️ Airport Cargo Scan',
  DESTINATION_AIRPORT: '🛬 Confirm Arrival',
  DESTINATION_OFFICE:  '📬 Destination Office Scan',
};

export default function ScanCargo({ role }) {
  const [tracking, setTracking] = useState('');
  const [cargo, setCargo] = useState(null);
  const [condition, setCondition] = useState('GOOD');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract once so it can be a useEffect dependency.
  // This ensures auto-load fires on fresh mount AND when the same
  // component receives a new ?tracking= param (e.g. QRDispatch navigating
  // to the page while ScanCargo is already mounted).
  const trackingFromUrl = searchParams.get('tracking');

  const targetCheckpoint = ROLE_CHECKPOINT[role];

  useEffect(() => {
    if (trackingFromUrl) {
      setTracking(trackingFromUrl);
      handleScan(trackingFromUrl);
    }
  }, [trackingFromUrl]); // re-run whenever the URL param changes

  const handleScan = async (trackingNumber) => {
    setTracking(trackingNumber);
    try {
      const res = await API.get(`/cargo/track/${trackingNumber}`);
      setCargo(res.data);
      toast.success('Cargo found!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cargo not found');
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (tracking) handleScan(tracking);
  };

  const isReadyForCheckpoint = () => {
    if (!cargo || !targetCheckpoint) return false;
    const statusFlow = [
      'REGISTERED', 'RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT',
      'ARRIVED_AT_DESTINATION_AIRPORT', 'RECEIVED_AT_DESTINATION_OFFICE', 'DELIVERED',
    ];
    const currentIdx = statusFlow.indexOf(cargo.current_status);
    const targetIdx  = statusFlow.indexOf(targetCheckpoint);
    return currentIdx === targetIdx - 1;
  };

  const alreadyProcessed = () => {
    if (!cargo || !targetCheckpoint) return false;
    const statusFlow = [
      'REGISTERED', 'RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT',
      'ARRIVED_AT_DESTINATION_AIRPORT', 'RECEIVED_AT_DESTINATION_OFFICE', 'DELIVERED',
    ];
    const currentIdx = statusFlow.indexOf(cargo.current_status);
    const targetIdx  = statusFlow.indexOf(targetCheckpoint);
    return currentIdx >= targetIdx;
  };

  const handleConfirm = async () => {
    if (!isReadyForCheckpoint()) {
      toast.error('Cargo is not at the correct stage for this checkpoint.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('checkpoint_name', targetCheckpoint);
      fd.append('condition_status', condition);
      if (note)  fd.append('note', note);
      if (photo) fd.append('photo', photo);

      await API.post(`/checkpoint/${cargo.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${targetCheckpoint.replace(/_/g, ' ')} confirmed!`);
      setCargo(null);
      setTracking('');
      setCondition('GOOD');
      setNote('');
      setPhoto(null);
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
    // Clear ?tracking= from the URL so it doesn't re-trigger auto-load
    // when the user wants to scan a different cargo manually.
    navigate({ search: '' }, { replace: true });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="page-title">{ROLE_TITLE[role] || '📷 Scan Cargo'}</h1>

      {/* Scan / Search — only show when no cargo loaded */}
      {!cargo && (
        <>
          <div className="card">
            <QRScanner onScan={handleScan} onError={(e) => toast.error(e)} />
          </div>
          <div className="card">
            <p className="text-sm text-gray-400 mb-3">Or enter tracking number manually:</p>
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <input
                className="input-field flex-1"
                placeholder="SC-20260308-XXXXXX"
                value={tracking}
                onChange={e => setTracking(e.target.value)}
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>
        </>
      )}

      {/* Cargo found */}
      {cargo && (
        <div className="space-y-4">
          {/* Cargo summary */}
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

          {/* Already past this checkpoint */}
          {alreadyProcessed() && (
            <div className="card text-center py-8">
              <p className="text-emerald-400 text-lg font-semibold mb-1">✅ Already processed</p>
              <p className="text-gray-500 text-sm">
                Current status: <span className="text-white">{cargo.current_status?.replace(/_/g, ' ')}</span>
              </p>
            </div>
          )}

          {/* Confirm checkpoint form */}
          {isReadyForCheckpoint() && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">
                Confirm: <span className="text-primary-400">{targetCheckpoint?.replace(/_/g, ' ')}</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Condition</label>
                  <div className="flex gap-3">
                    {['GOOD', 'DAMAGED', 'DISPUTE'].map(c => (
                      <button key={c} type="button" onClick={() => setCondition(c)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          condition === c
                            ? c === 'GOOD' ? 'bg-emerald-600 text-white'
                              : c === 'DAMAGED' ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}>
                        {c === 'GOOD' ? '✅' : c === 'DAMAGED' ? '❌' : '⚠️'} {c}
                      </button>
                    ))}
                  </div>
                </div>

                {(condition !== 'GOOD' || cargo.priority === 'HIGH_VALUE') && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Photo {cargo.priority === 'HIGH_VALUE' && '(Required for HIGH_VALUE)'}
                    </label>
                    <input
                      type="file" accept="image/*" capture="environment"
                      onChange={e => setPhoto(e.target.files[0])}
                      className="input-field"
                    />
                  </div>
                )}

                {condition !== 'GOOD' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Note (Required)</label>
                    <textarea
                      className="input-field" rows="2"
                      placeholder="Describe the issue..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                )}

                <button onClick={handleConfirm} disabled={loading} className="btn-success w-full text-lg py-3">
                  {loading ? 'Confirming...' : '✅ Confirm Checkpoint'}
                </button>
              </div>
            </div>
          )}

          {/* Wrong stage for this role */}
          {!isReadyForCheckpoint() && !alreadyProcessed() && (
            <div className="card text-center py-8">
              <p className="text-amber-400 text-lg font-semibold mb-1">⚠️ Wrong stage</p>
              <p className="text-gray-500 text-sm">
                This cargo is at <span className="text-white">{cargo.current_status?.replace(/_/g, ' ')}</span>.
                This page handles <span className="text-primary-400">{targetCheckpoint?.replace(/_/g, ' ')}</span>.
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
