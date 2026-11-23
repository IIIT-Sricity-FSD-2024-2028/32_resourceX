import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../components/AdminModal';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import { renderRoleBadge } from './AdminOverview';
import { DocumentLink } from '../../../common/DocumentUpload';
import BulkImportModal from '../../../common/BulkImportModal';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchUsers,
  fetchDepartments,
  fetchOrganization,
  createUser,
  updateUser,
  deactivateUser,
  suspendUser,
  reactivateUser,
  bulkCreateUsers,
  selectAdminUsers,
  selectAdminDepartments,
  selectAdminOrganization,
  selectAdminUsersLoading,
  selectUserOperationLoading,
} from '../../../../store/slices/admin/adminSlice';

const ROLE_OPTIONS = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Inventory Officer',
  'Maintenance Officer',
  'Procurement Officer',
];

/**
 * AdminUsers View
 * Manages institutional accounts, role assignments, department associations,
 * document verification, and account status transitions.
 * Fully integrated with Redux Toolkit (adminSlice).
 */
export default function AdminUsers() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  // Redux state
  const users = useAppSelector(selectAdminUsers);
  const departments = useAppSelector(selectAdminDepartments);
  const organization = useAppSelector(selectAdminOrganization);
  const isLoading = useAppSelector(selectAdminUsersLoading);
  const isOperating = useAppSelector(selectUserOperationLoading);

  // Search & filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
    dispatch(fetchOrganization());
  }, [dispatch]);

  const displayUsers = [...users].reverse();
  const allManageable = displayUsers.filter((u) => u.role !== 'System Admin');

  const query = search.trim().toLowerCase();
  const manageableUsers = allManageable.filter((u) => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All' && (u.status || 'Active') !== statusFilter) return false;
    if (
      query &&
      !(u.name || '').toLowerCase().includes(query) &&
      !(u.email || '').toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });

  // User CRUD Handlers
  const handleSaveAdd = async (userData) => {
    try {
      await dispatch(createUser(userData)).unwrap();
      addToast('New user successfully added.', 'success');
      setIsAddOpen(false);
      dispatch(fetchUsers());
    } catch (err) {
      addToast(err || 'Failed to add user', 'error');
      throw err;
    }
  };

  const handleSaveEdit = async (updates) => {
    if (!editUserTarget) return;
    try {
      await dispatch(updateUser({ id: editUserTarget.id, updates })).unwrap();
      addToast('User details updated permanently.', 'success');
      setEditUserTarget(null);
      dispatch(fetchUsers());
    } catch (err) {
      addToast(err || 'Failed to update user', 'error');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deactivateUser(deleteTarget.id)).unwrap();
      addToast('User deactivated.', 'success');
      setDeleteTarget(null);
      dispatch(fetchUsers());
    } catch (err) {
      addToast(err || 'Failed to deactivate user', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.status === 'Suspended') {
        await dispatch(reactivateUser(user.id)).unwrap();
        addToast('User reactivated.', 'success');
      } else {
        await dispatch(suspendUser(user.id)).unwrap();
        addToast('User suspended.', 'warning');
      }
      dispatch(fetchUsers());
    } catch (err) {
      addToast(err || 'Failed to change status', 'error');
    }
  };

  const handleBulkImport = async (rows) => {
    try {
      const result = await dispatch(bulkCreateUsers(rows)).unwrap();
      dispatch(fetchUsers());
      return result;
    } catch (err) {
      addToast(err || 'Bulk import failed', 'error');
      throw err;
    }
  };

  return (
    <div id="user-manage-view" className="view-section active">
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">Configure system users, assignments, and structural roles.</p>

      {/* Control Bar: Add Button, Bulk Import, Filters, and Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            id="open-add-user-btn"
            onClick={() => setIsAddOpen(true)}
          >
            + Add New User
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsImportOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Bulk Import (Excel/CSV)
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '150px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            style={{ width: '220px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>Name & Email</th>
              <th>System Role</th>
              <th>Department Access</th>
              <th>Status</th>
              <th>Document</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="users-table-tbody">
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading users...
                </td>
              </tr>
            ) : manageableUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No matching users found.
                </td>
              </tr>
            ) : (
              manageableUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>{renderRoleBadge(u.role)}</td>
                  <td>{u.department || 'N/A'}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.status === 'Active'
                          ? 'active'
                          : u.status === 'Suspended'
                          ? 'pending'
                          : 'rejected'
                      }`}
                      style={
                        u.status === 'Active'
                          ? { background: '#dcfce7', color: '#15803d' }
                          : u.status === 'Suspended'
                          ? { background: '#fef3c7', color: '#b45309' }
                          : { background: '#fee2e2', color: '#b91c1c' }
                      }
                    >
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <DocumentLink
                      fileName={u.documentFileName}
                      fileType={u.documentFileType}
                      fileDataUrl={u.documentFileDataUrl}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setEditUserTarget(u)}
                      >
                        Edit
                      </button>

                      {u.status !== 'Inactive' && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            color: u.status === 'Suspended' ? '#15803d' : '#b45309',
                          }}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}

                      {u.status !== 'Inactive' && (
                        <button
                          type="button"
                          className="btn-danger"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDeleteTarget(u)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleSaveAdd}
        departments={departments}
        users={users}
        orgName={organization?.name || ''}
        isSubmitting={isOperating}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={Boolean(editUserTarget)}
        user={editUserTarget}
        onClose={() => setEditUserTarget(null)}
        onSave={handleSaveEdit}
        departments={departments}
        users={users}
        isSubmitting={isOperating}
      />

      {/* Deactivate User Confirmation Modal */}
      <AdminModal
        isOpen={Boolean(deleteTarget)}
        title="Confirm Deactivation"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        confirmText="Deactivate"
        confirmButtonClass="btn-danger"
      >
        <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem' }}>
          Are you sure you want to deactivate access for user{' '}
          <strong>{deleteTarget?.name}</strong>? This user will no longer be able to log in.
        </p>
      </AdminModal>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        actor="admin"
        departments={departments}
      />
    </div>
  );
}
