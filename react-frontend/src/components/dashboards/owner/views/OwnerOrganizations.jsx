import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import OwnerModal from '../components/OwnerModal';
import AssignEmployeeModal from '../components/AssignEmployeeModal';
import { renderStatusBadge } from './OwnerOverview';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  approveOwnerOrganization,
  assignOwnerOrganizationEmployee,
  suspendOwnerOrganization,
  reactivateOwnerOrganization,
  selectOwnerOrganizations,
  selectOwnerEmployees,
  selectOwnerLoading,
} from '../../../../store/slices/owner/ownerSlice';

const STATUSES = ['Active', 'Suspended', 'Pending'];
const smallBtn = { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };

/**
 * Exact replica of org-management-view from owner.html connected to Redux
 */
export default function OwnerOrganizations() {
  const dispatch = useDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const organizations = useSelector(selectOwnerOrganizations);
  const employees = useSelector(selectOwnerEmployees);
  const isLoading = useSelector(selectOwnerLoading);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');

  // Approve & Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { org, action }

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

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { org, action } = actionTarget;
    try {
      if (action === 'suspend') {
        await dispatch(suspendOwnerOrganization(org.id)).unwrap();
      } else {
        await dispatch(reactivateOwnerOrganization(org.id)).unwrap();
      }
      addToast(`Organization ${action === 'suspend' ? 'suspended' : 'reactivated'}.`, 'success');
      setActionTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed: ' + (err?.message || err), 'error');
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
