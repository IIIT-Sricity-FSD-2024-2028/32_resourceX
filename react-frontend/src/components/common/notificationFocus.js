import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Notification deep links.
 *
 * Clicking a notification navigates to the page that handles its record, carrying
 * `{ notificationFocus: { type, id, tab } }` in the router state:
 *  - tab-based dashboards switch to `tab` (useNotificationTab)
 *  - views with a detail card open it for `id` (useNotificationFocus)
 *  - the matching table row is scrolled into view and flashed (highlightRecord)
 */

const ROLE_BASE = {
  Requestor: '/dashboard/requestor',
  'Dept Head': '/dashboard/dept-head',
  'Inventory Officer': '/dashboard/inventory-officer',
  'Procurement Officer': '/dashboard/procurement-officer',
  'Maintenance Officer': '/dashboard/maintenance-officer',
  Registrar: '/dashboard/registrar',
};

// Older notifications have no explicit target — recover it from the text
export function getNotificationTarget(n) {
  if (n.targetType) return { type: n.targetType, id: n.targetId };
  const text = `${n.title || ''} ${n.description || ''}`;
  const match = (re) => (text.match(re) || [])[0];
  const req = match(/\bREQ-[A-Za-z0-9-]*[A-Za-z0-9]/);
  if (req) return { type: 'request', id: req };
  const proc = match(/\b(?:PROC|PRC)-[A-Za-z0-9-]*[A-Za-z0-9]/);
  if (proc) return { type: 'procurement', id: proc };
  const res = match(/\bRES-[A-Za-z0-9-]*[A-Za-z0-9]/);
  if (res) return { type: 'resource', id: res };
  if (/procure|indent/i.test(text)) return { type: 'procurement' };
  if (/low stock/i.test(text)) return { type: 'stock' };
  return null;
}

/** Where a notification should take this role: { path, tab?, type, id } or null. */
export function resolveNotificationDestination(role, n) {
  const target = getNotificationTarget(n);
  const base = ROLE_BASE[role];
  if (!target || !base) return null;
  const { type } = target;
  const title = n.title || '';
  const tab = (t) => ({ ...target, path: base, tab: t });
  const page = (p) => ({ ...target, path: `${base}/${p}` });

  switch (role) {
    case 'Requestor':
      if (type === 'request') return tab('my-requests');
      if (type === 'resource') return tab('my-resources');
      return null;
    case 'Dept Head':
      if (type === 'request') return page('requests');
      if (type === 'procurement') return page('procurement');
      if (type === 'resource') return page(/extension/i.test(title) ? 'requests' : 'resources');
      if (type === 'stock') return page('stock');
      return null;
    case 'Inventory Officer':
      if (type === 'request') return tab('allocation-queue');
      if (type === 'procurement') return tab('registration');
      if (type === 'resource') return tab('returns');
      return null;
    case 'Procurement Officer':
      if (type === 'procurement') return tab(/cancel/i.test(title) ? 'indents' : 'orders');
      return null;
    case 'Maintenance Officer':
      if (type === 'resource') return tab('maintenance-queue');
      return null;
    case 'Registrar':
      if (type === 'procurement') return page('procurements');
      if (type === 'request') return page('requests');
      return null;
    default:
      return null;
  }
}

/**
 * Scrolls the record's row into view and flashes it. Rows are found by
 * `data-row-id`, or else by a cell whose whole text is the record id. Retries
 * for a few seconds because the page usually loads its data after navigating.
 */
export function highlightRecord(id, { timeoutMs = 5000 } = {}) {
  if (!id) return;
  const started = Date.now();

  const find = () => {
    const root = document.querySelector('.content-area') || document.body;
    const byAttr = root.querySelector(`[data-row-id="${CSS.escape(id)}"]`);
    if (byAttr) return byAttr;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.trim() === id) {
        const el = node.parentElement;
        return el.closest('tr') || el.closest('[class*="card"]') || el;
      }
    }
    return null;
  };

  const attempt = () => {
    const el = find();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('rx-focus-flash');
      void el.offsetWidth; // restart the animation if the row is flashed again
      el.classList.add('rx-focus-flash');
      setTimeout(() => el.classList.remove('rx-focus-flash'), 2600);
    } else if (Date.now() - started < timeoutMs) {
      setTimeout(attempt, 250);
    }
  };
  setTimeout(attempt, 150);
}

/** Tab-based dashboards: switch to the tab a notification points at. */
export function useNotificationTab(selectTab) {
  const location = useLocation();
  const tab = location.state?.notificationFocus?.tab;
  const selectRef = useRef(selectTab);
  selectRef.current = selectTab;
  useEffect(() => {
    if (tab) selectRef.current(tab);
  }, [tab, location.key]);
}

/**
 * Views with a detail card: once data is loaded, open the card for the focused
 * record of `type`, then clear the router state so a refresh does not reopen it.
 */
export function useNotificationFocus(type, ready, openRecord) {
  const location = useLocation();
  const navigate = useNavigate();
  const focus = location.state?.notificationFocus;
  const openRef = useRef(openRecord);
  openRef.current = openRecord;

  useEffect(() => {
    if (!focus || focus.type !== type || !ready) return;
    if (focus.id) openRef.current(focus.id);
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [focus, type, ready, location.key, location.pathname, location.search, navigate]);
}
