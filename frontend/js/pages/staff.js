const staffApp = {
    stockData: [
        { id: "s1", resourceType: "Laptop", currentQuantity: 18, thresholdLevel: 15 },
        { id: "s2", resourceType: "Projector", currentQuantity: 8, thresholdLevel: 10 },
        { id: "s3", resourceType: "Tablet", currentQuantity: 3, thresholdLevel: 8 },
        { id: "s4", resourceType: "Monitor", currentQuantity: 2, thresholdLevel: 5 },
        { id: "s5", resourceType: "Router", currentQuantity: 12, thresholdLevel: 10 },
        { id: "s6", resourceType: "Printer", currentQuantity: 6, thresholdLevel: 6 }
    ],
    editStockId: null,

    init: async function () {
        const user = Store.getCurrentUser();
        if (!user || user.role !== 'Staff') {
            window.location.href = 'login.html';
            return;
        }
        await Store.sync();

        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = user.department + ' Staff';

        this.bindNav();
        this.renderDashboard();
        await this.renderAllocations();
        this.renderInventory();
        this.renderMaintenance();
        this.renderReturns();
        this.renderProcurementTasks();
        this.renderRegistrationCards();
    },

    bindNav: function () {
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

    switchView: function (viewId) {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(viewId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    },

    getStaffDepartment: function () {
        const user = Store.getCurrentUser();
        return user && user.role === 'Staff' ? user.department : null;
    },

    getDepartmentResource: function (id) {
        const userDept = this.getStaffDepartment();
        return Store.getData().resources.find(r => r.id === id && r.department === userDept);
    },

    getDepartmentProcurement: function (id, status) {
        const userDept = this.getStaffDepartment();
        return Store.getData().procurements.find(p => {
            const statusMatches = status ? p.status === status : true;
            return p.id === id && p.department === userDept && statusMatches;
        });
    },

    getDepartmentCatalogTypes: function () {
        const userDept = this.getStaffDepartment();
        return Store.getDepartmentResourceTypes(userDept).slice().sort();
    },

    normalizeResourceToken: function (value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    },

    resourceMatchesType: function (resource, requestedType) {
        if (!requestedType || !resource) return false;
        const target = this.normalizeResourceToken(requestedType);
        const resType = this.normalizeResourceToken(resource.type);
        if (!target || !resType) return false;

        if (target === resType) return true;
        const stripS = (str) => (str.endsWith('s') ? str.slice(0, -1) : str);
        if (stripS(target) === stripS(resType)) return true;
        if (target.replace(/s/g, '') === resType.replace(/s/g, '')) return true;

        return false;
    },

    // 0. Dashboard View
    renderDashboard: function () {
        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const approvedReqs = db.requests.filter(r => r.status === 'Approved' && r.department === userDept);
        const resources = db.resources.filter(r => r.department === userDept);
        const maintenance = resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance');
        const returns = resources.filter(r => r.status === 'Returned');
        const procTasks = db.procurements.filter(p => p.status === 'Approved' && p.department === userDept);

        const elAlloc = document.getElementById('dash-staff-alloc');
        const elRes = document.getElementById('dash-staff-res');
        const elMaint = document.getElementById('dash-staff-maint');
        const elProc = document.getElementById('dash-staff-proc');
        const elReturns = document.getElementById('dash-staff-returns');

        if (elAlloc) elAlloc.textContent = approvedReqs.length;
        if (elRes) elRes.textContent = resources.length;
        if (elMaint) elMaint.textContent = maintenance.length;
        if (elProc) elProc.textContent = procTasks.length;
        if (elReturns) elReturns.textContent = returns.length;

        // Allocation Table
        const allocTbody = document.getElementById('dash-alloc-tbody');
        if (allocTbody) {
            allocTbody.innerHTML = '';
            approvedReqs.slice(0, 5).forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.quantity}</td>
                    <td>${req.requestor}</td>
                `;
                allocTbody.appendChild(tr);
            });
        }

        // Maintenance Table
        const maintTbody = document.getElementById('dash-maint-tbody');
        if (maintTbody) {
            maintTbody.innerHTML = '';
            maintenance.slice(0, 5).forEach(res => {
                let statusBadge = `<span class="badge pending">${res.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${res.id}</td>
                    <td>${res.type}</td>
                    <td>${statusBadge}</td>
                `;
                maintTbody.appendChild(tr);
            });
        }
    },

    // 1. Allocation Requests
    renderAllocations: async function () {
        const tbody = document.getElementById('allocation-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const approvedRequests = db.requests.filter(r => r.status === 'Approved' && r.department === userDept);

        for (const req of approvedRequests) {
            let checkboxesHTML = '';
            const matchingResources = await Store.fetchResources({
                department: userDept,
                status: 'Available',
                type: req.resourceType
            });

            (matchingResources || []).forEach(res => {
                checkboxesHTML += `
                    <label>
                        <input type="checkbox" value="${res.id}" class="alloc-cb-${req.id}" onchange="staffApp.updateMultiSelect('${req.id}', ${req.quantity})"> 
                        ${res.id} - ${res.name}
                        <span class="multi-status-text">${res.condition}</span>
                    </label>
                `;
            });

            if (matchingResources.length === 0) {
                checkboxesHTML = `<div style="padding: 0.6rem; text-align: center; color: #94a3b8; font-size: 0.8rem;">No matching resources available in your department inventory</div>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td>
                    <div class="multi-select-container">
                        <div class="multi-select-header" id="multi-header-${req.id}" onclick="staffApp.toggleMultiDropdown('${req.id}')">
                            <span class="multi-select-title" id="multi-title-${req.id}">Select Resources (0/${req.quantity})</span>
                            <span class="material-symbols-outlined" style="font-size: 1.2rem; color: #94a3b8;">expand_more</span>
                        </div>
                        <div class="multi-select-dropdown" id="multi-drop-${req.id}" style="display:none;">
                            ${checkboxesHTML}
                        </div>
                    </div>
                </td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem" onclick="staffApp.allocateResource('${req.id}')">Allocate</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    },

    toggleMultiDropdown: function (reqId) {
        const dropdown = document.getElementById(`multi-drop-${reqId}`);
        const header = document.getElementById(`multi-header-${reqId}`);

        if (dropdown.style.display === 'none') {
            // Close any open dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => d.style.display = 'none');
            document.querySelectorAll('.multi-select-header').forEach(h => h.classList.remove('active'));

            dropdown.style.display = 'flex';
            header.classList.add('active');

            // Close when clicking outside
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest(`.multi-select-container`)) {
                    dropdown.style.display = 'none';
                    header.classList.remove('active');
                    document.removeEventListener('click', closeMenu);
                }
            });
        } else {
            dropdown.style.display = 'none';
            header.classList.remove('active');
        }
    },

    updateMultiSelect: function (reqId, targetQty) {
        const checkboxes = document.querySelectorAll(`.alloc-cb-${reqId}:checked`);
        const title = document.getElementById(`multi-title-${reqId}`);
        const count = checkboxes.length;

        if (count === targetQty) {
            title.textContent = `${count}/${targetQty} Selected ✅`;
            title.style.color = '#16a34a';
            title.style.fontWeight = '700';
        } else {
            title.textContent = `Select Resources (${count}/${targetQty})`;
            title.style.color = 'var(--text-main)';
            title.style.fontWeight = '500';
        }
    },

    allocateResource: async function (reqId) {
        const checkboxes = document.querySelectorAll(`.alloc-cb-${reqId}:checked`);
        const selectedOptions = Array.from(checkboxes).map(cb => cb.value);

        const userDept = this.getStaffDepartment();
        const db = Store.getData();
        const req = db.requests.find(r => r.id === reqId && r.department === userDept);

        if (!req) {
            Store.showToast("You can only allocate requests for your department.", "error");
            return;
        }

        if (selectedOptions.length !== req.quantity) {
            Store.showToast(`Please select exactly ${req.quantity} resource(s) for this request (you selected ${selectedOptions.length}).`, "error");
            return;
        }

        await Store.allocateRequest(reqId, selectedOptions);

        Store.showToast(`Request ${reqId} Allocated. ${selectedOptions.length} resource(s) assigned successfully.`, "success");
        await this.renderAllocations();
        this.renderInventory();
    },

    // 2. Modular Resource Registration
    renderRegistrationCards: function () {
        const container = document.getElementById('procurement-registration-container');
        if (!container) return;
        container.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const procurements = Store.getData().procurements.filter(p => p.status === 'Fulfilled' && p.department === userDept);

        if (procurements.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:3rem; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1; color:#64748b;">
                    <span class="material-symbols-outlined" style="font-size:3rem; opacity:0.5; margin-bottom:1rem; display:block;">inventory</span>
                    <p style="font-size:1.1rem; margin-bottom:0.5rem">No Pending Registrations</p>
                    <p style="font-size:0.875rem">Purchases logged from Procurement Tasks will appear here for serial registration.</p>
                </div>
            `;
            return;
        }

        procurements.forEach(p => {
            const qty = parseInt(p.quantity) || 1;
            let rowsHtml = '';

            for (let i = 0; i < qty; i++) {
                const newCode = `RES-${p.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(i + 1).padStart(2, '0')}`;
                rowsHtml += `
                    <tr>
                        <td><input type="text" class="form-control" value="${newCode}" readonly></td>
                        <td><input type="text" class="form-control" placeholder="Model"></td>
                        <td style="display:none"><input type="hidden" value="${p.resourceType}"></td>
                        <td><input type="text" class="form-control" placeholder="Serial Number"></td>
                        <td><input type="text" class="form-control" placeholder="Location"></td>
                        <td>
                            <select class="form-control">
                                <option value="New">New</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Bad">Bad</option>
                            </select>
                        </td>
                        <td>
                            <select class="form-control">
                                <option value="Available">Available</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Scrapped">Scrapped</option>
                            </select>
                        </td>
                        <td style="display:none"><input type="hidden" value="${p.vendor || ''}"></td>
                        <td style="display:none"><input type="hidden" value="${p.invoice || ''}"></td>
                    </tr>
                `;
            }

            const card = document.createElement('div');
            card.className = 'form-card';
            card.style.maxWidth = '100%';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid #e2e8f0;">
                    <div>
                        <h3 class="data-section-title" style="margin-bottom:0.25rem;">Register Purchase: ${p.resourceType}</h3>
                        <div style="font-size:0.875rem; color:#64748b;">Procurement ID: <strong>${p.id}</strong> | Quantity Expected: <strong>${qty}</strong></div>
                    </div>
                    <div style="text-align:right; font-size:0.875rem;">
                        <div>Vendor: <strong>${p.vendor || 'N/A'}</strong></div>
                        <div>Invoice: <strong>${p.invoice || 'N/A'}</strong></div>
                        <div style="margin-top:0.25rem;">${p.invoiceFileName
                            ? `<a href="javascript:void(0)" class="spec-file-link" onclick="staffApp.previewInvoiceFile('${p.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${p.invoiceFileName}</a>`
                            : ''}</div>
                    </div>
                </div>
                
                <table class="table" style="background:#f8fafc; border-radius:8px; margin-bottom:1.5rem;">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Model</th>
                            <th>S/N <span style="color:#ef4444">*</span></th>
                            <th>Location</th>
                            <th>Condition</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="reg-tbody-${p.id}">
                        ${rowsHtml}
                    </tbody>
                </table>
                
                <div style="text-align:right;">
                    <button class="btn-primary" onclick="staffApp.submitRegistrationCard('${p.id}')">Submit & Register Assets</button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    submitRegistrationCard: async function (procId) {
        const tbody = document.getElementById(`reg-tbody-${procId}`);
        if (!tbody) return;

        const userDept = this.getStaffDepartment();
        // Allow 'Fulfilled' or 'Registered' — sync() inside logPurchase/registerProcurement
        // can update localStorage status before this check runs, causing a false rejection
        const procurement = this.getDepartmentProcurement(procId, 'Fulfilled') ||
                            this.getDepartmentProcurement(procId, 'Registered') ||
                            this.getDepartmentProcurement(procId);   // fallback: any status, dept-scoped
        if (!userDept || !procurement) {
            Store.showToast("You can only register fulfilled purchases for your department.", "error");
            return;
        }

        let count = 0;
        let errors = false;
        let formatErrors = false;
        let snErrors = false;
        let duplicateErrors = false;

        const newResources = [];
        const modelRegex = /^[a-zA-Z0-9\s.-]+$/;
        const snRegex = /^[a-zA-Z0-9_.-]+$/;
        const db = Store.getData();
        const existingSerials = new Set((db.resources || []).map(r => String(r.serialNumber || '').toLowerCase()));
        const batchSerials = new Set();

        Array.from(tbody.children).forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const selects = tr.querySelectorAll('select');
            const code = inputs[0].value.trim();
            const model = inputs[1].value.trim();
            const type = inputs[2].value.trim();
            const sn = inputs[3].value.trim();
            const loc = inputs[4].value.trim();
            const cond = selects[0] ? selects[0].value : 'New';
            const status = selects[1] ? selects[1].value : 'Available';
            const vendor = inputs[5] ? inputs[5].value.trim() : '';
            const invoice = inputs[6] ? inputs[6].value.trim() : '';

            if (!model || !type || !sn || !loc || !cond || !status) {
                errors = true;
            } else {
                if (!modelRegex.test(model)) {
                    formatErrors = true;
                }
                if (!snRegex.test(sn)) {
                    snErrors = true;
                }
                const normalizedSn = sn.toLowerCase();
                if (existingSerials.has(normalizedSn) || batchSerials.has(normalizedSn)) {
                    duplicateErrors = true;
                }
                batchSerials.add(normalizedSn);

                if (!errors && !formatErrors && !snErrors && !duplicateErrors) {
                    newResources.push({
                        id: code,
                        code: code,
                        name: model,
                        type: type,
                        department: userDept,
                        serialNumber: sn,
                        location: loc,
                        status: status,
                        condition: cond,
                        assignedTo: "None",
                        vendor: vendor,
                        invoice: invoice,
                        date: new Date().toLocaleDateString('en-US')
                    });
                    count++;
                }
            }
        });

        if (errors) {
            Store.showToast("Please fully complete all fields for every row in this batch.", "error");
            return;
        }

        if (formatErrors) {
            Store.showToast("Model can only contain letters, numbers, spaces, dots, and hyphens.", "error");
            return;
        }

        if (snErrors) {
            Store.showToast("Serial Number can only contain letters, numbers, dots, hyphens, and underscores.", "error");
            return;
        }

        if (duplicateErrors) {
            Store.showToast("Serial numbers must be unique across inventory and this batch.", "error");
            return;
        }

        if (count > 0) {
            // Capture procurement data BEFORE registerProcurement() because sync() changes status to 'Registered'
            const procData = Store.getData().procurements.find(p => p.id === procId);

            await Store.registerProcurement(procId, newResources);

            // Look up the requester's role to distinguish between Requestor and Dept Head
            const requesterUser = procData ? Store.getData().users.find(u => u.id === procData.requestedById) : null;
            const requesterRole = (procData && procData.requesterRole) ? procData.requesterRole : (requesterUser ? requesterUser.role : null);

            // AUTO-CREATE an Approved allocation request ONLY if requested by a Requestor
            // (Department Head procurements go straight to inventory without auto-allocation)
            if (procData && procData.requestedById && requesterRole === 'Requestor') {
                const allocationReqId = `REQ-PRC-${procId.replace(/[^a-zA-Z0-9]/g, '')}`;
                const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                try {
                    await Store.createRequest({
                        id: allocationReqId,
                        department: userDept,
                        resourceType: procData.resourceType || procData.item,
                        quantity: count,
                        requestor: procData.requester || 'Unknown',
                        requestorId: procData.requestedById,
                        status: 'Approved',
                        priority: 'Normal',
                        date: dateStr,
                        justification: `Auto-generated from Procurement ${procId} — ${count} assets registered and pending allocation.`,
                        procurementId: procId
                    });
                    await this.renderAllocations();
                    this.renderRegistrationCards();
                    this.renderInventory();
                    this.renderDashboard();
                    // Navigate directly to Allocation Requests so staff can allocate immediately
                    this.switchView('allocations-view');
                    Store.showToast(`✅ ${count} asset(s) registered! Now allocate them to ${procData.requester} using the Allocate button below.`, 'success');
                } catch (err) {
                    console.error('Allocation request creation failed:', err);
                    this.renderRegistrationCards();
                    this.renderInventory();
                    this.renderDashboard();
                    Store.showToast(`✅ ${count} asset(s) registered to inventory. (Could not auto-create allocation: ${err.message})`, 'warning');
                }
            } else {
                Store.showToast(`Successfully registered ${count} assets to ${userDept} inventory.`, 'success');
                this.renderRegistrationCards();
                this.renderInventory();
                this.renderDashboard();
            }
        }
    },

    // 3. Manage Inventory
    renderInventory: function () {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        // Erase allocated resources from inventory view
        const resources = Store.getData().resources.filter(r => r.department === userDept && r.status !== 'Allocated');

        resources.forEach(res => {
            const tr = document.createElement('tr');

            let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
            if (res.status === 'Available') statusBadge = `<span class="badge allocated">${res.status}</span>`;

            const srcProc = res.procurementId ? (Store.getData().procurements || []).find(p => p.id === res.procurementId) : null;
            const invoiceFileCell = srcProc && srcProc.invoiceFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="staffApp.previewInvoiceFile('${srcProc.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${srcProc.invoiceFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            tr.innerHTML = `
                <td class="td-id">${res.id}</td>
                <td style="font-weight: 500">${res.name || res.type}</td>
                <td>${res.type}</td>
                <td><span style="font-family: monospace; font-size: 0.8rem; background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${res.serialNumber || 'N/A'}</span></td>
                <td>${res.location || res.department || 'N/A'}</td>
                <td>${res.condition || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${res.vendor || 'N/A'}</td>
                <td>${res.invoice || 'N/A'}</td>
                <td>${invoiceFileCell}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-secondary" style="font-size:0.75rem; margin-right:4px;" onclick="staffApp.openEditResourceModal('${res.id}')">Edit</button>
                    ${res.status !== 'Scrapped' ? `<button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.scrapResource('${res.id}')">Scrap</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    previewInvoiceFile: function (procId) {
        Store.previewProcurementFile(procId, 'invoice');
    },

    scrapResource: async function (resId) {
        if (!this.getDepartmentResource(resId)) {
            Store.showToast("You can only scrap resources in your department.", "error");
            return;
        }
        if (confirm("Permanently mark this resource as scrapped?")) {
            await Store.scrapResource(resId);
            Store.showToast(`Resource ${resId} marked as scrapped!`, "error");
            this.renderInventory();
            this.renderDashboard();
        }
    },

    // 3.1 Edit Resource Dialog

    openEditResourceModal: function (id) {
        const res = this.getDepartmentResource(id);
        if (!res) return;

        document.getElementById('er-id').value = res.id;
        document.getElementById('er-code').value = res.code || res.id;
        document.getElementById('er-sn').value = res.serialNumber || '';
        document.getElementById('er-vendor').value = res.vendor || '';
        document.getElementById('er-invoice').value = res.invoice || '';
        document.getElementById('er-location').value = res.location || '';

        // Sometimes mock data condition is "Fair" instead of "Average"
        let cond = res.condition || 'Average';
        if (cond === 'Fair') cond = 'Average';
        if (cond === 'New') cond = 'Good';
        document.getElementById('er-condition').value = cond;

        document.getElementById('er-status').value = res.status || 'Available';

        document.getElementById('edit-resource-modal').classList.add('active');
    },

    closeEditResourceModal: function () {
        document.getElementById('edit-resource-modal').classList.remove('active');
        document.getElementById('editResourceForm').reset();
    },

    submitEditResource: async function (e) {
        e.preventDefault();
        const id = document.getElementById('er-id').value;
        const sn = document.getElementById('er-sn').value.trim();
        const vendor = document.getElementById('er-vendor').value.trim();
        const invoice = document.getElementById('er-invoice').value.trim();
        const loc = document.getElementById('er-location').value;
        const cond = document.getElementById('er-condition').value;
        const status = document.getElementById('er-status').value;

        if (!this.getDepartmentResource(id)) {
            Store.showToast("You can only edit resources in your department.", "error");
            return;
        }

        const snRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!sn || !snRegex.test(sn)) {
            Store.showToast("Serial Number can only contain letters, numbers, dots, hyphens, and underscores.", "error");
            return;
        }

        const duplicateSerial = Store.getData().resources.some(r => {
            return r.id !== id && String(r.serialNumber || '').toLowerCase() === sn.toLowerCase();
        });
        if (duplicateSerial) {
            Store.showToast("Serial number already exists", "error");
            return;
        }

        await Store.updateResource(id, {
            serialNumber: sn,
            vendor: vendor,
            invoice: invoice,
            location: loc,
            condition: cond,
            status: status
        });

        Store.showToast(`Resource ${id} updated!`, "success");
        this.renderInventory();
        this.renderDashboard();
        this.closeEditResourceModal();
    },

    // 3.2 Add Resource Dialog

    openAddResourceModal: function () {
        const typeSelect = document.getElementById('ar-type');
        const allTypes = this.getDepartmentCatalogTypes();

        if (allTypes.length === 0) {
            typeSelect.innerHTML = '<option value="" disabled>No Catalog Configured. Contact Admin.</option>';
        } else {
            typeSelect.innerHTML = '<option value="">Select Resource Type...</option>';
            allTypes.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                typeSelect.appendChild(opt);
            });
        }

        document.getElementById('add-resource-modal').classList.add('active');
    },

    closeAddResourceModal: function () {
        document.getElementById('add-resource-modal').classList.remove('active');
        document.getElementById('addResourceForm').reset();
    },

    submitAddResource: async function (e) {
        e.preventDefault();

        const type = document.getElementById('ar-type').value;
        const mfg = document.getElementById('ar-mfg').value;
        const model = document.getElementById('ar-model').value;
        const sn = document.getElementById('ar-sn').value;
        const vendor = document.getElementById('ar-vendor').value.trim();
        const invoice = document.getElementById('ar-invoice').value.trim();
        const loc = document.getElementById('ar-location').value;
        const cond = document.getElementById('ar-condition').value;

        if (!type || !mfg || !model || !sn || !loc || !cond) {
            Store.showToast("Please fill in all fields", "error");
            return;
        }

        const currentUser = Store.getCurrentUser();
        const userDept = this.getStaffDepartment();
        const db = Store.getData();
        const resources = db.resources || [];

        const snRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!snRegex.test(sn)) {
            Store.showToast("Serial Number can only contain letters, numbers, dots, hyphens, and underscores.", "error");
            return;
        }

        // Validation: Unique Serial Number
        const isDuplicate = resources.some(r => String(r.serialNumber || '').toLowerCase() === sn.toLowerCase());
        if (isDuplicate) {
            Store.showToast("Serial number already exists", "error");
            return;
        }

        // Generating Code
        const deptPrefix = (userDept || 'DEP').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        const typePrefix = type.substring(0, 3).toUpperCase();

        const sameTypeRes = resources.filter(r => r.type === type && r.department === userDept);
        const nextNumber = String(sameTypeRes.length + 1).padStart(3, '0');

        const generatedCode = `${deptPrefix}-${typePrefix}-${nextNumber}`;

        const newResource = {
            code: generatedCode,
            id: generatedCode,
            internalId: "r" + (resources.length + 1),
            type: type,
            name: `${mfg} ${model}`,
            department: currentUser.department,
            serialNumber: sn,
            location: loc,
            condition: cond,
            status: "Available",
            vendor: vendor,
            invoice: invoice,
            assignedTo: "None",
            date: new Date().toLocaleDateString('en-US')
        };

        await Store.createResource(newResource);
        Store.showToast(`Resource ${generatedCode} added successfully!`, "success");

        this.renderInventory();
        this.renderDashboard();
        this.closeAddResourceModal();
    },

    // 4. Maintenance Management
    renderMaintenance: function () {
        const mtbody = document.getElementById('maint-tbody');
        if (!mtbody) return;
        mtbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const resources = db.resources.filter(r => r.department === userDept);

        // Active Queue
        resources.filter(r => r.status === 'Maintenance Requested' || r.status === 'Maintenance').forEach(res => {
            const tr = document.createElement('tr');
            let actionHtml = '';
            let statusText = res.status;

            if (res.status === 'Maintenance Requested') {
                actionHtml = `
                    <button class="btn-primary" style="font-size:0.75rem; margin-right:4px;" onclick="staffApp.acceptMaintenance('${res.id}')">Accept</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.markScrapMaint('${res.id}')">Reject &rarr; Scrap</button>
                `;
            } else if (res.status === 'Maintenance') {
                statusText = 'Under Maintenance';
                actionHtml = `
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a; margin-right:4px;" onclick="staffApp.markRepaired('${res.id}')">Mark Repaired</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="staffApp.markScrapMaint('${res.id}')">Mark Scrap</button>
                `;
            }

            tr.innerHTML = `
                <td><div class="td-id">${res.id}</div></td>
                <td>${res.type}</td>
                <td>${res.assignedTo || 'None'}</td>
                <td><span class="badge pending">${statusText}</span></td>
                <td style="text-align:right">${actionHtml}</td>
            `;
            mtbody.appendChild(tr);
        });

        // History
        const htbody = document.getElementById('maint-history-tbody');
        const hcount = document.getElementById('maint-history-count');
        if (htbody) {
            htbody.innerHTML = '';
            const deptResourceIds = new Set(resources.map(r => r.id));
            const history = (db.maintenanceHistory || []).filter(log => {
                return log.department === userDept || (!log.department && deptResourceIds.has(log.code));
            });
            if (hcount) hcount.textContent = history.length;

            history.forEach(log => {
                const sbadge = log.status === 'Repaired' ? `<span class="badge allocated">${log.status}</span>` : `<span class="badge rejected">${log.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="td-id">${log.code}</div></td>
                    <td>${log.type}</td>
                    <td>${log.allocatedTo}</td>
                    <td>${log.issue || 'Routine'}</td>
                    <td>${log.actionDate}</td>
                    <td>${sbadge}</td>
                `;
                htbody.appendChild(tr);
            });
        }
    },

    acceptMaintenance: async function (id) {
        if (!this.getDepartmentResource(id)) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        await Store.acceptMaintenance(id);
        Store.showToast("Maintenance accepted. Resource is now under maintenance.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markRepaired: async function (id) {
        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        await Store.repairMaintenance(id);
        Store.showToast("Resource marked as repaired. User notified.", "success");
        this.renderMaintenance();
        this.renderDashboard();
    },

    markScrapMaint: async function (id) {
        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process maintenance for your department.", "error");
            return;
        }
        await Store.scrapMaintenance(id);
        Store.showToast("Resource marked as scrap. User notified.", "error");
        this.renderMaintenance();
        this.renderDashboard();
    },

    // 5. Return Management
    renderReturns: function () {
        const rtbody = document.getElementById('return-tbody');
        if (!rtbody) return;
        rtbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const db = Store.getData();
        const resources = db.resources.filter(r => r.department === userDept);

        // Return Queue
        resources.filter(r => r.status === 'Returned').forEach(res => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="td-id">${res.id}</div></td>
                <td>${res.type}</td>
                <td>${res.assignedTo || 'Unknown'}</td>
                <td>${res.date || new Date().toLocaleDateString()}</td>
                <td>
                    <select class="form-control" style="font-size:0.75rem; padding:0.25rem" id="return-cond-${res.id}" onchange="staffApp.validateReturnCond('${res.id}')">
                        <option value="">-- Inspect Condition --</option>
                        <option value="Good">Good &rarr; Available</option>
                        <option value="Average">Average &rarr; Available</option>
                        <option value="Bad">Bad &rarr; Scrap</option>
                    </select>
                </td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem" id="process-ret-${res.id}" disabled onclick="staffApp.processReturn('${res.id}')">Process Return</button>
                </td>
            `;
            rtbody.appendChild(tr);
        });

        // History
        const htbody = document.getElementById('return-history-tbody');
        const hcount = document.getElementById('return-history-count');
        if (htbody) {
            htbody.innerHTML = '';
            const deptResourceIds = new Set(resources.map(r => r.id));
            const history = (db.returnHistory || []).filter(log => {
                return log.department === userDept || (!log.department && deptResourceIds.has(log.code));
            });
            if (hcount) hcount.textContent = history.length;

            history.forEach(log => {
                const sbadge = log.finalStatus === 'Available' ? `<span class="badge allocated">${log.finalStatus}</span>` : `<span class="badge rejected">${log.finalStatus}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="td-id">${log.code}</div></td>
                    <td>${log.type}</td>
                    <td>${log.returnedBy}</td>
                    <td>${log.returnDate}</td>
                    <td>${log.processDate}</td>
                    <td>${log.condition}</td>
                    <td>${sbadge}</td>
                `;
                htbody.appendChild(tr);
            });
        }
    },

    validateReturnCond: function (id) {
        const val = document.getElementById(`return-cond-${id}`).value;
        const btn = document.getElementById(`process-ret-${id}`);
        if (btn) btn.disabled = val === "";
    },

    processReturn: async function (id) {
        const cond = document.getElementById(`return-cond-${id}`).value;

        const res = this.getDepartmentResource(id);
        if (!res) {
            Store.showToast("You can only process returns for your department.", "error");
            return;
        }
        await Store.processReturn(id, cond);
        const newStatus = cond === "Bad" ? "Scrapped" : "Available";

        if (newStatus === 'Available') {
            Store.showToast("Return processed. Resource marked as Available.", "success");
        } else {
            Store.showToast("Return processed. Resource marked as Scrap.", "error");
        }

        this.renderReturns();
        this.renderDashboard();
    },

    toggleHistory: function (contentId) {
        const content = document.getElementById(contentId);
        const icon = document.getElementById(contentId + '-icon');
        if (content) {
            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                if (icon) icon.textContent = '▼';
            } else {
                content.classList.add('expanded');
                if (icon) icon.textContent = '▲';
            }
        }
    },

    // 5. Procurement Tasks
    _invoiceFiles: {}, // procId -> { name, size, type, dataUrl }

    renderProcurementTasks: function () {
        const tbody = document.querySelector('#proctask-tbody tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const userDept = user.department;
        const tasks = Store.getData().procurements.filter(p => p.status === 'Approved' && p.department === userDept);

        tasks.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="td-id">PT-${p.id.split('-')[1]}</div>
                    <div style="font-size:0.75rem; color:#64748b">${p.resourceType}</div>
                </td>
                <td>${p.quantity}</td>
                <td>
                    <input type="text" class="form-control" style="margin-bottom:0.25rem; font-size:0.75rem" placeholder="Vendor Name" id="vend-${p.id}">
                    <input type="text" class="form-control" style="margin-bottom:0.25rem; font-size:0.75rem" placeholder="Invoice Number" id="inv-${p.id}">
                    <input type="file" style="font-size:0.72rem; width:100%" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" id="invfile-${p.id}" onchange="staffApp.onInvoiceFileSelected(event, '${p.id}')">
                    <div id="invfile-name-${p.id}" style="font-size:0.72rem; color:#16a34a; margin-top:0.15rem;"></div>
                </td>
                <td style="text-align:right; vertical-align:middle">
                    <button class="btn-primary" onclick="staffApp.logPurchase('${p.id}')">Log Purchase</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    onInvoiceFileSelected: function (event, procId) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;

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
            this._invoiceFiles[procId] = { name: file.name, size: file.size, type: file.type, dataUrl: e.target.result, rawFile: file };
            const label = document.getElementById('invfile-name-' + procId);
            if (label) label.textContent = file.name;
        };
        reader.readAsDataURL(file);
    },

    logPurchase: async function (id) {
        const vendorInput = document.getElementById('vend-' + id);
        const invoiceInput = document.getElementById('inv-' + id);

        const vendor = vendorInput ? vendorInput.value.trim() : '';
        const invoice = invoiceInput ? invoiceInput.value.trim() : '';
        const invoiceFile = this._invoiceFiles[id];

        if (!vendor || !invoice) {
            Store.showToast("Please provide both Vendor Name and Invoice Number before logging purchase.", "error");
            if (!vendor && vendorInput) vendorInput.focus();
            else if (!invoice && invoiceInput) invoiceInput.focus();
            return;
        }

        const vendorRegex = /^[a-zA-Z0-9\s.-]+$/;
        const invoiceRegex = /^[0-9]+$/;

        if (!vendorRegex.test(vendor)) {
            Store.showToast("Vendor Name can only contain characters and numbers.", "error");
            if (vendorInput) vendorInput.focus();
            return;
        }

        if (!invoiceRegex.test(invoice)) {
            Store.showToast("Invoice Number can only contain numbers.", "error");
            if (invoiceInput) invoiceInput.focus();
            return;
        }

        if (!invoiceFile) {
            Store.showToast("⚠️ Please attach the invoice file before logging the purchase.", "error");
            return;
        }

        const proc = this.getDepartmentProcurement(id, 'Approved');
        if (!proc) {
            Store.showToast("You can only log purchases for your department.", "error");
            return;
        }

        await Store.logPurchase(id, vendor, invoice, invoiceFile);
        delete this._invoiceFiles[id];

        Store.showToast(`Purchase logged for Invoice ${invoice}. Assets are now pending Serial Registration.`, "success");
        this.renderProcurementTasks();
        this.renderRegistrationCards();
    },

    // Stock Monitoring
    renderStockMonitoring: function () {
        const tbody = document.getElementById('stock-monitoring-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const userDept = this.getStaffDepartment();
        const backendThresholds = (Store.getData().stockThresholds || []).filter(item => item.department === userDept);
        this.stockData = backendThresholds.map(item => ({
            id: item.id,
            resourceType: item.resourceType,
            currentQuantity: 0,
            thresholdLevel: item.thresholdLevel
        }));
        const deptResources = Store.getData().resources.filter(r => r.department === userDept);
        const countsByType = {};
        deptResources.forEach(res => {
            const type = res.type || res.name || 'Unknown';
            if (!countsByType[type]) countsByType[type] = 0;
            if (res.status === 'Available') countsByType[type]++;
        });

        const stockRows = Object.keys(countsByType).sort().map(type => {
            const configured = this.stockData.find(item => item.resourceType === type);
            return {
                id: configured ? configured.id : type,
                resourceType: type,
                currentQuantity: countsByType[type],
                thresholdLevel: configured ? configured.thresholdLevel : 1
            };
        });

        let safeCount = 0;
        let nearCount = 0;
        let lowCount = 0;

        stockRows.forEach(item => {
            let status = '';
            let statusBadge = '';
            let showSendReq = false;

            if (item.currentQuantity >= item.thresholdLevel) {
                status = 'Safe';
                statusBadge = `<span class="badge badge-stock-safe">Safe</span>`;
                safeCount++;
            } else if (item.currentQuantity >= item.thresholdLevel * 0.7) {
                status = 'Near Threshold';
                statusBadge = `<span class="badge badge-stock-near">Near Threshold</span>`;
                nearCount++;
            } else {
                status = 'Low Stock';
                statusBadge = `<span class="badge badge-stock-low">Low Stock</span>`;
                lowCount++;
                showSendReq = true;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.resourceType}</td>
                <td>${item.currentQuantity}</td>
                <td>${item.thresholdLevel}</td>
                <td>${statusBadge}</td>
                <td style="text-align:right">
                    <button class="btn-ghost btn-ghost-primary" onclick="staffApp.openStockModal('${item.id}')">
                        <span class="material-symbols-outlined">edit</span> Edit Threshold
                    </button>
                    ${showSendReq ? `
                    <button class="btn-ghost btn-ghost-danger" onclick="staffApp.sendStockRequest('${item.resourceType}')">
                        <span class="material-symbols-outlined">send</span> Send Request
                    </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        const safeEl = document.getElementById('stock-safe-count');
        const nearEl = document.getElementById('stock-near-count');
        const lowEl = document.getElementById('stock-low-count');

        if (safeEl) safeEl.textContent = safeCount;
        if (nearEl) nearEl.textContent = nearCount;
        if (lowEl) lowEl.textContent = lowCount;
    },

    openStockModal: function (id) {
        let item = this.stockData.find(i => i.id === id);
        if (!item) {
            const userDept = this.getStaffDepartment();
            const currentQuantity = Store.getData().resources.filter(r => {
                return r.department === userDept && r.status === 'Available' && (r.type === id || r.name === id);
            }).length;
            item = { id: id, resourceType: id, currentQuantity: currentQuantity, thresholdLevel: 1 };
            this.stockData.push(item);
        }
        this.editStockId = id;
        document.getElementById('stock-modal-resource').textContent = `Resource: ${item.resourceType}`;
        document.getElementById('stock-current-qty').value = item.currentQuantity;
        document.getElementById('stock-threshold-input').value = item.thresholdLevel;
        document.getElementById('stock-edit-modal').classList.add('active');
    },

    closeStockModal: function () {
        this.editStockId = null;
        document.getElementById('stock-edit-modal').classList.remove('active');
        document.getElementById('stock-threshold-input').value = '';
    },

    saveStockThreshold: async function () {
        if (!this.editStockId) return;
        const val = parseInt(document.getElementById('stock-threshold-input').value);
        if (isNaN(val) || val < 0) {
            Store.showToast("Threshold must be a non-negative integer.", "error");
            return;
        }

        const itemIndex = this.stockData.findIndex(i => i.id === this.editStockId);
        if (itemIndex > -1) {
            await Store.updateStockThreshold(this.editStockId, val);
            this.stockData[itemIndex].thresholdLevel = val;
            Store.showToast("Threshold updated successfully.", "success");
            this.renderStockMonitoring();
            this.closeStockModal();
        }
    },

    sendStockRequest: function (resourceType) {
        this.switchView('proc-tasks-view');

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector('.nav-item[data-target="proc-tasks-view"]');
        if (navItem) navItem.classList.add('active');

        // Give context to the user
        Store.showToast(`Navigated to Procurement Tasks for ${resourceType}.`, "warning");
    },

    logout: function () {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await staffApp.init();
});
