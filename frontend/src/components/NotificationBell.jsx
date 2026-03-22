import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineBell, HiOutlineCheckCircle, HiOutlineExclamation,
    HiOutlineInformationCircle, HiOutlineX, HiOutlineCheck
} from 'react-icons/hi';

// Role-specific cargo detail base paths (mirrors DailyVerified / CargoList)
const ROLE_DETAIL_PATH = {
    ADMIN:               '/admin/cargo',
    ORIGIN_OFFICE:       '/origin/cargo',
    AIRPORT_CARGO:       '/airport/cargo',
    DESTINATION_AIRPORT: '/dest-airport/cargo',
    DESTINATION_OFFICE:  '/dest-office/cargo',
};

const TYPE_STYLES = {
    info: { icon: HiOutlineInformationCircle, bg: 'bg-blue-900/40', border: 'border-blue-800/50', text: 'text-blue-300', dot: 'bg-blue-400' },
    success: { icon: HiOutlineCheckCircle, bg: 'bg-emerald-900/40', border: 'border-emerald-800/50', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    warning: { icon: HiOutlineExclamation, bg: 'bg-amber-900/40', border: 'border-amber-800/50', text: 'text-amber-300', dot: 'bg-amber-400' },
    danger: { icon: HiOutlineExclamation, bg: 'bg-red-900/40', border: 'border-red-800/50', text: 'text-red-300', dot: 'bg-red-400' },
};

function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({ notifications: [], unreadCount: 0 });
    const panelRef = useRef();

    const load = () => API.get('/notifications').then(r => setData(r.data)).catch(() => { });

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id) => {
        await API.patch(`/notifications/${id}/read`).catch(() => { });
        load();
    };

    const markAllRead = async () => {
        await API.patch('/notifications/read-all').catch(() => { });
        load();
    };

    const unread = data.unreadCount;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
                title="Notifications"
            >
                <HiOutlineBell className="text-xl" />
                {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-12 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                        <h3 className="font-semibold text-white text-sm">Notifications {unread > 0 && <span className="text-xs text-red-400">({unread} unread)</span>}</h3>
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                                    <HiOutlineCheck /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                                <HiOutlineX />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                        {data.notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                <p>🔔 No notifications</p>
                            </div>
                        ) : (
                            data.notifications.map(n => {
                                const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                                const Icon = style.icon;
                                return (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-800/40 transition-colors ${!n.is_read ? 'bg-gray-800/20' : ''}`}
                                        onClick={() => {
                                            markRead(n.id);
                                            if (n.cargo_id) {
                                                const base = ROLE_DETAIL_PATH[user?.role] || '/admin/cargo';
                                                navigate(`${base}/${n.cargo_id}`);
                                            }
                                        }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                            <Icon className={`text-sm ${style.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium ${n.is_read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                                                {!n.is_read && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${style.dot}`}></span>}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-xs text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
