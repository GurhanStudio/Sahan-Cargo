import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePencil, HiOutlinePlusCircle, HiOutlineXCircle, HiOutlineBan,
  HiOutlineCheckCircle, HiOutlineTrash, HiOutlineSearch, HiOutlineExclamation
} from 'react-icons/hi';

const ROLE_STYLES = {
  ADMIN: { bg: 'bg-red-900/30 text-red-300', label: 'Admin' },
  ORIGIN_OFFICE: { bg: 'bg-blue-900/30 text-blue-300', label: 'Origin Office' },
  AIRPORT_CARGO: { bg: 'bg-indigo-900/30 text-indigo-300', label: 'Airport Cargo' },
  DESTINATION_AIRPORT: { bg: 'bg-purple-900/30 text-purple-300', label: 'Dest. Airport' },
  DESTINATION_OFFICE: { bg: 'bg-amber-900/30 text-amber-300', label: 'Dest. Office' },
};

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'ORIGIN_OFFICE', office_id: '' };

// ── Confirmation Modal ──
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamation className="text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={confirmClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null); // { type, userId, userName }

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [u, o] = await Promise.all([API.get('/users'), API.get('/offices')]);
    setUsers(u.data); setOffices(o.data);
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
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role, office_id: u.office_id || '' });
    setEditing(u.id); setShowForm(true); window.scrollTo(0, 0);
  };

  const handleActivate = async (id) => {
    try {
      await API.patch(`/users/${id}/activate`);
      toast.success('User activated');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDeactivate = async (id) => {
    try {
      await API.patch(`/users/${id}/deactivate`);
      toast.success('User deactivated');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setConfirmModal(null);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      toast.success('User permanently deleted');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot delete — deactivate instead'); }
    setConfirmModal(null);
  };

  const filtered = users.filter(u => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || (statusFilter === 'active' ? u.is_active : !u.is_active);
    return matchRole && matchSearch && matchStatus;
  });

  const activeCount = users.filter(u => u.is_active).length;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {confirmModal?.type === 'deactivate' && (
        <ConfirmModal
          title="Deactivate User"
          message={`Are you sure you want to deactivate "${confirmModal.userName}"? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="btn-primary bg-amber-600 hover:bg-amber-500"
          onConfirm={() => handleDeactivate(confirmModal.userId)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {confirmModal?.type === 'delete' && (
        <ConfirmModal
          title="Permanently Delete User"
          message={`This will permanently delete "${confirmModal.userName}" from the system. If they have linked records, deletion will be blocked — deactivate instead.`}
          confirmLabel="Delete Permanently"
          confirmClass="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onConfirm={() => handleDelete(confirmModal.userId)}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">User Management</h1>
          <p className="text-gray-500 text-sm">{activeCount} active · {users.length - activeCount} inactive · {users.length} total</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_FORM); }}
          className={showForm ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}
        >
          {showForm ? <><HiOutlineXCircle /> Cancel</> : <><HiOutlinePlusCircle /> Add User</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            {editing ? <><HiOutlinePencil className="text-primary-400" />Edit User</> : <><HiOutlinePlusCircle className="text-emerald-400" />New User</>}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Full Name *</label>
              <input className="input-field" placeholder="e.g. Ahmed Mohamed" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Email *</label>
              <input className="input-field" type="email" placeholder="e.g. ahmed@sahancargo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Phone</label>
              <input className="input-field" placeholder="+252613456789" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">{editing ? 'New Password (blank = keep)' : 'Password *'}</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Role *</label>
              <select className="select-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="ORIGIN_OFFICE">Origin Office</option>
                <option value="AIRPORT_CARGO">Airport Cargo</option>
                <option value="DESTINATION_AIRPORT">Destination Airport</option>
                <option value="DESTINATION_OFFICE">Destination Office</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">Assigned Office</label>
              <select className="select-field" value={form.office_id} onChange={e => setForm({ ...form, office_id: e.target.value })}>
                <option value="">— No Office (Admin) —</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.office_name} ({o.office_type?.replace(/_/g, ' ')})</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Update User' : 'Create User'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input-field pl-9" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select-field w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="ORIGIN_OFFICE">Origin Office</option>
            <option value="AIRPORT_CARGO">Airport Cargo</option>
            <option value="DESTINATION_AIRPORT">Destination Airport</option>
            <option value="DESTINATION_OFFICE">Destination Office</option>
          </select>
          <select className="select-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="table-header">Name</th>
                <th className="table-header">Email / Phone</th>
                <th className="table-header">Role</th>
                <th className="table-header">Office</th>
                <th className="table-header">Status</th>
                <th className="table-header min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(u => {
                const roleStyle = ROLE_STYLES[u.role] || { bg: 'bg-gray-700 text-gray-300', label: u.role };
                return (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${u.is_active ? 'bg-primary-600/30 text-primary-400' : 'bg-gray-700 text-gray-500'}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-300">{u.email}</div>
                      {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleStyle.bg}`}>{roleStyle.label}</span>
                    </td>
                    <td className="table-cell text-sm">
                      {u.office ? (
                        <div>
                          <p className="text-white text-sm">{u.office.office_name}</p>
                          <p className="text-gray-500 text-xs">{u.office.office_type?.replace(/_/g, ' ')}</p>
                        </div>
                      ) : <span className="text-gray-600 text-xs">System Admin</span>}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${u.is_active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Edit — always shown */}
                        <button onClick={() => handleEdit(u)} title="Edit user" className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-900/20 transition-colors">
                          <HiOutlinePencil /> Edit
                        </button>
                        {/* ADMIN accounts cannot be deactivated or deleted */}
                        {u.role !== 'ADMIN' && (
                          <>
                            {u.is_active ? (
                              <button
                                onClick={() => setConfirmModal({ type: 'deactivate', userId: u.id, userName: u.name })}
                                className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-900/20 transition-colors"
                              >
                                <HiOutlineBan /> Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(u.id)}
                                className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-900/20 transition-colors"
                              >
                                <HiOutlineCheckCircle /> Activate
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmModal({ type: 'delete', userId: u.id, userName: u.name })}
                              className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors"
                            >
                              <HiOutlineTrash /> Delete
                            </button>
                          </>
                        )}
                        {u.role === 'ADMIN' && (
                          <span className="text-xs text-gray-600 italic">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="table-cell text-center text-gray-500 py-10">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
