import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function CargoList() {
  const [data, setData] = useState({ cargos: [], total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => { loadCargo(); }, []);

  const loadCargo = (s) => {
    const params = { limit: 50 };
    if (s || search) params.search = s || search;
    API.get('/cargo', { params }).then(r => setData(r.data));
  };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Cargo List</h1>
      <div className="card">
        <form onSubmit={e => { e.preventDefault(); loadCargo(); }} className="flex gap-3">
          <input className="input-field flex-1" placeholder="Search tracking #, sender, receiver..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              <th className="table-header">Tracking #</th>
              <th className="table-header">Sender</th>
              <th className="table-header">Receiver</th>
              <th className="table-header">Priority</th>
              <th className="table-header">Status</th>
              <th className="table-header">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.cargos.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/30">
                  <td className="table-cell font-mono text-primary-400">{c.tracking_number}</td>
                  <td className="table-cell">{c.sender_name}</td>
                  <td className="table-cell">{c.receiver_name}</td>
                  <td className="table-cell"><span className={`status-badge ${c.priority === 'HIGH_VALUE' ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-gray-400'}`}>{c.priority}</span></td>
                  <td className="table-cell"><span className="status-badge bg-primary-900/50 text-primary-300">{c.current_status?.replace(/_/g, ' ')}</span></td>
                  <td className="table-cell text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.cargos.length === 0 && <tr><td colSpan="6" className="table-cell text-center text-gray-500 py-8">No cargo found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
