import { useState } from 'react';
import API from '../../api/axios';

export default function CargoTrack() {
  const [tracking, setTracking] = useState('');
  const [cargo, setCargo] = useState(null);
  const [error, setError] = useState('');

  const statusFlow = [
    'REGISTERED', 'RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT',
    'ARRIVED_AT_DESTINATION_AIRPORT', 'RECEIVED_AT_DESTINATION_OFFICE', 'DELIVERED'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setCargo(null);
    try {
      const res = await API.get(`/cargo/track/${tracking}`);
      setCargo(res.data);
    } catch (err) { setError(err.response?.data?.message || 'Cargo not found'); }
  };

  const getStepStatus = (step) => {
    if (!cargo) return 'pending';
    const checkpoints = cargo.checkpoints || [];
    const done = checkpoints.find(c => c.checkpoint_name === step);
    if (done) return 'done';
    if (statusFlow.indexOf(step) === statusFlow.indexOf(cargo.current_status) + 1) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="page-title">Track Cargo</h1>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input className="input-field flex-1" placeholder="Enter Tracking Number (SC-...)" value={tracking} onChange={e => setTracking(e.target.value)} required />
          <button type="submit" className="btn-primary">Track</button>
        </form>
      </div>

      {error && <div className="card border-red-800 bg-red-900/20 text-red-300">{error}</div>}

      {cargo && (
        <>
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Cargo Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Tracking:</span><p className="font-mono text-primary-400 font-bold">{cargo.tracking_number}</p></div>
              <div><span className="text-gray-500">Status:</span><p className="text-amber-400 font-semibold">{cargo.current_status?.replace(/_/g, ' ')}</p></div>
              <div><span className="text-gray-500">Sender:</span><p>{cargo.sender_name}</p></div>
              <div><span className="text-gray-500">Receiver:</span><p>{cargo.receiver_name}</p></div>
              <div><span className="text-gray-500">From:</span><p>{cargo.originOffice?.office_name}</p></div>
              <div><span className="text-gray-500">To:</span><p>{cargo.destinationOffice?.office_name}</p></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-6">Tracking Timeline</h2>
            <div className="space-y-0">
              {statusFlow.map((step, i) => {
                const s = getStepStatus(step);
                const checkpoint = cargo.checkpoints?.find(c => c.checkpoint_name === step);
                return (
                  <div key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        s === 'done' ? 'bg-emerald-500 border-emerald-500' :
                        s === 'current' ? 'bg-primary-500 border-primary-500 animate-pulse' :
                        'bg-gray-800 border-gray-600'
                      }`}></div>
                      {i < statusFlow.length - 1 && (
                        <div className={`w-0.5 h-12 ${s === 'done' ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`font-medium text-sm ${s === 'done' ? 'text-emerald-400' : s === 'current' ? 'text-primary-400' : 'text-gray-600'}`}>
                        {step.replace(/_/g, ' ')}
                      </p>
                      {checkpoint && (
                        <div className="mt-1 text-xs text-gray-500">
                          <p>{new Date(checkpoint.checked_at).toLocaleString()}</p>
                          {checkpoint.checkedBy && <p>By: {checkpoint.checkedBy.name}</p>}
                          {checkpoint.condition_status !== 'GOOD' && (
                            <p className="text-red-400">⚠️ {checkpoint.condition_status} {checkpoint.note && `- ${checkpoint.note}`}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
