const regApp = {
    state: {
        summary: null,
        requests: [],
        procurements: [],
        resources: []
    },
    init: async function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Registrar') {
            window.location.href = 'login.html';
            return;
        }
        await this.refreshData();
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'University Registrar';
        
        this.bindNav();
        this.renderDashboard();
        this.renderProcurementApprovals();
        this.renderGlobalRequests();
        this.renderAnalytics();
    },

    refreshData: async function() {
        const [summary, requests, procurements, resources] = await Promise.all([
            Store.fetchRegistrarSummary(),
            Store.fetchRequests(),
            Store.fetchProcurements(),
            Store.fetchResources()
        ]);

        this.state = {
            summary: summary || null,
            requests: requests || [],
            procurements: procurements || [],
            resources: resources || []
        };
    },

    // 0. Dashboard Overview
    renderDashboard: function() {
        const summary = this.state.summary || {};
        const resources = this.state.resources || [];
        const requests = this.state.requests || [];
        const procurements = this.state.procurements || [];

        // Stats
        document.getElementById('dash-main-assets').textContent = String(summary.activeAssets ?? resources.length).toLocaleString();
        document.getElementById('dash-main-reqs').textContent = summary.pendingRequests ?? requests.filter(r => r.status === 'Pending').length;
        document.getElementById('dash-main-procs').textContent = summary.pendingProcurements ?? procurements.filter(p => p.status === 'Pending').length;
        document.getElementById('dash-main-approved').textContent = summary.approvedTotals ?? (requests.filter(r => r.status === 'Approved').length + procurements.filter(p => p.status === 'Approved').length);

        // Recent Requests
        const reqTbody = document.getElementById('dash-req-tbody');
        if(reqTbody) {
            reqTbody.innerHTML = '';
            requests.slice(0, 5).forEach(r => {
                let badgeClass = r.status === 'Approved' || r.status === 'Allocated' ? 'allocated' : (r.status === 'Rejected' ? 'rejected' : 'pending');
                reqTbody.innerHTML += `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.department}</td>
                        <td><span class="badge ${badgeClass}">${r.status}</span></td>
                    </tr>
                `;
            });
        }

        // Actionable Procurements
        const procTbody = document.getElementById('dash-proc2-tbody');
        if(procTbody) {
            procTbody.innerHTML = '';
            const actionProcs = procurements.filter(p => p.status === 'Pending').slice(0, 5);
            actionProcs.forEach(p => {
                procTbody.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.resourceType}</td>
                        <td><span class="badge pending">Pending</span></td>
                    </tr>
                `;
            });
        }
    },

    bindNav: function() {
        const items = document.querySelectorAll('.nav-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                if (targetId) {
                    this.switchView(targetId);
                    items.forEach(i => i.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                }
            });
        });
    },

    switchView: function(viewId) {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(viewId);
        if(targetSection) {
            targetSection.classList.add('active');
        }
    },

    // 1. Procurement Approvals
    renderProcurementApprovals: function() {
        const tbody = document.querySelector('#procurement-approvals-view tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const procs = this.state.procurements;
        
        // Calculate Stats
        let pending = 0, accepted = 0, rejected = 0;
        procs.forEach(p => {
            if(p.status === 'Pending') pending++;
            else if(p.status === 'Approved' || p.status === 'Fulfilled') accepted++;
            else if(p.status === 'Rejected') rejected++;
        });

        const elTotal = document.getElementById('dash-proc-total');
        const elPending = document.getElementById('dash-proc-pending');
        const elAccepted = document.getElementById('dash-proc-accepted');
        const elRejected = document.getElementById('dash-proc-rejected');

        if(elTotal) elTotal.textContent = procs.length;
        if(elPending) elPending.textContent = pending;
        if(elAccepted) elAccepted.textContent = accepted;
        if(elRejected) elRejected.textContent = rejected;

        // Render Table
        procs.forEach(p => {
            let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
            if (p.status === 'Approved' || p.status === 'Fulfilled') {
                statusBadge = `<span class="badge allocated">${p.status}</span>`;
            } else if (p.status === 'Rejected') {
                statusBadge = `<span class="badge rejected">${p.status}</span>`;
            } else if (p.status === 'Pending') {
                statusBadge = `<span class="badge pending">${p.status}</span>`;
            }

            let actionCol = '';
            if(p.status === 'Pending') {
                actionCol = `
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                        <button class="btn-primary" style="font-size:0.75rem; background:#16a34a; border-color:#16a34a; padding: 0.25rem 0.75rem" onclick="regApp.acceptProcurement('${p.id}')">Accept</button>
                        <button class="btn-danger" style="font-size:0.75rem; padding: 0.25rem 0.75rem" onclick="regApp.rejectProcurement('${p.id}')">Reject</button>
                    </div>
                `;
            } else {
                actionCol = statusBadge;
            }

            const specCell = p.specFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="regApp.previewSpecFile('${p.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${p.specFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.requestedBy} (${p.department})</td>
                <td>${p.resourceType}</td>
                <td>${p.quantity}</td>
                <td style="font-size:0.75rem; color:#64748b">${p.justification}</td>
                <td>${specCell}</td>
                <td style="text-align:right">${actionCol}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    previewSpecFile: function(procId) {
        Store.previewProcurementFile(procId, 'spec');
    },

    acceptProcurement: async function(id) {
        await Store.approveRegistrarProcurement(id);
        await this.refreshData();
        alert('Procurement Approved. Task passed to Staff for fulfillment.');
        this.renderProcurementApprovals();
        this.renderDashboard();
    },

    rejectProcurement: async function(id) {
        if(confirm("Reject this procurement request?")) {
            await Store.rejectRegistrarProcurement(id);
            await this.refreshData();
            this.renderProcurementApprovals();
            this.renderDashboard();
        }
    },

    // 2. Global Requests Overview
    renderGlobalRequests: async function() {
        const tbody = document.querySelector('#sys-overview-view tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const filterStatus = document.getElementById('filterStatus')?.value || 'All';
        const filterDept = document.getElementById('filterDept')?.value || 'All';
        const requests = await Store.fetchRequests({
            status: filterStatus,
            department: filterDept
        });

        (requests || []).forEach(r => {
            let statusBadge = `<span class="badge ${r.status.toLowerCase()}">${r.status}</span>`;
            if (r.status === 'Approved' || r.status === 'Allocated') {
                statusBadge = `<span class="badge allocated">${r.status}</span>`;
            } else if (r.status === 'Pending') {
                statusBadge = `<span class="badge pending">${r.status}</span>`;
            } else {
                statusBadge = `<span class="badge rejected">${r.status}</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.id}</td>
                <td>${r.department}</td>
                <td>${r.resourceType}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // 3. System Analytics
    renderAnalytics: function() {
        const stats = this.state.summary || {};
        const activeAssets = stats.activeAssets ?? this.state.resources.length;
        
        let itDemand = this.state.requests.filter(r => r.department === "IT Services").length;
        let hrDemand = this.state.requests.filter(r => r.department === "HR Dept").length;
        let opsDemand = this.state.requests.filter(r => r.department === "Operations").length;
        
        let max = Math.max(itDemand, hrDemand, opsDemand);
        let highDemand = "IT Services";
        if (max === hrDemand) highDemand = "HR Dept";
        if (max === opsDemand) highDemand = "Operations";

        const statValues = document.querySelectorAll('#sys-analytics-view .stat-value');
        if(statValues.length >= 3) {
            statValues[0].textContent = activeAssets.toLocaleString();
            statValues[1].textContent = "1.2 Days"; // Mock average fulfillment
            statValues[2].textContent = highDemand;
        }
    },

    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await regApp.init();
});
