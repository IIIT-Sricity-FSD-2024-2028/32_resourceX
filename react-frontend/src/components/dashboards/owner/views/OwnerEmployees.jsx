import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import TableToolbar, { matchesSearch, uniqueOptions } from '../../../common/TableToolbar';
import OwnerModal from '../components/OwnerModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import { DocumentLink } from '../../../common/DocumentUpload';
import { renderStatusBadge } from './OwnerOverview';
import {
  fetchOwnerOrganizations,
  fetchOwnerEmployees,
  suspendOwnerEmployee,
  reactivateOwnerEmployee,
  updateOwnerEmployee,
  removeOwnerEmployee
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
  const [statusFilter, setStatusFilter] = useState('All');

  // Suspend / Reactivate Modal state
  const [actionTarget, setActionTarget] = useState(null); // { emp, action }
  const [editTarget, setEditTarget] = useState(null);

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

  const orgNames = (empId) => organizations.filter((o) => o.assignedEmployeeId === empId).map((o) => o.name).join(' ');
  const filtered = employees.filter((e) =>
    (statusFilter === 'All' || (e.status || 'Active') === statusFilter) &&
    matchesSearch(search, e.name, e.email, e.id, orgNames(e.id))
  );

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    const { emp, action } = actionTarget;
    try {
      if (action === 'remove') {
        const { unassignedOrganizations = [] } = await removeOwnerEmployee(emp.id);
        addToast(
          `${emp.name} removed.` +
            (unassignedOrganizations.length ? ` ${unassignedOrganizations.length} organization(s) are now unassigned.` : ''),
          'success'
        );
      } else {
        if (action === 'suspend') await suspendOwnerEmployee(emp.id);
        else await reactivateOwnerEmployee(emp.id);
        addToast(`Employee ${action === 'suspend' ? 'suspended' : 'reactivated'}.`, 'success');
      }
      setActionTarget(null);
      loadData();
    } catch (err) {
      addToast('Failed: ' + err.message, 'error');
    }
  };

  const handleSaveEmployee = async (id, payload) => {
    await updateOwnerEmployee(id, payload);
    addToast('Employee updated.', 'success');
    loadData();
  };

  const removeTargetOrgs = actionTarget?.action === 'remove'
    ? organizations.filter((o) => o.assignedEmployeeId === actionTarget.emp.id)
    : [];

  return (
    <div id="employees-view" className="view-section active">
      <h1 className="page-title">Employee Management</h1>
      <p className="page-subtitle">Platform support employees and their assigned organizations.</p>

      <div className="data-section">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by name, email, ID or organization..."
          filters={[
            { label: 'All Statuses', value: statusFilter, onChange: setStatusFilter, options: uniqueOptions(employees, (e) => e.status || 'Active') },
          ]}
          resultCount={filtered.length}
          totalCount={employees.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Orgs Managed</th>
              <th>Organizations (first 3)</th>
              <th>Document</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="employeeTableBody">
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading employees...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
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
                    <td><DocumentLink record={emp} /></td>
                    <td>{renderStatusBadge(emp.status)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn-secondary" style={{ ...smallBtn, marginRight: 4 }} onClick={() => setEditTarget(emp)}>
                        Edit
                      </button>
                      {emp.status === 'Active' ? (
                        <button type="button" className="btn-secondary" style={smallBtn} onClick={() => setActionTarget({ emp, action: 'suspend' })}>
                          Suspend
                        </button>
                      ) : (
                        <button type="button" className="btn-primary" style={smallBtn} onClick={() => setActionTarget({ emp, action: 'reactivate' })}>
                          Reactivate
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ ...smallBtn, marginLeft: 4, color: '#b91c1c', borderColor: '#fecaca' }}
                        onClick={() => setActionTarget({ emp, action: 'remove' })}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend / Reactivate / Remove Confirmation Modal */}
      <OwnerModal
        isOpen={Boolean(actionTarget)}
        title={
          actionTarget?.action === 'remove'
            ? 'Remove Employee'
            : actionTarget?.action === 'suspend' ? 'Suspend Employee' : 'Reactivate Employee'
        }
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirmAction}
        confirmText={actionTarget?.action === 'remove' ? 'Remove' : actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
        confirmButtonClass={actionTarget?.action === 'remove' ? 'btn-danger' : 'btn-primary'}
      >
        {actionTarget?.action === 'remove' ? (
          <div style={{ color: '#334155', fontSize: '0.9rem' }}>
            <p style={{ margin: 0 }}>
              Permanently remove <strong>{actionTarget.emp.name}</strong> ({actionTarget.emp.id})? They will no longer be able to sign in.
            </p>
            {removeTargetOrgs.length > 0 && (
              <p style={{ margin: '0.75rem 0 0', color: '#b45309' }}>
                {removeTargetOrgs.length} organization{removeTargetOrgs.length !== 1 ? 's' : ''} ({removeTargetOrgs.map((o) => o.name).join(', ')}) will
                become unassigned. Reassign them from Organization Management.
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#334155' }}>
            {actionTarget?.action === 'suspend' ? 'Suspend' : 'Reactivate'} <strong>{actionTarget?.emp.name}</strong>?
          </p>
        )}
      </OwnerModal>

      <EditEmployeeModal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleSaveEmployee}
        employee={editTarget}
        organizations={organizations}
        employees={employees}
      />
    </div>
  );
}
