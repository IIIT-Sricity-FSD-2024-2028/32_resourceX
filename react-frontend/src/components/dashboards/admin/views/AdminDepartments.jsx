import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../components/AdminModal';
import AddDeptModal from '../components/AddDeptModal';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchCatalog,
  updateCatalog,
  selectAdminDepartments,
  selectAdminCatalog,
  selectAdminDeptsLoading,
  selectDeptOperationLoading,
} from '../../../../store/slices/admin/adminSlice';

/**
 * AdminDepartments View
 * Manages institutional departments and associated resource catalog types.
 * Fully integrated with Redux Toolkit (adminSlice).
 */
export default function AdminDepartments() {
  const dispatch = useAppDispatch();
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  // Redux state
  const departments = useAppSelector(selectAdminDepartments);
  const catalog = useAppSelector(selectAdminCatalog);
  const isLoading = useAppSelector(selectAdminDeptsLoading);
  const isOperating = useAppSelector(selectDeptOperationLoading);

  // Catalog View sub-mode
  const [activeCatalogDept, setActiveCatalogDept] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [headFilter, setHeadFilter] = useState('All');

  // Modals state
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [editDeptTarget, setEditDeptTarget] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptMembers, setEditDeptMembers] = useState(0);
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);

  // Catalog Modals state
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [renameTypeTarget, setRenameTypeTarget] = useState(null);
  const [renamedTypeName, setRenamedTypeName] = useState('');
  const [deleteTypeTarget, setDeleteTypeTarget] = useState(null);

  // Initial data dispatch
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchCatalog());
  }, [dispatch]);

  // Department CRUD Handlers
  const handleSaveAddDept = async (name) => {
    try {
      await dispatch(createDepartment({ name, memberCount: 0 })).unwrap();
      addToast('Department added successfully.', 'success');
      setIsAddDeptOpen(false);
      dispatch(fetchDepartments());
    } catch (err) {
      addToast(err || 'Failed to add department', 'error');
      throw err;
    }
  };

  const openEditDept = (dept) => {
    setEditDeptTarget(dept);
    setEditDeptName(dept.name || '');
    setEditDeptMembers(dept.memberCount || 0);
  };

  const handleSaveEditDept = async () => {
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    const name = editDeptName.trim();
    const members = parseInt(editDeptMembers, 10);

    if (!name) {
      addToast('Please enter a department name.', 'error');
      return;
    }
    if (!nameRegex.test(name)) {
      addToast('Department name can only contain letters, spaces, hyphens and dots.', 'error');
      return;
    }
    if (isNaN(members) || members < 0) {
      addToast('Member count must be a non-negative number.', 'error');
      return;
    }

    const duplicate = departments.some(
      (d) => d.id !== editDeptTarget.id && d.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      addToast('Another department with this name already exists.', 'error');
      return;
    }

    try {
      await dispatch(
        updateDepartment({
          id: editDeptTarget.id,
          updates: { name, memberCount: members },
        })
      ).unwrap();
      addToast('Department updated successfully.', 'success');
      setEditDeptTarget(null);
      dispatch(fetchDepartments());
    } catch (err) {
      addToast(err || 'Failed to update department', 'error');
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (!deleteDeptTarget) return;
    try {
      await dispatch(deleteDepartment(deleteDeptTarget.id)).unwrap();
      addToast('Department securely removed.', 'warning');
      setDeleteDeptTarget(null);
      dispatch(fetchDepartments());
    } catch (err) {
      addToast(err || 'Failed to delete department', 'error');
    }
  };

  // Catalog Helper and Handlers
  const getDeptTypes = (deptName) => {
    const entry = catalog.find((item) => item.department === deptName);
    return entry ? entry.resourceTypes || [] : [];
  };

  const handleSaveAddType = async () => {
    const val = newTypeName.trim();
    if (!val) {
      addToast('Resource type name cannot be empty.', 'error');
      return;
    }
    const currentTypes = getDeptTypes(activeCatalogDept);
    if (currentTypes.some((t) => t.toLowerCase() === val.toLowerCase())) {
      addToast('This resource type is already in the catalog.', 'error');
      return;
    }

    try {
      const updated = [...currentTypes, val];
      await dispatch(
        updateCatalog({ department: activeCatalogDept, resourceTypes: updated })
      ).unwrap();
      addToast('Resource type added successfully.', 'success');
      setIsAddTypeOpen(false);
      setNewTypeName('');
      dispatch(fetchCatalog());
    } catch (err) {
      addToast(err || 'Failed to add resource type.', 'error');
    }
  };

  const handleSaveRenameType = async () => {
    const val = renamedTypeName.trim();
    if (!val) {
      addToast('Resource type name cannot be empty.', 'error');
      return;
    }
    if (val.toLowerCase() === renameTypeTarget.toLowerCase()) {
      setRenameTypeTarget(null);
      return;
    }
    const currentTypes = getDeptTypes(activeCatalogDept);
    if (
      currentTypes.some(
        (t) =>
          t.toLowerCase() === val.toLowerCase() &&
          t.toLowerCase() !== renameTypeTarget.toLowerCase()
      )
    ) {
      addToast('Another resource type with this name already exists.', 'error');
      return;
    }

    try {
      const updated = currentTypes.map((t) => (t === renameTypeTarget ? val : t));
      await dispatch(
        updateCatalog({ department: activeCatalogDept, resourceTypes: updated })
      ).unwrap();
      addToast('Resource type renamed and records propagated successfully.', 'success');
      setRenameTypeTarget(null);
      dispatch(fetchCatalog());
    } catch (err) {
      addToast(err || 'Failed to rename resource type.', 'error');
    }
  };

  const handleConfirmDeleteType = async () => {
    if (!deleteTypeTarget) return;
    try {
      const currentTypes = getDeptTypes(activeCatalogDept);
      const updated = currentTypes.filter((t) => t !== deleteTypeTarget);
      await dispatch(
        updateCatalog({ department: activeCatalogDept, resourceTypes: updated })
      ).unwrap();
      addToast('Resource type removed from catalog.', 'warning');
      setDeleteTypeTarget(null);
      dispatch(fetchCatalog());
    } catch (err) {
      addToast(err || 'Failed to remove resource type.', 'error');
    }
  };

  // If viewing Catalog sub-mode
  if (activeCatalogDept) {
    const allowedTypes = getDeptTypes(activeCatalogDept);
    const filteredTypes = allowedTypes.filter((t) =>
      t.toLowerCase().includes(catalogSearch.toLowerCase().trim())
    );

    return (
      <div id="dept-manage-view" className="view-section active">
        <h1 className="page-title">Department Topology</h1>
        <p className="page-subtitle">
          Define organizational structures. Department heads are assigned from User Management.
        </p>

        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
              onClick={() => {
                setActiveCatalogDept(null);
                setCatalogSearch('');
              }}
            >
              &larr; Back to Department List
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                Catalog Resource Types:{' '}
                <span style={{ color: '#2563eb' }}>{activeCatalogDept}</span>
              </h2>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                Specify which physical equipment and asset categories can be requested in this department.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setNewTypeName('');
                setIsAddTypeOpen(true);
              }}
            >
              + Add Resource Type
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem', maxWidth: '350px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search resource types..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Resource Type Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan="2"
                    style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}
                  >
                    No resource types registered for this department.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{type}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setRenameTypeTarget(type);
                            setRenamedTypeName(type);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDeleteTypeTarget(type)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Type Modal */}
        <AdminModal
          isOpen={isAddTypeOpen}
          title={`Add Resource Type to ${activeCatalogDept}`}
          onClose={() => setIsAddTypeOpen(false)}
          onConfirm={handleSaveAddType}
          confirmText="Add Type"
        >
          <div className="form-group">
            <label className="form-label">Resource Type Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. GPU Workstations"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveAddType();
                }
              }}
            />
          </div>
        </AdminModal>

        {/* Rename Type Modal */}
        <AdminModal
          isOpen={Boolean(renameTypeTarget)}
          title={`Rename Resource Type (${renameTypeTarget})`}
          onClose={() => setRenameTypeTarget(null)}
          onConfirm={handleSaveRenameType}
          confirmText="Save Name"
        >
          <div className="form-group">
            <label className="form-label">Updated Type Title</label>
            <input
              type="text"
              className="form-control"
              value={renamedTypeName}
              onChange={(e) => setRenamedTypeName(e.target.value)}
            />
          </div>
        </AdminModal>

        {/* Delete Type Modal */}
        <AdminModal
          isOpen={Boolean(deleteTypeTarget)}
          title="Remove Resource Type"
          onClose={() => setDeleteTypeTarget(null)}
          onConfirm={handleConfirmDeleteType}
          confirmText="Remove"
          confirmButtonClass="btn-danger"
        >
          <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem' }}>
            Are you sure you want to remove <strong>{deleteTypeTarget}</strong> from the catalog for{' '}
            <strong>{activeCatalogDept}</strong>?
          </p>
        </AdminModal>
      </div>
    );
  }

  // Filter department list
  const filteredDepts = departments.filter((d) => {
    if (headFilter === 'Assigned' && (!d.head || d.head === 'Unassigned')) return false;
    if (headFilter === 'Unassigned' && d.head && d.head !== 'Unassigned') return false;
    return matchesSearch(deptSearch, d.id, d.name, d.head, d.memberCount);
  });

  return (
    <div id="dept-manage-view" className="view-section active">
      <h1 className="page-title">Department Topology</h1>
      <p className="page-subtitle">
        Define organizational structures. Department heads are assigned from User Management.
      </p>

      {/* Control Bar: Add Button, Head Filter, and Search */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          className="btn-primary"
          id="open-add-dept-btn"
          onClick={() => setIsAddDeptOpen(true)}
        >
          + Add New Department
        </button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '150px' }}
            value={headFilter}
            onChange={(e) => setHeadFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Assigned">With Assigned Head</option>
            <option value="Unassigned">Without Head</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Search departments..."
            style={{ width: '220px' }}
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Department Table */}
      <div className="data-section">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Department Head</th>
              <th>Active Members</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="dept-table-tbody">
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading departments...
                </td>
              </tr>
            ) : filteredDepts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No departments found.
                </td>
              </tr>
            ) : (
              filteredDepts.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>{d.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.name}</div>
                  </td>
                  <td>
                    {d.head && d.head !== 'Unassigned' ? (
                      <span className="badge pending" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                        {d.head}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                        No Head Assigned
                      </span>
                    )}
                  </td>
                  <td>{d.memberCount || 0} users</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setActiveCatalogDept(d.name);
                          setCatalogSearch('');
                        }}
                      >
                        Manage Catalog
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => openEditDept(d)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => setDeleteDeptTarget(d)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Department Modal */}
      <AddDeptModal
        isOpen={isAddDeptOpen}
        onClose={() => setIsAddDeptOpen(false)}
        onSubmit={handleSaveAddDept}
        departments={departments}
        isSubmitting={isOperating}
      />

      {/* Edit Department Modal */}
      <AdminModal
        isOpen={Boolean(editDeptTarget)}
        title="Edit Department"
        onClose={() => setEditDeptTarget(null)}
        onConfirm={handleSaveEditDept}
        confirmText="Save Changes"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Department Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={editDeptName}
              onChange={(e) => setEditDeptName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Member Count
            </label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={editDeptMembers}
              onChange={(e) => setEditDeptMembers(e.target.value)}
            />
          </div>
        </div>
      </AdminModal>

      {/* Delete Department Modal */}
      <AdminModal
        isOpen={Boolean(deleteDeptTarget)}
        title="Delete Department"
        onClose={() => setDeleteDeptTarget(null)}
        onConfirm={handleConfirmDeleteDept}
        confirmText="Delete"
        confirmButtonClass="btn-danger"
      >
        <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem' }}>
          Are you sure you want to delete department{' '}
          <strong>{deleteDeptTarget?.name}</strong>? This action cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}
