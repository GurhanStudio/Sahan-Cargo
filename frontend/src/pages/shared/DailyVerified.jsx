import { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    REGISTERED: 'bg-gray-700 text-gray-300',
    RECEIVED_AT_ORIGIN_AIRPORT: 'bg-blue-900/50 text-blue-300',
    LOADED_ON_AIRCRAFT: 'bg-indigo-900/50 text-indigo-300',
    ARRIVED_AT_DESTINATION_AIRPORT: 'bg-purple-900/50 text-purple-300',
    RECEIVED_AT_DESTINATION_OFFICE: 'bg-amber-900/50 text-amber-300',
    DELIVERED: 'bg-emerald-900/50 text-emerald-300',
};

const ROLE_DETAIL_PATH = {
    ORIGIN_OFFICE: '/origin/cargo',
    AIRPORT_CARGO: '/airport/cargo',
    DESTINATION_AIRPORT: '/dest-airport/cargo',
    DESTINATION_OFFICE: '/dest-office/cargo',
};

export default function DailyVerified() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null); // cargo id being verified

    const load = useCallback(() => {
        setLoading(true);
        API.get('/office-verifications/daily')
            .then(r => setCargos(r.data.cargos || []))
            .catch(() => toast.error('Failed to load daily cargo list.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleVerify = async (cargo) => {
        setVerifying(cargo.id);
        try {
            await API.post(`/office-verifications/${cargo.id}`);
            toast.success(`Cargo ${cargo.tracking_number} marked as verified!`);
            load(); // Refresh list
        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed.';
            if (err.response?.status === 409) {
                toast.error('Already verified by this office.');
            } else {
                toast.error(msg);
            }
        } finally {
            setVerifying(null);
        }
    };

    const getVerification = (cargo) => cargo.officeVerifications?.[0] || null;
    const detailPath = ROLE_DETAIL_PATH[user?.role];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title mb-1">Daily Verified List</h1>
                    <p className="text-gray-500 text-sm">
                        Cargo handled by your office in the last 24 hours. Mark each as verified from your side.
                    </p>
                </div>
                <button onClick={load} className="btn-secondary text-sm">🔄 Refresh</button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
            ) : cargos.length === 0 ? (
                <div className="card text-center py-12">
                    <HiOutlineClock className="text-5xl text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No cargo in the last 24 hours</p>
                    <p className="text-gray-600 text-sm mt-1">Cargo handled by your office will appear here.</p>
                </div>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="table-header">Tracking #</th>
                                    <th className="table-header">Sender</th>
                                    <th className="table-header">Receiver</th>
                                    <th className="table-header">Origin</th>
                                    <th className="table-header">Destination</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Date</th>
                                    <th className="table-header text-center">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {cargos.map(cargo => {
                                    const verif = getVerification(cargo);
                                    const isVerified = !!verif;
                                    const isVerifying = verifying === cargo.id;

                                    return (
                                        <tr
                                            key={cargo.id}
                                            className="hover:bg-gray-800/30 transition-colors group"
                                        >
                                            <td
                                                className="table-cell font-mono text-primary-400 cursor-pointer group-hover:underline"
                                                onClick={() => detailPath && navigate(`${detailPath}/${cargo.id}`)}
                                                title="Click to view details"
                                            >
                                                {cargo.tracking_number}
                                            </td>
                                            <td className="table-cell">{cargo.sender_name}</td>
                                            <td className="table-cell">{cargo.receiver_name}</td>
                                            <td className="table-cell text-sm">{cargo.originOffice?.office_name}</td>
                                            <td className="table-cell text-sm">{cargo.destinationOffice?.office_name}</td>
                                            <td className="table-cell">
                                                <span className={`status-badge ${STATUS_COLORS[cargo.current_status] || 'bg-gray-700 text-gray-300'}`}>
                                                    {cargo.current_status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="table-cell text-sm">{new Date(cargo.created_at).toLocaleDateString()}</td>
                                            <td className="table-cell text-center">
                                                {isVerified ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                                                            <HiOutlineCheckCircle className="text-lg" /> Verified
                                                        </span>
                                                        <span className="text-gray-500 text-xs">
                                                            {new Date(verif.verified_at).toLocaleString()}
                                                        </span>
                                                        <span className="text-gray-600 text-xs">
                                                            by {verif.verifiedBy?.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleVerify(cargo)}
                                                        disabled={isVerifying}
                                                        className="btn-success text-xs px-4 py-1.5 disabled:opacity-50"
                                                    >
                                                        {isVerifying ? (
                                                            <span className="flex items-center gap-1">
                                                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                                                Saving...
                                                            </span>
                                                        ) : '✓ Verified'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                        <p className="text-gray-500 text-sm">{cargos.length} cargo items in the last 24 hours</p>
                        <p className="text-gray-600 text-xs">{cargos.filter(c => c.officeVerifications?.length > 0).length} verified · {cargos.filter(c => !c.officeVerifications?.length).length} pending</p>
                    </div>
                </div>
            )}
        </div>
    );
}
