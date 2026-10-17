import React, { useEffect, useState } from 'react';
import DocumentUpload, { DocumentLink } from '../../../common/DocumentUpload';

/**
 * Edit a platform employee: name, the organizations they manage, and (optionally) a replacement document.
 * Ticking an organization that belongs to another employee moves it to this one.
 */
export default function EditEmployeeModal({ isOpen, onClose, onSubmit, employee, organizations = [], employees = [] }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setSelected(organizations.filter((o) => o.assignedEmployeeId === employee.id).map((o) => o.id));
      setOrgSearch('');
      setDocument(null);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  if (!isOpen || !employee) return null;

  const employeeName = (id) => employees.find((e) => e.id === id)?.name;
  const q = orgSearch.trim().toLowerCase();
  const visibleOrgs = organizations.filter(
    (o) => !q || o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
  );
  const toggle = (orgId) =>
    setSelected((prev) => (prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]));
  const movedFromOthers = organizations.filter(
    (o) => selected.includes(o.id) && o.assignedEmployeeId && o.assignedEmployeeId !== employee.id
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(employee.id, { name: name.trim(), organizationIds: selected, ...(document || {}) });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '12px', maxWidth: '560px', width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Edit Employee — {employee.id}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">
              Assigned Organizations <span style={{ color: '#64748b', fontWeight: 400 }}>({selected.length} selected)</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter organizations by name or ID..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}
            />
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
              {visibleOrgs.length === 0 ? (
                <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>No organizations match.</div>
              ) : (
                visibleOrgs.map((org) => {
                  const owner = org.assignedEmployeeId && org.assignedEmployeeId !== employee.id ? employeeName(org.assignedEmployeeId) : null;
                  return (
                    <label
                      key={org.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      <input type="checkbox" checked={selected.includes(org.id)} onChange={() => toggle(org.id)} />
                      <span style={{ flex: 1 }}>
                        <strong>{org.name}</strong> <span style={{ color: '#94a3b8' }}>{org.id}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: owner ? '#b45309' : '#94a3b8' }}>
                        {owner ? `with ${owner}` : org.assignedEmployeeId === employee.id ? '' : 'unassigned'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {movedFromOthers.length > 0 && (
              <small style={{ color: '#b45309', display: 'block', marginTop: '0.35rem' }}>
                {movedFromOthers.length} organization{movedFromOthers.length !== 1 ? 's' : ''} will move from another employee to {name.trim() || 'this employee'}.
              </small>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Current document: <DocumentLink record={employee} />
          </div>
          <DocumentUpload label="Replace Document (optional)" onChange={setDocument} resetKey={employee.id} />

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
