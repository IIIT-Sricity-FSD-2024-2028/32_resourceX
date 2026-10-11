import React, { useState, useEffect } from 'react';

/**
 * Edit Resource modal dialog matching staff.html
 */
export default function EditResourceModal({
  isOpen,
  onClose,
  onSubmit,
  resource = null,
  existingResources = []
}) {
  const [formData, setFormData] = useState({
    serialNumber: '',
    vendor: '',
    invoice: '',
    location: '',
    condition: 'Good',
    status: 'Available'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      let cond = resource.condition || 'Average';
      if (cond === 'Fair') cond = 'Average';
      if (cond === 'New') cond = 'Good';

      setFormData({
        serialNumber: resource.serialNumber || '',
        vendor: resource.vendor || '',
        invoice: resource.invoice || '',
        location: resource.location || '',
        condition: cond,
        status: resource.status || 'Available'
      });
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, resource]);

  if (!isOpen || !resource) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const sn = formData.serialNumber.trim();
    const snRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!sn || !snRegex.test(sn)) {
      setErrorMsg('Serial Number can only contain letters, numbers, dots, hyphens, and underscores.');
      return;
    }

    if (!formData.location.trim()) {
      setErrorMsg('Location is required.');
      return;
    }

    // Check duplicate serial against other resources
    const isDuplicate = existingResources.some(
      (r) => r.id !== resource.id && String(r.serialNumber || '').toLowerCase() === sn.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg('Serial number already exists for another resource.');
      return;
    }

    const updatePayload = {
      serialNumber: sn,
      vendor: formData.vendor.trim() || undefined,
      invoice: formData.invoice.trim() || undefined,
      location: formData.location.trim(),
      condition: formData.condition,
      status: formData.status
    };

    try {
      setIsSubmitting(true);
      await onSubmit(resource.id, updatePayload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stock-modal-overlay">
      <div className="stock-modal-content resource-modal-content">
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Edit Resource</h3>
          <button type="button" onClick={onClose} className="stock-modal-close" aria-label="Close">
            &#x2715;
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="resource-form-grid">
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Resource Code
              </label>
              <input
                type="text"
                className="form-control"
                value={resource.code || resource.id}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serialNumber" style={{ textAlign: 'left', display: 'block' }}>
                Serial Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="serialNumber"
                className="form-control"
                value={formData.serialNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="vendor" style={{ textAlign: 'left', display: 'block' }}>
                Vendor
              </label>
              <input
                type="text"
                id="vendor"
                className="form-control"
                value={formData.vendor}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="invoice" style={{ textAlign: 'left', display: 'block' }}>
                Invoice Number
              </label>
              <input
                type="text"
                id="invoice"
                className="form-control"
                value={formData.invoice}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="location" style={{ textAlign: 'left', display: 'block' }}>
                Location <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="condition" style={{ textAlign: 'left', display: 'block' }}>
                Condition <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="condition"
                className="form-control"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>
            </div>

            <div className="form-group span-2">
              <label className="form-label" htmlFor="status" style={{ textAlign: 'left', display: 'block' }}>
                Status <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Maintenance Requested">Maintenance Requested</option>
                <option value="Returned">Returned</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>
          </div>

          <div className="stock-modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
