import { useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineDocumentDownload } from 'react-icons/hi';

const reportTypes = [
  { key: 'cargo', label: 'Cargo Report', endpoint: '/reports/cargo', filters: ['from', 'to', 'status'] },
  { key: 'delivery', label: 'Delivery Report', endpoint: '/reports/delivery', filters: ['from', 'to'] },
  { key: 'high-value', label: 'High Value Cargo', endpoint: '/reports/high-value', filters: [] },
  { key: 'damaged', label: 'Damaged / Dispute', endpoint: '/reports/damaged', filters: [] },
  { key: 'activity', label: 'Cargo Activity', endpoint: '/reports/activity', filters: ['from', 'to'] },
];

export default function Reports() {
  const [selected, setSelected] = useState('cargo');
  const [format, setFormat] = useState('xlsx');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const report = reportTypes.find(r => r.key === selected);

  const handlePreview = async () => {
    try {
      const params = { format: 'json' };
      if (from) params.from = from;
      if (to) params.to = to;
      if (status) params.status = status;
      const res = await API.get(report.endpoint, { params });
      setPreviewData(res.data);
    } catch (err) { toast.error('Failed to load preview'); }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = { format };
      if (from) params.from = from;
      if (to) params.to = to;
      if (status) params.status = status;

      const res = await API.get(report.endpoint, {
        params,
        responseType: format === 'json' ? 'json' : 'blob'
      });

      if (format !== 'json') {
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = format === 'xlsx' ? 'xlsx' : format;
        a.download = `${report.label.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} downloaded`);
      }
    } catch (err) { toast.error('Download failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Reports</h1>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-6">
          {reportTypes.map(r => (
            <button key={r.key} onClick={() => { setSelected(r.key); setPreviewData(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selected === r.key ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-end mb-6">
          {report.filters.includes('from') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
          )}
          {report.filters.includes('to') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} />
            </div>
          )}
          {report.filters.includes('status') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select className="select-field" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="REGISTERED">Registered</option>
                <option value="DELIVERED">Delivered</option>
                <option value="LOADED_ON_AIRCRAFT">Loaded</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Format</label>
            <select className="select-field" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <button onClick={handlePreview} className="btn-secondary">Preview</button>
          <button onClick={handleDownload} disabled={loading} className="btn-primary flex items-center gap-2">
            <HiOutlineDocumentDownload className="text-lg" />
            {loading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {previewData && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Preview ({previewData.total || previewData.data?.length || 0} rows)</h2>
          <div className="overflow-x-auto max-h-96">
            {previewData.data && previewData.data.length > 0 ? (
              <table className="w-full">
                <thead><tr className="border-b border-gray-800">
                  {Object.keys(previewData.data[0]).map(k => <th key={k} className="table-header">{k}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-800/50">
                  {previewData.data.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      {Object.values(row).map((v, j) => <td key={j} className="table-cell">{String(v || '-')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-gray-500">No data found</p>}
          </div>
        </div>
      )}
    </div>
  );
}
