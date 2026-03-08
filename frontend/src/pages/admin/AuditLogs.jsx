import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function AuditLogs() {
  const [data, setData] = useState({ logs: [], total: 0, page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    API.get('/reports/audit-logs', { params: { page, limit: 30 } }).then(r => setData(r.data));
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Audit Logs</h1>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              <th className="table-header">Date</th>
              <th className="table-header">User</th>
              <th className="table-header">Role</th>
              <th className="table-header">Action</th>
              <th className="table-header">Description</th>
              <th className="table-header">Cargo</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="table-cell text-xs">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="table-cell">{l.user?.name || 'System'}</td>
                  <td className="table-cell"><span className="status-badge bg-primary-900/50 text-primary-300">{l.user?.role?.replace(/_/g, ' ') || '-'}</span></td>
                  <td className="table-cell font-medium text-amber-400">{l.action_type}</td>
                  <td className="table-cell max-w-xs truncate">{l.action_description}</td>
                  <td className="table-cell font-mono text-primary-400">{l.cargo?.tracking_number || '-'}</td>
                </tr>
              ))}
              {data.logs.length === 0 && <tr><td colSpan="6" className="table-cell text-center text-gray-500 py-8">No audit logs</td></tr>}
            </tbody>
          </table>
        </div>
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">← Prev</button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page === data.totalPages} className="btn-secondary text-sm disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
