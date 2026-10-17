import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchProcurements,
  approveRegistrarProcurement,
  rejectRegistrarProcurement
} from '../../../../services/registrar';

/**
 * Department Indents & Approvals View for Registrar
 * Modern, beautifully styled, and consistent interface to review, approve,
 * or reject department indents submitted by Department Heads.
 */
export default function ProcurementApprovalsView({ addToast, onPreviewFile }) {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [localPreviewFile, setLocalPreviewFile] = useState(null);

  // Load indents list
  const loadIndents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProcurements();
      // Exclude requestor unapproved drafts if any
      const list = (Array.isArray(data) ? data : []).filter(
        p => p.status !== 'Pending Approval'
      );
      setIndents(list);
    } catch (err) {
      console.error('Error fetching indents:', err);
      if (addToast) addToast('Error loading department indents.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadIndents();
  }, [loadIndents]);

  // Accept procurement / indent
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approveRegistrarProcurement(id);
      await loadIndents();
      if (addToast) {
        addToast('✅ Indent Approved! Passed to Procurement Officer for PO creation.', 'success');
      }
    } catch (err) {
      console.error('Approve failed:', err);
      if (addToast) {
        addToast('Failed to approve indent: ' + (err.message || 'Error'), 'error');
      } else {
        alert('Failed to approve indent: ' + (err.message || 'Error'));
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Reject procurement / indent
  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this department indent?')) {
      try {
        setProcessingId(id);
        await rejectRegistrarProcurement(id);
        await loadIndents();
        if (addToast) addToast('Indent rejected.', 'warning');
      } catch (err) {
        console.error('Reject failed:', err);
        if (addToast) {
          addToast('Failed to reject indent: ' + (err.message || 'Error'), 'error');
        } else {
          alert('Failed to reject indent: ' + (err.message || 'Error'));
        }
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Preview spec file
  const handlePreviewSpec = (proc) => {
    const hasSpec = proc.specFileName || proc.specFileDataUrl || proc.specFile;
    if (hasSpec) {
      const fileData = proc.specFileDataUrl || proc.specFile;
      const fileName = proc.specFileName || `Indent_Spec_${proc.id}`;
      let detectedType = proc.specFileType;
      if (!detectedType || detectedType === 'application/octet-stream') {
        if (/\.(png)$/i.test(fileName)) detectedType = 'image/png';
        else if (/\.(jpe?g)$/i.test(fileName)) detectedType = 'image/jpeg';
        else if (/\.(webp)$/i.test(fileName)) detectedType = 'image/webp';
        else if (/\.(gif)$/i.test(fileName)) detectedType = 'image/gif';
        else if (/\.(pdf)$/i.test(fileName)) detectedType = 'application/pdf';
      }

      const fileObj = {
        name: fileName,
        type: detectedType || 'application/pdf',
        dataUrl: fileData
      };

      if (onPreviewFile) {
        onPreviewFile(fileObj);
      } else {
        setLocalPreviewFile(fileObj);
      }
    } else {
      if (addToast) addToast('No specification document attached to this indent.', 'info');
      else alert('No specification document attached to this indent.');
    }
  };

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set();
    indents.forEach(p => {
      if (p.department) set.add(p.department);
    });
    return ['All', ...Array.from(set).sort()];
  }, [indents]);

  // Filtered indents
  const filteredIndents = useMemo(() => {
    return indents.filter(p => {
      // Status filter
      if (statusFilter === 'Pending' && p.status !== 'Pending') return false;
      if (statusFilter === 'Approved' && !['Approved', 'PO Created', 'Fulfilled', 'Registered'].includes(p.status)) return false;
      if (statusFilter === 'Rejected' && p.status !== 'Rejected') return false;

      // Department filter
      if (deptFilter !== 'All' && p.department !== deptFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const itemMatch = (p.resourceType || p.item || '').toLowerCase().includes(q);
        const reqMatch = (p.requestedBy || p.requester || '').toLowerCase().includes(q);
        const deptMatch = (p.department || '').toLowerCase().includes(q);
        const justMatch = (p.justification || '').toLowerCase().includes(q);
        if (!idMatch && !itemMatch && !reqMatch && !deptMatch && !justMatch) return false;
      }

      return true;
    });
  }, [indents, statusFilter, deptFilter, searchTerm]);

  // Compute stat counts
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    indents.forEach((p) => {
      if (p.status === 'Pending') pending++;
      else if (['Approved', 'PO Created', 'Fulfilled', 'Registered'].includes(p.status)) approved++;
      else if (p.status === 'Rejected') rejected++;
    });
    return { total: indents.length, pending, approved, rejected };
  }, [indents]);

  const tabs = [
    { id: 'All', label: 'All Indents', count: stats.total },
    { id: 'Pending', label: 'Pending Approval', count: stats.pending, highlight: stats.pending > 0 },
    { id: 'Approved', label: 'Approved / In Procurement', count: stats.approved },
    { id: 'Rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="view-section active" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Department Indents & Approvals</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
            Review, sanction, and approve procurement indents submitted by Department Heads across the university.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadIndents}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh Indents
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total Department Indents</span>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#0F386E' }}>receipt_long</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F386E' }}>{loading ? '...' : stats.total}</div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>Pending Registrar Approval</span>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#d97706' }}>hourglass_empty</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309' }}>{loading ? '...' : stats.pending}</div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Approved / In Procurement</span>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#16a34a' }}>check_circle</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d' }}>{loading ? '...' : stats.approved}</div>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>Rejected</span>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#dc2626' }}>cancel</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#b91c1c' }}>{loading ? '...' : stats.rejected}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: isSelected ? '1px solid #0F386E' : '1px solid #e2e8f0',
                  background: isSelected ? '#0F386E' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(255,255,255,0.2)' : tab.highlight ? '#fef3c7' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : tab.highlight ? '#b45309' : '#475569'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Department selector & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Department:</span>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search indent ID, resource, dept head..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 34px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#64748b' }}>
            Showing <strong>{filteredIndents.length}</strong> of <strong>{indents.length}</strong> indents
          </div>
        </div>
      </div>

      {/* Indents Table */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '12px 16px' }}>Indent ID</th>
                <th style={{ padding: '12px 16px' }}>Department Head</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Resource Requested</th>
                <th style={{ padding: '12px 16px' }}>Qty</th>
                <th style={{ padding: '12px 16px', minWidth: 200 }}>Justification</th>
                <th style={{ padding: '12px 16px' }}>Indent Doc</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', minWidth: 180 }}>Registrar Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Loading department indents...
                  </td>
                </tr>
              ) : filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                      assignment_turned_in
                    </span>
                    <strong style={{ display: 'block', fontSize: 15, color: '#1e293b' }}>No Department Indents Found</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>There are no indents matching your active status or department filter.</span>
                  </td>
                </tr>
              ) : (
                filteredIndents.map((p) => {
                  const isPending = p.status === 'Pending';
                  const isApproved = ['Approved', 'PO Created', 'Fulfilled', 'Registered'].includes(p.status);
                  const isProcessing = processingId === p.id;
                  const hasSpec = p.specFileName || p.specFileDataUrl || p.specFile;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                        background: isPending ? '#fffdf7' : '#ffffff'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isPending ? '#fefbe8' : '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = isPending ? '#fffdf7' : '#ffffff'}
                    >
                      {/* Indent ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#0F386E', background: '#eff6ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bfdbfe', fontSize: 12 }}>
                          {p.id}
                        </span>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{p.date}</div>
                      </td>

                      {/* Department Head */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {p.requestedBy || p.requester || 'Department Head'}
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                          {p.department}
                        </span>
                      </td>

                      {/* Resource Requested */}
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: 14 }}>
                          {p.resourceType || p.item}
                        </strong>
                        {(p.targetDate || p.targetDateDisplay) && (
                          <div style={{ fontSize: 11, color: '#0369a1', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, background: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                            <span className="material-icons" style={{ fontSize: 13 }}>event</span>
                            Needed by: {p.targetDateDisplay || p.targetDate}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: '#0F386E' }}>
                          {p.quantity}
                        </span>
                      </td>

                      {/* Justification */}
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#475569', maxWidth: 240, lineHeight: 1.4 }}>
                        {p.justification || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No justification provided</span>}
                      </td>

                      {/* Indent Spec Doc */}
                      <td style={{ padding: '14px 16px' }}>
                        {hasSpec ? (
                          <button
                            type="button"
                            onClick={() => handlePreviewSpec(p)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 12,
                              color: '#2563eb',
                              fontWeight: 600,
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '5px 10px',
                              cursor: 'pointer'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                            {p.specFileName || 'View Spec'}
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
                            <button
                              type="button"
                              disabled={isProcessing}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 7,
                                padding: '6px 14px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.6 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 1px 3px rgba(22,163,74,0.3)'
                              }}
                              onClick={() => handleApprove(p.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check</span>
                              {isProcessing ? 'Saving...' : 'Approve'}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                background: '#ffffff',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: 7,
                                padding: '6px 12px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.6 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              onClick={() => handleReject(p.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                              Reject
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 20,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                            {p.status === 'Approved' ? 'Approved (Ready for PO)' : p.status}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 20,
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fallback File Preview Modal */}
      {localPreviewFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setLocalPreviewFile(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 820,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.5rem', background: '#0F386E', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#93c5fd' }}>description</span>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{localPreviewFile.name}</h4>
              </div>
              <button
                onClick={() => setLocalPreviewFile(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>

            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350, background: '#f8fafc' }}>
              {localPreviewFile.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(localPreviewFile.name || '') ? (
                <img
                  src={localPreviewFile.dataUrl}
                  alt={localPreviewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                />
              ) : (
                <iframe
                  src={localPreviewFile.dataUrl}
                  title={localPreviewFile.name}
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8, background: '#ffffff' }}
                />
              )}
            </div>

            <div style={{ padding: '0.85rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {localPreviewFile.dataUrl && (
                <a
                  href={localPreviewFile.dataUrl}
                  download={localPreviewFile.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: '#f1f5f9',
                    color: '#334155',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  Download
                </a>
              )}
              <button
                onClick={() => setLocalPreviewFile(null)}
                style={{ padding: '8px 18px', background: '#0F386E', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
