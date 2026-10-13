import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import OwnerModal from '../components/OwnerModal';
import AssignEmployeeModal from '../components/AssignEmployeeModal';
import { renderStatusBadge } from './OwnerOverview';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  approveOwnerOrganization,
  suspendOwnerOrganization,
  reactivateOwnerOrganization
} from '../../../../services/owner';

const FILTERS = ['All', 'Active', 'Suspended'];
const smallBtn = { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };

/**
 * Exact replica of org-management-view from owner.html
 */
export default function OwnerOrganizations() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [organizations, setOrganizations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // Approve & Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null);

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { org, action }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgList, empList] = await Promise.all([
        fetchOwnerOrganizations(),
        fetchOwnerEmployees().catch(() => [])
      ]);
      setOrganizations(orgList || []);
      setEmployees(empList || []);
    } catch (err) {
      addToast(err.message || 'Failed to load organizations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = filter === 'All' ? organizations : organizations.filter((o) => o.status === filter);

  const handleApprove = async (orgId, employeeId) => {
    try {
      await approveOwnerOrganization(orgId, employeeId);
      addToast('Organization approved and employee assigned.', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to approve organization: ' + err.message, 'error');
      throw err;
    }
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { org, action } = actionTarget;
    try {
      if (action === 'suspend') await suspendOwnerOrganization(org.id);
      else await reactivateOwnerOrganization(org.id);
      addToast(`Organization ${action === 'suspend' ? 'suspended' : 'reactivated'}.`, 'success');
      setActionTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  return (
    <div id="org-management-view" className="view-section active">
      <h1 className="page-title">Organization Management</h1>
      <p className="page-subtitle">Manage all registered organizations — active, suspended and pending.</p>

      <div className="data-section-header" style={{ marginBottom: '1rem', padding: 0, border: 'none' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>Org ID</th>
              <th>Organization Name</th>
              <th>Admin Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Assigned Employee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="mgmtTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No {filter === 'All' ? '' : `${filter.toLowerCase()} `}organizations found.
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.adminEmail}</td>
                  <td>{org.subscriptionPlanId || '—'}</td>
                  <td>{renderStatusBadge(org.status)}</td>
                  <td>{employees.find((e) => e.id === org.assignedEmployeeId)?.name || '—'}</td>
                  <td>
                    {org.status === 'Active' && (
                      <button type="button" className="btn-secondary" style={smallBtn} onClick={() => setActionTarget({ org, action: 'suspend' })}>
                        Suspend
                      </button>
                    )}
                    {org.status === 'Suspended' && (
                      <button type="button" className="btn-primary" style={smallBtn} onClick={() => setActionTarget({ org, action: 'reactivate' })}>
                        Reactivate
                      </button>
                    )}
                    {org.status === 'Pending' && (
                      <button type="button" className="btn-primary" style={smallBtn} onClick={() => setAssignTarget(org)}>
                        Approve &amp; Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve & Assign Employee Modal */}
      <AssignEmployeeModal
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        onSubmit={handleApprove}
        organization={assignTarget}
        organizations={organizations}
        employees={employees}
      />

      {/* Suspend / Reactivate Confirmation Modal */}
      <OwnerModal
        isOpen={Boolean(actionTarget)}
        title={actionTarget?.action === 'suspend' ? 'Suspend Organization' : 'Reactivate Organization'}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        confirmText={actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
      >
        <p style={{ margin: 0, color: '#334155' }}>
          {actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'} <strong>{actionTarget?.org.name}</strong>?
        </p>
      </OwnerModal>
    </div>
  );
}
