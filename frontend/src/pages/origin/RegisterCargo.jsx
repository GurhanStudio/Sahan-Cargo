import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function RegisterCargo() {
  const { user } = useAuth();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    sender_name: '', sender_phone: '', receiver_name: '', receiver_phone: '',
    description: '', weight: '', priority: 'NORMAL',
    origin_office_id: '', destination_office_id: ''
  });
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    API.get('/offices').then(r => {
      setOffices(r.data);
      if (user?.office_id) setForm(f => ({ ...f, origin_office_id: user.office_id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      const res = await API.post('/cargo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      toast.success('Cargo registered successfully!');
      setForm({ sender_name: '', sender_phone: '', receiver_name: '', receiver_phone: '', description: '', weight: '', priority: 'NORMAL', origin_office_id: user?.office_id || '', destination_office_id: '' });
      setPhoto(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="page-title">Register New Cargo</h1>

      {result && (
        <div className="card border-emerald-800 bg-emerald-900/20">
          <h2 className="text-lg font-semibold text-emerald-400 mb-3">✅ Cargo Registered Successfully</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Tracking Number</p>
              <p className="text-xl font-mono font-bold text-white">{result.tracking_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">QR Code</p>
              {result.qr_code_url && (
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${result.qr_code_url}`} target="_blank" className="text-primary-400 hover:underline text-sm">
                  📥 Download QR Code
                </a>
              )}
            </div>
          </div>
          <button onClick={() => setResult(null)} className="btn-secondary mt-4 text-sm">Register Another</button>
        </div>
      )}

      {!result && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sender Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="input-field" placeholder="Sender Name" value={form.sender_name} onChange={e => setForm({...form, sender_name: e.target.value})} required />
                <input className="input-field" placeholder="Sender Phone" value={form.sender_phone} onChange={e => setForm({...form, sender_phone: e.target.value})} required />
              </div>
            </div>

            {/* Receiver Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Receiver Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="input-field" placeholder="Receiver Name" value={form.receiver_name} onChange={e => setForm({...form, receiver_name: e.target.value})} required />
                <input className="input-field" placeholder="Receiver Phone" value={form.receiver_phone} onChange={e => setForm({...form, receiver_phone: e.target.value})} required />
              </div>
            </div>

            {/* Cargo Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Cargo Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea className="input-field md:col-span-2" rows="3" placeholder="Cargo Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                <input className="input-field" type="number" step="0.01" placeholder="Weight (kg)" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} required />
                <select className="select-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="NORMAL">Normal</option>
                  <option value="FRAGILE">Fragile</option>
                  <option value="HIGH_VALUE">High Value</option>
                </select>
              </div>
            </div>

            {/* Offices */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="select-field" value={form.origin_office_id} onChange={e => setForm({...form, origin_office_id: e.target.value})} required>
                  <option value="">Select Origin Office</option>
                  {offices.filter(o => o.office_type === 'ORIGIN_OFFICE').map(o => <option key={o.id} value={o.id}>{o.office_name}</option>)}
                </select>
                <select className="select-field" value={form.destination_office_id} onChange={e => setForm({...form, destination_office_id: e.target.value})} required>
                  <option value="">Select Destination Office</option>
                  {offices.filter(o => o.office_type === 'DESTINATION_OFFICE').map(o => <option key={o.id} value={o.id}>{o.office_name}</option>)}
                </select>
              </div>
            </div>

            {/* Photo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Cargo Photo {form.priority === 'HIGH_VALUE' && <span className="text-red-400">*</span>}
              </h3>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="input-field" required={form.priority === 'HIGH_VALUE'} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-3">
              {loading ? 'Registering...' : '📦 Register Cargo'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
