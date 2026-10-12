import React, { useState, useEffect } from 'react';

/**
 * Add Resource modal dialog matching staff.html
 */
export default function AddResourceModal({
  isOpen,
  onClose,
  onSubmit,
  catalogTypes = [],
  department = '',
  existingResources = []
}) {
  const [formData, setFormData] = useState({
    type: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    vendor: '',
    invoice: '',
    location: '',
    condition: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: catalogTypes.length > 0 ? catalogTypes[0] : '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        vendor: '',
        invoice: '',
        location: '',
        condition: 'Good'
      });
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, catalogTypes]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { type, serialNumber, manufacturer, model, vendor, invoice, location, condition } = formData;

    if (!type || !manufacturer.trim() || !model.trim() || !serialNumber.trim() || !location.trim() || !condition) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const sn = serialNumber.trim();
    const snRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!snRegex.test(sn)) {
      setErrorMsg('Serial Number can only contain letters, numbers, dots, hyphens, and underscores.');
      return;
    }

    // Check duplicate serial number
    const isDuplicate = existingResources.some(
      (r) => String(r.serialNumber || '').toLowerCase() === sn.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg('Serial number already exists in inventory.');
      return;
    }

    // Generate unique ID / code
    const deptPrefix = (department || 'DEP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const typePrefix = type.substring(0, 3).toUpperCase();
    const sameTypeCount = existingResources.filter((r) => r.type === type).length;
    const nextNumber = String(sameTypeCount + 1).padStart(3, '0');
    const generatedCode = `${deptPrefix}-${typePrefix}-${nextNumber}`;

    const newResource = {
      id: generatedCode,
      code: generatedCode,
      type,
      name: `${manufacturer.trim()} ${model.trim()}`,
      department: department || 'IT Services',
      serialNumber: sn,
      location: location.trim(),
      condition,
      status: 'Available',
      vendor: vendor.trim() || undefined,
      invoice: invoice.trim() || undefined,
      assignedTo: 'None',
      date: new Date().toLocaleDateString('en-US')
    };

    try {
      setIsSubmitting(true);
      await onSubmit(newResource);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fallback catalog options if catalog is empty
  const defaultTypes = [
    'Laptops',
    'Server Blades v2',
    'External Hard Drives',
    'Network Switches',
    'Routers',
    'Monitors',
    'Printers',
    'Accessories',
    'Standing Desks',
    'Office Chairs',
    'Walkie Talkies',
    'Tablets'
  ];
  const availableTypes = catalogTypes.length > 0 ? catalogTypes : defaultTypes;

  return (
    <div className="stock-modal-overlay">
      <div className="stock-modal-content resource-modal-content">
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Add New Resource</h3>
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
              <label className="form-label" htmlFor="type" style={{ textAlign: 'left', display: 'block' }}>
                Resource Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Resource Type...</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="serialNumber" style={{ textAlign: 'left', display: 'block' }}>
                Serial Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="serialNumber"
                className="form-control"
                placeholder="e.g., SN-XXXXXX"
                value={formData.serialNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="manufacturer" style={{ textAlign: 'left', display: 'block' }}>
                Manufacturer <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="manufacturer"
                className="form-control"
                placeholder="e.g., Dell"
                value={formData.manufacturer}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="model" style={{ textAlign: 'left', display: 'block' }}>
                Model <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="model"
                className="form-control"
                placeholder="e.g., Latitude 5540"
                value={formData.model}
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
                placeholder="e.g., Dell Partner"
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
                placeholder="e.g., INV-1024"
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
                placeholder="e.g., Building A, Room 101"
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
                <option value="">Select Condition...</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
          </div>

          <div className="stock-modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
