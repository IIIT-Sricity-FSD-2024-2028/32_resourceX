import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  approveOwnerOrganization,
  assignOwnerOrganizationEmployee,
  suspendOwnerOrganization,
  reactivateOwnerOrganization,
  selectOwnerOrganizations,
  selectOwnerEmployees,
  selectOwnerLoading
} from '../../../../store/slices/owner/ownerSlice';
import OwnerModal from '../components/OwnerModal';
import AssignEmployeeModal from '../components/AssignEmployeeModal';
import { renderStatusBadge } from './OwnerOverview';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

const STATUSES = ['Active', 'Suspended', 'Pending'];
const smallBtn = { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };

/**
 * Exact replica of org-management-view from owner.html
 */
export default function OwnerOrganizations() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const organizations = useAppSelector(selectOwnerOrganizations);
  const employees = useAppSelector(selectOwnerEmployees);
  const isLoading = useAppSelector(selectOwnerLoading);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');

  // Approve & Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { org, action }
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const isSuspending = actionTarget?.action === 'suspend';

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchOwnerOrganizations()).unwrap(),
        dispatch(fetchOwnerEmployees()).unwrap().catch(() => [])
      ]);
    } catch (err) {
      addToast(err?.message || err || 'Failed to load organizations', 'error');
    }
  }, [dispatch, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeName = (org) => employees.find((e) => e.id === org.assignedEmployeeId)?.name || '';
  const filtered = organizations.filter((o) =>
    (filter === 'All' || o.status === filter) &&
    (planFilter === 'All' || o.subscriptionPlanId === planFilter) &&
    (employeeFilter === 'All' || employeeName(o) === employeeFilter) &&
    matchesSearch(search, o.id, o.name, o.adminEmail, o.adminName, o.subscriptionPlanId, employeeName(o))
  );

  const handleApprove = async (orgId, employeeId) => {
    try {
      await dispatch(approveOwnerOrganization({ id: orgId, employeeId })).unwrap();
      addToast('Organization approved and employee assigned.', 'success');
      loadData();
    } catch (err) {
      addToast('Failed to approve organization: ' + (err?.message || err), 'error');
      throw err;
    }
  };

  const handleReassign = async (orgId, employeeId) => {
    try {
      await dispatch(assignOwnerOrganizationEmployee({ orgId, employeeId })).unwrap();
      const emp = employees.find((e) => e.id === employeeId);
      addToast(`Organization assigned to ${emp?.name || employeeId}.`, 'success');
      loadData();
    } catch (err) {
      addToast('Failed to change employee: ' + (err?.message || err), 'error');
      throw err;
    }
  };

  const closeStatusDialog = () => {
    setActionTarget(null);
    setStatusError('');
  };

  const handleConfirmAction = async () => {
    if (!actionTarget || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusError('');
    try {
      const updateStatus = isSuspending ? suspendOwnerOrganization : reactivateOwnerOrganization;
      const organization = await dispatch(updateStatus(actionTarget.org.id)).unwrap();
      addToast(`${organization.name} ${isSuspending ? 'suspended' : 'reactivated'}.`, 'success');
      closeStatusDialog();
    } catch (err) {
      setStatusError(err?.message || err || 'The organization status could not be updated.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div id="org-management-view" className="view-section active">
      <h1 className="page-title">Organization Management</h1>
      <p className="page-subtitle">Manage all registered organizations — active, suspended and pending.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by org ID, name, admin email or employee..."
          filters={[
            { label: 'All Statuses', value: filter, onChange: setFilter, options: STATUSES },
            { label: 'All Plans', value: planFilter, onChange: setPlanFilter, options: uniqueOptions(organizations, 'subscriptionPlanId') },
            { label: 'All Employees', value: employeeFilter, onChange: setEmployeeFilter, options: uniqueOptions(organizations, employeeName) },
          ]}
          resultCount={filtered.length}
          totalCount={organizations.length}
        />
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
                  No organizations match your search or filters.
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
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{employeeName(org) || '—'}</span>
                      {org.status !== 'Pending' && (
                        <button
                          type="button"
                          title="Change assigned employee"
                          aria-label={`Change assigned employee for ${org.name}`}
                          onClick={() => setReassignTarget(org)}
                          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--primary-color)', display: 'inline-flex' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                        </button>
                      )}
                    </div>
                  </td>
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

      {/* Change Assigned Employee Modal */}
      <AssignEmployeeModal
        mode="reassign"
        isOpen={Boolean(reassignTarget)}
        onClose={() => setReassignTarget(null)}
        onSubmit={handleReassign}
        organization={reassignTarget}
        organizations={organizations}
        employees={employees}
      />

      {/* Suspend / Reactivate Confirmation Modal */}
      <OwnerModal
        isOpen={Boolean(actionTarget)}
        title={isSuspending ? 'Suspend Organization' : 'Reactivate Organization'}
        onClose={closeStatusDialog}
        onConfirm={handleConfirmAction}
        confirmText={isSuspending ? 'Confirm Suspension' : 'Confirm Reactivation'}
        isSubmitting={isUpdatingStatus}
      >
        {statusError && <p role="alert" style={{ color: '#b91c1c' }}>{statusError}</p>}
        <p style={{ margin: 0, color: '#334155' }}>
          {isSuspending ? 'Suspend' : 'Reactivate'} <strong>{actionTarget?.org.name}</strong>?
          {' '}
          {isSuspending
            ? 'Members will lose access until the organization is reactivated.'
            : 'Members with active accounts will regain access.'}
        </p>
      </OwnerModal>
    </div>
  );
}
