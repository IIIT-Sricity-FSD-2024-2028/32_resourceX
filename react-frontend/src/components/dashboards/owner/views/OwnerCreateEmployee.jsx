import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createOwnerEmployee } from '../../../../services/owner';
import DocumentUpload from '../../../common/DocumentUpload';

// Mirrors backend/src/common/password.ts's PASSWORD_PATTERN — keep in sync by hand.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.';

/**
 * Exact replica of create-employee-view from owner.html
 */
export default function OwnerCreateEmployee() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [document, setDocument] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!PASSWORD_PATTERN.test(password)) {
      setFormError(PASSWORD_RULE_MESSAGE);
      return;
    }
    if (!document) {
      setFormError('Please upload the employee\'s details document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emp = await createOwnerEmployee({ name: name.trim(), email: email.trim(), password, ...document });
      addToast(`Employee created! ID: ${emp.id} — ${emp.name}`, 'success');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDocument(null);
      setResetKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message);
      addToast(`Failed to create employee: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-employee-view" className="view-section active">
      <h1 className="page-title">Create Employee</h1>
      <p className="page-subtitle">Add a new platform support employee account.</p>

      <div className="data-section" style={{ maxWidth: '520px', padding: '1.5rem' }}>
        <form id="createEmpForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Priya Sharma"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. employee6@resourcex.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Create a password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
              At least 8 characters, with an uppercase letter, a number, and a symbol.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Re-enter the password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <DocumentUpload
            label="Employee Details Document"
            required
            onChange={setDocument}
            resetKey={resetKey}
            hint="ID proof or employment details. PDF, PNG or JPG, up to 5 MB."
          />
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            The employee will log in with this email and password.
          </p>
          {formError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '8px',
                padding: '0.6rem 0.9rem',
                fontSize: '0.875rem'
              }}
            >
              {formError}
            </div>
          )}
          <button
            type="submit"
            id="createEmpBtn"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}
