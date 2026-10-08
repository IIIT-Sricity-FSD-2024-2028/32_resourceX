import React, { useState, useEffect } from 'react';
import { fetchOrganizations } from '../../services/auth';

export default function OrgSelector({ selectedRole, onSelectOrg, onBack }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadOrgs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orgs = await fetchOrganizations();
        if (isMounted) {
          setOrganizations(orgs || []);
          if (orgs && orgs.length > 0) {
            setSelectedOrgId(orgs[0].id);
          }
        }
      } catch {
        if (isMounted) {
          setError('Failed to load organizations. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadOrgs();
    return () => { isMounted = false; };
  }, []);

  const handleContinue = () => {
    if (!selectedOrgId) return;
    const found = organizations.find((o) => o.id === selectedOrgId);
    onSelectOrg(selectedOrgId, found ? found.name : 'Selected Organization');
  };

  return (
    <div className="org-selector-step">
      <button type="button" className="login-back-btn" onClick={onBack}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Roles
      </button>

      <h2 className="login-title">Select Organization</h2>
      <p className="login-subtitle">Signing in as <strong>{selectedRole}</strong></p>

      {error && (
        <div className="login-error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
          {error}
        </div>
      )}

      <div className="login-form-group">
        <label className="login-form-label" htmlFor="org-select">Organization / Institution</label>
        {isLoading ? (
          <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading organizations...
          </div>
        ) : (
          <select
            id="org-select"
            className="login-form-control"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
          >
            {organizations.length === 0 ? (
              <option value="">No organizations available</option>
            ) : (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.id})
                </option>
              ))
            )}
          </select>
        )}
      </div>

      <button
        type="button"
        className="login-submit-btn"
        onClick={handleContinue}
        disabled={isLoading || !selectedOrgId}
      >
        Continue to Sign In &rarr;
      </button>
    </div>
  );
}
