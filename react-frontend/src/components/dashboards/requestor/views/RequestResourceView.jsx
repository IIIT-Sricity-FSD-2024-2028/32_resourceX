import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  fetchDepartments,
  fetchResourceCatalog,
  fetchStock,
  fetchResources,
  fetchResourceAvailability,
  createRequest
} from '../../../../services/requestor';

export default function RequestResourceView({ onNavigateToRequests, addToast }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stock, setStock] = useState([]);
  const [existingResources, setExistingResources] = useState([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [requirementDate, setRequirementDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [availableCount, setAvailableCount] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Today's date string in YYYY-MM-DD for min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const [depts, cat, stk, resList] = await Promise.all([
          fetchDepartments().catch(() => []),
          fetchResourceCatalog().catch(() => []),
          fetchStock().catch(() => []),
          fetchResources().catch(() => [])
        ]);
        setDepartments(depts || []);
        setCatalog(cat || []);
        setStock(stk || []);
        setExistingResources(resList || []);
      } catch (err) {
        console.error('Failed to load initial request metadata:', err);
      }
    };
    init();
  }, []);

  // Compute available resource types for the selected department
  const getDeptResourceTypes = (deptName) => {
    if (!deptName) return [];

    const catEntry = catalog.find((c) => c.department === deptName);
    if (catEntry && Array.isArray(catEntry.resourceTypes) && catEntry.resourceTypes.length > 0) {
      return [...catEntry.resourceTypes];
    }

    const stockRows = stock.filter((s) => s.department === deptName);
    if (stockRows.length > 0) {
      return [...new Set(stockRows.map((s) => s.resourceType))];
    }

    const resTypes = existingResources
      .filter((r) => r.department === deptName)
      .map((r) => r.type);
    return [...new Set(resTypes)];
  };

  const handleDeptChange = (e) => {
    const dept = e.target.value;
    setSelectedDept(dept);
    setSelectedType('');
    setAvailableCount(null);
  };

  const handleTypeChange = async (e) => {
    const type = e.target.value;
    setSelectedType(type);
    if (selectedDept && type) {
      setCheckingAvailability(true);
      try {
        const avail = await fetchResourceAvailability(selectedDept, type);
        setAvailableCount(Number(avail?.availableCount || 0));
      } catch (err) {
        console.error('Failed to check resource availability:', err);
        setAvailableCount(0);
      } finally {
        setCheckingAvailability(false);
      }
    } else {
      setAvailableCount(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDept || !selectedType || isNaN(quantity) || quantity < 1 || !reason.trim()) {
      addToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }

    if (!requirementDate) {
      addToast('Please select a Resource Requirement Date.', 'error');
      return;
    }

    if (!returnDate) {
      addToast('Please select a Resource Return Date.', 'error');
      return;
    }

    if (new Date(returnDate) <= new Date(requirementDate)) {
      addToast('Resource Return Date must be after the Requirement Date.', 'error');
      return;
    }

    // Re-verify availability
    try {
      const avail = await fetchResourceAvailability(selectedDept, selectedType);
      const currentAvailable = Number(avail?.availableCount || 0);

      if (quantity > currentAvailable) {
        addToast(
          `❌ Quantity must be less than or equal to available inventory (${currentAvailable} available). Please reduce your quantity.`,
          'error'
        );
        return;
      }
    } catch {
      // Proceed if endpoint check is not strict
    }

    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Format dates for display
    const formatDate = (dateStr) =>
      new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    const payload = {
      id: newId,
      department: selectedDept,
      resourceType: selectedType,
      quantity: Number(quantity),
      requestor: user?.name || 'Requestor',
      requestorId: user?.id,
      status: 'Pending',
      priority: 'Normal',
      date: dateStr,
      justification: reason,
      requirementDate: requirementDate,
      returnDate: returnDate,
      requirementDateDisplay: formatDate(requirementDate),
      returnDateDisplay: formatDate(returnDate)
    };

    setSubmitting(true);
    try {
      await createRequest(payload);
      addToast(`Request Submitted Successfully! ID: ${newId}`, 'success');
      // Reset form
      setSelectedDept('');
      setSelectedType('');
      setQuantity(1);
      setReason('');
      setRequirementDate('');
      setReturnDate('');
      setAvailableCount(null);

      if (onNavigateToRequests) {
        onNavigateToRequests();
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      addToast(err.message || 'Failed to submit request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const availableTypes = getDeptResourceTypes(selectedDept);

  return (
    <div className="view-section">
      <h1 className="page-title">Request Resource</h1>
      <p className="page-subtitle">Submit a new request for organizational resources.</p>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Managing Department</label>
            <select
              className="form-control"
              value={selectedDept}
              onChange={handleDeptChange}
              required
            >
              <option value="" disabled>Select Department</option>
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Resource Type</label>
            <select
              className="form-control"
              value={selectedType}
              onChange={handleTypeChange}
              disabled={!selectedDept}
              required
            >
              <option value="" disabled>
                {!selectedDept ? 'Select a Department First' : availableTypes.length === 0 ? 'No Catalog Configured for Department' : 'Select Resource Type'}
              </option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {checkingAvailability && (
              <small style={{ display: 'block', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>
                Checking inventory availability...
              </small>
            )}
            {!checkingAvailability && availableCount !== null && (
              <small
                style={{
                  display: 'block',
                  color: availableCount > 0 ? '#16a34a' : '#dc2626',
                  marginTop: '0.5rem',
                  fontWeight: 500
                }}
              >
                Available in Inventory: {availableCount}
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>

          {/* Timing Section */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary-color, #0F386E)' }}>schedule</span>
              Resource Usage Period
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 100%)',
              border: '1.5px solid #c7d9f8',
              borderRadius: '10px',
              padding: '1rem 1.2rem',
              marginTop: '0.3rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📅 Requirement Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={requirementDate}
                  min={todayStr}
                  onChange={(e) => {
                    setRequirementDate(e.target.value);
                    // Clear return date if it becomes invalid
                    if (returnDate && e.target.value && new Date(returnDate) <= new Date(e.target.value)) {
                      setReturnDate('');
                    }
                  }}
                  required
                  style={{ fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🔄 Return Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={returnDate}
                  min={requirementDate || todayStr}
                  onChange={(e) => setReturnDate(e.target.value)}
                  disabled={!requirementDate}
                  required
                  style={{ fontSize: '0.9rem' }}
                />
              </div>
            </div>
            {requirementDate && returnDate && (
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#0F386E', fontWeight: 500 }}>
                📆 Duration:{' '}
                {Math.ceil((new Date(returnDate) - new Date(requirementDate)) / (1000 * 60 * 60 * 24))} day(s)
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              placeholder="Provide a justification for your request..."
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
