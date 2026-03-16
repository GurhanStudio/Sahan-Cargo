import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

export default function CargoList({ title }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ cargos: [], total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => { loadCargo(); }, []);

  const loadCargo = (s) => {
    const params = { limit: 50 };
    if (s !== undefined ? s : search) params.search = s !== undefined ? s : search;
    API.get('/cargo', { params }).then(r => setData(r.data));
  };

  const detailPath = ROLE_DETAIL_PATH[user?.role];

  return (
    <div className="space-y-6">
      <h1 className="page-title">{title || 'Cargo List'}</h1>
      <div className="card">
        <form onSubmit={e => { e.preventDefault(); loadCargo(); }} className="flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search tracking #, sender, receiver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                  onClick={() => detailPath && navigate(`${detailPath}/${c.id}`)}
                >
                  <td className="table-cell font-mono text-primary-400 group-hover:text-primary-300">{c.tracking_number}</td>
                  <td className="table-cell">{c.sender_name}</td>
                  <td className="table-cell">{c.receiver_name}</td>
                  <td className="table-cell text-sm">{c.originOffice?.office_name || '-'}</td>
                  <td className="table-cell text-sm">{c.destinationOffice?.office_name || '-'}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : c.priority === 'FRAGILE' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-700 text-gray-400'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${STATUS_COLORS[c.current_status] || 'bg-gray-700 text-gray-300'}`}>
                      {c.current_status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.cargos.length === 0 && (
                <tr><td colSpan="8" className="table-cell text-center text-gray-500 py-10">No cargo found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.total > 0 && (
          <div className="p-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">{data.total} total cargo records</p>
          </div>
        )}
      </div>
    </div>
  );
}
