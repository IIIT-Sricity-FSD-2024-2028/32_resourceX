import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchDeptResources, fetchDeptRequests } from '../../../../services/deptHead';
import { DoughnutChart, LineChart, HBarChart } from '../components/DeptCharts';
import { LoadingBlock, ErrorBlock, countBuckets, parseDate } from '../components/deptHeadUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const APPROVED_STATES = ['Approved', 'Allocated', 'Completed'];

/**
 * #analytics-view from department_head.html — computed from live department data
 * (the original page used hard-coded sample numbers for trends / most used / KPIs).
 */
export default function DeptHeadAnalytics() {
  const { addToast = () => {} } = useOutletContext() || {};

  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, reqs] = await Promise.all([fetchDeptResources(), fetchDeptRequests()]);
      setResources(res || []);
      setRequests(reqs || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
      addToast(err.message || 'Error loading analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analytics = useMemo(() => {
    // 1. Distribution
    const b = countBuckets(resources);
    const total = resources.length;

    // 2. Monthly request trend — 6 months ending this month, or ending at the latest
    //    request month when the department has no requests in the last 6 months
    const now = new Date();
    const dates = requests.map((r) => parseDate(r.date)).filter(Boolean);
    const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : now;
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const end = latest < sixMonthsAgo ? latest : now;
    const showYear = end.getFullYear() !== now.getFullYear();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: showYear ? `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` : MONTHS[d.getMonth()],
        count: 0
      });
    }
    requests.forEach((r) => {
      const d = parseDate(r.date);
      if (!d) return;
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.count += 1;
    });
    const counts = months.map((m) => m.count);
    const avg = counts.reduce((a, c) => a + c, 0) / months.length;
    const last = counts[counts.length - 1];
    const prev = counts[counts.length - 2];
    const trendPct = prev > 0 ? ((last - prev) / prev) * 100 : last > 0 ? 100 : 0;

    // 3. Most used resources — allocation % per type (top 6)
    const byType = {};
    resources.forEach((r) => {
      const t = r.type || r.name || 'Other';
      if (!byType[t]) byType[t] = { total: 0, allocated: 0 };
      byType[t].total++;
      if (r.status === 'Allocated') byType[t].allocated++;
    });
    const used = Object.entries(byType)
      .map(([type, v]) => ({ type, pct: v.total ? Math.round((v.allocated / v.total) * 100) : 0 }))
      .sort((a, b2) => b2.pct - a.pct || a.type.localeCompare(b2.type))
      .slice(0, 6);

    // 4. KPIs
    const utilRate = total > 0 ? Math.round((b.allocated / total) * 100) : 0;
    const approved = requests.filter((r) => APPROVED_STATES.includes(r.status)).length;
    const rejected = requests.filter((r) => r.status === 'Rejected').length;
    const decided = approved + rejected;
    const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
    const pending = requests.filter((r) => r.status === 'Pending').length;

    return { b, total, months, counts, avg, trendPct, used, utilRate, approved, rejected, approvalRate, pending };
  }, [resources, requests]);

  if (isLoading) return <LoadingBlock text="Loading analytics..." />;
  if (error) return <ErrorBlock text={error} onRetry={loadData} />;

  const a = analytics;
  const trendUp = a.trendPct >= 0;

  return (
    <div className="view-section">
      <h1 className="page-title">Resource Analytics</h1>
      <p className="page-subtitle">Insights and trends for departmental resources</p>

      {/* Top Row: Doughnut + Line */}
      <div className="dh-two-col" style={{ marginBottom: '1.5rem' }}>
        <div className="data-section dh-section-pad" style={{ marginBottom: 0 }}>
          <div className="data-section-title" style={{ marginBottom: '1rem' }}>Resource Distribution</div>
          <div style={{ minHeight: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <DoughnutChart
              labels={['Available', 'Allocated', 'Maintenance', 'Scrap']}
              data={[a.b.available, a.b.allocated, a.b.maintenance, a.b.scrap]}
              colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
            />
          </div>
        </div>
        <div className="data-section dh-section-pad" style={{ marginBottom: 0 }}>
          <div className="data-section-title" style={{ marginBottom: '1rem' }}>Monthly Request Trends</div>
          <div style={{ minHeight: '250px', display: 'flex', alignItems: 'center' }}>
            <LineChart labels={a.months.map((m) => m.label)} data={a.counts} label="Requests" />
          </div>
        </div>
      </div>

      {/* Middle Row: Horizontal Bar */}
      <div className="data-section dh-section-pad" style={{ marginBottom: '1.5rem' }}>
        <div className="data-section-title" style={{ marginBottom: '1rem' }}>Most Used Resources</div>
        <HBarChart labels={a.used.map((u) => u.type)} data={a.used.map((u) => u.pct)} label="Usage %" />
      </div>

      {/* Bottom Row: KPI Cards */}
      <div className="stats-grid dh-stats-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>Average Request per Month</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{a.avg.toFixed(1)}</div>
          <div style={{ fontSize: '0.75rem', color: trendUp ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
            {trendUp ? '+' : ''}{a.trendPct.toFixed(1)}% from previous month
          </div>
        </div>
        <div className="stat-card" style={{ justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>Resource Utilization Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{a.utilRate}%</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
            {a.b.allocated} of {a.total} resources allocated
          </div>
        </div>
        <div className="stat-card" style={{ justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>Request Approval Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{a.approvalRate}%</div>
          <div style={{ fontSize: '0.75rem', color: a.pending > 0 ? '#d97706' : '#16a34a', fontWeight: 500 }}>
            {a.approved} approved · {a.rejected} rejected · {a.pending} pending
          </div>
        </div>
      </div>
    </div>
  );
}
