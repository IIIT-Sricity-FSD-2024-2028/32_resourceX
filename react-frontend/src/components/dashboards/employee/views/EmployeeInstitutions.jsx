import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmployeeModal from '../components/EmployeeModal';
import { renderStatusBadge } from './EmployeeOverview';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import {
  fetchEmployeeInstitutions,
  suspendEmployeeInstitution,
  reactivateEmployeeInstitution
} from '../../../../services/employee';
import { useAuth } from '../../../../context/AuthContext';

const smallBtn = { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };

/**
 * Exact replica of institutions-view from employee.html
 */
export default function EmployeeInstitutions() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;
  const { user: currentUser } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { org, action }

  const loadData = async () => {
    setIsLoading(true);
    try {
      setInstitutions(await fetchEmployeeInstitutions(currentUser?.id));
    } catch (err) {
      addToast(err.message || 'Failed to load institutions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const list = institutions.filter((o) =>
    (filter === 'All' || o.status === filter) &&
    (planFilter === 'All' || o.subscriptionPlanId === planFilter) &&
    matchesSearch(search, o.name, o.id, o.adminEmail, o.adminName, o.subscriptionPlanId)
  );

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { org, action } = actionTarget;
    try {
      if (action === 'suspend') await suspendEmployeeInstitution(org.id);
      else await reactivateEmployeeInstitution(org.id);
      addToast(`Institution ${action === 'suspend' ? 'suspended' : 'reactivated'}.`, 'success');
      setActionTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  return (
    <div id="institutions-view" className="view-section active">
      <h1 className="page-title">Institution Management</h1>
      <p className="page-subtitle">Manage institution accounts assigned to you — activate or suspend.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by ID, institution name or admin email..."
          filters={[
            { label: 'All Statuses', value: filter, onChange: setFilter, options: ['Active', 'Suspended', 'Pending'] },
            { label: 'All Plans', value: planFilter, onChange: setPlanFilter, options: uniqueOptions(institutions, 'subscriptionPlanId') },
          ]}
          resultCount={list.length}
          totalCount={institutions.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Institution Name</th>
              <th>Admin Email</th>
              <th>Plan</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="orgsTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No institutions found.
                </td>
              </tr>
            ) : (
              list.map((org) => (
                <tr key={org.id}>
                  <td>{org.id}</td>
                  <td><strong>{org.name}</strong></td>
                  <td>{org.adminEmail}</td>
                  <td>{org.subscriptionPlanId || '—'}</td>
                  <td>{org.subscriptionExpiryDate || '—'}</td>
                  <td>{renderStatusBadge(org.status)}</td>
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend / Reactivate Confirmation Modal */}
      <EmployeeModal
        isOpen={Boolean(actionTarget)}
        title={actionTarget?.action === 'suspend' ? 'Suspend Institution' : 'Reactivate Institution'}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        confirmText={actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
      >
        <p style={{ margin: 0, color: '#334155' }}>
          {actionTarget?.action === 'suspend'
            ? 'Suspend this institution? Their users will lose access: '
            : 'Reactivate '}
          <strong>{actionTarget?.org.name}</strong>?
        </p>
      </EmployeeModal>
    </div>
  );
}
