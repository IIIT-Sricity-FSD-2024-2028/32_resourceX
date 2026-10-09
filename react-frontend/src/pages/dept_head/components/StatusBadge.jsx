import React from 'react';

/**
 * Maps request / procurement / resource / stock statuses to badge classes.
 */
const STATUS_CLASS = {
  Pending: 'pending',
  'Pending Approval': 'pending-approval',
  Approved: 'approved',
  Allocated: 'allocated',
  Rejected: 'rejected',
  Fulfilled: 'fulfilled',
  Registered: 'registered',
  Available: 'available',
  Maintenance: 'maintenance',
  'Maintenance Requested': 'maintenance',
  Scrapped: 'scrap',
  Safe: 'badge-stock-safe',
  'Near Threshold': 'badge-stock-near',
  'Low Stock': 'badge-stock-low'
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const cls = STATUS_CLASS[status] || 'badge-secondary';
  return <span className={`badge ${cls}`}>{status}</span>;
}
