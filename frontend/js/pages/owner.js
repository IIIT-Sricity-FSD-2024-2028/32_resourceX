// ─── State ───────────────────────────────────────────────────────────────────
let currentOrgs = [];
let systemEmployees = [];
let subscriptionPlans = [];
let currentRegFilter = 'Pending';
let assignModal = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = Store.getCurrentUser();
    if (!user || user.role !== 'Owner') {
        window.location.href = 'login.html';
        return;
    }
    assignModal = new bootstrap.Modal(document.getElementById('assignEmployeeModal'));

    // Update sidebar user info from logged-in owner
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = 'Platform Owner';

    bindNav();
    await loadData();
});


// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const [orgs, users, analytics, invoices, plans] = await Promise.all([
            Store.api('/organizations'),
            Store.api('/users'),
            Store.api('/platform-analytics'),
            Store.api('/invoices'),
            Store.api('/subscriptions/plans')
        ]);

        currentOrgs = orgs || [];
        systemEmployees = (users || []).filter(u => u.role === 'Employee');
        subscriptionPlans = plans || [];

        // Stat cards
        document.getElementById('statActiveOrgs').textContent = analytics?.activeOrgs ?? 0;
        document.getElementById('statPendingOrgs').textContent = analytics?.pendingOrgs ?? 0;
        document.getElementById('statRevenue').textContent = `$${(analytics?.totalRevenue ?? 0).toLocaleString()}`;
        document.getElementById('statEmployees').textContent = systemEmployees.length;

        // Pending badge in sidebar
        const pendingCount = currentOrgs.filter(o => o.status === 'Pending').length;
        const badge = document.getElementById('pendingBadge');
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline' : 'none';

        renderDashboardOrgs();
        renderInvoices(invoices || []);
        renderEmployeeTable();
        renderRegTable();
        renderMgmtTable('All');
        renderRevenue();

    } catch (e) {
        console.error(e);
        alert('Failed to load dashboard data: ' + e.message);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOrgCountForEmployee(empId) {
    return currentOrgs.filter(o => o.assignedEmployeeId === empId).length;
}

function getOrgsForEmployee(empId) {
    return currentOrgs.filter(o => o.assignedEmployeeId === empId);
}

function statusBadge(status) {
    const map = { Active: 'badge-success', Pending: 'badge-pending', Suspended: 'badge-rejected' };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function renderDashboardOrgs() {
    const tbody = document.getElementById('dashOrgsTableBody');
    tbody.innerHTML = '';

    if (currentOrgs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No organizations found.</td></tr>';
        return;
    }

    currentOrgs.forEach(org => {
        const emp = systemEmployees.find(e => e.id === org.assignedEmployeeId);
        const empName = emp ? emp.name : '—';
        tbody.innerHTML += `
            <tr>
                <td>${org.id}</td>
                <td><strong>${org.name}</strong></td>
                <td>${org.adminEmail}</td>
                <td>${statusBadge(org.status)}</td>
                <td>${empName}</td>
                <td>${org.subscriptionPlanId || '—'}</td>
            </tr>`;
    });
}

function renderInvoices(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    tbody.innerHTML = '';

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No invoices found.</td></tr>';
        return;
    }

    invoices.forEach(inv => {
        tbody.innerHTML += `
            <tr>
                <td>${inv.id}</td>
                <td>${inv.organizationId}</td>
                <td>$${inv.amount?.toLocaleString?.() ?? inv.amount}</td>
                <td>${statusBadge(inv.status)}</td>
                <td>${inv.dueDate}</td>
            </tr>`;
    });
}

// ─── EMPLOYEE MANAGEMENT ──────────────────────────────────────────────────────
function renderEmployeeTable(filter = '') {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    const filtered = systemEmployees.filter(emp =>
        !filter ||
        emp.name.toLowerCase().includes(filter.toLowerCase()) ||
        emp.email.toLowerCase().includes(filter.toLowerCase()) ||
        emp.id.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No employees found.</td></tr>';
        return;
    }

    filtered.forEach(emp => {
        const empOrgs = getOrgsForEmployee(emp.id);
        const orgCount = empOrgs.length;
        const orgNames = empOrgs.slice(0, 3).map(o => o.name).join(', ') || '—';
        const extra = orgCount > 3 ? ` +${orgCount - 3} more` : '';

        const actionHtml = emp.status === 'Active'
            ? `<button class="btn-secondary" style="font-size:0.75rem;padding:0.25rem 0.5rem" onclick="suspendEmployee('${emp.id}')">Suspend</button>`
            : `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.5rem" onclick="reactivateEmployee('${emp.id}')">Reactivate</button>`;

        tbody.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.email}</td>
                <td>${orgCount}</td>
                <td>${orgNames}${extra}</td>
                <td>${statusBadge(emp.status)}</td>
                <td>${actionHtml}</td>
            </tr>`;
    });
}

function filterEmployeeCards() {
    renderEmployeeTable(document.getElementById('empSearch').value);
}

// ─── CREATE EMPLOYEE ──────────────────────────────────────────────────────────
async function handleCreateEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('newEmpName').value.trim();
    const email = document.getElementById('newEmpEmail').value.trim();
    const btn = document.getElementById('createEmpBtn');

    btn.disabled = true;
    btn.textContent = 'Creating...';

    try {
        const newEmp = await Store.api('/users/create-employee', {
            method: 'POST',
            body: { name, email }
        });

        Store.showToast(`Employee created! ID: ${newEmp.id} — ${newEmp.name}`, 'success');
        document.getElementById('createEmpForm').reset();
        await loadData();
    } catch (err) {
        Store.showToast('Failed to create employee: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Employee';
    }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function bindNav() {
    // Wait for app-sidebar custom element to render its innerHTML
    setTimeout(() => {
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                if (targetId) {
                    // Switch view
                    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
                    const target = document.getElementById(targetId);
                    if (target) target.classList.add('active');
                    // Update active nav item
                    items.forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                }
            });
        });
    }, 0);
}

// ─── ORG REGISTRATIONS (Pending only) ────────────────────────────────────────
function renderRegTable() {
    const tbody = document.getElementById('regTableBody');
    tbody.innerHTML = '';

    const pending = currentOrgs.filter(o => o.status === 'Pending');

    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No pending registrations. All caught up! ✅</td></tr>';
        return;
    }

    pending.forEach(org => {
        tbody.innerHTML += `
            <tr>
                <td>${org.id}</td>
                <td><strong>${org.name}</strong></td>
                <td>${org.adminEmail}</td>
                <td>${org.subscriptionPlanId || '—'}</td>
                <td><button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.75rem" onclick="openAssignModal('${org.id}')">Approve &amp; Assign</button></td>
            </tr>`;
    });
}

// ─── ORG MANAGEMENT (All statuses with filter) ────────────────────────────────
let currentMgmtFilter = 'All';

function filterMgmt(status, el) {
    currentMgmtFilter = status;
    ['All', 'Active', 'Suspended'].forEach(s => {
        const btn = document.getElementById(`mgmtBtn-${s}`);
        if (btn) btn.className = s === status ? 'btn-primary' : 'btn-secondary';
    });
    renderMgmtTable(status);
}

function renderMgmtTable(statusFilter = 'All') {
    const tbody = document.getElementById('mgmtTableBody');
    tbody.innerHTML = '';

    const filtered = statusFilter === 'All'
        ? currentOrgs
        : currentOrgs.filter(o => o.status === statusFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No ${statusFilter === 'All' ? '' : statusFilter.toLowerCase() + ' '}organizations found.</td></tr>`;
        return;
    }

    filtered.forEach(org => {
        const emp = systemEmployees.find(e => e.id === org.assignedEmployeeId);
        const empName = emp ? emp.name : '—';

        let actionHtml = '';
        if (org.status === 'Active') {
            actionHtml = `<button class="btn-secondary" style="font-size:0.75rem;padding:0.25rem 0.5rem" onclick="suspendOrg('${org.id}')">Suspend</button>`;
        } else if (org.status === 'Suspended') {
            actionHtml = `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.5rem" onclick="reactivateOrg('${org.id}')">Reactivate</button>`;
        } else if (org.status === 'Pending') {
            actionHtml = `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.75rem" onclick="openAssignModal('${org.id}')">Approve &amp; Assign</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${org.id}</td>
                <td><strong>${org.name}</strong></td>
                <td>${org.adminEmail}</td>
                <td>${org.subscriptionPlanId || '—'}</td>
                <td>${statusBadge(org.status)}</td>
                <td>${empName}</td>
                <td>${actionHtml}</td>
            </tr>`;
    });
}

// ─── Assign Employee Modal ────────────────────────────────────────────────────
function openAssignModal(orgId) {
    document.getElementById('assignOrgId').value = orgId;

    const select = document.getElementById('assignEmployeeSelect');
    select.innerHTML = '<option value="">-- Select Employee --</option>';

    // Sort by fewest orgs first
    const sorted = [...systemEmployees].sort((a, b) =>
        getOrgCountForEmployee(a.id) - getOrgCountForEmployee(b.id)
    );

    sorted.forEach((emp, idx) => {
        const count = getOrgCountForEmployee(emp.id);
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.name} (${count} org${count !== 1 ? 's' : ''})${idx === 0 ? ' — Recommended' : ''}`;
        if (idx === 0) opt.selected = true;
        select.appendChild(opt);
    });

    updateEmpOrgCountHint();
    assignModal.show();
}

function updateEmpOrgCountHint() {
    const empId = document.getElementById('assignEmployeeSelect').value;
    const hint = document.getElementById('empOrgCount');
    if (!empId) { hint.textContent = ''; return; }
    const count = getOrgCountForEmployee(empId);
    hint.textContent = `This employee currently manages ${count} organization${count !== 1 ? 's' : ''}.`;
}

async function handleAssignEmployee(e) {
    e.preventDefault();
    const orgId = document.getElementById('assignOrgId').value;
    const employeeId = document.getElementById('assignEmployeeSelect').value;

    try {
        await Store.api(`/organizations/${orgId}/approve`, {
            method: 'PATCH',
            body: { employeeId }
        });
        assignModal.hide();
        await loadData();
        renderRegTable(currentRegFilter);
    } catch (err) {
        alert('Failed to approve organization: ' + err.message);
    }
}

// ─── Org actions ──────────────────────────────────────────────────────────────
async function suspendOrg(orgId) {
    if (!confirm('Suspend this organization?')) return;
    try {
        await Store.api(`/organizations/${orgId}/suspend`, { method: 'PATCH' });
        await loadData();
        renderRegTable(currentRegFilter);
    } catch (e) { alert('Failed: ' + e.message); }
}

async function reactivateOrg(orgId) {
    if (!confirm('Reactivate this organization?')) return;
    try {
        await Store.api(`/organizations/${orgId}/reactivate`, { method: 'PATCH' });
        await loadData();
        renderRegTable(currentRegFilter);
    } catch (e) { alert('Failed: ' + e.message); }
}

// ─── Employee actions ─────────────────────────────────────────────────────────
async function suspendEmployee(empId) {
    if (!confirm('Suspend this employee?')) return;
    try {
        await Store.api(`/users/${empId}/suspend`, { method: 'PATCH' });
        await loadData();
    } catch (e) { alert('Failed: ' + e.message); }
}

async function reactivateEmployee(empId) {
    if (!confirm('Reactivate this employee?')) return;
    try {
        await Store.api(`/users/${empId}/reactivate`, { method: 'PATCH' });
        await loadData();
    } catch (e) { alert('Failed: ' + e.message); }
}

// ─── REVENUE ANALYSIS ─────────────────────────────────────────────────────────
function renderRevenue() {
    const activeOrgs = currentOrgs.filter(o => o.status === 'Active');
    const today = new Date();
    const in90 = new Date(); in90.setDate(today.getDate() + 90);

    // Build plan price lookup
    const planMap = {};
    subscriptionPlans.forEach(p => { planMap[p.id] = p; });

    // Per-org revenue (only active orgs with a plan)
    let totalRevenue = 0;
    let expiringCount = 0;

    const orgRevenueRows = activeOrgs.map(org => {
        const plan = planMap[org.subscriptionPlanId];
        const price = plan ? plan.pricePerYear : 0;
        totalRevenue += price;

        const expiry = org.subscriptionExpiryDate ? new Date(org.subscriptionExpiryDate) : null;
        const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : null;

        if (expiry && expiry <= in90 && expiry > today) expiringCount++;

        let renewalBadge;
        if (!expiry) {
            renewalBadge = '<span class="badge badge-secondary">No Expiry</span>';
        } else if (daysLeft < 0) {
            renewalBadge = '<span class="badge badge-rejected">Expired</span>';
        } else if (daysLeft <= 30) {
            renewalBadge = `<span class="badge badge-pending">Renew Soon</span>`;
        } else if (daysLeft <= 90) {
            renewalBadge = `<span class="badge" style="background:#eff6ff;color:#1d4ed8;font-weight:600">Upcoming</span>`;
        } else {
            renewalBadge = '<span class="badge badge-success">Active</span>';
        }

        return { org, plan, price, daysLeft, expiry, renewalBadge };
    });

    // Update stat cards
    document.getElementById('rev-total').textContent = `$${totalRevenue.toLocaleString()}`;
    document.getElementById('rev-active-count').textContent = activeOrgs.length;
    document.getElementById('rev-expiring').textContent = expiringCount;
    document.getElementById('rev-avg').textContent = activeOrgs.length
        ? `$${Math.round(totalRevenue / activeOrgs.length).toLocaleString()}`
        : '$0';

    // Plan breakdown table
    const planBodyEl = document.getElementById('revPlanTableBody');
    planBodyEl.innerHTML = '';
    subscriptionPlans.forEach(plan => {
        const orgsOnPlan = activeOrgs.filter(o => o.subscriptionPlanId === plan.id).length;
        const planRevenue = orgsOnPlan * plan.pricePerYear;
        const pct = totalRevenue > 0 ? ((planRevenue / totalRevenue) * 100).toFixed(1) : '0.0';
        planBodyEl.innerHTML += `
            <tr>
                <td><strong>${plan.name}</strong></td>
                <td>$${plan.pricePerYear.toLocaleString()}</td>
                <td>${orgsOnPlan}</td>
                <td><strong>$${planRevenue.toLocaleString()}</strong></td>
                <td>
                    <div style="display:flex;align-items:center;gap:0.5rem">
                        <div style="background:#e2e8f0;border-radius:4px;height:8px;width:120px;overflow:hidden">
                            <div style="background:var(--primary-color);height:100%;width:${pct}%"></div>
                        </div>
                        ${pct}%
                    </div>
                </td>
            </tr>`;
    });

    if (subscriptionPlans.length === 0) {
        planBodyEl.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No plan data.</td></tr>';
    }

    // Subscription timeline table — sorted by days remaining (ascending)
    const timelineEl = document.getElementById('revTimelineTableBody');
    timelineEl.innerHTML = '';

    const sorted = [...orgRevenueRows].sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

    if (sorted.length === 0) {
        timelineEl.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No active subscriptions.</td></tr>';
        return;
    }

    sorted.forEach(({ org, plan, price, daysLeft, expiry, renewalBadge }) => {
        const expiryStr = expiry ? expiry.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        const daysStr = daysLeft !== null ? (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days`) : '—';
        timelineEl.innerHTML += `
            <tr>
                <td>${org.id}</td>
                <td><strong>${org.name}</strong></td>
                <td>${plan ? plan.name : '—'}</td>
                <td>$${price.toLocaleString()}</td>
                <td>${expiryStr}</td>
                <td>${daysStr}</td>
                <td>${renewalBadge}</td>
            </tr>`;
    });
}
