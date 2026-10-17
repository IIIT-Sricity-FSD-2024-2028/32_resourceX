import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AssignEmployeeModal from '../components/AssignEmployeeModal';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  approveOwnerOrganization
} from '../../../../services/owner';

/**
 * Exact replica of registrations-view from owner.html — pending organizations only
 */
export default function OwnerRegistrations() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [organizations, setOrganizations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approve & Assign Modal state
  const [assignTarget, setAssignTarget] = useState(null);

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
      addToast(err.message || 'Failed to load registrations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pending = organizations.filter((o) => o.status === 'Pending');

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

  return (
    <div id="registrations-view" className="view-section active">
      <h1 className="page-title">Org Registrations</h1>
      <p className="page-subtitle">Pending organizations waiting for approval and employee assignment.</p>

      <div className="data-section">
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
                  No pending registrations. All caught up! ✅
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
