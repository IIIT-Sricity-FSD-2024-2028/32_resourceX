import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import OwnerModal from '../components/OwnerModal';
import { renderStatusBadge } from './OwnerOverview';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  suspendOwnerEmployee,
  reactivateOwnerEmployee
} from '../../../../services/owner';

const smallBtn = { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };

/**
 * Exact replica of employees-view from owner.html
 */
export default function OwnerEmployees() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [organizations, setOrganizations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { emp, action }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgList, empList] = await Promise.all([
        fetchOwnerOrganizations().catch(() => []),
        fetchOwnerEmployees()
      ]);
      setOrganizations(orgList || []);
      setEmployees(empList || []);
    } catch (err) {
      addToast(err.message || 'Failed to load employees', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = employees.filter(
    (e) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
  );

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { emp, action } = actionTarget;
    try {
      if (action === 'suspend') await suspendOwnerEmployee(emp.id);
      else await reactivateOwnerEmployee(emp.id);
      addToast(`Employee ${action === 'suspend' ? 'suspended' : 'reactivated'}.`, 'success');
      setActionTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  return (
    <div id="employees-view" className="view-section active">
      <h1 className="page-title">Employee Management</h1>
      <p className="page-subtitle">Platform support employees and their assigned organizations.</p>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          id="empSearch"
          className="form-control"
          style={{ maxWidth: '320px' }}
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Orgs Managed</th>
              <th>Organizations (first 3)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="employeeTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading employees...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No employees found.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const empOrgs = organizations.filter((o) => o.assignedEmployeeId === emp.id);
                const names = empOrgs.slice(0, 3).map((o) => o.name).join(', ') || '—';
                const extra = empOrgs.length > 3 ? ` +${empOrgs.length - 3} more` : '';
                return (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.email}</td>
                    <td>{empOrgs.length}</td>
                    <td>{names}{extra}</td>
                    <td>{renderStatusBadge(emp.status)}</td>
                    <td>
                      {emp.status === 'Active' ? (
                        <button type="button" className="btn-secondary" style={smallBtn} onClick={() => setActionTarget({ emp, action: 'suspend' })}>
                          Suspend
                        </button>
                      ) : (
                        <button type="button" className="btn-primary" style={smallBtn} onClick={() => setActionTarget({ emp, action: 'reactivate' })}>
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend / Reactivate Confirmation Modal */}
      <OwnerModal
        isOpen={Boolean(actionTarget)}
        title={actionTarget?.action === 'suspend' ? 'Suspend Employee' : 'Reactivate Employee'}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        confirmText={actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
      >
        <p style={{ margin: 0, color: '#334155' }}>
          {actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'} <strong>{actionTarget?.emp.name}</strong>?
        </p>
      </OwnerModal>
    </div>
  );
}
