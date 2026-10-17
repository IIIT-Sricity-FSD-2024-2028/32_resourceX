import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchOwnerOrganizations, fetchOwnerPlans } from '../../../../services/owner';
import TableToolbar, { matchesSearch } from '../../../common/TableToolbar';

const DAY_MS = 1000 * 60 * 60 * 24;

const RENEWAL_STATUSES = ['Active', 'Upcoming', 'Renew Soon', 'Expired', 'No Expiry'];

function renewalLabel(expiry, daysLeft) {
  if (!expiry) return 'No Expiry';
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Renew Soon';
  if (daysLeft <= 90) return 'Upcoming';
  return 'Active';
}

function renewalBadge(expiry, daysLeft) {
  if (!expiry) return <span className="badge">No Expiry</span>;
  if (daysLeft < 0) return <span className="badge rejected">Expired</span>;
  if (daysLeft <= 30) return <span className="badge pending">Renew Soon</span>;
  if (daysLeft <= 90) {
    return <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Upcoming</span>;
  }
  return <span className="badge allocated">Active</span>;
}

/**
 * Exact replica of revenue-view from owner.html and owner.js#renderRevenue
 */
export default function OwnerRevenue() {
  const context = useOutletContext() || {};
  const { addToast = () => {} } = context;

  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [renewalFilter, setRenewalFilter] = useState('All');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgList, planList] = await Promise.all([fetchOwnerOrganizations(), fetchOwnerPlans()]);
      setOrganizations(orgList || []);
      setPlans(planList || []);
    } catch (err) {
      addToast(err.message || 'Failed to load revenue data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Per-org revenue (only active orgs with a plan)
  const today = new Date();
  const in90 = new Date();
  in90.setDate(today.getDate() + 90);
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));
  const activeOrgs = organizations.filter((o) => o.status === 'Active');

  let totalRevenue = 0;
  let expiringCount = 0;
  const rows = activeOrgs
    .map((org) => {
      const plan = planMap[org.subscriptionPlanId];
      const price = plan ? plan.pricePerYear : 0;
      totalRevenue += price;
      const expiry = org.subscriptionExpiryDate ? new Date(org.subscriptionExpiryDate) : null;
      const daysLeft = expiry ? Math.ceil((expiry - today) / DAY_MS) : null;
      if (expiry && expiry <= in90 && expiry > today) expiringCount++;
      return { org, plan, price, expiry, daysLeft };
    })
    .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

  const visibleRows = rows.filter(({ org, plan, expiry, daysLeft }) =>
    (planFilter === 'All' || plan?.name === planFilter) &&
    (renewalFilter === 'All' || renewalLabel(expiry, daysLeft) === renewalFilter) &&
    matchesSearch(search, org.id, org.name, plan?.name)
  );

  const emptyRow = (cols, text) => (
    <tr>
      <td colSpan={cols} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>{text}</td>
    </tr>
  );

  return (
    <div id="revenue-view" className="view-section active">
      <h1 className="page-title">Revenue Analysis</h1>
      <p className="page-subtitle">Platform revenue breakdown by plan, organization and subscription timeline.</p>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-title">Total Annual Revenue</div>
          <div className="stat-value-row">
            <div className="stat-value" id="rev-total">${totalRevenue.toLocaleString()}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#166534' }}>payments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Subscriptions</div>
          <div className="stat-value-row">
            <div className="stat-value" id="rev-active-count">{activeOrgs.length}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>check_circle</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Expiring in 90 Days</div>
          <div className="stat-value-row">
            <div className="stat-value" id="rev-expiring">{expiringCount}</div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#92400e' }}>schedule</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Avg Revenue / Org</div>
          <div className="stat-value-row">
            <div className="stat-value" id="rev-avg">
              ${activeOrgs.length ? Math.round(totalRevenue / activeOrgs.length).toLocaleString() : 0}
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#1d4ed8' }}>trending_up</span>
          </div>
        </div>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Revenue by Subscription Plan</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Price / Year</th>
              <th>Orgs on Plan</th>
              <th>Annual Revenue</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody id="revPlanTableBody">
            {isLoading
              ? emptyRow(5, 'Loading...')
              : plans.length === 0
                ? emptyRow(5, 'No plan data.')
                : plans.map((plan) => {
                    const orgsOnPlan = activeOrgs.filter((o) => o.subscriptionPlanId === plan.id).length;
                    const planRevenue = orgsOnPlan * plan.pricePerYear;
                    const pct = totalRevenue > 0 ? ((planRevenue / totalRevenue) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={plan.id}>
                        <td><strong>{plan.name}</strong></td>
                        <td>${plan.pricePerYear.toLocaleString()}</td>
                        <td>{orgsOnPlan}</td>
                        <td><strong>${planRevenue.toLocaleString()}</strong></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', width: '120px', overflow: 'hidden' }}>
                              <div style={{ background: 'var(--primary-color)', height: '100%', width: `${pct}%` }} />
                            </div>
                            {pct}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Subscription Timeline (per Organization)</div>
        </div>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by org ID, organization or plan..."
          filters={[
            { label: 'All Plans', value: planFilter, onChange: setPlanFilter, options: plans.map((p) => p.name) },
            { label: 'All Renewal Statuses', value: renewalFilter, onChange: setRenewalFilter, options: RENEWAL_STATUSES },
          ]}
          resultCount={visibleRows.length}
          totalCount={rows.length}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Org ID</th>
              <th>Organization</th>
              <th>Plan</th>
              <th>Price / Year</th>
              <th>Expiry Date</th>
              <th>Days Remaining</th>
              <th>Renewal Status</th>
            </tr>
          </thead>
          <tbody id="revTimelineTableBody">
            {isLoading
              ? emptyRow(7, 'Loading...')
              : rows.length === 0
                ? emptyRow(7, 'No active subscriptions.')
                : visibleRows.length === 0
                  ? emptyRow(7, 'No subscriptions match your search or filters.')
                  : visibleRows.map(({ org, plan, price, expiry, daysLeft }) => (
                    <tr key={org.id}>
                      <td>{org.id}</td>
                      <td><strong>{org.name}</strong></td>
                      <td>{plan ? plan.name : '—'}</td>
                      <td>${price.toLocaleString()}</td>
                      <td>
                        {expiry
                          ? expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        {daysLeft === null ? '—' : daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days`}
                      </td>
                      <td>{renewalBadge(expiry, daysLeft)}</td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
