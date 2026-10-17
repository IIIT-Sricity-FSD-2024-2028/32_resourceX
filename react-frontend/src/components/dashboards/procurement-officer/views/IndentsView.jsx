import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchProcurements } from '../../../../services/procurementOfficer';

export default function IndentsView({ addToast, onProcessOrder }) {
  const { user } = useAuth();
  const department = user?.department || 'IT Services';
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const loadIndents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProcurements({ department });
      const list = (Array.isArray(res) ? res : []).filter(
        p => p.status !== 'Pending Approval'
      );
      setIndents(list);
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to load department indents.', 'error');
    } finally {
      setLoading(false);
    }
  }, [department, addToast]);

  useEffect(() => {
    loadIndents();
  }, [loadIndents]);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set();
    indents.forEach(p => {
      if (p.department) set.add(p.department);
    });
    return ['All', ...Array.from(set).sort()];
  }, [indents]);

  // Filtered indents
  const filteredIndents = useMemo(() => {
    return indents.filter(item => {
      // Status tab filter
      if (statusFilter === 'Pending' && item.status !== 'Pending') return false;
      if (statusFilter === 'Approved' && item.status !== 'Approved') return false;
      if (statusFilter === 'In Procurement' && item.status !== 'PO Created') return false;
      if (statusFilter === 'Fulfilled' && !['Fulfilled', 'Registered'].includes(item.status)) return false;
      if (statusFilter === 'Rejected' && item.status !== 'Rejected') return false;

      // Department filter
      if (deptFilter !== 'All' && item.department !== deptFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = (item.id || '').toLowerCase().includes(q);
        const itemMatch = (item.resourceType || item.item || '').toLowerCase().includes(q);
        const reqMatch = (item.requestedBy || item.requester || '').toLowerCase().includes(q);
        const deptMatch = (item.department || '').toLowerCase().includes(q);
        const justMatch = (item.justification || '').toLowerCase().includes(q);
        if (!idMatch && !itemMatch && !reqMatch && !deptMatch && !justMatch) return false;
      }

      return true;
    });
  }, [indents, statusFilter, deptFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = indents.length;
    const pending = indents.filter(p => p.status === 'Pending').length;
    const approved = indents.filter(p => p.status === 'Approved').length;
    const inProc = indents.filter(p => p.status === 'PO Created').length;
    const fulfilled = indents.filter(p => ['Fulfilled', 'Registered'].includes(p.status)).length;
    const rejected = indents.filter(p => p.status === 'Rejected').length;
    return { total, pending, approved, inProc, fulfilled, rejected };
  }, [indents]);

  const STATUS_BADGES = {
    'Pending': { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'Awaiting Registrar Approval', icon: 'hourglass_empty' },
    'Approved': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Approved — Ready for PO', icon: 'check_circle' },
    'PO Created': { bg: '#fef3c7', text: '#d97706', border: '#fde68a', label: 'PO Issued (In Procurement)', icon: 'description' },
    'Fulfilled': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Order Fulfilled', icon: 'task_alt' },
    'Registered': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: 'Added to Inventory', icon: 'inventory_2' },
    'Rejected': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Rejected by Registrar', icon: 'cancel' },
  };

  const tabs = [
    { id: 'All', label: 'All Indents', count: stats.total },
    { id: 'Pending', label: 'Pending Approval', count: stats.pending },
    { id: 'Approved', label: 'Approved', count: stats.approved },
    { id: 'In Procurement', label: 'In Procurement', count: stats.inProc },
    { id: 'Fulfilled', label: 'Fulfilled', count: stats.fulfilled },
    { id: 'Rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-icons" style={{ color: '#0F386E', fontSize: 24 }}>assignment</span>
            Department Indents
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Inspect requisition indents submitted by Department Heads and monitor Registrar approval sanction.
          </p>
        </div>

        <button
          onClick={loadIndents}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <span className="material-icons" style={{ fontSize: 16 }}>refresh</span>
          Refresh Indents
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Indents', value: stats.total, icon: 'receipt_long', color: '#0F386E', bg: '#f8fafc' },
          { label: 'Pending Approval', value: stats.pending, icon: 'pending_actions', color: '#d97706', bg: '#fffbeb' },
          { label: 'Approved by Registrar', value: stats.approved, icon: 'verified', color: '#2563eb', bg: '#eff6ff' },
          { label: 'In Procurement / PO', value: stats.inProc, icon: 'description', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Fulfilled / In Stock', value: stats.fulfilled, icon: 'check_circle', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Rejected', value: stats.rejected, icon: 'cancel', color: '#dc2626', bg: '#fef2f2' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1rem 1.15rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{card.label}</span>
              <span className="material-icons" style={{ fontSize: 20, color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Controls Bar: Tabs, Department Filter & Search */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: isSelected ? '1px solid #0F386E' : '1px solid #e2e8f0',
                  background: isSelected ? '#0F386E' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
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
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            {/* Department Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Department:</span>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                {departments.map(d => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 420 }}>
              <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search by ID, item, requester..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}
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

      {/* Indents List Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading department indents...
        </div>
      ) : filteredIndents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', display: 'block', marginBottom: 12 }}>
            assignment_late
          </span>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>No indents found</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Try adjusting your status tab or search filter.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredIndents.map(indent => {
            const badge = STATUS_BADGES[indent.status] || {
              bg: '#f1f5f9',
              text: '#475569',
              border: '#e2e8f0',
              label: indent.status,
              icon: 'info'
            };

            const hasSpec = indent.specFileName || indent.specFileDataUrl || indent.specFile;

            return (
              <div
                key={indent.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.2s ease'
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F386E', background: '#ffffff', padding: '3px 9px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                      {indent.id}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', background: '#e2e8f0', padding: '3px 9px', borderRadius: 6 }}>
                      {indent.department}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Submitted: <strong>{indent.date}</strong>
                    </span>
                    {indent.targetDate && (
                      <span style={{ fontSize: 12, color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>event</span>
                        Needed By: <strong>{indent.targetDateDisplay || indent.targetDate}</strong>
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: 14 }}>{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>

                {/* Body Row */}
                <div style={{ padding: '1.15rem 1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                    {/* Item and Quantity */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Resource Requisition
                      </span>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                        {indent.resourceType || indent.item}
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                        Requested Quantity: <strong style={{ color: '#0f172a', fontSize: 14 }}>{indent.quantity} units</strong>
                      </div>
                    </div>

                    {/* Department Head / Requester */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Department Head Requester
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-icons" style={{ fontSize: 16, color: '#64748b' }}>person</span>
                        {indent.requestedBy || indent.requester || 'Department Head'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Department: {indent.department}
                      </div>
                    </div>

                    {/* Attached Spec Document & Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Specification / Indent File
                      </span>

                      {hasSpec ? (
                        <button
                          type="button"
                          onClick={() => setPreviewFile({
                            name: indent.specFileName || `Indent_Spec_${indent.id}`,
                            type: indent.specFileType || 'application/pdf',
                            dataUrl: indent.specFileDataUrl || indent.specFile
                          })}
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: 16 }}>description</span>
                          {indent.specFileName || 'View Indent Document'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                          No document attached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Justification Block */}
                  {indent.justification && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem 1rem', marginTop: '1rem', fontSize: 13, color: '#334155' }}>
                      <strong style={{ color: '#0F386E', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>
                        Business Requirement & Justification
                      </strong>
                      <span>{indent.justification}</span>
                    </div>
                  )}

                  {/* Action Bar based on Status */}
                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    {indent.status === 'Pending' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#b45309' }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>hourglass_empty</span>
                        <span>Awaiting sanction and formal approval from the University Registrar.</span>
                      </div>
                    )}

                    {indent.status === 'Approved' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                          <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
                          <span>Approved by Registrar! Purchase Order file can now be generated and uploaded.</span>
                        </div>
                        {onProcessOrder && (
                          <button
                            onClick={() => onProcessOrder(indent.id)}
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '7px 16px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: 16 }}>shopping_cart_checkout</span>
                            Proceed to Issue PO →
                          </button>
                        )}
                      </div>
                    )}

                    {indent.status === 'PO Created' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706' }}>
                          <span className="material-icons" style={{ fontSize: 16 }}>local_shipping</span>
                          <span>Purchase Order #{indent.poNumber || 'PO-Issued'} has been issued to vendor {indent.vendor ? `(${indent.vendor})` : ''}.</span>
                        </div>
                        {onProcessOrder && (
                          <button
                            onClick={() => onProcessOrder(indent.id)}
                            style={{
                              background: '#ffffff',
                              color: '#7c3aed',
                              border: '1px solid #c4b5fd',
                              borderRadius: 8,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            View Order in Pipeline →
                          </button>
                        )}
                      </div>
                    )}

                    {(indent.status === 'Fulfilled' || indent.status === 'Registered') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>verified</span>
                        <span>Order successfully fulfilled! Assets {indent.status === 'Registered' ? 'registered into inventory' : 'awaiting inventory cataloging'}.</span>
                      </div>
                    )}

                    {indent.status === 'Rejected' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#b91c1c' }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>cancel</span>
                        <span>Requisition rejected by Registrar. Not moving forward to procurement.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Specification / Indent Document Preview Modal */}
      {previewFile && (
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
          onClick={() => setPreviewFile(null)}
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
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', background: '#0F386E', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-icons" style={{ fontSize: 22, color: '#93c5fd' }}>description</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{previewFile.name}</h4>
                  <span style={{ fontSize: 11, color: '#bfdbfe' }}>Department Indent Specification Document</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span className="material-icons" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 350, background: '#f8fafc' }}>
              {previewFile.type?.startsWith('image/') ? (
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                />
              ) : previewFile.dataUrl?.startsWith('data:application/pdf') || previewFile.type?.includes('pdf') ? (
                <iframe
                  src={previewFile.dataUrl}
                  title={previewFile.name}
                  style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8, background: '#ffffff' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <span className="material-icons" style={{ fontSize: 48, color: '#3b82f6', marginBottom: 12 }}>file_present</span>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{previewFile.name}</div>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Preview for this file type is not supported directly in the browser.
                  </p>
                  {previewFile.dataUrl && (
                    <a
                      href={previewFile.dataUrl}
                      download={previewFile.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 12,
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>download</span>
                      Download Document
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.85rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {previewFile.dataUrl && (
                <a
                  href={previewFile.dataUrl}
                  download={previewFile.name}
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
                  <span className="material-icons" style={{ fontSize: 16 }}>download</span>
                  Download
                </a>
              )}
              <button
                onClick={() => setPreviewFile(null)}
                style={{
                  padding: '8px 18px',
                  background: '#0F386E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
