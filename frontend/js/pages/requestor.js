const app = {
    state: {
        departments: [],
        resourceCatalog: [],
        stock: [],
        requests: [],
        resources: [],
        procurements: [],
        summary: null
    },
    init: async function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Requestor') {
            window.location.href = 'login.html';
            return;
        }
        await this.refreshData();

        this.populateDepartmentDropdowns();
        this.bindNav();
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.renderProcurementStatus();

        // React (Lab 2): Sidebar nav and the Procurement Request feature are React
        // components under frontend/react/. They're loaded and mounted last, once all
        // the vanilla-rendered sections and this page's own data are ready, since they
        // reuse app.switchView/getDepartments/getDeptResources and the real logged-in user.
        if (window.RX && window.RX.loadComponents) {
            await window.RX.loadComponents([
                '../react/sidebar/NavItem.jsx',
                '../react/sidebar/NavMenu.jsx',
                '../react/sidebar/UserProfileWidget.jsx',
                '../react/sidebar/Sidebar.jsx',
                '../react/sidebar/mount.jsx',
                '../react/procurement/FileUploadZone.jsx',
                '../react/procurement/ProcurementForm.jsx',
                '../react/procurement/ProcurementHistoryTable.jsx',
                '../react/procurement/ProcurementView.jsx',
                '../react/procurement/mount.jsx',
            ]);

            window.RX.mountSidebar({
                items: [
                    { target: 'dashboard-view', icon: 'dashboard', label: 'Dashboard' },
                    { target: 'request-view', icon: 'add_circle', label: 'Request Resource' },
                    { target: 'my-requests-view', icon: 'list_alt', label: 'My Requests' },
                    { target: 'my-resources-view', icon: 'inventory_2', label: 'My Resources' },
                    { target: 'procurement-view', icon: 'shopping_cart', label: 'Procurement' },
                ],
                initialActive: 'dashboard-view',
                user: {
                    name: user.name,
                    role: 'Requestor - ' + user.department,
                    initial: user.name.charAt(0),
                },
                onNavigate: (target) => this.switchView(target),
            });

            window.RX.mountProcurementView({
                getDepartments: () => this.getDepartments(),
                getDeptResources: (dept) => this.getDeptResources(dept),
                // Store.createProcurement() (called just before this) already runs a full
                // Store.sync(), so app.state can be refreshed straight from Store's cache
                // here instead of re-fetching everything again via this.refreshData().
                onAfterSubmit: () => {
                    const data = Store.getData();
                    this.state.procurements = data.procurements || [];
                    this.state.requests = data.requests || [];
                    this.renderProcurementStatus();
                },
            });
        }
    },

    previewInvoiceFile: function(procId) {
        Store.previewProcurementFile(procId, 'invoice');
    },

    refreshData: async function() {
        const [departments, resourceCatalog, stock, requests, resources, procurements, summary] = await Promise.all([
            Store.fetchDepartments(),
            Store.fetchResourceCatalog(),
            Store.fetchStock(),
            Store.fetchRequests(),
            Store.fetchResources(),
            Store.fetchProcurements(),
            Store.fetchRequestorSummary()
        ]);

        this.state = {
            departments: departments || [],
            resourceCatalog: resourceCatalog || [],
            stock: stock || [],
            requests: requests || [],
            resources: resources || [],
            procurements: procurements || [],
            summary: summary || null
        };
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

    getDepartments: function() {
        return this.state.departments.map(dept => dept.name);
    },

    populateDepartmentDropdowns: function() {
        const departments = this.getDepartments();
        ['req-dept'].forEach((id) => {
            const select = document.getElementById(id);
            if (!select) return;

            select.innerHTML = '<option value="" disabled selected>Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                select.appendChild(option);
            });
        });
    },
    
    getDeptResources: function(dept) {
        const entry = (this.state.resourceCatalog || []).find(item => item.department === dept);
        if (entry && Array.isArray(entry.resourceTypes) && entry.resourceTypes.length) {
            return [...entry.resourceTypes];
        }

        const stockRows = this.state.stock.filter(item => item.department === dept);
        if (stockRows.length) {
            return [...new Set(stockRows.map(item => item.resourceType))];
        }

        const resourceTypes = this.state.resources
            .filter(resource => resource.department === dept)
            .map(resource => resource.type);
        return [...new Set(resourceTypes)];
    },

    updateResourceDropdown: function() {
        const dept = document.getElementById('req-dept').value;
        const typeSelect = document.getElementById('req-type');
        const types = this.getDeptResources(dept);
        
        if (types.length === 0) {
            typeSelect.innerHTML = '<option value="" disabled selected>No Catalog Configured for Department</option>';
        } else {
            typeSelect.innerHTML = '<option value="" disabled selected>Select Resource Type</option>';
            types.forEach(res => {
                const opt = document.createElement('option');
                opt.value = res;
                opt.textContent = res;
                typeSelect.appendChild(opt);
            });
        }
        
        this.updateResourceCount();
    },

    updateResourceCount: async function() {
        const dept = document.getElementById('req-dept').value;
        const type = document.getElementById('req-type').value;
        const countDisplay = document.getElementById('resource-count-display');
        
        if (!countDisplay) return;

        if (!dept || !type) {
            countDisplay.style.display = 'none';
            return;
        }

        const availability = await Store.fetchResourceAvailability(dept, type);
        const availableCount = Number(availability?.availableCount || 0);
        
        countDisplay.textContent = `Available in Inventory: ${availableCount}`;
        countDisplay.style.display = 'block';
        
        // Change color based on availability
        if (availableCount > 0) {
            countDisplay.style.color = '#16a34a'; // Green
        } else {
            countDisplay.style.color = '#dc2626'; // Red
        }
    },

    submitRequest: async function(e) {
        e.preventDefault();
        const dept = document.getElementById('req-dept').value;
        const type = document.getElementById('req-type').value;

        const qty = parseInt(document.getElementById('req-qty').value);
        const reason = document.getElementById('req-reason').value;
        const user = Store.getCurrentUser();

        if (!dept || !type || isNaN(qty) || qty < 1 || !reason.trim()) {
            Store.showToast("Please fill in all fields correctly before submitting.", "error");
            return;
        }

        // Fix 1: Validate quantity <= available inventory
        const availability = await Store.fetchResourceAvailability(dept, type);
        const availableCount = Number(availability?.availableCount || 0);

        if (qty > availableCount) {
            Store.showToast(
                `❌ Quantity must be less than or equal to available inventory (${availableCount} available). Please reduce your quantity.`,
                "error"
            );
            return;
        }

        const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        await Store.createRequest({
            id: newId,
            department: dept,
            resourceType: type,
            quantity: qty,
            requestor: user.name,
            requestorId: user.id,
            status: "Pending",
            priority: "Normal",
            date: dateStr,
            justification: reason
        });
        await this.refreshData();

        Store.showToast("Request Submitted Successfully! ID: " + newId, "success");
        document.getElementById('requestForm').reset();
        
        this.renderDashboard();
        this.renderRequests();
        this.switchView('my-requests-view');

        if (window.RX && window.RX.setSidebarActive) window.RX.setSidebarActive('my-requests-view');
    },

    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const myRequests = this.state.requests;
        const myResources = this.state.resources;
        const summary = this.state.summary || {};

        const nameSpan = document.getElementById('dash-user-name');
        if(nameSpan) nameSpan.textContent = user.name.split(' ')[0];
        
        // 1. Stats
        const elTotalReq = document.getElementById('dash-total-req');
        const elPendingReq = document.getElementById('dash-pending-req');
        const elMyRes = document.getElementById('dash-my-res');
        const elMaint = document.getElementById('dash-maint');

        if(elTotalReq) elTotalReq.textContent = summary.totalRequests ?? myRequests.length;
        if(elPendingReq) elPendingReq.textContent = summary.pendingRequests ?? myRequests.filter(r => r.status === 'Pending').length;
        if(elMyRes) elMyRes.textContent = summary.allocatedResources ?? myResources.length;
        if(elMaint) elMaint.textContent = summary.maintenanceItems ?? myResources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').length;

        // 2. Recent Requests Table
        const reqTbody = document.getElementById('dash-requests-tbody');
        if(reqTbody) {
            reqTbody.innerHTML = '';
            myRequests.slice(0, 5).forEach(req => {
                let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.quantity}</td>
                    <td>${statusBadge}</td>
                `;
                reqTbody.appendChild(tr);
            });
        }

        // 3. My Resources Table
        const resTbody = document.getElementById('dash-resources-tbody');
        if(resTbody) {
            resTbody.innerHTML = '';
            myResources.slice(0, 5).forEach(res => {
                let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
                if(res.status === 'Allocated') statusBadge = `<span class="badge allocated">${res.status}</span>`;
                else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') statusBadge = `<span class="badge maintenance">${res.status}</span>`;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${res.id}</td>
                    <td>${res.type}</td>
                    <td>${statusBadge}</td>
                `;
                resTbody.appendChild(tr);
            });
        }
        
        // Populate the old My Requests stats
        const statPending = document.getElementById('stat-pending');
        const statApproved = document.getElementById('stat-approved');
        const statAllocated = document.getElementById('stat-allocated');
        
        const pending = summary.pendingRequests ?? myRequests.filter(r => r.status === 'Pending').length;
        const approved = summary.approvedRequests ?? myRequests.filter(r => r.status === 'Approved').length;
        const allocated = summary.allocatedRequests ?? myRequests.filter(r => r.status === 'Allocated').length;

        if(statPending) statPending.textContent = pending.toString().padStart(2, '0');
        if(statApproved) statApproved.textContent = approved.toString().padStart(2, '0');
        if(statAllocated) statAllocated.textContent = allocated.toString().padStart(2, '0');
    },

    renderRequests: function() {
        const tbody = document.getElementById('requests-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        let myRequests = [...this.state.requests];

        // Apply status filter
        const filterEl = document.getElementById('req-status-filter');
        const filterVal = filterEl ? filterEl.value : 'All';
        if (filterVal && filterVal !== 'All') {
            myRequests = myRequests.filter(r => r.status === filterVal);
        }

        myRequests.forEach(req => {
            let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
            let actions = `<button class="icon-btn">⋮</button>`;
            
            if(req.status === "Allocated") {
                actions = `<button class="btn-primary" style="font-size:0.75rem; padding: 0.4rem 0.8rem;" onclick="app.confirmReceipt('${req.id}')">I RECEIVED</button>`;
            } else if (req.status === "Rejected") {
                actions = `<span title="View Reason">ℹ️</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.department}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td>${req.date}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderProcurementStatus: function() {
        const tbody = document.getElementById('procurement-status-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const myProcs = this.state.procurements.filter(p =>
            p.requester === user.name || p.requestedById === user.id
        );

        if (myProcs.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem; font-size:0.875rem;">No procurement requests submitted yet.</td>`;
            tbody.appendChild(tr);
            return;
        }

        myProcs.forEach(proc => {
            // Determine stage label and badge color based on status
            const stageMap = {
                'Pending Approval': { stage: '1 of 5 — Awaiting Dept Head',  bg: '#fef9c3', color: '#854d0e' },
                'Pending':          { stage: '2 of 5 — Awaiting Registrar',   bg: '#fef9c3', color: '#854d0e' },
                'Approved':         { stage: '3 of 5 — Staff Purchase',        bg: '#dbeafe', color: '#1d4ed8' },
                'Fulfilled':        { stage: '4 of 5 — Asset Registration',    bg: '#ede9fe', color: '#6d28d9' },
                'Registered':       { stage: '5 of 5 — Pending Allocation',    bg: '#dcfce7', color: '#166534' },
                'Rejected':         { stage: 'Rejected',                        bg: '#fee2e2', color: '#b91c1c' },
            };

            // Check if there's an allocation request auto-generated from this procurement
            const allocationReqId = `REQ-PRC-${proc.id.replace(/[^a-zA-Z0-9]/g, '')}`;
            const allocationReq = this.state.requests.find(r => r.id === allocationReqId);
            let stageInfo = stageMap[proc.status] || { stage: proc.status, bg: '#f1f5f9', color: '#64748b' };

            // If allocation request exists and is Allocated/Completed, show final stage
            if (allocationReq && (allocationReq.status === 'Allocated' || allocationReq.status === 'Completed')) {
                stageInfo = { stage: '✅ Allocated — Check My Resources', bg: '#dcfce7', color: '#166534' };
            } else if (allocationReq && allocationReq.status === 'Approved') {
                stageInfo = { stage: '5 of 5 — Staff Allocating Now', bg: '#dcfce7', color: '#166534' };
            }

            const statusBadge = `<span style="background:${stageInfo.bg}; color:${stageInfo.color}; padding:3px 10px; border-radius:999px; font-size:0.75rem; font-weight:600;">${proc.status}</span>`;
            const stageText = `<span style="font-size:0.78rem; color:${stageInfo.color}; font-weight:500;">${stageInfo.stage}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${proc.id}</td>
                <td>${proc.item || proc.resourceType}</td>
                <td>${String(proc.quantity).padStart(2, '0')}</td>
                <td>${proc.date}</td>
                <td>${stageText}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    confirmReceipt: async function(reqId) {
        await Store.confirmReceipt(reqId);
        await this.refreshData();
        alert('Item successfully received and confirmed.');
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.switchView('my-resources-view');

        if (window.RX && window.RX.setSidebarActive) window.RX.setSidebarActive('my-resources-view');
    },

    renderResources: function() {
        const tbody = document.getElementById('resources-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const myResources = this.state.resources;

        myResources.forEach((res) => {
            let statusBadge = "";
            let actions = "";
            
            if(res.status === 'Allocated') {
                statusBadge = `<span class="badge allocated">${res.status}</span>`;
                actions = `
                    <div style="display:flex; flex-direction:row; gap:0.5rem; justify-content:flex-end">
                        <button class="btn-secondary" style="font-size:0.82rem; padding:0.3rem 0.8rem; white-space:nowrap" onclick="app.requestMaintenance('${res.id}')">🛠 Maintenance</button>
                        <button class="btn-danger" style="font-size:0.82rem; padding:0.3rem 0.8rem; white-space:nowrap" onclick="app.returnResource('${res.id}')">⮌ Return</button>
                    </div>
                `;
            } else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') {
                statusBadge = `<span class="badge maintenance">${res.status}</span>`;
                actions = `<span class="text-muted" style="font-size:0.75rem">Under Review</span>`;
            } else if (res.status === 'Repaired') {
                statusBadge = `<span class="badge allocated" style="background:#dcfce7; color:#166534">Repaired</span>`;
                actions = `<button class="btn-primary" style="font-size:0.75rem" onclick="app.confirmRepairedAllocation('${res.id}')">Confirm Allocation</button>`;
            }

            const srcProc = res.procurementId ? (this.state.procurements || []).find(p => p.id === res.procurementId) : null;
            const invoiceCell = srcProc && srcProc.invoiceFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="app.previewInvoiceFile('${srcProc.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${srcProc.invoiceFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${res.id}</td>
                <td>${res.type}</td>
                <td>${res.department}</td>
                <td>${res.date}</td>
                <td>${statusBadge}</td>
                <td>${invoiceCell}</td>
                <td style="text-align:right">${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    requestMaintenance: async function(resId) {
        if(confirm("Submit maintenance request for this resource?")) {
            await Store.requestMaintenance(resId);
            await this.refreshData();
            this.renderResources();
        }
    },

    returnResource: async function(resId) {
        if(confirm("Are you sure you want to return this resource? It will be sent to Staff for Verification.")) {
            await Store.initiateReturn(resId);
            await this.refreshData();
            alert("Resource returned successfully. Status moved to Returned.");
            this.renderResources();
        }
    },
    
    confirmRepairedAllocation: async function(resId) {
        await Store.confirmRepairedAllocation(resId);
        await this.refreshData();
        this.renderResources();
    },
    
    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});
