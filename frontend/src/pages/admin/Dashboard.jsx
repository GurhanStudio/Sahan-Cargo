import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiOutlineTruck, HiOutlineBadgeCheck, HiOutlineExclamation, HiOutlineCube, HiOutlineLightningBolt } from 'react-icons/hi';

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'from-primary-600 to-primary-800 shadow-primary-600/20',
    green: 'from-emerald-600 to-emerald-800 shadow-emerald-600/20',
    yellow: 'from-amber-500 to-amber-700 shadow-amber-500/20',
    red: 'from-red-600 to-red-800 shadow-red-600/20',
    purple: 'from-purple-600 to-purple-800 shadow-purple-600/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className="text-4xl text-white/30" />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    REGISTERED: 'bg-gray-700 text-gray-300',
    RECEIVED_AT_ORIGIN_AIRPORT: 'bg-blue-900/50 text-blue-300',
    LOADED_ON_AIRCRAFT: 'bg-indigo-900/50 text-indigo-300',
    ARRIVED_AT_DESTINATION_AIRPORT: 'bg-purple-900/50 text-purple-300',
    RECEIVED_AT_DESTINATION_OFFICE: 'bg-amber-900/50 text-amber-300',
    DELIVERED: 'bg-emerald-900/50 text-emerald-300',
  };

  return (
    <span className={`status-badge ${styles[status] || 'bg-gray-700 text-gray-300'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/cargo/dashboard/stats')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of cargo operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Cargo" value={stats.total || 0} icon={HiOutlineCube} color="blue" />
        <StatCard title="In Transit" value={stats.inTransit || 0} icon={HiOutlineTruck} color="yellow" />
        <StatCard title="Delivered" value={stats.delivered || 0} icon={HiOutlineBadgeCheck} color="green" />
        <StatCard title="High Value" value={stats.highValue || 0} icon={HiOutlineLightningBolt} color="purple" />
        <StatCard title="Disputes" value={(stats.disputes || 0) + (stats.damaged || 0)} icon={HiOutlineExclamation} color="red" />
      </div>

      {/* Recent Cargo */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Cargo</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
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
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="table-cell font-mono text-primary-400">{c.tracking_number}</td>
                  <td className="table-cell">{c.sender_name}</td>
                  <td className="table-cell">{c.receiver_name}</td>
                  <td className="table-cell">{c.originOffice?.office_name}</td>
                  <td className="table-cell">{c.destinationOffice?.office_name}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : c.priority === 'FRAGILE' ? 'bg-amber-900/50 text-amber-300' : 'bg-gray-700 text-gray-400'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="table-cell"><StatusBadge status={c.current_status} /></td>
                </tr>
              ))}
              {(!data?.recentCargo || data.recentCargo.length === 0) && (
                <tr><td colSpan="7" className="table-cell text-center text-gray-500 py-8">No cargo records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Disputes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Disputes & Damages</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">Tracking #</th>
                <th className="table-header">Condition</th>
                <th className="table-header">Checkpoint</th>
                <th className="table-header">Officer</th>
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
                  <td className="table-cell">{d.checkpoint_name?.replace(/_/g, ' ')}</td>
                  <td className="table-cell">{d.checkedBy?.name}</td>
                  <td className="table-cell">{new Date(d.checked_at).toLocaleString()}</td>
                </tr>
              ))}
              {(!data?.recentDisputes || data.recentDisputes.length === 0) && (
                <tr><td colSpan="5" className="table-cell text-center text-gray-500 py-8">No disputes or damages</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
