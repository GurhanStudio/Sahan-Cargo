import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  HiOutlineTruck, HiOutlineBadgeCheck, HiOutlineExclamation, HiOutlineCube,
  HiOutlineLightningBolt, HiOutlineUsers, HiOutlineOfficeBuilding,
  HiOutlineUserGroup, HiOutlineChartBar
} from 'react-icons/hi';

const STATUS_COLORS = {
  REGISTERED: 'bg-gray-700 text-gray-300',
  RECEIVED_AT_ORIGIN_AIRPORT: 'bg-blue-900/50 text-blue-300',
  LOADED_ON_AIRCRAFT: 'bg-indigo-900/50 text-indigo-300',
  ARRIVED_AT_DESTINATION_AIRPORT: 'bg-purple-900/50 text-purple-300',
  RECEIVED_AT_DESTINATION_OFFICE: 'bg-amber-900/50 text-amber-300',
  DELIVERED: 'bg-emerald-900/50 text-emerald-300',
};

const OFFICE_ICONS = {
  ORIGIN_OFFICE: '🏠',
  AIRPORT_CARGO: '✈️',
  DESTINATION_AIRPORT: '🛬',
  DESTINATION_OFFICE: '📬',
};

function StatCard({ title, value, icon: Icon, gradient, sub }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/70 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        <Icon className="text-4xl text-white/25 flex-shrink-0" />
      </div>
    </div>
  );
}

function MiniCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-3 ${color} flex items-center justify-between`}>
      <span className="text-xs font-medium opacity-80">{label}</span>
      <span className="text-lg font-bold">{value ?? 0}</span>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/cargo/dashboard/stats')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  );

  const stats = data?.stats || {};
  const users = data?.users || {};
  const offices = data?.offices || {};
  const byType = offices.byType || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">System-wide overview of cargo operations, staff, and offices</p>
      </div>

      {/* ── Cargo Stats Row ── */}
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-3 font-semibold">📦 Cargo Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total Cargo" value={stats.total} icon={HiOutlineCube} gradient="from-primary-600 to-primary-800 shadow-primary-600/20" />
          <StatCard title="In Transit" value={stats.inTransit} icon={HiOutlineTruck} gradient="from-amber-500 to-amber-700 shadow-amber-500/20" />
          <StatCard title="Delivered" value={stats.delivered} icon={HiOutlineBadgeCheck} gradient="from-emerald-600 to-emerald-800 shadow-emerald-600/20" />
          <StatCard title="High Value" value={stats.highValue} icon={HiOutlineLightningBolt} gradient="from-purple-600 to-purple-800 shadow-purple-600/20" />
          <StatCard title="Disputes / Damaged" value={(stats.disputes || 0) + (stats.damaged || 0)} icon={HiOutlineExclamation} gradient="from-red-600 to-red-800 shadow-red-600/20" />
        </div>
      </div>

      {/* ── Users & Offices Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users */}
        <div className="card">
          <SectionHeader
            title="👤 Staff Overview"
            action={<button onClick={() => navigate('/admin/users')} className="text-primary-400 hover:text-primary-300 text-xs">Manage →</button>}
          />
          <div className="grid grid-cols-3 gap-3">
            <MiniCard label="Total Users" value={users.total} color="bg-primary-900/30 text-primary-300" />
            <MiniCard label="Active" value={users.active} color="bg-emerald-900/30 text-emerald-300" />
            <MiniCard label="Inactive" value={users.inactive} color="bg-red-900/30 text-red-400" />
          </div>
        </div>

        {/* Offices */}
        <div className="card">
          <SectionHeader
            title="🏢 Office Overview"
            action={<button onClick={() => navigate('/admin/offices')} className="text-primary-400 hover:text-primary-300 text-xs">Manage →</button>}
          />
          <div className="grid grid-cols-2 gap-2">
            {Object.entries({
              ORIGIN_OFFICE: 'Origin Office',
              AIRPORT_CARGO: 'Airport Cargo',
              DESTINATION_AIRPORT: 'Dest. Airport',
              DESTINATION_OFFICE: 'Dest. Office',
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">{OFFICE_ICONS[key]} {label}</span>
                <span className="text-white font-bold text-sm">{byType[key] || 0}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">{offices.total || 0} offices total</p>
        </div>
      </div>

      {/* ── Recent Cargo ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">🕐 Recent Cargo</h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Last 10 records</span>
            <button onClick={() => navigate('/admin/cargo')} className="text-primary-400 hover:text-primary-300 text-xs">View All →</button>
          </div>
        </div>
        <p className="text-gray-600 text-xs px-5 pb-2">💡 Click any row to view full cargo details</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-800 bg-gray-900/50">
                <th className="table-header">Tracking #</th>
                <th className="table-header">Sender</th>
                <th className="table-header">Receiver</th>
                <th className="table-header">Origin</th>
                <th className="table-header">Destination</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data?.recentCargo?.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-primary-900/20 hover:border-l-2 hover:border-l-primary-500 transition-all cursor-pointer group"
                  onClick={() => navigate(`/admin/cargo/${c.id}`)}
                >
                  <td className="table-cell font-mono text-primary-400 group-hover:text-primary-300">{c.tracking_number}</td>
                  <td className="table-cell">{c.sender_name}</td>
                  <td className="table-cell">{c.receiver_name}</td>
                  <td className="table-cell text-sm">{c.originOffice?.office_name}</td>
                  <td className="table-cell text-sm">{c.destinationOffice?.office_name}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : c.priority === 'FRAGILE' ? 'bg-amber-900/50 text-amber-300' : 'bg-gray-700 text-gray-400'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${STATUS_COLORS[c.current_status] || 'bg-gray-700 text-gray-300'}`}>
                      {c.current_status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recentCargo || data.recentCargo.length === 0) && (
                <tr><td colSpan="7" className="table-cell text-center text-gray-500 py-10">No cargo records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Disputes ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-white">⚠️ Recent Disputes & Damages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-800 bg-gray-900/50">
                <th className="table-header">Tracking #</th>
                <th className="table-header">Condition</th>
                <th className="table-header">Checkpoint</th>
                <th className="table-header">Reported By</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data?.recentDisputes?.map(d => (
                <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="table-cell font-mono text-primary-400">{d.cargo?.tracking_number}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${d.condition_status === 'DAMAGED' ? 'bg-red-900/50 text-red-300' : 'bg-amber-900/50 text-amber-300'}`}>
                      {d.condition_status}
                    </span>
                  </td>
                  <td className="table-cell text-sm">{d.checkpoint_name?.replace(/_/g, ' ')}</td>
                  <td className="table-cell text-sm">{d.checkedBy?.name}</td>
                  <td className="table-cell text-xs">{new Date(d.checked_at).toLocaleString()}</td>
                </tr>
              ))}
              {(!data?.recentDisputes || data.recentDisputes.length === 0) && (
                <tr><td colSpan="5" className="table-cell text-center text-gray-500 py-10">No disputes or damages ✅</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
