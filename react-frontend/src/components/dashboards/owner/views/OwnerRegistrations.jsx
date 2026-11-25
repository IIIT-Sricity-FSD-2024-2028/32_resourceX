import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  approveOwnerOrganization,
  selectOwnerOrganizations,
  selectOwnerEmployees,
  selectOwnerLoading
} from '../../../../store/slices/owner/ownerSlice';
import AssignEmployeeModal from '../components/AssignEmployeeModal';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';

/**
 * Exact replica of registrations-view from owner.html — pending organizations only
 */
export default function OwnerRegistrations() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const organizations = useAppSelector(selectOwnerOrganizations);
  const employees = useAppSelector(selectOwnerEmployees);
  const isLoading = useAppSelector(selectOwnerLoading);

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');

  // Approve & Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchOwnerOrganizations()).unwrap(),
        dispatch(fetchOwnerEmployees()).unwrap().catch(() => [])
      ]);
    } catch (err) {
      addToast(err?.message || err || 'Failed to load registrations', 'error');
    }
  }, [dispatch, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allPending = organizations.filter((o) => o.status === 'Pending');
  const pending = allPending.filter((o) =>
    (planFilter === 'All' || o.subscriptionPlanId === planFilter) &&
    matchesSearch(search, o.id, o.name, o.adminEmail, o.adminName, o.subscriptionPlanId)
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

  return (
    <div id="registrations-view" className="view-section active">
      <h1 className="page-title">Org Registrations</h1>
      <p className="page-subtitle">Pending organizations waiting for approval and employee assignment.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by org ID, name, admin name or email..."
          filters={[
            { label: 'All Plans', value: planFilter, onChange: setPlanFilter, options: uniqueOptions(allPending, 'subscriptionPlanId') },
          ]}
          resultCount={pending.length}
          totalCount={allPending.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Org ID</th>
              <th>Organization Name</th>
              <th>Admin Email</th>
              <th>Plan</th>
              <th>Proof Documents</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="regTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  {allPending.length === 0 ? 'No pending registrations. All caught up! ✅' : 'No registrations match your search.'}
                </td>
              </tr>
            ) : (
              pending.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.adminEmail}</td>
                  <td>{org.subscriptionPlanId || '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {org.adminProofFileDataUrl ? (
                      <a href={org.adminProofFileDataUrl} download={org.adminProofFileName || 'admin-proof'}>
                        System Admin proof
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No admin proof</span>
                    )}
                    <br />
                    {org.orgProofFileDataUrl ? (
                      <a href={org.orgProofFileDataUrl} download={org.orgProofFileName || 'organization-proof'}>
                        Organization details
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No organization proof</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      onClick={() => setAssignTarget(org)}
                    >
                      Approve &amp; Assign
                    </button>
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
    </div>
  );
}
