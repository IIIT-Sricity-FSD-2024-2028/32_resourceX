import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import DocumentUpload from '../../../common/DocumentUpload';

const ROLE_EMAIL_CODES = {
  Requestor: 're',
  Registrar: 'rg',
  'System Admin': 'sa',
  'Dept Head': 'dh',
  'Maintenance Officer': 'mo',
  'Inventory Officer': 'io',
  'Procurement Officer': 'po',
};

const ROLE_OPTIONS = [
  'Requestor',
  'Dept Head',
  'Registrar',
  'Inventory Officer',
  'Maintenance Officer',
  'Procurement Officer',
];

const slug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * AddUserModal Component
 * Controlled modal dialog to create a new user account with role-based validation,
 * email pattern calculation, department head constraints, and document upload.
 */
export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  departments = [],
  users = [],
  orgName = '',
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Requestor');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [document, setDocument] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Requestor and Registrar do not belong to a department
  const roleHasDepartment = (r) => r !== 'Registrar' && r !== 'Requestor';

  // Only allow departments that do not already have an active head
  const departmentsForRole = (r) => {
    if (r !== 'Dept Head') return departments;
    const activeHeaded = new Set(
      users
        .filter((u) => u.role === 'Dept Head' && u.status !== 'Inactive')
        .map((u) => u.department)
    );
    return departments.filter((d) => !activeHeaded.has(d.name));
  };

  const orgSlug = slug(orgName);
  const emailSuffix = (r) => `${ROLE_EMAIL_CODES[r] || ''}${orgSlug}@gmail.com`;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setRole('Requestor');
      setDepartment(departments[0]?.name || '');
      setPassword('');
      setDocument(null);
      setErrorMsg('');
      setFormKey((prev) => prev + 1);
    }
  }, [isOpen, departments]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    const opts = departmentsForRole(newRole);
    if (!opts.some((d) => d.name === department)) {
      setDepartment(opts[0]?.name || '');
    }
  };

  const handleAutoSuggestEmail = () => {
    const firstPart = slug(name.split(' ')[0] || 'user');
    setEmail(`${firstPart}${emailSuffix(role)}`);
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    const nameRegex = /^[a-zA-Z0-9\s.-]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setErrorMsg('Please fill out all fields including password.');
      return;
    }
    if (!nameRegex.test(trimmedName)) {
      setErrorMsg('Name can only contain characters, numbers, dots, and hyphens.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (trimmedPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!document) {
      setErrorMsg('Please upload a verification document for the new user.');
      return;
    }

    // Role-specific email rule
    if (orgSlug) {
      const suffix = emailSuffix(role);
      const val = trimmedEmail.toLowerCase();
      const local = val.slice(0, Math.max(0, val.length - suffix.length));
      if (!val.endsWith(suffix) || !/^[a-z0-9]+$/.test(local)) {
        setErrorMsg(`Email must match institutional format: {name}${suffix}`);
        return;
      }
    }

    // Duplicate email check
    if (users.some((u) => (u.email || '').toLowerCase() === trimmedEmail.toLowerCase())) {
      setErrorMsg('A user with this email address already exists.');
      return;
    }

    // Single department head check
    if (role === 'Dept Head' && !department) {
      setErrorMsg('No department without a head is available. Create a department first.');
      return;
    }

    const payload = {
      id: `U-9${Math.floor(100 + Math.random() * 900)}`,
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      role,
      ...(roleHasDepartment(role) ? { department: department || departments[0]?.name } : {}),
      status: 'Active',
      ...document,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add user');
    }
  };

  const availableDepts = departmentsForRole(role);

  return (
    <AdminModal
      isOpen={isOpen}
      title="Add New User Account"
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText={isSubmitting ? 'Creating...' : 'Create Account'}
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
            Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. John Doe"
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
            {role === 'Dept Head' && (
              <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                Note: Each department may have strictly one active Department Head.
              </small>
            )}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {name && orgSlug && (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                onClick={handleAutoSuggestEmail}
              >
                Auto-fill
              </button>
            )}
          </div>
          <input
            type="email"
            className="form-control"
            placeholder={orgSlug ? `e.g. john${emailSuffix(role)}` : 'e.g. user@domain.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Temporary Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="password"
            className="form-control"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Verification Document (PDF, PNG, JPG max 5MB) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <DocumentUpload
            key={formKey}
            label="Upload Proof"
            required={true}
            onChange={setDocument}
          />
        </div>
      </div>
    </AdminModal>
  );
}
