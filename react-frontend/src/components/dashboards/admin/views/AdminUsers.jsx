import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../components/AdminModal';
import { renderRoleBadge } from './AdminOverview';
import {
  fetchAdminUsers,
  fetchAdminDepartments,
  createAdminUser,
  updateAdminUser
} from '../../../../services/admin';

/**
 * Exact replica of user-manage-view from admin.html
 */
export default function AdminUsers() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('Requestor');
  const [addDept, setAddDept] = useState('');
  const [addPassword, setAddPassword] = useState('');

  // Edit User Modal state
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Requestor');
  const [editDept, setEditDept] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editPassword, setEditPassword] = useState('');

  // Deactivate User Modal state
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
      if (dList && dList.length > 0 && !addDept) {
        setAddDept(dList[0].name);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayUsers = [...users].reverse();
  const managableUsers = displayUsers.filter((u) => u.role !== 'System Admin');

  const openAddModal = () => {
    setAddName('');
    setAddEmail('');
    setAddRole('Requestor');
    setAddDept(departments[0]?.name || '');
    setAddPassword('');
    setIsAddOpen(true);
  };

  const handleSaveAdd = async () => {
    const nameRegex = /^[a-zA-Z0-9\s.-]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      addToast('Please fill out all fields including password.', 'error');
      return;
    }
    if (!nameRegex.test(addName.trim())) {
      addToast('Name can only contain characters and numbers.', 'error');
      return;
    }
    if (!emailRegex.test(addEmail.trim())) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    if (addPassword.trim().length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      await createAdminUser({
        id: `U-9${Math.floor(100 + Math.random() * 900)}`,
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole,
        department: addDept || departments[0]?.name || 'Engineering',
        status: 'Active'
      });
      addToast('New user successfully added.', 'success');
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to add user', 'error');
    }
  };

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
    <div id="user-manage-view" className="view-section active">
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">Add, edit, and deactivate system user accounts comprehensively.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">All Users Roster</div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={openAddModal}
          >
            + Add New User
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
          <tbody id="all-users-tbody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading users...
                </td>
              </tr>
            ) : managableUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              managableUsers.map((u) => (
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

      {/* Add New User Modal */}
      <AdminModal
        isOpen={isAddOpen}
        title="Add New User"
        onClose={() => setIsAddOpen(false)}
        onConfirm={handleSaveAdd}
        confirmText="Confirm"
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="e.g. John Doe"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
          <input
            type="email"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="user@resourcex.com"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>System Role</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
          >
            <option value="Requestor">Requestor</option>
            <option value="Dept Head">Dept Head</option>
            <option value="Registrar">Registrar</option>
            <option value="Staff">Staff</option>
            <option value="System Admin">System Admin</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Department</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={addDept}
            onChange={(e) => setAddDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
          <input
            type="password"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Enter temporary password"
            value={addPassword}
            onChange={(e) => setAddPassword(e.target.value)}
          />
        </div>
      </AdminModal>

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
            <option value="Staff">Staff</option>
            <option value="System Admin">System Admin</option>
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
