import React, { useState, useEffect } from 'react';
import { fetchRegistrarCatalog, fetchRegistrarStock } from '../../../../services/registrar';

/**
 * MasterCatalogView
 * University-wide Master Resource Catalog.
 * Displays authorized equipment specifications, department categories,
 * and current stock levels against minimum threshold guidelines.
 */
export default function MasterCatalogView({ addToast }) {
  const [catalog, setCatalog] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Load catalog data and stock info
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [catData, stockData] = await Promise.all([
        fetchRegistrarCatalog().catch(() => []),
        fetchRegistrarStock().catch(() => [])
      ]);

      setCatalog(Array.isArray(catData) ? catData : []);
      setStockList(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      console.error('Error loading master catalog:', err);
      setError('Failed to load master catalog.');
      if (addToast) addToast('Error loading catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter catalog by department
  const filteredCatalog = catalog.filter((deptEntry) => {
    if (selectedDept !== 'All' && deptEntry.department !== selectedDept) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color, #0F386E)', marginBottom: '0.25rem' }}>
            Master Resource Catalog
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Central repository of authorized equipment, hardware specifications, and department inventory allocations.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>refresh</span>
          Refresh
        </button>
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
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search catalog resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ width: '220px' }}>
          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="All">All Departments</option>
            {catalog.map((c) => (
              <option key={c.department} value={c.department}>
                {c.department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Cards by Department */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
            sync
          </span>
          <p style={{ marginTop: '0.5rem' }}>Loading master catalog...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={loadData} style={{ marginTop: '0.5rem' }}>
            Retry
          </button>
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>
            menu_book
          </span>
          <p style={{ marginTop: '0.5rem' }}>No catalog entries found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredCatalog.map((deptEntry) => {
            const types = (deptEntry.resourceTypes || []).filter((t) => {
              if (!searchTerm.trim()) return true;
              return t.toLowerCase().includes(searchTerm.toLowerCase());
            });

            if (types.length === 0) return null;

            return (
              <div
                key={deptEntry.department}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#0F386E', fontSize: '1.5rem' }}>
                    domain
                  </span>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0F386E' }}>
                      {deptEntry.department}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {types.length} authorized resource classification(s)
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {types.map((type) => {
                    // Look up stock info for this item in this dept
                    const stockItem = stockList.find(
                      (s) => s.department === deptEntry.department && s.resourceType === type
                    );

                    return (
                      <div
                        key={type}
                        style={{
                          background: '#f8fafc',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                            {type}
                          </span>
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                            category
                          </span>
                        </div>

                        {stockItem ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            <span style={{ color: '#64748b' }}>
                              Available: <strong style={{ color: '#0F386E' }}>{stockItem.currentQuantity ?? 0}</strong> / Min: {stockItem.thresholdLevel ?? 0}
                            </span>
                            <span
                              className={`badge ${stockItem.status ? 'badge-allocated' : 'badge-rejected'}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {stockItem.status ? 'Optimal' : 'Low Stock'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Standard university inventory asset
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
