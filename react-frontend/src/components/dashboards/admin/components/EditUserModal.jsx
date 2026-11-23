import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';

const ROLE_OPTIONS = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Inventory Officer',
  'Maintenance Officer',
  'Procurement Officer',
];

/**
 * EditUserModal Component
 * Controlled modal dialog to update user details, permissions, role, and departmental assignment.
 */
export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  departments = [],
  users = [],
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Requestor');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const roleHasDepartment = (r) => r !== 'Registrar' && r !== 'Requestor';

  const departmentsForRole = (r, selfId) => {
    if (r !== 'Dept Head') return departments;
    const headed = new Set(
      users
        .filter((u) => u.role === 'Dept Head' && u.status !== 'Inactive' && u.id !== selfId)
        .map((u) => u.department)
    );
    return departments.filter((d) => !headed.has(d.name));
  };

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setRole(user.role || 'Requestor');
      setDepartment(user.department || '');
      setStatus(user.status || 'Active');
      setPassword('');
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    const opts = departmentsForRole(newRole, user?.id);
    if (!opts.some((d) => d.name === department)) {
      setDepartment(opts[0]?.name || '');
    }
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    const nameRegex = /^[a-zA-Z0-9\s.-]+$/;
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMsg('Name cannot be empty.');
      return;
    }
    if (!nameRegex.test(trimmedName)) {
      setErrorMsg('Name can only contain characters, numbers, dots, and hyphens.');
      return;
    }
    if (role === 'Dept Head' && !department) {
      setErrorMsg('Select a department without an existing head for the Department Head role.');
      return;
    }
    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long if changed.');
      return;
    }

    const updates = {
      name: trimmedName,
      role,
      ...(roleHasDepartment(role) ? { department } : { department: '' }),
      status,
    };
    if (password) {
      updates.password = password;
    }

    try {
      await onSave(updates);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user');
    }
  };

  const availableDepts = departmentsForRole(role, user?.id);

  return (
    <AdminModal
      isOpen={isOpen}
      title="Edit User Access"
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText={isSubmitting ? 'Saving...' : 'Save Changes'}
    >
      {errorMsg && (
        <div
          style={{
            padding: '0.625rem 0.875rem',
            marginBottom: '1rem',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            User ID
          </label>
          <input
            type="text"
            className="form-control"
            value={user?.id || ''}
            disabled
            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Email
          </label>
          <input
            type="email"
            className="form-control"
            value={user?.email || ''}
            disabled
            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            System Role <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="form-control"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {roleHasDepartment(role) && (
          <div>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Department <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="form-control"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {availableDepts.length === 0 ? (
                <option value="">No available department</option>
              ) : (
                availableDepts.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Account Status <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Reset Password (optional)
          </label>
          <input
            type="password"
            className="form-control"
            placeholder="Leave blank to keep existing password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
    </AdminModal>
  );
}
