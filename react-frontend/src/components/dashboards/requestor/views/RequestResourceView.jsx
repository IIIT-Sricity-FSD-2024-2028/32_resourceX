import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import {
  useGetDepartmentsQuery,
  useGetResourceCatalogQuery,
  useGetMyResourcesQuery,
  useCreateRequestMutation,
  useLazyGetResourceAvailabilityQuery,
} from '../../../../api/requestorApi';
import { useGetDeptStockQuery } from '../../../../api/deptHeadApi';
import DocumentUpload from '../../../common/DocumentUpload';

export default function RequestResourceView({ onNavigateToRequests, addToast }) {
  const { user } = useAuth();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: catalog = [] } = useGetResourceCatalogQuery();
  const { data: stock = [] } = useGetDeptStockQuery();
  const { data: existingResources = [] } = useGetMyResourcesQuery();
  const [createRequestMutation, { isLoading: submitting }] = useCreateRequestMutation();
  const [triggerGetAvailability] = useLazyGetResourceAvailabilityQuery();

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [requirementDate, setRequirementDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [availableCount, setAvailableCount] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  // { documentFileName, documentFileType, documentFileDataUrl } from DocumentUpload
  const [letter, setLetter] = useState(null);
  const [letterResetKey, setLetterResetKey] = useState(0);

  // The requirement date must be at least 2 days after the request date (local time, YYYY-MM-DD)
  const MIN_LEAD_DAYS = 2;
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + MIN_LEAD_DAYS);
  const minRequirementStr = `${earliest.getFullYear()}-${String(earliest.getMonth() + 1).padStart(2, '0')}-${String(earliest.getDate()).padStart(2, '0')}`;

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
        const avail = await triggerGetAvailability({ department: selectedDept, type }).unwrap();
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

    // Format dates for display
    const formatDate = (dateStr) =>
      new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    if (!selectedDept || !selectedType || isNaN(quantity) || quantity < 1 || !reason.trim()) {
      addToast('Please fill in all fields correctly before submitting.', 'error');
      return;
    }

    if (!requirementDate) {
      addToast('Please select a Resource Requirement Date.', 'error');
      return;
    }

    if (requirementDate < minRequirementStr) {
      addToast(`Requirement Date must be at least ${MIN_LEAD_DAYS} days after today (${formatDate(minRequirementStr)} or later).`, 'error');
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

    if (!letter) {
      addToast('Please attach a Request Letter / Proof before submitting.', 'error');
      return;
    }

    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
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
      returnDateDisplay: formatDate(returnDate),
      letterFileName: letter.documentFileName,
      letterFileType: letter.documentFileType,
      letterFileDataUrl: letter.documentFileDataUrl
    };

    try {
      await createRequestMutation(payload).unwrap();
      addToast(`Request Submitted Successfully! ID: ${newId}`, 'success');
      // Reset form
      setSelectedDept('');
      setSelectedType('');
      setQuantity(1);
      setReason('');
      setRequirementDate('');
      setReturnDate('');
      setAvailableCount(null);
      setLetter(null);
      setLetterResetKey((k) => k + 1);

      if (onNavigateToRequests) {
        onNavigateToRequests();
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      addToast(err?.data?.message || err.message || 'Failed to submit request. Please try again.', 'error');
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
              <small style={{
                display: 'block',
                marginTop: '0.5rem',
                fontWeight: 600,
                color: availableCount > 0 ? '#16a34a' : '#dc2626'
              }}>
                Available in Department Inventory: {availableCount}
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-control"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Requirement Date</label>
              <input
                type="date"
                className="form-control"
                min={minRequirementStr}
                value={requirementDate}
                onChange={(e) => setRequirementDate(e.target.value)}
                required
              />
              <small style={{ display: 'block', color: '#64748b', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                At least {MIN_LEAD_DAYS} days lead time required.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Return Date</label>
              <input
                type="date"
                className="form-control"
                min={requirementDate || minRequirementStr}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
              <small style={{ display: 'block', color: '#64748b', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                Expected date the resource will be returned.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Justification / Purpose</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="State the academic or operational justification for this request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">
              Request Letter / Proof <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <DocumentUpload
              key={letterResetKey}
              label="Request Letter / Proof"
              hint="Upload signed permission letter or syllabus requirement (PDF, PNG, JPG up to 10 MB)"
              onFileChange={setLetter}
            />
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting Request...' : 'Submit Request'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedDept('');
                setSelectedType('');
                setQuantity(1);
                setReason('');
                setRequirementDate('');
                setReturnDate('');
                setAvailableCount(null);
                setLetter(null);
                setLetterResetKey((k) => k + 1);
              }}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
