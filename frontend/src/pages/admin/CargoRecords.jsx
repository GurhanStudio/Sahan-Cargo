import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

function StatusBadge({ status }) {
  const s = {
    REGISTERED: 'bg-gray-700 text-gray-300',
    RECEIVED_AT_ORIGIN_AIRPORT: 'bg-blue-900/50 text-blue-300',
    LOADED_ON_AIRCRAFT: 'bg-indigo-900/50 text-indigo-300',
    ARRIVED_AT_DESTINATION_AIRPORT: 'bg-purple-900/50 text-purple-300',
    RECEIVED_AT_DESTINATION_OFFICE: 'bg-amber-900/50 text-amber-300',
    DELIVERED: 'bg-emerald-900/50 text-emerald-300',
  };
  return <span className={`status-badge ${s[status] || 'bg-gray-700 text-gray-300'}`}>{status?.replace(/_/g, ' ')}</span>;
}

export default function CargoRecords() {
  const navigate = useNavigate();
  const [data, setData] = useState({ cargos: [], total: 0, page: 1, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { loadCargo(); }, [page, statusFilter]);

  const loadCargo = () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    API.get('/cargo', { params }).then(r => setData(r.data));
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); loadCargo(); };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Cargo Records</h1>

      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            className="input-field flex-1 min-w-[200px]"
            placeholder="Search by tracking #, sender, receiver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="select-field w-auto"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="RECEIVED_AT_ORIGIN_AIRPORT">At Origin Airport</option>
            <option value="LOADED_ON_AIRCRAFT">Loaded</option>
            <option value="ARRIVED_AT_DESTINATION_AIRPORT">At Dest Airport</option>
            <option value="RECEIVED_AT_DESTINATION_OFFICE">At Dest Office</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <p className="text-gray-500 text-xs px-4 pt-3 pb-1">💡 Click any row to view full cargo details</p>
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
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.cargos.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-primary-900/20 hover:border-l-2 hover:border-l-primary-500 transition-all cursor-pointer group"
                  onClick={() => navigate(`/admin/cargo/${c.id}`)}
                  title="Click to view details"
                >
                  <td className="table-cell font-mono text-primary-400 group-hover:text-primary-300">
                    {c.tracking_number}
                  </td>
                  <td className="table-cell">{c.sender_name}</td>
                  <td className="table-cell">{c.receiver_name}</td>
                  <td className="table-cell">{c.originOffice?.office_name}</td>
                  <td className="table-cell">{c.destinationOffice?.office_name}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : c.priority === 'FRAGILE' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-700 text-gray-400'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="table-cell"><StatusBadge status={c.current_status} /></td>
                  <td className="table-cell">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.cargos.length === 0 && (
                <tr>
                  <td colSpan="8" className="table-cell text-center text-gray-500 py-10">
                    No cargo records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">Page {data.page} of {data.totalPages} ({data.total} total)</p>
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
