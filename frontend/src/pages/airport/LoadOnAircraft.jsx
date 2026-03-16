import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineRefresh, HiOutlinePaperAirplane, HiOutlineExclamation } from 'react-icons/hi';

export default function LoadOnAircraft() {
    const navigate = useNavigate();
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(null); // track which cargo is being updated

    const load = async () => {
        setLoading(true);
        try {
            // Fetch cargo that arrived at origin airport and hasn't been loaded yet
            const r = await API.get('/cargo', { params: { status: 'RECEIVED_AT_ORIGIN_AIRPORT', limit: 100 } });
            setCargos(r.data.cargos || []);
        } catch { toast.error('Failed to load cargo'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const markLoaded = async (cargo) => {
        if (!window.confirm(`Mark "${cargo.tracking_number}" as Loaded on Aircraft?`)) return;
        setMarking(cargo.id);
        try {
            await API.post('/checkpoint', {
                cargo_id: cargo.id,
                checkpoint_name: 'LOADED_ON_AIRCRAFT',
                condition_status: 'GOOD',
                note: 'Loaded on aircraft by airport cargo staff'
            });
            toast.success(`${cargo.tracking_number} marked as Loaded on Aircraft ✈️`);
            load(); // refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally { setMarking(null); }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title mb-1">✈️ Load on Aircraft</h1>
                    <p className="text-gray-500 text-sm">
                        {cargos.length} cargo item{cargos.length !== 1 ? 's' : ''} received at origin airport — waiting to be loaded
                    </p>
                </div>
                <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
                    <HiOutlineRefresh /> Refresh
                </button>
            </div>

            {/* Info banner */}
            {cargos.length > 0 && (
                <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-800/40 rounded-xl px-4 py-3">
                    <HiOutlineExclamation className="text-blue-400 text-lg flex-shrink-0 mt-0.5" />
                    <p className="text-blue-300 text-sm">
                        These cargo items have been received at the origin airport and are waiting to be marked as <strong>Loaded on Aircraft</strong>.
                        Click <strong>"Mark Loaded"</strong> once cargo is physically on the aircraft.
                    </p>
                </div>
            )}

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-900/50">
                                <th className="table-header">Tracking #</th>
                                <th className="table-header">Sender</th>
                                <th className="table-header">Receiver</th>
                                <th className="table-header">Origin</th>
                                <th className="table-header">Destination</th>
                                <th className="table-header">Priority</th>
                                <th className="table-header">Received</th>
                                <th className="table-header">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {loading && (
                                <tr><td colSpan="8" className="table-cell text-center py-10 text-gray-500">Loading...</td></tr>
                            )}
                            {!loading && cargos.map(c => (
                                <tr
                                    key={c.id}
                                    className="hover:bg-gray-800/30 transition-colors"
                                >
                                    <td
                                        className="table-cell font-mono text-primary-400 cursor-pointer hover:text-primary-300"
                                        onClick={() => navigate(`/airport/cargo/${c.id}`)}
                                    >
                                        {c.tracking_number}
                                    </td>
                                    <td className="table-cell">{c.sender_name}</td>
                                    <td className="table-cell">{c.receiver_name}</td>
                                    <td className="table-cell text-sm">{c.originOffice?.office_name || '—'}</td>
                                    <td className="table-cell text-sm">{c.destinationOffice?.office_name || '—'}</td>
                                    <td className="table-cell">
                                        <span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' :
                                            c.priority === 'FRAGILE' ? 'bg-amber-900/50 text-amber-300' :
                                                'bg-gray-700 text-gray-400'}`}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td className="table-cell text-xs text-gray-400">
                                        {new Date(c.updated_at).toLocaleString()}
                                    </td>
                                    <td className="table-cell">
                                        <button
                                            onClick={() => markLoaded(c)}
                                            disabled={marking === c.id}
                                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <HiOutlinePaperAirplane />
                                            {marking === c.id ? 'Marking...' : 'Mark Loaded'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && cargos.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="table-cell text-center text-gray-500 py-12">
                                        ✅ No cargo waiting to be loaded — all clear
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
