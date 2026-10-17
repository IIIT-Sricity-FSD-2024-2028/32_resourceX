import React, { useState } from 'react';

// Platform staff (Owner / Employee) are not classified by department or organization;
// Requestors, Registrars and System Admins are general actors and are not classified by department either.
const NO_DEPARTMENT_ROLES = ['Owner', 'Employee', 'Registrar', 'System Admin', 'Requestor'];
const NO_ORGANIZATION_ROLES = ['Owner', 'Employee'];

export default function AccountInfo({ id, department, email, name, role, organizationName, organizationId, onNameChange }) {
  const [isEditable, setIsEditable] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleEditClick = () => {
    setIsEditable(true);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onNameChange(val); // Notify parent of name change

    // Validate
    const nameRegex = /^[a-zA-Z0-9\s.-]+$/;
    if (!val.trim()) {
      setNameError('Name is required.');
    } else if (!nameRegex.test(val)) {
      setNameError('Name can only contain characters and numbers.');
    } else {
      setNameError('');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>Account Information</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">User ID</label>
          <input type="text" className="form-control" value={id || ''} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
        </div>
        {!NO_DEPARTMENT_ROLES.includes(role) && (
          <div className="form-group">
            <label className="form-label">Department</label>
            <input type="text" className="form-control" value={department || ''} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
          </div>
        )}
        {!NO_ORGANIZATION_ROLES.includes(role) && (
          <div className="form-group">
            <label className="form-label">Organization</label>
            <input type="text" className="form-control" value={organizationName || organizationId || ''} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Role</label>
          <input type="text" className="form-control" value={role || ''} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-label">Full Name</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            value={name || ''} 
            disabled={!isEditable} 
            onChange={handleInputChange}
            style={{ borderColor: nameError ? '#ef4444' : 'var(--border-color)' }}
          />
          {!isEditable && (
            <button className="btn-secondary" style={{ padding: '0 1rem', whiteSpace: 'nowrap' }} onClick={handleEditClick} type="button">
              Edit
            </button>
          )}
        </div>
        {nameError && (
          <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500, marginTop: '0.4rem' }}>
            {nameError}
          </div>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-label">Email Address</label>
        <input type="email" className="form-control" value={email || ''} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
      </div>
    </div>
  );
}
