import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminModal from '../components/AdminModal';
import {
  fetchAdminDepartments,
  createAdminDepartment,
  updateAdminDepartment,
  deleteAdminDepartment,
  fetchResourceCatalog,
  updateResourceCatalog
} from '../../../../services/admin';

/**
 * Exact replica of dept-manage-view from admin.html
 */
export default function AdminDepartments() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [departments, setDepartments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Catalog View sub-mode
  const [activeCatalogDept, setActiveCatalogDept] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Add Dept Modal
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [addDeptName, setAddDeptName] = useState('');
  const [addDeptHead, setAddDeptHead] = useState('');

  // Edit Dept Modal
  const [editDeptTarget, setEditDeptTarget] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editDeptMembers, setEditDeptMembers] = useState(0);

  // Delete Dept Modal
  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);

  // Catalog Modals
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const [renameTypeTarget, setRenameTypeTarget] = useState(null);
  const [renamedTypeName, setRenamedTypeName] = useState('');

  const [deleteTypeTarget, setDeleteTypeTarget] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dList, cList] = await Promise.all([
        fetchAdminDepartments(),
        fetchResourceCatalog().catch(() => [])
      ]);
      setDepartments(dList || []);
      setCatalog(cList || []);
    } catch (err) {
      addToast(err.message || 'Failed to load department data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Department CRUD
  const handleSaveAddDept = async () => {
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    const headRegex = /^[a-zA-Z\s.]+$/;

    const name = addDeptName.trim();
    const head = addDeptHead.trim();

    if (!name || !head) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    if (!nameRegex.test(name)) {
      addToast('Department name can only contain letters, spaces, hyphens and dots.', 'error');
      return;
    }
    if (!headRegex.test(head)) {
      addToast('Head name can only contain letters and spaces.', 'error');
      return;
    }

    const exists = departments.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      addToast('A department with this name already exists.', 'error');
      return;
    }

    try {
      await createAdminDepartment({
        id: `D${Math.floor(100 + Math.random() * 900)}`,
        name,
        head,
        memberCount: 0
      });
      addToast('Department added successfully.', 'success');
      setIsAddDeptOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to add department', 'error');
    }
  };

  const openEditDept = (dept) => {
    setEditDeptTarget(dept);
    setEditDeptName(dept.name || '');
    setEditDeptHead(dept.head || '');
    setEditDeptMembers(dept.memberCount || 0);
  };

  const handleSaveEditDept = async () => {
    const nameRegex = /^[a-zA-Z\s.-]+$/;
    const headRegex = /^[a-zA-Z\s.]+$/;

    const name = editDeptName.trim();
    const head = editDeptHead.trim();
    const members = parseInt(editDeptMembers, 10);

    if (!name || !head) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    if (!nameRegex.test(name)) {
      addToast('Department name can only contain letters, spaces, hyphens and dots.', 'error');
      return;
    }
    if (!headRegex.test(head)) {
      addToast('Head name can only contain letters and spaces.', 'error');
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
      await updateAdminDepartment(editDeptTarget.id, {
        name,
        head,
        memberCount: members
      });
      addToast('Department updated successfully.', 'success');
      setEditDeptTarget(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update department', 'error');
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (!deleteDeptTarget) return;
    try {
      await deleteAdminDepartment(deleteDeptTarget.id);
      addToast('Department securely removed.', 'warning');
      setDeleteDeptTarget(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete department', 'error');
    }
  };

  // Catalog CRUD
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
      await updateResourceCatalog(activeCatalogDept, updated);
      addToast('Resource type added successfully.', 'success');
      setIsAddTypeOpen(false);
      setNewTypeName('');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to add resource type.', 'error');
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
    if (currentTypes.some((t) => t.toLowerCase() === val.toLowerCase() && t.toLowerCase() !== renameTypeTarget.toLowerCase())) {
      addToast('Another resource type with this name already exists.', 'error');
      return;
    }

    try {
      const updated = currentTypes.map((t) => (t === renameTypeTarget ? val : t));
      await updateResourceCatalog(activeCatalogDept, updated);
      addToast('Resource type renamed and records propagated successfully.', 'success');
      setRenameTypeTarget(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to rename resource type.', 'error');
    }
  };

  const handleConfirmDeleteType = async () => {
    if (!deleteTypeTarget) return;
    try {
      const currentTypes = getDeptTypes(activeCatalogDept);
      const updated = currentTypes.filter((t) => t !== deleteTypeTarget);
      await updateResourceCatalog(activeCatalogDept, updated);
      addToast('Resource type removed from catalog.', 'warning');
      setDeleteTypeTarget(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to remove resource type.', 'error');
    }
  };

  // If viewing Catalog
  if (activeCatalogDept) {
    const allowedTypes = getDeptTypes(activeCatalogDept);
    const filteredTypes = allowedTypes.filter((t) =>
      t.toLowerCase().includes(catalogSearch.toLowerCase().trim())
    );

    return (
      <div id="dept-manage-view" className="view-section active">
        <h1 className="page-title">Department Topology</h1>
        <p className="page-subtitle">Define organizational structures and departmental heads.</p>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveCatalogDept(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle' }}>
                arrow_back
              </span>{' '}
              Back to Departments
            </button>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0f172a' }}>
              {activeCatalogDept} - Resource Catalog
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Configure and manage allowed resource types for this department with full CRUD operations.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div
                className="search-bar"
                style={{
                  width: '250px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #cbd5e1',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  background: '#fff'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search types..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.875rem',
                    width: '100%',
                    marginLeft: '0.25rem'
                  }}
                />
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

            <div
              className="table-responsive"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.5rem'
              }}
            >
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '2px solid #e2e8f0' }}>Resource Type Name</th>
                    <th style={{ textAlign: 'right', width: '180px', borderBottom: '2px solid #e2e8f0' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody id="catalog-types-tbody">
                  {allowedTypes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="2"
                        style={{
                          textAlign: 'center',
                          color: '#64748b',
                          fontStyle: 'italic',
                          padding: '2rem'
                        }}
                      >
                        No resource types configured. Click "+ Add Resource Type" to begin.
                      </td>
                    </tr>
                  ) : filteredTypes.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No types matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTypes.map((type) => (
                      <tr key={type}>
                        <td>
                          <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{type}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              marginRight: '0.25rem'
                            }}
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
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setDeleteTypeTarget(type)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Type Modal */}
        <AdminModal
          isOpen={isAddTypeOpen}
          title="Add Resource Type to Catalog"
          onClose={() => setIsAddTypeOpen(false)}
          onConfirm={handleSaveAddType}
          confirmText="Confirm"
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Resource Type Name
            </label>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g. Developer Laptops"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Enter the category/type of resources for this department.
            </div>
          </div>
        </AdminModal>

        {/* Rename Type Modal */}
        <AdminModal
          isOpen={Boolean(renameTypeTarget)}
          title="Rename Resource Type"
          onClose={() => setRenameTypeTarget(null)}
          onConfirm={handleSaveRenameType}
          confirmText="Confirm"
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Rename Resource Type
            </label>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              value={renamedTypeName}
              onChange={(e) => setRenamedTypeName(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Existing requests, procurements, and resources of this type will be updated automatically.
            </div>
          </div>
        </AdminModal>

        {/* Delete Type Modal */}
        <AdminModal
          isOpen={Boolean(deleteTypeTarget)}
          title="Delete Resource Type"
          onClose={() => setDeleteTypeTarget(null)}
          onConfirm={handleConfirmDeleteType}
          confirmText="Confirm"
        >
          <p style={{ color: '#b91c1c', margin: 0 }}>
            Warning: Are you sure you want to delete <strong>"{deleteTypeTarget}"</strong> from the catalog?
            This will prevent users from submitting any new requests or procurements for this resource type.
          </p>
        </AdminModal>
      </div>
    );
  }

  // Regular Department Topology View
  return (
    <div id="dept-manage-view" className="view-section active">
      <h1 className="page-title">Department Topology</h1>
      <p className="page-subtitle">Define organizational structures and departmental heads.</p>

      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading department topology...
          </div>
        ) : departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No departments found.
          </div>
        ) : (
          departments.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}
            >
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary-color)' }}>{d.name}</strong>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Head: {d.head} | Members: {d.memberCount ?? 0}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                  onClick={() => setActiveCatalogDept(d.name)}
                >
                  Catalog
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => openEditDept(d)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setDeleteDeptTarget(d)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setAddDeptName('');
              setAddDeptHead('');
              setIsAddDeptOpen(true);
            }}
          >
            + Add New Department
          </button>
        </div>
      </div>

      {/* Add Department Modal */}
      <AdminModal
        isOpen={isAddDeptOpen}
        title="Add New Department"
        onClose={() => setIsAddDeptOpen(false)}
        onConfirm={handleSaveAddDept}
        confirmText="Confirm"
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Department Name
          </label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="e.g. IT Services"
            value={addDeptName}
            onChange={(e) => setAddDeptName(e.target.value)}
          />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Letters, spaces, hyphens and dots only.
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Head Name</label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="e.g. pradhyum"
            value={addDeptHead}
            onChange={(e) => setAddDeptHead(e.target.value)}
          />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Alphabets and spaces only.
          </div>
        </div>
      </AdminModal>

      {/* Edit Department Modal */}
      <AdminModal
        isOpen={Boolean(editDeptTarget)}
        title="Edit Department"
        onClose={() => setEditDeptTarget(null)}
        onConfirm={handleSaveEditDept}
        confirmText="Confirm"
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Department Name
          </label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editDeptName}
            onChange={(e) => setEditDeptName(e.target.value)}
          />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Letters, spaces, hyphens and dots only.
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Head Name</label>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editDeptHead}
            onChange={(e) => setEditDeptHead(e.target.value)}
          />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Alphabets and spaces only.
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Member Count</label>
          <input
            type="number"
            min="0"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
            value={editDeptMembers}
            onChange={(e) => setEditDeptMembers(e.target.value)}
          />
        </div>
      </AdminModal>

      {/* Delete Department Modal */}
      <AdminModal
        isOpen={Boolean(deleteDeptTarget)}
        title="Delete Department"
        onClose={() => setDeleteDeptTarget(null)}
        onConfirm={handleConfirmDeleteDept}
        confirmText="Confirm"
      >
        <p style={{ color: '#b91c1c', margin: 0 }}>
          Warning: Deleting this department affects all linked associated users and active resources. Proceed at your own risk.
        </p>
      </AdminModal>
    </div>
  );
}
