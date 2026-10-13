import React, { useState, useEffect } from 'react';

/**
 * Exact replica of assignEmployeeModal from owner.html —
 * approve a pending organization and assign a support employee (fewest orgs first = recommended).
 */
export default function AssignEmployeeModal({ isOpen, onClose, onSubmit, organization, organizations = [], employees = [] }) {
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countFor = (empId) => organizations.filter((o) => o.assignedEmployeeId === empId).length;
  const sorted = [...employees].sort((a, b) => countFor(a.id) - countFor(b.id));

  useEffect(() => {
    if (organization) {
      setEmployeeId(sorted[0]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  if (!isOpen || !organization) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) return;
    setIsSubmitting(true);
    try {
      await onSubmit(organization.id, employeeId);
      onClose();
    } catch {
      // error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Approve &amp; Assign Employee</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
            Select a support employee to manage <strong>{organization.name}</strong>. Employees are sorted by fewest
            organizations first.
          </p>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Assign to Employee</label>
            <select className="form-control" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">-- Select Employee --</option>
              {sorted.map((emp, idx) => {
                const count = countFor(emp.id);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({count} org{count !== 1 ? 's' : ''}){idx === 0 ? ' — Recommended' : ''}
                  </option>
                );
              })}
            </select>
            {employeeId && (
              <small style={{ color: '#64748b' }}>
                This employee currently manages {countFor(employeeId)} organization
                {countFor(employeeId) !== 1 ? 's' : ''}.
              </small>
            )}
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting || !employeeId}>
            {isSubmitting ? 'Approving...' : 'Approve & Assign'}
          </button>
        </form>
      </div>
    </div>
  );
}
