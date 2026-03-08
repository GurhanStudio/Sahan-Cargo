import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function Offices() {
  const [offices, setOffices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ office_name: '', office_type: 'ORIGIN_OFFICE', location: '' });

  useEffect(() => { loadOffices(); }, []);
  const loadOffices = () => API.get('/offices').then(r => setOffices(r.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/offices/${editing}`, form);
        toast.success('Office updated');
      } else {
        await API.post('/offices', form);
        toast.success('Office created');
      }
      setShowForm(false); setEditing(null);
      setForm({ office_name: '', office_type: 'ORIGIN_OFFICE', location: '' });
      loadOffices();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (o) => {
    setForm({ office_name: o.office_name, office_type: o.office_type, location: o.location });
    setEditing(o.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this office?')) return;
    try { await API.delete(`/offices/${id}`); toast.success('Office deleted'); loadOffices(); }
    catch (err) { toast.error('Error deleting office'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Office Management</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ office_name: '', office_type: 'ORIGIN_OFFICE', location: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Office'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Edit Office' : 'Create Office'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="input-field" placeholder="Office Name" value={form.office_name} onChange={e => setForm({...form, office_name: e.target.value})} required />
            <select className="select-field" value={form.office_type} onChange={e => setForm({...form, office_type: e.target.value})}>
              <option value="ORIGIN_OFFICE">Origin Office</option>
              <option value="AIRPORT_CARGO">Airport Cargo</option>
              <option value="DESTINATION_AIRPORT">Destination Airport</option>
              <option value="DESTINATION_OFFICE">Destination Office</option>
            </select>
            <input className="input-field" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
            <div className="md:col-span-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Office</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              <th className="table-header">Office Name</th>
              <th className="table-header">Type</th>
              <th className="table-header">Location</th>
              <th className="table-header">Created</th>
              <th className="table-header">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {offices.map(o => (
                <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="table-cell font-medium text-white">{o.office_name}</td>
                  <td className="table-cell"><span className="status-badge bg-primary-900/50 text-primary-300">{o.office_type?.replace(/_/g, ' ')}</span></td>
                  <td className="table-cell">{o.location}</td>
                  <td className="table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(o)} className="text-primary-400 hover:text-primary-300 text-sm">Edit</button>
                      <button onClick={() => handleDelete(o.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
