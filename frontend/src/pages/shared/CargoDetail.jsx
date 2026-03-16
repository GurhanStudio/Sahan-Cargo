import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_COLORS = {
    REGISTERED: 'bg-gray-700 text-gray-300',
    RECEIVED_AT_ORIGIN_AIRPORT: 'bg-blue-900/50 text-blue-300',
    LOADED_ON_AIRCRAFT: 'bg-indigo-900/50 text-indigo-300',
    ARRIVED_AT_DESTINATION_AIRPORT: 'bg-purple-900/50 text-purple-300',
    RECEIVED_AT_DESTINATION_OFFICE: 'bg-amber-900/50 text-amber-300',
    DELIVERED: 'bg-emerald-900/50 text-emerald-300',
};

const CHECKPOINT_ICONS = {
    REGISTERED: '📋',
    RECEIVED_AT_ORIGIN_AIRPORT: '✈️',
    LOADED_ON_AIRCRAFT: '🛫',
    ARRIVED_AT_DESTINATION_AIRPORT: '🛬',
    RECEIVED_AT_DESTINATION_OFFICE: '🏢',
    DELIVERED: '✅',
};

function Row({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex justify-between items-start py-2.5 border-b border-gray-800/60 last:border-0">
            <span className="text-gray-500 text-sm flex-shrink-0 w-40">{label}</span>
            <span className="text-white text-sm text-right">{value}</span>
        </div>
    );
}

export default function CargoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cargo, setCargo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        API.get(`/cargo/${id}`)
            .then(r => setCargo(r.data))
            .catch(() => setError('Failed to load cargo details.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
        </div>
    );
    if (error) return <div className="card text-red-400 text-center py-10">{error}</div>;
    if (!cargo) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
                    <HiOutlineArrowLeft /> Back
                </button>
                <div>
                    <h1 className="page-title mb-0">Cargo Detail</h1>
                    <p className="font-mono text-primary-400 text-sm">{cargo.tracking_number}</p>
                </div>
                <span className={`ml-auto status-badge text-sm px-3 py-1 ${STATUS_COLORS[cargo.current_status] || 'bg-gray-700 text-gray-300'}`}>
                    {cargo.current_status?.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Cargo Info */}
                    <div className="card">
                        <h2 className="font-semibold text-white mb-4 text-base">📦 Cargo Information</h2>
                        <Row label="Tracking Number" value={<span className="font-mono text-primary-400">{cargo.tracking_number}</span>} />
                        <Row label="Description" value={cargo.description} />
                        <Row label="Weight" value={`${cargo.weight} kg`} />
                        <Row label="Priority" value={
                            <span className={`status-badge ${cargo.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : cargo.priority === 'FRAGILE' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-700 text-gray-400'}`}>
                                {cargo.priority}
                            </span>
                        } />
                        <Row label="Registered By" value={cargo.creator?.name} />
                        <Row label="Registered On" value={new Date(cargo.created_at).toLocaleString()} />
                        {cargo.delivered_at && <Row label="Delivered At" value={new Date(cargo.delivered_at).toLocaleString()} />}
                    </div>

                    {/* Sender & Receiver */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="card">
                            <h2 className="font-semibold text-white mb-4 text-base">👤 Sender</h2>
                            <Row label="Name" value={cargo.sender_name} />
                            <Row label="Phone" value={cargo.sender_phone} />
                            <Row label="Origin Office" value={cargo.originOffice?.office_name} />
                        </div>
                        <div className="card">
                            <h2 className="font-semibold text-white mb-4 text-base">📬 Receiver</h2>
                            <Row label="Name" value={cargo.receiver_name} />
                            <Row label="Phone" value={cargo.receiver_phone} />
                            <Row label="Destination Office" value={cargo.destinationOffice?.office_name} />
                        </div>
                    </div>

                    {/* Checkpoint Timeline */}
                    <div className="card">
                        <h2 className="font-semibold text-white mb-6 text-base">🗓️ Journey Timeline</h2>
                        {cargo.checkpoints?.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No checkpoints recorded yet.</p>
                        )}
                        <div className="relative">
                            {/* Vertical line */}
                            {cargo.checkpoints?.length > 1 && (
                                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-700"></div>
                            )}
                            <div className="space-y-4">
                                {cargo.checkpoints?.map((cp, i) => (
                                    <div key={cp.id} className="relative flex gap-4">
                                        {/* Dot */}
                                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${cp.condition_status === 'DAMAGED' ? 'bg-red-900/50 border border-red-700' :
                                                cp.condition_status === 'DISPUTE' ? 'bg-yellow-900/50 border border-yellow-700' :
                                                    'bg-gray-800 border border-gray-700'}`}>
                                            {CHECKPOINT_ICONS[cp.checkpoint_name] || '📍'}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <p className="text-white font-medium text-sm">
                                                    {cp.checkpoint_name?.replace(/_/g, ' ')}
                                                </p>
                                                <span className={`status-badge text-xs ${cp.condition_status === 'DAMAGED' ? 'bg-red-900/50 text-red-300' : cp.condition_status === 'DISPUTE' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                                                    {cp.condition_status}
                                                </span>
                                            </div>
                                            {cp.checkedBy && (
                                                <p className="text-gray-400 text-xs mt-1">By: {cp.checkedBy.name} ({cp.checkedBy.role?.replace(/_/g, ' ')})</p>
                                            )}
                                            <p className="text-gray-500 text-xs mt-1">{new Date(cp.checked_at).toLocaleString()}</p>
                                            {cp.note && <p className="text-gray-300 text-xs mt-2 italic">"{cp.note}"</p>}
                                            {cp.photo_url && (
                                                <a href={`${API_BASE}${cp.photo_url}`} target="_blank" rel="noopener noreferrer">
                                                    <img src={`${API_BASE}${cp.photo_url}`} alt="Checkpoint photo" className="mt-2 rounded-lg max-h-32 object-cover border border-gray-700 hover:opacity-90 transition-opacity" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — Images */}
                <div className="space-y-6">
                    {/* Cargo Photo */}
                    <div className="card">
                        <h2 className="font-semibold text-white mb-4 text-base">📷 Cargo Photo</h2>
                        {cargo.photo_url ? (
                            <a href={`${API_BASE}${cargo.photo_url}`} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={`${API_BASE}${cargo.photo_url}`}
                                    alt="Cargo"
                                    className="w-full rounded-xl object-cover max-h-64 border border-gray-700 hover:opacity-90 transition-opacity cursor-pointer"
                                />
                            </a>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 bg-gray-800/40 rounded-xl border border-gray-700/50">
                                <span className="text-3xl mb-2">📦</span>
                                <p className="text-gray-500 text-sm">No photo available</p>
                            </div>
                        )}
                    </div>

                    {/* QR Code */}
                    <div className="card">
                        <h2 className="font-semibold text-white mb-4 text-base">📱 QR Code</h2>
                        {cargo.qr_code_url ? (
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={`${API_BASE}${cargo.qr_code_url}`}
                                    alt="QR Code"
                                    className="w-full max-w-[200px] rounded-xl bg-white p-2"
                                />
                                <a
                                    href={`${API_BASE}${cargo.qr_code_url}`}
                                    download
                                    className="btn-secondary text-sm w-full text-center"
                                >
                                    📥 Download QR
                                </a>
                                <a
                                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5173'}/receiver/confirm/${cargo.tracking_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary text-sm w-full text-center"
                                >
                                    🔗 Open Receiver Link
                                </a>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 bg-gray-800/40 rounded-xl border border-gray-700/50">
                                <p className="text-gray-500 text-sm">No QR code</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
