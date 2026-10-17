import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../components/AdminModal';
import { renderRoleBadge } from './AdminOverview';
import {
  fetchAdminUsers,
  fetchAdminDepartments,
  fetchAdminOrganization,
  createAdminUser,
  updateAdminUser
} from '../../../../services/admin';

// Organization-level email format: {name}{roleCode}{organizationName}@gmail.com
const ROLE_EMAIL_CODES = {
  Requestor: 're',
  Registrar: 'rg',
  'System Admin': 'sa',
  'Dept Head': 'dh',
  'Maintenance Officer': 'mo',
  'Inventory Officer': 'io',
  'Procurement Officer': 'po'
};
const slug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const ROLE_OPTIONS = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Inventory Officer',
  'Maintenance Officer',
  'Procurement Officer'
];

/**
 * Exact replica of user-manage-view from admin.html
 */
export default function AdminUsers() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [orgName, setOrgName] = useState('');
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

  // Search & filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Deactivate User Modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, dList, org] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminDepartments().catch(() => []),
        fetchAdminOrganization().catch(() => null)
      ]);
      setOrgName(org?.name || '');
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
  const allManagable = displayUsers.filter((u) => u.role !== 'System Admin');

  const query = search.trim().toLowerCase();
  const managableUsers = allManagable.filter((u) => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All' && (u.status || 'Active') !== statusFilter) return false;
    if (query && !(u.name || '').toLowerCase().includes(query) && !(u.email || '').toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  // Requestors and Registrars are general actors and are not classified by department
  const roleHasDepartment = (role) => role !== 'Registrar' && role !== 'Requestor';

  // One department can have only one head: for Dept Head only offer departments without an active head
  const departmentsForRole = (role, selfId) => {
    if (role !== 'Dept Head') return departments;
    const headed = new Set(
      users
        .filter((u) => u.role === 'Dept Head' && u.status !== 'Inactive' && u.id !== selfId)
        .map((u) => u.department)
    );
    return departments.filter((d) => !headed.has(d.name));
  };

  const orgSlug = slug(orgName);
  const emailSuffix = (role) => `${ROLE_EMAIL_CODES[role] || ''}${orgSlug}@gmail.com`;
  const emailError = (email, role) => {
    const value = email.trim().toLowerCase();
    const suffix = emailSuffix(role);
    const local = value.slice(0, Math.max(0, value.length - suffix.length));
    return !value.endsWith(suffix) || !/^[a-z0-9]+$/.test(local) ? `Email must look like {name}${suffix}` : '';
  };

  const addDeptOptions = departmentsForRole(addRole);
  const editDeptOptions = departmentsForRole(editRole, editUser?.id);

  const handleAddRoleChange = (role) => {
    setAddRole(role);
    const opts = departmentsForRole(role);
    if (!opts.some((d) => d.name === addDept)) setAddDept(opts[0]?.name || '');
  };

  const handleEditRoleChange = (role) => {
    setEditRole(role);
    const opts = departmentsForRole(role, editUser?.id);
    if (!opts.some((d) => d.name === editDept)) setEditDept(opts[0]?.name || '');
  };

  const openAddModal = () => {
    setAddName('');
    setAddEmail('');
    setAddRole('Requestor');
    setAddDept(departmentsForRole('Requestor')[0]?.name || '');
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
    if (orgSlug && emailError(addEmail, addRole)) {
      addToast(`${emailError(addEmail, addRole)} (e.g. ${slug(addName.split(' ')[0] || 'john')}${emailSuffix(addRole)}).`, 'error');
      return;
    }
    if (users.some((u) => (u.email || '').toLowerCase() === addEmail.trim().toLowerCase())) {
      addToast('A user with this email already exists.', 'error');
      return;
    }
    if (addRole === 'Dept Head' && !addDept) {
      addToast('No department without a head is available. Create a department first.', 'error');
      return;
    }

    try {
      await createAdminUser({
        id: `U-9${Math.floor(100 + Math.random() * 900)}`,
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole,
        ...(roleHasDepartment(addRole) ? { department: addDept || departments[0]?.name } : {}),
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
    if (editRole === 'Dept Head' && !editDept) {
      addToast('Select a department without a head for the Department Head role.', 'error');
      return;
    }

    try {
      const updates = {
        name: editName.trim(),
        role: editRole,
        ...(roleHasDepartment(editRole) ? { department: editDept } : {}),
        status: editStatus
      };
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem' }}>
          <input
            type="text"
            className="form-control"
            style={{ flex: '1 1 260px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All System Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="form-control"
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
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
                  <td>{u.department || '—'}</td>
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
            placeholder={`e.g. john${emailSuffix(addRole)}`}
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
          />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Format: {'{name}'}{emailSuffix(addRole)}
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>System Role</label>
          <select
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={addRole}
            onChange={(e) => handleAddRoleChange(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {roleHasDepartment(addRole) && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Department</label>
            <select
              className="form-control"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              value={addDept}
              onChange={(e) => setAddDept(e.target.value)}
            >
              {addDeptOptions.length === 0 && <option value="">No department without a head</option>}
              {addDeptOptions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {addRole === 'Dept Head' && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Only departments without a head are listed (one head per department).
              </div>
            )}
          </div>
        )}
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
            onChange={(e) => handleEditRoleChange(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {roleHasDepartment(editRole) && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Department</label>
            <select
              className="form-control"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              value={editDept}
              onChange={(e) => setEditDept(e.target.value)}
            >
              {editDeptOptions.length === 0 && <option value="">No department without a head</option>}
              {editDeptOptions.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {editRole === 'Dept Head' && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Only departments without a head are listed (one head per department).
              </div>
            )}
          </div>
        )}
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
