import React, { useState, useEffect } from 'react';
import { fetchRegistrarResources } from '../../../../services/registrar';

/**
 * AssetTaggingView
 * Enables the Registrar to index hardware serials, assign RFID tags,
 * and audit incoming physical assets into the university ledger.
 */
export default function AssetTaggingView({ addToast }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  // Tag registration modal state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [rfidTagInput, setRfidTagInput] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Load existing resources to view and tag
  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await fetchRegistrarResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching resources for tagging:', err);
      if (addToast) addToast('Failed to load asset list for tagging', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Open modal to tag an asset
  const handleOpenTagModal = (asset) => {
    setSelectedAsset(asset);
    setSerialInput(asset.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`);
    setRfidTagInput(`RFID-${Math.floor(1000000 + Math.random() * 9000000)}`);
    setBarcodeInput(`BC-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  // Close tag modal
  const handleCloseModal = () => {
    setSelectedAsset(null);
  };

  // Save the RFID tag to the local asset list
  const handleSaveTag = (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    // Update the asset in local state
    setResources((prev) =>
      prev.map((item) => {
        if (item.id === selectedAsset.id) {
          return {
            ...item,
            rfidTag: rfidTagInput,
            serialNumber: serialInput,
            barcode: barcodeInput,
            taggedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        }
        return item;
      })
    );

    if (addToast) {
      addToast(`RFID Tag ${rfidTagInput} successfully registered to ${selectedAsset.name || selectedAsset.id}!`, 'success');
    }
    handleCloseModal();
  };

  // Filtered resources
  const filteredList = resources.filter((item) => {
    if (filterDept !== 'All' && item.department !== filterDept) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = (item.id || '').toLowerCase().includes(q);
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
      const matchRfid = (item.rfidTag || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSerial && !matchRfid) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
            RFID Asset Tagging & Verification
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Index new shipments, assign university RFID identifiers, and link serial numbers to the asset master registry.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadResources}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* Info Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Registered Assets</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F386E' }}>{resources.length}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#93c5fd' }}>qr_code_2</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>RFID Verified</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#16a34a' }}>
              {resources.filter((r) => r.rfidTag || r.serialNumber).length}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#86efac' }}>verified</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active In Circulation</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f59e0b' }}>
              {resources.filter((r) => r.status === 'Allocated' || r.status === 'Available').length}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#fde68a' }}>devices</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Asset ID, name, serial, or RFID tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="form-control"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">Department: All</option>
            <option value="IT Services">IT Services</option>
            <option value="HR Dept">HR Dept</option>
            <option value="Operations">Operations</option>
            <option value="Facilities">Facilities</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>
      </div>

      {/* Inventory & Tagging Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: 'var(--shadow-sm)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>
          Hardware Inventory & RFID Index ({filteredList.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
              sync
            </span>
            <p style={{ marginTop: '0.5rem' }}>Loading asset registry...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>
              qr_code_scanner
            </span>
            <p style={{ marginTop: '0.5rem' }}>No hardware assets found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset Name / Model</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Serial Number</th>
                  <th style={{ padding: '0.75rem 1rem' }}>RFID Tag</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Registry Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((asset) => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0F386E' }}>
                      {asset.id}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{asset.name || asset.type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Type: {asset.type}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                      {asset.department}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#334155' }}>
                      {asset.serialNumber || 'Unassigned'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {asset.rfidTag ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>nfc</span>
                          {asset.rfidTag}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Pending Tag</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${asset.status === 'Available' ? 'badge-allocated' : 'badge-pending'}`}>
                        {asset.status}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleOpenTagModal(asset)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>qr_code_scanner</span>
                        {asset.rfidTag ? 'Re-tag' : 'Tag & Register'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tag Registration Modal */}
      {selectedAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0F386E' }}>
                  Assign RFID & Serial Tag
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Asset: {selectedAsset.name || selectedAsset.id} ({selectedAsset.department})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTag} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Hardware Serial Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  RFID Tag Identifier
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={rfidTagInput}
                  onChange={(e) => setRfidTagInput(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Barcode Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save & Index Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
