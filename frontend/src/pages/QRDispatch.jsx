import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

/**
 * QRDispatch — public page that reads a cargo's current status
 * and redirects the scanner to the correct next workflow step.
 *
 * Status → Next Route mapping:
 *   REGISTERED                    → /airport/scan          (AIRPORT_CARGO confirms RECEIVED_AT_ORIGIN_AIRPORT)
 *   RECEIVED_AT_ORIGIN_AIRPORT    → /airport/load-aircraft  (AIRPORT_CARGO confirms LOADED_ON_AIRCRAFT)
 *   LOADED_ON_AIRCRAFT            → /dest-airport/scan      (DESTINATION_AIRPORT confirms ARRIVED_AT_DESTINATION_AIRPORT)
 *   ARRIVED_AT_DESTINATION_AIRPORT→ /dest-office/scan       (DESTINATION_OFFICE confirms RECEIVED_AT_DESTINATION_OFFICE)
 *   RECEIVED_AT_DESTINATION_OFFICE→ /receiver/confirm/:trackingNumber  (Public receiver confirmation)
 *   DELIVERED                     → show "Delivered" message
 */

const STATUS_NEXT_ROUTE = {
  REGISTERED:                       '/airport/scan',
  RECEIVED_AT_ORIGIN_AIRPORT:       '/airport/load-aircraft',
  LOADED_ON_AIRCRAFT:               '/dest-airport/scan',
  ARRIVED_AT_DESTINATION_AIRPORT:   '/dest-office/scan',
};

export default function QRDispatch() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cargo, setCargo] = useState(null);

  useEffect(() => {
    if (!trackingNumber) { setError('No tracking number provided.'); return; }

    API.get(`/cargo/track/${trackingNumber}`)
      .then(res => {
        const { current_status, tracking_number } = res.data;
        setCargo(res.data);

        if (current_status === 'RECEIVED_AT_DESTINATION_OFFICE') {
          // Final stage — go to receiver confirmation (public page)
          navigate(`/receiver/confirm/${tracking_number}`, { replace: true });
          return;
        }

        if (current_status === 'DELIVERED') {
          // Workflow complete — stay on this page and show delivered status
          return;
        }

        const nextRoute = STATUS_NEXT_ROUTE[current_status];
        if (nextRoute) {
          navigate(nextRoute, { replace: true });
        } else {
          setError(`Unknown cargo status: ${current_status}`);
        }
      })
      .catch(() => {
        setError(`Cargo not found: ${trackingNumber}`);
      });
  }, [trackingNumber]);

  // Loading state
  if (!error && !cargo) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        <p className="text-gray-400 text-sm">Loading cargo status…</p>
      </div>
    );
  }

  // Delivered — show final state
  if (cargo?.current_status === 'DELIVERED') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="card max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-white">Delivered</h1>
          <p className="text-gray-400">
            Cargo <span className="font-mono text-primary-400">{cargo.tracking_number}</span> has been successfully delivered.
          </p>
          <p className="text-gray-500 text-sm">
            This cargo has completed its journey.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="card max-w-sm w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">Unable to process QR</h1>
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-gray-500 text-xs mt-2">Please contact your office or try scanning again.</p>
      </div>
    </div>
  );
}
