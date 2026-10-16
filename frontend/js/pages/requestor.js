const app = {
    _procSpecFile: null, // { name, size, type, dataUrl }

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
        
        // Update UI with user info
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Requestor - ' + user.department;

        this.populateDepartmentDropdowns();
        this.bindNav();
        this.renderDashboard();
        this.renderRequests();
        this.renderResources();
        this.renderProcurements();
        this.renderProcurementStatus();
        this.initFileUpload();
    },

    initFileUpload: function() {
        const zone = document.getElementById('proc-file-zone');
        if (!zone) return;

        // Drag-and-drop handlers
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer?.files[0];
            if (file) this._readProcFile(file);
        });
    },

    onProcFileSelected: function(event) {
        const file = event.target.files[0];
        if (file) this._readProcFile(file);
        // Reset input so same file can be re-selected
        event.target.value = '';
    },

    _readProcFile: function(file) {
        const ALLOWED = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png', 'image/jpeg'];
        const MAX_MB = 5;

        if (!ALLOWED.includes(file.type)) {
            Store.showToast('❌ Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            Store.showToast(`❌ File too large. Maximum size is ${MAX_MB} MB.`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this._procSpecFile = {
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result,
                rawFile: file
            };
            // Clear any warning border
            const zone = document.getElementById('proc-file-zone');
            if (zone) zone.style.borderColor = '';
            this._showProcFilePreview();
        };
        reader.readAsDataURL(file);
    },

    _showProcFilePreview: function() {
        const zone = document.getElementById('proc-file-zone');
        const preview = document.getElementById('proc-file-preview');
        const nameEl = document.getElementById('proc-file-name');
        const sizeEl = document.getElementById('proc-file-size');

        if (!this._procSpecFile || !zone || !preview) return;

        zone.style.display = 'none';
        preview.style.display = 'block';
        if (nameEl) nameEl.textContent = this._procSpecFile.name;
        if (sizeEl) {
            const kb = (this._procSpecFile.size / 1024).toFixed(1);
            sizeEl.textContent = kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(2)} MB`;
        }
    },

    removeProcFile: function() {
        this._procSpecFile = null;
        const zone = document.getElementById('proc-file-zone');
        const preview = document.getElementById('proc-file-preview');
        if (zone) zone.style.display = '';
        if (preview) preview.style.display = 'none';
    },

    previewSpecFile: function(procId) {
        Store.previewProcurementFile(procId, 'spec');
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
        ['req-dept', 'proc-dept'].forEach((id) => {
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

    updateProcurementTypeDropdown: function() {
        const dept = document.getElementById('proc-dept').value;
        const typeSelect = document.getElementById('proc-type');
        if (!typeSelect) return;

        const types = this.getDeptResources(dept);
        if (types.length === 0) {
            typeSelect.innerHTML = '<option value="" disabled selected>No Catalog Configured for Department</option>';
        } else {
            typeSelect.innerHTML = '<option value="" disabled selected>Select Resource Type</option>';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            });
        }
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
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-target="my-requests-view"]').classList.add('active');
    },

    submitProcurement: async function(e) {
        e.preventDefault();
        const dept = document.getElementById('proc-dept').value;
        const type = document.getElementById('proc-type').value;
        const qty = parseInt(document.getElementById('proc-qty').value);
        const reason = document.getElementById('proc-reason').value;
        const user = Store.getCurrentUser();

        if (!dept || !type.trim() || isNaN(qty) || qty < 1 || !reason.trim()) {
            Store.showToast("Please fill in all fields correctly before submitting.", "error");
            return;
        }

        // Spec file is required
        if (!this._procSpecFile) {
            Store.showToast("⚠️ Please attach a Resource Specification / Intent File before submitting.", "warning");
            document.getElementById('proc-file-zone').style.borderColor = '#f59e0b';
            return;
        }



        const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'});

        const procPayload = {
            id: newId,
            item: type,
            resourceType: type,
            department: dept,
            requester: user.name,
            requestedById: user.id,
            requesterRole: user.role,
            quantity: qty,
            status: "Pending Approval",
            priority: "Normal",
            date: dateStr,
            justification: reason,
            specFileName: this._procSpecFile.name,
            specFileType: this._procSpecFile.type,
            specFileDataUrl: this._procSpecFile.dataUrl,
            rawFile: this._procSpecFile.rawFile
        };

        try {
            await Store.createProcurement(procPayload);
            await this.refreshData();

            Store.showToast("Procurement Request Submitted Successfully! ID: " + newId, "success");
            document.getElementById('procurementForm').reset();
            this.removeProcFile();
            this.renderProcurements();
        } catch (err) {
            console.error('Procurement submit error:', err);
            Store.showToast("❌ Failed to submit: " + (err.message || "Unknown error. Please try again."), "error");
        }
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

    renderProcurements: function() {
        const tbody = document.getElementById('procurements-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const myProcs = this.state.procurements.filter(p => p.requester === user.name || p.requestedById === user.id);

        myProcs.forEach(proc => {
            let statusBadge = `<span class="badge" style="background:#cbd5e1; color:#0f172a">${proc.status}</span>`;
            if (proc.status === 'Approved' || proc.status === 'Completed') statusBadge = `<span class="badge" style="background:#dcfce7; color:#166534">${proc.status}</span>`;
            else if (proc.status === 'Pending Approval') statusBadge = `<span class="badge pending">${proc.status}</span>`;
            else if (proc.status === 'Rejected') statusBadge = `<span class="badge" style="background:#fee2e2; color:#b91c1c">${proc.status}</span>`;

            const specCell = proc.specFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="app.previewSpecFile('${proc.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${proc.specFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const invoiceCell = proc.invoiceFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="app.previewInvoiceFile('${proc.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${proc.invoiceFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${proc.id}</td>
                <td>${proc.item}</td>
                <td>${String(proc.quantity).padStart(2, '0')}</td>
                <td>${proc.date}</td>
                <td>${statusBadge}</td>
                <td>${specCell}</td>
                <td>${invoiceCell}</td>
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
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-target="my-resources-view"]').classList.add('active');
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
