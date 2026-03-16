import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlusCircle, HiOutlineXCircle } from 'react-icons/hi';

const TYPE_STYLES = {
  ORIGIN_OFFICE: { bg: 'bg-blue-900/30 border-blue-800/50', text: 'text-blue-300', badge: 'bg-blue-900/50 text-blue-300', icon: '🏠' },
  AIRPORT_CARGO: { bg: 'bg-indigo-900/30 border-indigo-800/50', text: 'text-indigo-300', badge: 'bg-indigo-900/50 text-indigo-300', icon: '✈️' },
  DESTINATION_AIRPORT: { bg: 'bg-purple-900/30 border-purple-800/50', text: 'text-purple-300', badge: 'bg-purple-900/50 text-purple-300', icon: '🛬' },
  DESTINATION_OFFICE: { bg: 'bg-amber-900/30 border-amber-800/50', text: 'text-amber-300', badge: 'bg-amber-900/50 text-amber-300', icon: '📬' },
};

const OFFICE_TYPES = [
  { value: 'ORIGIN_OFFICE', label: 'Origin Office' },
  { value: 'AIRPORT_CARGO', label: 'Airport Cargo' },
  { value: 'DESTINATION_AIRPORT', label: 'Destination Airport' },
  { value: 'DESTINATION_OFFICE', label: 'Destination Office' },
];

const EMPTY = { office_name: '', office_type: 'ORIGIN_OFFICE', location: '' };

export default function Offices() {
  const [offices, setOffices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { load(); }, []);
  const load = () => API.get('/offices').then(r => setOffices(r.data));

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
      setShowForm(false); setEditing(null); setForm(EMPTY);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (o) => {
    setForm({ office_name: o.office_name, office_type: o.office_type, location: o.location });
    setEditing(o.id); setShowForm(true); window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this office? This cannot be undone.')) return;
    try { await API.delete(`/offices/${id}`); toast.success('Office deleted'); load(); }
    catch (err) { toast.error('Error deleting office'); }
  };

  // Group offices by type
  const grouped = OFFICE_TYPES.map(t => ({
    ...t,
    offices: offices.filter(o => o.office_type === t.value)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Office Management</h1>
          <p className="text-gray-500 text-sm">{offices.length} offices across {OFFICE_TYPES.length} types</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); }}
          className={showForm ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}
        >
          {showForm ? <><HiOutlineXCircle /> Cancel</> : <><HiOutlinePlusCircle /> Add Office</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            {editing ? <><HiOutlinePencil className="text-primary-400" /> Edit Office</> : <><HiOutlinePlusCircle className="text-emerald-400" /> New Office</>}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Office Name *</label>
              <input
                className="input-field"
                placeholder="e.g. Hargeisa Cargo Office"
                value={form.office_name}
                onChange={e => setForm({ ...form, office_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Office Type *</label>
              <select
                className="select-field"
                value={form.office_type}
                onChange={e => setForm({ ...form, office_type: e.target.value })}
              >
                {OFFICE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Location *</label>
              <input
                className="input-field"
                placeholder="e.g. Hargeisa, Somaliland"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">
                {editing ? 'Update Office' : 'Create Office'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped by type */}
      {grouped.map(group => (
        group.offices.length === 0 ? null : (
          <div key={group.value} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center gap-3">
              <span className="text-xl">{TYPE_STYLES[group.value]?.icon}</span>
              <div>
                <h2 className={`font-semibold text-sm ${TYPE_STYLES[group.value]?.text}`}>{group.label}</h2>
                <p className="text-gray-600 text-xs">{group.offices.length} office{group.offices.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 h-px bg-gray-800 ml-2"></div>
            </div>

            {/* Office cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.offices.map(o => {
                const style = TYPE_STYLES[o.office_type] || {};
                return (
                  <div key={o.id} className={`rounded-xl p-4 border ${style.bg || 'bg-gray-800/50 border-gray-700'} flex flex-col gap-3`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{o.office_name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">📍 {o.location}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                        {o.office_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Assigned staff */}
                    <div className="border-t border-gray-700/50 pt-2">
                      <p className="text-gray-500 text-xs font-medium mb-1.5">👤 Assigned Staff</p>
                      {o.users && o.users.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {o.users.map(u => (
                            <div key={u.id} className="flex items-center justify-between">
                              <span className="text-gray-300 text-xs">{u.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-md ${u.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs italic">No staff assigned</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 text-xs">Added {new Date(o.created_at).toLocaleDateString()}</p>
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(o)} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1">
                          <HiOutlinePencil /> Edit
                        </button>
                        <button onClick={() => handleDelete(o.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                          <HiOutlineTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}

      {offices.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No offices yet. Create your first office above.</p>
        </div>
      )}
    </div>
  );
}
