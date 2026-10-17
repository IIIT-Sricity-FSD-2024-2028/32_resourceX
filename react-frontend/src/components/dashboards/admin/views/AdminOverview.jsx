import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AdminStatsCards from '../components/AdminStatsCards';
import AdminModal from '../components/AdminModal';
import {
  fetchAdminUsers,
  fetchAdminDepartments,
  updateAdminUser,
  deactivateAdminUser
} from '../../../../services/admin';

export function renderRoleBadge(role) {
  if (role === 'Dept Head') {
    return (
      <span className="badge pending" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
        {role}
      </span>
    );
  }
  if (role === 'Inventory Officer' || role === 'Maintenance Officer' || role === 'Procurement Officer') {
    return <span className="badge pending" style={{ background: '#e0f2fe', color: '#0369a1' }}>{role}</span>;
  }
  if (role === 'System Admin') {
    return (
      <span className="badge" style={{ background: '#fecaca', color: '#b91c1c' }}>
        {role}
      </span>
    );
  }
  if (role === 'Registrar') {
    return (
      <span className="badge allocated" style={{ background: '#fef08a', color: '#854d0e' }}>
        {role}
      </span>
    );
  }
  return (
    <span className="badge" style={{ background: '#cbd5e1', color: '#0f172a' }}>
      {role}
    </span>
  );
}

/**
 * Exact replica of dashboard-view from admin.html
 */
export default function AdminOverview() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit User Modal state
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Requestor');
  const [editDept, setEditDept] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editPassword, setEditPassword] = useState('');

  // Delete User Modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminDepartments().catch(() => [])
      ]);
      setUsers(uList || []);
      setDepartments(dList || []);
    } catch (err) {
      addToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const roles = new Set(users.map((u) => u.role));
  const displayUsers = [...users].reverse();
  const managableUsers = displayUsers.filter((u) => u.role !== 'System Admin');
  const recentUsers = managableUsers.slice(0, 5);

  const openEditModal = (user) => {
    setEditUser(user);
    setEditName(user.name || '');
    setEditRole(user.role || 'Requestor');
    setEditDept(user.department || (departments[0]?.name || ''));
    setEditStatus(user.status || 'Active');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    const nameRegex = /^[a-zA-Z0-9\s.-]+$/;
    if (!editName.trim()) {
      addToast('Name cannot be empty.', 'error');
      return;
    }
    if (!nameRegex.test(editName.trim())) {
      addToast('Name can only contain characters and numbers.', 'error');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      const updates = {
        name: editName.trim(),
        role: editRole,
        department: editDept,
        status: editStatus
      };
      if (editPassword) {
        updates.password = editPassword;
      }
      await updateAdminUser(editUser.id, updates);
      addToast('User details updated permanently.', 'success');
      setEditUser(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await updateAdminUser(deleteTarget.id, { status: 'Inactive' });
      addToast('User deactivated.', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to deactivate user', 'error');
    }
  };

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Configure system users, assignments, and structural roles.</p>

      {/* Stats Row */}
      <AdminStatsCards
        totalUsers={users.length}
        totalDepts={departments.length}
        totalRoles={roles.size || 5}
      />

      {/* Recent Users Data Section */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Recent Users</div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => navigate('/dashboard/admin/users')}
          >
            View All
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>System Role</th>
              <th>Department Access</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody id="dash-users-tbody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading recent users...
                </td>
              </tr>
            ) : recentUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No users available.
                </td>
              </tr>
            ) : (
              recentUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.name}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                      {u.email}
                    </div>
                  </td>
                  <td>{renderRoleBadge(u.role)}</td>
                  <td>{u.department}</td>
                  <td>
                    <span className="badge allocated">{u.status || 'Active'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => openEditModal(u)}
                    >
                      Edit Access
                    </button>
                    {u.role !== 'System Admin' && (
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}
                        onClick={() => setDeleteTarget(u)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <AdminModal
        isOpen={Boolean(editUser)}
        title="Edit User"
        onClose={() => setEditUser(null)}
        onConfirm={handleSaveEdit}
        confirmText="Confirm"
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
          >
            <option value="Requestor">Requestor</option>
            <option value="Dept Head">Dept Head</option>
            <option value="Registrar">Registrar</option>
            <option value="Inventory Officer">Inventory Officer</option>
            <option value="Maintenance Officer">Maintenance Officer</option>
            <option value="Procurement Officer">Procurement Officer</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Department</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editDept}
            onChange={(e) => setEditDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Account Status</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            New Password{' '}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
              (Leave blank to keep current)
            </span>
          </label>
          <input
            type="password"
            placeholder="Enter new password"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
          />
        </div>
      </AdminModal>

      {/* Deactivate User Modal */}
      <AdminModal
        isOpen={Boolean(deleteTarget)}
        title="Deactivate User"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        confirmText="Confirm"
      >
        <p style={{ color: '#64748b', margin: 0 }}>
          Are you absolutely sure you want to deactivate this user? They will lose access immediately.
        </p>
      </AdminModal>
    </div>
  );
}
