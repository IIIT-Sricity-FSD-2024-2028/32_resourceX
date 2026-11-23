import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import AdminStatsCards from '../components/AdminStatsCards';
import AdminModal from '../components/AdminModal';
import EditUserModal from '../components/EditUserModal';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAdminOverview,
  fetchUsers,
  fetchDepartments,
  updateUser,
  deactivateUser,
  selectAdminUsers,
  selectAdminDepartments,
  selectAdminOverviewLoading,
  selectUserOperationLoading,
} from '../../../../store/slices/admin/adminSlice';

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
 * AdminOverview View
 * Displays high-level system metrics, topology stats, and recent user accounts.
 * Fully integrated with Redux Toolkit (adminSlice).
 */
export default function AdminOverview() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  // Redux state selectors
  const users = useAppSelector(selectAdminUsers);
  const departments = useAppSelector(selectAdminDepartments);
  const isLoading = useAppSelector(selectAdminOverviewLoading);
  const isOperating = useAppSelector(selectUserOperationLoading);

  // Local UI states
  const [search, setSearch] = useState('');
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Initial data dispatch
  useEffect(() => {
    dispatch(fetchAdminOverview())
      .unwrap()
      .catch((err) => {
        addToast(err || 'Failed to load administrative overview', 'error');
      });
  }, [dispatch]);

  const roles = new Set(users.map((u) => u.role));
  const displayUsers = [...users].reverse();
  const manageableUsers = displayUsers.filter((u) => u.role !== 'System Admin');
  const recentUsers = manageableUsers
    .filter((u) => matchesSearch(search, u.name, u.email, u.role, u.department, u.status))
    .slice(0, 5);

  const handleSaveEdit = async (updates) => {
    if (!editUserTarget) return;
    try {
      await dispatch(updateUser({ id: editUserTarget.id, updates })).unwrap();
      addToast('User details updated successfully.', 'success');
      setEditUserTarget(null);
      // Refresh list to maintain state consistency
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
      addToast('User account deactivated.', 'success');
      setDeleteTarget(null);
      dispatch(fetchUsers());
    } catch (err) {
      addToast(err || 'Failed to deactivate user', 'error');
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

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search users by name, email, role or department..."
        />

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
                  No users found matching query.
                </td>
              </tr>
            ) : (
              recentUsers.map((u) => (
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
    </div>
  );
}
