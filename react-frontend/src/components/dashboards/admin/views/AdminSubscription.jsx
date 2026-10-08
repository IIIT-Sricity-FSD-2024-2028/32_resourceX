import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  fetchAdminOrganization,
  fetchSubscriptionPlans,
  updateSubscription
} from '../../../../services/admin';

/**
 * Exact replica of subscription-manage-view from admin.html and admin.js
 */
export default function AdminSubscription() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [myOrg, setMyOrg] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgData, plansData] = await Promise.all([
        fetchAdminOrganization(),
        fetchSubscriptionPlans()
      ]);
      setMyOrg(orgData);
      setPlans(plansData || []);
    } catch (err) {
      addToast(err.message || 'Failed to load subscription data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeSubscription = async (planId) => {
    try {
      await updateSubscription(planId);
      addToast('Subscription plan updated successfully', 'success');
      const updatedOrg = await fetchAdminOrganization();
      setMyOrg(updatedOrg);
    } catch (err) {
      addToast(err.message || 'Failed to update subscription.', 'error');
    }
  };

  const activePlanId = myOrg?.subscriptionPlanId;
  const activePlan = plans.find((p) => p.id === activePlanId);

  return (
    <div id="subscription-manage-view" className="view-section active">
      <h1 className="page-title">Subscription Management</h1>
      <p className="page-subtitle">Manage your organization's subscription plan and billing.</p>

      {/* Current Plan Details */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Current Plan Details</div>
        </div>
        <div id="current-plan-details" style={{ padding: '1.5rem', fontSize: '1rem' }}>
          {isLoading ? (
            'Loading subscription details...'
          ) : activePlan ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Plan Name:</strong> {activePlan.name} <br />
                <strong>Max Users:</strong> {activePlan.maxUsers} <br />
                <strong>Price:</strong> ${activePlan.pricePerYear} / year
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge allocated" style={{ background: '#dcfce7', color: '#166534', fontWeight: 'bold' }}>
                  Active
                </span>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                  No expiry (In-Memory)
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b' }}>No active subscription plan configured.</div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="data-section" style={{ marginTop: '1.5rem' }}>
        <div className="data-section-header">
          <div className="data-section-title">Available Plans</div>
        </div>
        <div
          id="subscription-plans-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem'
          }}
        >
          {isLoading ? (
            <div style={{ color: '#64748b' }}>Loading plans...</div>
          ) : plans.length === 0 ? (
            <div style={{ color: '#64748b' }}>No subscription plans available.</div>
          ) : (
            plans.map((plan) => {
              const isActive = plan.id === activePlanId;
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'white',
                    border: `2px solid ${isActive ? 'var(--primary-color)' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      ACTIVE
                    </div>
                  )}
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>{plan.name}</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
                      ${plan.pricePerYear}{' '}
                      <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>
                        /yr
                      </span>
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                      For up to {plan.maxUsers} users.
                    </p>
                  </div>
                  <div>
                    {isActive ? (
                      <button className="btn-secondary" style={{ width: '100%' }} disabled>
                        Current Plan
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => handleChangeSubscription(plan.id)}
                      >
                        Select Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
