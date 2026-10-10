import React, { useState } from 'react';

/**
 * Exact replica of #stock-edit-modal from department_head.html
 */
export default function EditThresholdModal({ item, onClose, onSave, isSaving = false }) {
  if (!item) return null;

  return <EditThresholdForm item={item} onClose={onClose} onSave={onSave} isSaving={isSaving} />;
}

function EditThresholdForm({ item, onClose, onSave, isSaving }) {
  const [value, setValue] = useState(() => String(item.thresholdLevel ?? ''));

  return (
    <div className="stock-modal-overlay active" onClick={onClose}>
      <div className="stock-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Edit Threshold</h3>
          <button type="button" onClick={onClose} className="stock-modal-close">&#x2715;</button>
        </div>
        <div className="stock-modal-resource-info">Resource: {item.resourceType}</div>
        <div className="stock-modal-field">
          <label className="stock-modal-label">Current Quantity</label>
          <input type="number" disabled className="stock-modal-input" value={item.currentQuantity ?? 0} />
        </div>
        <div className="stock-modal-field last">
          <label className="stock-modal-label">Threshold Level</label>
          <input
            type="number"
            min="0"
            className="stock-modal-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(value);
            }}
            autoFocus
          />
        </div>
        <div className="stock-modal-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={() => onSave(value)} className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Threshold'}
          </button>
        </div>
      </div>
    </div>
  );
}
