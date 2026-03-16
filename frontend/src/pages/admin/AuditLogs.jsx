import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';

const ACTION_COLORS = {
  CARGO_REGISTERED: { bg: 'bg-blue-900/50', text: 'text-blue-300', icon: '📦' },
  CHECKPOINT_UPDATED: { bg: 'bg-indigo-900/50', text: 'text-indigo-300', icon: '📍' },
  DELIVERY_CONFIRMED: { bg: 'bg-emerald-900/50', text: 'text-emerald-300', icon: '✅' },
  OTP_REQUESTED: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', icon: '📱' },
  USER_CREATED: { bg: 'bg-purple-900/50', text: 'text-purple-300', icon: '👤' },
  USER_UPDATED: { bg: 'bg-violet-900/50', text: 'text-violet-300', icon: '✏️' },
  USER_DEACTIVATED: { bg: 'bg-red-900/50', text: 'text-red-300', icon: '🚫' },
  OFFICE_CREATED: { bg: 'bg-teal-900/50', text: 'text-teal-300', icon: '🏢' },
  REPORT_DOWNLOADED: { bg: 'bg-gray-700', text: 'text-gray-300', icon: '📊' },
};

const ROLE_COLORS = {
  ADMIN: 'bg-red-900/30 text-red-300',
  ORIGIN_OFFICE: 'bg-blue-900/30 text-blue-300',
  AIRPORT_CARGO: 'bg-indigo-900/30 text-indigo-300',
  DESTINATION_AIRPORT: 'bg-purple-900/30 text-purple-300',
  DESTINATION_OFFICE: 'bg-amber-900/30 text-amber-300',
};

function ActionBadge({ type }) {
  const cfg = ACTION_COLORS[type] || { bg: 'bg-gray-700', text: 'text-gray-300', icon: '📝' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {type?.replace(/_/g, ' ')}
    </span>
  );
}

const ACTION_TYPES = [
  '', 'CARGO_REGISTERED', 'CHECKPOINT_UPDATED', 'DELIVERY_CONFIRMED',
  'OTP_REQUESTED', 'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED',
  'OFFICE_CREATED', 'REPORT_DOWNLOADED'
];

export default function AuditLogs() {
  const [data, setData] = useState({ logs: [], total: 0, page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, [page, actionFilter]);

  const load = () => {
    const params = { page, limit: 25 };
    if (actionFilter) params.action_type = actionFilter;
    API.get('/reports/audit-logs', { params }).then(r => setData(r.data));
  };

  const filtered = search
    ? data.logs.filter(l =>
      l.action_description?.toLowerCase().includes(search.toLowerCase()) ||
      l.cargo?.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase())
    )
    : data.logs;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Complete activity history · {data.total} total entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input-field pl-9"
              placeholder="Search user, cargo, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
              className="select-field pl-9 w-auto"
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Action Types</option>
              {ACTION_TYPES.filter(Boolean).map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="table-header w-36">Timestamp</th>
                <th className="table-header">Staff</th>
                <th className="table-header">Action</th>
                <th className="table-header w-36">Cargo</th>
                <th className="table-header">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(l => (
                <>
                  <tr
                    key={l.id}
                    className="hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  >
                    {/* Timestamp */}
                    <td className="table-cell">
                      <div className="text-xs text-white font-medium">
                        {new Date(l.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(l.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    {/* Staff */}
                    <td className="table-cell">
                      <div className="text-sm text-white font-medium">{l.user?.name || '—'}</div>
                      {l.user?.role && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[l.user.role] || 'bg-gray-700 text-gray-300'}`}>
                          {l.user.role.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    {/* Action */}
                    <td className="table-cell">
                      <ActionBadge type={l.action_type} />
                    </td>
                    {/* Cargo */}
                    <td className="table-cell font-mono text-primary-400 text-xs">
                      {l.cargo?.tracking_number || '—'}
                    </td>
                    {/* Description (truncated, expand on click) */}
                    <td className="table-cell text-sm text-gray-400 max-w-xs">
                      <span className={expandedId === l.id ? '' : 'line-clamp-1'}>
                        {l.action_description}
                      </span>
                      {l.action_description?.length > 60 && (
                        <span className="text-primary-500 text-xs ml-1 group-hover:underline">
                          {expandedId === l.id ? '▲ less' : '▼ more'}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedId === l.id && (
                    <tr key={`${l.id}-expand`} className="bg-gray-800/20">
                      <td colSpan="5" className="px-6 py-3">
                        <div className="flex gap-6 text-sm flex-wrap">
                          <div>
                            <span className="text-gray-500 text-xs">Full Description</span>
                            <p className="text-gray-200 mt-0.5">{l.action_description}</p>
                          </div>
                          {l.ip_address && (
                            <div>
                              <span className="text-gray-500 text-xs">IP Address</span>
                              <p className="text-gray-400 font-mono mt-0.5">{l.ip_address}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 text-xs">Log ID</span>
                            <p className="text-gray-500 font-mono mt-0.5">#{l.id}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="table-cell text-center text-gray-500 py-10">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">Page {data.page} of {data.totalPages} · {data.total} entries</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">← Prev</button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary text-sm disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
