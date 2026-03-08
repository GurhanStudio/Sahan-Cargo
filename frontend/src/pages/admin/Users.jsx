import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'ORIGIN_OFFICE', office_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [u, o] = await Promise.all([API.get('/users'), API.get('/offices')]);
    setUsers(u.data);
    setOffices(o.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const data = { ...form };
        if (!data.password) delete data.password;
        await API.put(`/users/${editing}`, data);
        toast.success('User updated');
      } else {
        await API.post('/users', form);
        toast.success('User created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', email: '', phone: '', password: '', role: 'ORIGIN_OFFICE', office_id: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role, office_id: user.office_id || '' });
    setEditing(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success('User deactivated');
      loadData();
    } catch (err) {
      toast.error('Error deactivating user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">User Management</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', email: '', phone: '', password: '', role: 'ORIGIN_OFFICE', office_id: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Edit User' : 'Create User'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input-field" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <input className="input-field" type="password" placeholder={editing ? 'New Password (leave blank)' : 'Password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
            <select className="select-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="ADMIN">Admin</option>
              <option value="ORIGIN_OFFICE">Origin Office</option>
              <option value="AIRPORT_CARGO">Airport Cargo</option>
              <option value="DESTINATION_AIRPORT">Destination Airport</option>
              <option value="DESTINATION_OFFICE">Destination Office</option>
            </select>
            <select className="select-field" value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})}>
              <option value="">No Office (Admin)</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.office_name}</option>)}
            </select>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} User</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Role</th>
              <th className="table-header">Office</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="table-cell font-medium text-white">{u.name}</td>
                  <td className="table-cell">{u.email}</td>
                  <td className="table-cell">{u.phone || '-'}</td>
                  <td className="table-cell"><span className="status-badge bg-primary-900/50 text-primary-300">{u.role?.replace(/_/g, ' ')}</span></td>
                  <td className="table-cell">{u.office?.office_name || '-'}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${u.is_active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(u)} className="text-primary-400 hover:text-primary-300 text-sm">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-sm">Deactivate</button>
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
