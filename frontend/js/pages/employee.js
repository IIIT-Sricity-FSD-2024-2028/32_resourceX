// ─── State ────────────────────────────────────────────────────────────────────
let currentOrgs = [];
let currentTickets = [];
let currentAnnouncements = [];
let currentTicketFilter = 'Open';
let currentOrgFilter = 'All';
let resolveModal = null;
let announcementModal = null;
let repliesModal = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const user = Store.getCurrentUser();
    if (!user || user.role !== 'Employee') {
        window.location.href = 'login.html';
        return;
    }

    resolveModal = new bootstrap.Modal(document.getElementById('resolveTicketModal'));
    announcementModal = new bootstrap.Modal(document.getElementById('announcementModal'));
    repliesModal = new bootstrap.Modal(document.getElementById('repliesModal'));

    // Update sidebar with real user info
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = 'Platform Employee';

    document.getElementById('empWelcome').textContent =
        `Welcome, ${user.name} — manage your assigned institutions and support tickets.`;

    bindNav();
    await loadData();
});

// ─── Navigation ───────────────────────────────────────────────────────────────
function bindNav() {
    setTimeout(() => {
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.addEventListener('click', async (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                if (!targetId) return;
                document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
                const target = document.getElementById(targetId);
                if (target) target.classList.add('active');
                items.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Re-fetch live data when switching to these tabs
                if (targetId === 'communication-view') {
                    try {
                        const fresh = await Store.api('/announcements');
                        const user = Store.getCurrentUser();
                        // Employee sees announcements for their assigned orgs or ALL
                        const myOrgIds = currentOrgs.map(o => o.id);
                        currentAnnouncements = (fresh || []).filter(a =>
                            a.targetOrgId === 'ALL' || myOrgIds.includes(a.targetOrgId)
                        );
                        renderAnnouncements();
                    } catch(err) { console.error('Failed to refresh announcements:', err); }
                }
                if (targetId === 'support-view') {
                    try {
                        currentTickets = await Store.api('/support') || [];
                        renderTickets(currentTicketFilter);
                    } catch(err) { console.error('Failed to refresh tickets:', err); }
                }
            });
        });
    }, 0);
}

function switchToView(viewId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    const navItem = document.querySelector(`[data-target="${viewId}"]`);
    if (navItem) navItem.classList.add('active');
}

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
    try {
        const user = Store.getCurrentUser();
        const [orgs, tickets, announcements] = await Promise.all([
            Store.api('/organizations'),
            Store.api('/support'),
            Store.api('/announcements')
        ]);

        // Only orgs assigned to this employee
        currentOrgs = (orgs || []).filter(o => o.assignedEmployeeId === user.id);
        currentTickets = tickets || [];
        currentAnnouncements = announcements || [];

        updateStats();
        renderDashboard();
        renderTickets(currentTicketFilter);
        renderOrgs(currentOrgFilter);
        renderAnnouncements();

    } catch (e) {
        console.error(e);
        Store.showToast('Failed to load dashboard data: ' + e.message, 'error');
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status) {
    const map = {
        Active: 'badge-success',
        Suspended: 'badge-rejected',
        Pending: 'badge-pending',
        Open: 'badge-pending',
        Resolved: 'badge-success'
    };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function updateStats() {
    const openCount = currentTickets.filter(t => t.status === 'Open').length;
    const resolvedCount = currentTickets.filter(t => t.status === 'Resolved').length;

    document.getElementById('statOrgs').textContent = currentOrgs.length;
    document.getElementById('statOpenTickets').textContent = openCount;
    document.getElementById('statResolvedTickets').textContent = resolvedCount;
    document.getElementById('statAnnouncements').textContent = currentAnnouncements.length;

    // Badge on sidebar
    const badge = document.getElementById('openTicketsBadge');
    badge.textContent = openCount;
    badge.style.display = openCount > 0 ? 'inline' : 'none';
}

function renderDashboard() {
    // Quick org table (all assigned)
    const orgBody = document.getElementById('dashOrgsBody');
    orgBody.innerHTML = '';
    if (currentOrgs.length === 0) {
        orgBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No institutions assigned to you yet.</td></tr>';
    } else {
        currentOrgs.forEach(org => {
            orgBody.innerHTML += `
                <tr>
                    <td>${org.id}</td>
                    <td><strong>${org.name}</strong></td>
                    <td>${org.adminEmail}</td>
                    <td>${statusBadge(org.status)}</td>
                    <td>${org.subscriptionPlanId || '—'}</td>
                </tr>`;
        });
    }

    // Quick tickets table (open only, max 5)
    const ticketBody = document.getElementById('dashTicketsBody');
    ticketBody.innerHTML = '';
    const open = currentTickets.filter(t => t.status === 'Open').slice(0, 5);
    if (open.length === 0) {
        ticketBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No open tickets. All clear! ✅</td></tr>';
    } else {
        open.forEach(t => {
            ticketBody.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.organizationId}</td>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.date}</td>
                    <td><button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.5rem"
                        onclick='openResolveModal(${JSON.stringify(t)})'>Resolve</button></td>
                </tr>`;
        });
    }
}

// ─── SUPPORT MANAGEMENT ───────────────────────────────────────────────────────
function filterTickets(status, el) {
    currentTicketFilter = status;
    ['Open', 'Resolved', 'All'].forEach(s => {
        const btn = document.getElementById(`ticketBtn-${s}`);
        if (btn) btn.className = s === status ? 'btn-primary' : 'btn-secondary';
    });
    renderTickets(status);
}

function renderTickets(filter = 'Open') {
    const tbody = document.getElementById('ticketsTableBody');
    tbody.innerHTML = '';

    const list = filter === 'All' ? currentTickets
        : currentTickets.filter(t => t.status === filter);

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No ${filter === 'All' ? '' : filter.toLowerCase() + ' '}tickets found.</td></tr>`;
        return;
    }

    list.forEach(t => {
        const actionHtml = t.status === 'Open'
            ? `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.5rem"
                onclick='openResolveModal(${JSON.stringify(t)})'>Resolve</button>`
            : statusBadge('Resolved');

        tbody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td>${t.organizationId}</td>
                <td><strong>${t.title}</strong></td>
                <td><span style="font-size:0.8rem;color:var(--text-muted)">${t.description || '—'}</span></td>
                <td>${statusBadge(t.status)}</td>
                <td>${t.date}</td>
                <td>${actionHtml}</td>
            </tr>`;
    });
}

function openResolveModal(ticket) {
    document.getElementById('resolveTicketId').value = ticket.id;
    document.getElementById('ticketDetails').innerHTML = `
        <div style="margin-bottom:0.5rem"><strong>Ticket:</strong> ${ticket.id}</div>
        <div style="margin-bottom:0.5rem"><strong>Institution:</strong> ${ticket.organizationId}</div>
        <div style="margin-bottom:0.5rem"><strong>Title:</strong> ${ticket.title}</div>
        <div><strong>Description:</strong> ${ticket.description || '—'}</div>`;
    document.getElementById('resolveReply').value = '';
    resolveModal.show();
}

async function handleResolveTicket(e) {
    e.preventDefault();
    const ticketId = document.getElementById('resolveTicketId').value;
    const reply = document.getElementById('resolveReply').value;

    try {
        await Store.api(`/support/${ticketId}/resolve`, {
            method: 'PATCH',
            body: { reply, status: 'Resolved' }
        });
        resolveModal.hide();
        Store.showToast('Ticket resolved and reply sent.', 'success');
        await loadData();
    } catch (err) {
        Store.showToast('Failed to resolve ticket: ' + err.message, 'error');
    }
}

// ─── INSTITUTION MANAGEMENT ───────────────────────────────────────────────────
function filterOrgs(status, el) {
    currentOrgFilter = status;
    ['All', 'Active', 'Suspended'].forEach(s => {
        const btn = document.getElementById(`orgBtn-${s}`);
        if (btn) btn.className = s === status ? 'btn-primary' : 'btn-secondary';
    });
    applyOrgFilter();
}

function applyOrgFilter() {
    const search = document.getElementById('orgSearch')?.value?.toLowerCase() || '';
    const list = currentOrgFilter === 'All'
        ? currentOrgs
        : currentOrgs.filter(o => o.status === currentOrgFilter);

    const filtered = search
        ? list.filter(o =>
            o.name.toLowerCase().includes(search) ||
            o.id.toLowerCase().includes(search) ||
            o.adminEmail.toLowerCase().includes(search))
        : list;

    renderOrgsFiltered(filtered);
}

function renderOrgs() {
    applyOrgFilter();
}

function renderOrgsFiltered(list) {
    const tbody = document.getElementById('orgsTableBody');
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No institutions found.</td></tr>';
        return;
    }

    list.forEach(org => {
        let actionHtml = '';
        if (org.status === 'Active') {
            actionHtml = `<button class="btn-secondary" style="font-size:0.75rem;padding:0.25rem 0.5rem"
                onclick="suspendOrg('${org.id}')">Suspend</button>`;
        } else if (org.status === 'Suspended') {
            actionHtml = `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.5rem"
                onclick="reactivateOrg('${org.id}')">Reactivate</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${org.id}</td>
                <td><strong>${org.name}</strong></td>
                <td>${org.adminEmail}</td>
                <td>${org.subscriptionPlanId || '—'}</td>
                <td>${org.subscriptionExpiryDate || '—'}</td>
                <td>${statusBadge(org.status)}</td>
                <td>${actionHtml}</td>
            </tr>`;
    });
}

async function suspendOrg(orgId) {
    if (!confirm('Suspend this institution? Their users will lose access.')) return;
    try {
        await Store.api(`/organizations/${orgId}/suspend`, { method: 'PATCH' });
        Store.showToast('Institution suspended.', 'success');
        await loadData();
    } catch (e) {
        Store.showToast('Failed: ' + e.message, 'error');
    }
}

async function reactivateOrg(orgId) {
    if (!confirm('Reactivate this institution?')) return;
    try {
        await Store.api(`/organizations/${orgId}/reactivate`, { method: 'PATCH' });
        Store.showToast('Institution reactivated.', 'success');
        await loadData();
    } catch (e) {
        Store.showToast('Failed: ' + e.message, 'error');
    }
}

// ─── COMMUNICATION MANAGEMENT ─────────────────────────────────────────────────
function renderAnnouncements() {
    const tbody = document.getElementById('announcementsTableBody');
    tbody.innerHTML = '';

    if (currentAnnouncements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No announcements sent yet.</td></tr>';
        return;
    }

    // Most recent first
    [...currentAnnouncements].reverse().forEach(a => {
        const target = a.targetOrgId === 'ALL' ? '<em>All Institutions (Broadcast)</em>' : a.targetOrgId;

        // Build replies button — show if adminReply exists
        let replyCell = '<span style="color:#94a3b8;font-size:0.8rem">No replies yet</span>';
        if (a.adminReply) {
            replyCell = `<button class="btn-primary" style="font-size:0.75rem;padding:0.25rem 0.6rem"
                onclick='viewReplies(${JSON.stringify(a)})'>
                <span class="material-symbols-outlined" style="font-size:0.9rem;vertical-align:middle">mark_unread_chat_alt</span>
                View Replies
            </button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${a.id}</td>
                <td>${target}</td>
                <td><span class="badge badge-secondary">${a.type}</span></td>
                <td><strong>${a.title}</strong></td>
                <td style="max-width:200px;font-size:0.8rem;color:var(--text-muted)">${a.message || '—'}</td>
                <td>${a.date}</td>
                <td>${replyCell}</td>
            </tr>`;
    });
}

function viewReplies(ann) {
    // Populate modal
    document.getElementById('repliesAnnTitle').textContent = `"${ann.title}"`;
    const container = document.getElementById('repliesContainer');

    if (!ann.adminReply) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:1rem">No replies received yet.</p>';
    } else {
        const orgName = ann.targetOrgId === 'ALL' ? 'Broadcast (All Institutions)' : ann.targetOrgId;
        container.innerHTML = `
            <div style="border:1px solid #e2e8f0;border-radius:8px;padding:1rem;background:#f8fafc">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <strong style="color:var(--primary-color)">${orgName}</strong>
                    <span style="font-size:0.75rem;color:#94a3b8">${ann.adminReplyDate || ann.date}</span>
                </div>
                <p style="margin:0;font-size:0.9rem;color:#334155">${ann.adminReply}</p>
            </div>`;
    }

    repliesModal.show();
}

function openAnnouncementModal() {
    const select = document.getElementById('annTargetOrg');
    select.innerHTML = '<option value="ALL">All My Institutions (Broadcast)</option>';
    currentOrgs.forEach(org => {
        select.innerHTML += `<option value="${org.id}">${org.name} (${org.id})</option>`;
    });
    document.getElementById('announcementForm').reset();
    announcementModal.show();
}

async function handleCreateAnnouncement(e) {
    e.preventDefault();
    const payload = {
        targetOrgId: document.getElementById('annTargetOrg').value,
        type: document.getElementById('annType').value,
        title: document.getElementById('annTitle').value,
        message: document.getElementById('annMessage').value
    };

    try {
        await Store.api('/announcements', { method: 'POST', body: payload });
        announcementModal.hide();
        Store.showToast('Announcement posted successfully.', 'success');
        await loadData();
    } catch (err) {
        Store.showToast('Failed to post announcement: ' + err.message, 'error');
    }
}
