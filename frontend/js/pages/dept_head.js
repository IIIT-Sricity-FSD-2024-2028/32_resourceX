const deptApp = {
    _dhProcSpecFile: null, // { name, size, type, dataUrl }

    stockData: [
        { id: "s1", resourceType: "Laptop", currentQuantity: 18, thresholdLevel: 15 },
        { id: "s2", resourceType: "Projector", currentQuantity: 8, thresholdLevel: 10 },
        { id: "s3", resourceType: "Tablet", currentQuantity: 3, thresholdLevel: 8 },
        { id: "s4", resourceType: "Monitor", currentQuantity: 2, thresholdLevel: 5 },
        { id: "s5", resourceType: "Router", currentQuantity: 12, thresholdLevel: 10 },
        { id: "s6", resourceType: "Printer", currentQuantity: 6, thresholdLevel: 6 }
    ],
    editStockId: null,
    chartInstances: {},

    init: async function() {
        const user = Store.getCurrentUser();
        if(!user || user.role !== 'Dept Head') {
            window.location.href = 'login.html';
            return;
        }
        await Store.sync();
        
        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = user.department + ' Head';
        
        this.bindNav();
        this.renderIncomingRequests();
        this.renderDeptResources();
        this.renderProcurements();
        this.renderDashboard();
        this.populateProcurementTypeDropdown();
        this.stockData = (Store.getData().stockThresholds || []).filter(item => item.department === user.department).map(item => ({
            id: item.id,
            resourceType: item.resourceType,
            currentQuantity: 0,
            thresholdLevel: item.thresholdLevel
        }));
        this.renderStockMonitoring();
        
        // Wait briefly for Chart.js to initialize if it's loading over CDN asynchronously
        setTimeout(() => {
            this.renderAnalytics();
        }, 300);
        this.initFileUpload();
    },

    initFileUpload: function() {
        const zone = document.getElementById('dh-proc-file-zone');
        if (!zone) return;
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
            this._dhProcSpecFile = { name: file.name, size: file.size, type: file.type, dataUrl: e.target.result, rawFile: file };
            // Clear any warning border
            const zone = document.getElementById('dh-proc-file-zone');
            if (zone) zone.style.borderColor = '';
            this._showProcFilePreview();
        };
        reader.readAsDataURL(file);
    },

    _showProcFilePreview: function() {
        const zone = document.getElementById('dh-proc-file-zone');
        const preview = document.getElementById('dh-proc-file-preview');
        const nameEl = document.getElementById('dh-proc-file-name');
        const sizeEl = document.getElementById('dh-proc-file-size');
        if (!this._dhProcSpecFile || !zone || !preview) return;
        zone.style.display = 'none';
        preview.style.display = 'block';
        if (nameEl) nameEl.textContent = this._dhProcSpecFile.name;
        if (sizeEl) {
            const kb = (this._dhProcSpecFile.size / 1024).toFixed(1);
            sizeEl.textContent = kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(2)} MB`;
        }
    },

    removeProcFile: function() {
        this._dhProcSpecFile = null;
        const zone = document.getElementById('dh-proc-file-zone');
        const preview = document.getElementById('dh-proc-file-preview');
        if (zone) zone.style.display = '';
        if (preview) preview.style.display = 'none';
    },

    previewSpecFile: function(procId) {
        Store.previewProcurementFile(procId, 'spec');
    },

    previewInvoiceFile: function(procId) {
        Store.previewProcurementFile(procId, 'invoice');
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

    populateProcurementTypeDropdown: function() {
        const select = document.getElementById('proc-type');
        const user = Store.getCurrentUser();
        if (!select || !user) return;

        const types = Store.getDepartmentResourceTypes(user.department);
        if (types.length === 0) {
            select.innerHTML = '<option value="" disabled selected>No Catalog Configured for Department</option>';
        } else {
            select.innerHTML = '<option value="" disabled selected>Select Resource Type</option>';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });
        }
    },

    // 1. Incoming Requests
    renderIncomingRequests: function() {
        const tbody = document.getElementById('incoming-requests-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        // Load pending requests for this department
        const requests = Store.getData().requests.filter(r => r.department === user.department && r.status === 'Pending');

        requests.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${req.id}</td>
                <td>${req.requestor}</td>
                <td>${req.resourceType}</td>
                <td>${String(req.quantity).padStart(2, '0')}</td>
                <td style="font-size:0.75rem; color:#64748b">${req.justification}</td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a" onclick="deptApp.approveRequest('${req.id}')">Approve</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="deptApp.rejectRequest('${req.id}')">Reject</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Load pending procurements for this department
        const procTbody = document.getElementById('incoming-procurements-tbody');
        if(!procTbody) return;
        procTbody.innerHTML = '';

        const procs = Store.getData().procurements.filter(p => p.department === user.department && p.status === 'Pending Approval');
        procs.forEach(p => {
            const specCell = p.specFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="deptApp.previewSpecFile('${p.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${p.specFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.requester || p.requestedBy || 'Unknown'}</td>
                <td>${p.item || p.resourceType}</td>
                <td>${String(p.quantity).padStart(2, '0')}</td>
                <td style="font-size:0.75rem; color:#64748b">${p.justification}</td>
                <td>${specCell}</td>
                <td style="text-align:right">
                    <button class="btn-primary" style="font-size:0.75rem; background:#16a34a" onclick="deptApp.approveProcurement('${p.id}')">Approve</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="deptApp.rejectProcurement('${p.id}')">Reject</button>
                </td>
            `;
            procTbody.appendChild(tr);
        });
    },

    approveRequest: async function(reqId) {
        await Store.approveRequest(reqId);
        alert('Request approved. It has been passed to Staff for allocation.');
        this.renderIncomingRequests();
    },

    rejectRequest: async function(reqId) {
        if(confirm("Are you sure you want to reject this request?")) {
            await Store.rejectRequest(reqId);
            this.renderIncomingRequests();
        }
    },

    approveProcurement: async function(procId) {
        await Store.approveDeptProcurement(procId);
        Store.showToast("Procurement approved! Sent to Registrar.", "success");
        this.renderIncomingRequests();
        this.renderProcurements();
    },

    rejectProcurement: async function(procId) {
        if(confirm("Are you sure you want to reject this procurement request?")) {
            await Store.rejectDeptProcurement(procId);
            Store.showToast("Procurement request rejected.", "error");
            this.renderIncomingRequests();
            this.renderProcurements();
        }
    },

    // 2. Dept Resources
    renderDeptResources: function() {
        const tbody = document.getElementById('dept-resources-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const user = Store.getCurrentUser();
        const resources = Store.getData().resources.filter(r => r.department === user.department);
        
        resources.forEach(res => {
            let statusBadge = `<span class="badge ${res.status.toLowerCase()}">${res.status}</span>`;
            if (res.status === 'Allocated') statusBadge = `<span class="badge allocated">${res.status}</span>`;
            else if (res.status === 'Maintenance Requested' || res.status === 'Maintenance') statusBadge = `<span class="badge maintenance">${res.status}</span>`;
            
            const condition = res.condition || 'Good';
            const assigned = res.assignedTo || '--';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id" style="font-weight:600">${res.id}</td>
                <td>${res.type}</td>
                <td>${assigned}</td>
                <td>${condition}</td>
                <td style="text-align:right">${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Dashboard / Analytics
    renderDashboard: function() {
        const user = Store.getCurrentUser();
        const data = Store.getData();
        const resources = data.resources.filter(r => r.department === user.department);
        const incoming = data.requests.filter(r => r.department === user.department && r.status === 'Pending');
        const procurements = data.procurements.filter(p => p.department === user.department);

        // Update titles
        const deptTitle = document.getElementById('dash-dept-name');
        if(deptTitle) deptTitle.textContent = user.department;

        // Stats
        let available = 0, allocated = 0, maintenance = 0, scrap = 0;
        let countsByType = {};

        resources.forEach(r => {
            if(!countsByType[r.type]) countsByType[r.type] = { total: 0, available: 0 };
            countsByType[r.type].total++;

            if(r.status === 'Allocated') {
                allocated++;
            } else if(r.status === 'Available') {
                available++;
                countsByType[r.type].available++;
            } else if (r.status === 'Scrapped') {
                scrap++;
            } else {
                maintenance++;
            }
        });

        // Set stat cards
        const elTotal = document.getElementById('dash-total-res');
        const elAvail = document.getElementById('dash-avail');
        const elAlloc = document.getElementById('dash-alloc');
        const elMaint = document.getElementById('dash-maint');
        const elScrap = document.getElementById('dash-scrap');

        if(elTotal) elTotal.textContent = resources.length;
        if(elAvail) elAvail.textContent = available;
        if(elAlloc) elAlloc.textContent = allocated;
        if(elMaint) elMaint.textContent = maintenance;
        if(elScrap) elScrap.textContent = scrap;

        // Low stock logic
        let hasLowStock = false;
        Object.keys(countsByType).forEach(type => {
            const c = countsByType[type];
            const threshold = Math.max(2, Math.floor(c.total * 0.2));
            if(c.available <= threshold) hasLowStock = true;
        });

        const alertBanner = document.getElementById('low-stock-alert');
        if(alertBanner) {
            alertBanner.style.display = hasLowStock ? 'flex' : 'none';
        }

        // Incoming Table
        const incTbody = document.getElementById('dash-inc-req-tbody');
        if(incTbody) {
            incTbody.innerHTML = '';
            incoming.slice(0,5).forEach(req => {
                let statusBadge = `<span class="badge ${req.status.toLowerCase()}">${req.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${req.id}</td>
                    <td>${req.resourceType}</td>
                    <td>${req.requestor}</td>
                    <td>${statusBadge}</td>
                `;
                incTbody.appendChild(tr);
            });
        }

        // Procurements Table
        const procTbody = document.getElementById('dash-proc-tbody');
        if(procTbody) {
            procTbody.innerHTML = '';
            procurements.slice(0,5).forEach(p => {
                let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
                if(p.status === 'Approved') statusBadge = `<span class="badge allocated">${p.status}</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-id">${p.id}</td>
                    <td>${p.resourceType}</td>
                    <td>${p.quantity}</td>
                    <td>${statusBadge}</td>
                `;
                procTbody.appendChild(tr);
            });
        }
    },

    // 4. Procurement
    renderProcurements: function() {
        const tbody = document.getElementById('procurement-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        const user = Store.getCurrentUser();
        const procs = Store.getData().procurements.filter(p => p.department === user.department);

        procs.forEach(p => {
            let statusBadge = `<span class="badge ${p.status.toLowerCase()}">${p.status}</span>`;
            if (p.status === 'Approved') statusBadge = `<span class="badge" style="background:#dcfce7; color:#166534">Approved</span>`;

            const specCell = p.specFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="deptApp.previewSpecFile('${p.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${p.specFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const invoiceCell = p.invoiceFileName
                ? `<a href="javascript:void(0)" class="spec-file-link" onclick="deptApp.previewInvoiceFile('${p.id}')"><span class="material-symbols-outlined" style="font-size:1rem">visibility</span>${p.invoiceFileName}</a>`
                : `<span style="color:#cbd5e1; font-size:0.78rem">—</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="td-id">${p.id}</td>
                <td>${p.resourceType}</td>
                <td>${p.quantity}</td>
                <td>${statusBadge}</td>
                <td>${specCell}</td>
                <td>${invoiceCell}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    submitProcurement: async function(e) {
        e.preventDefault();
        const type = document.getElementById('proc-type').value;
        const qty = parseInt(document.getElementById('proc-qty').value);
        const reason = document.getElementById('proc-reason').value;
        const user = Store.getCurrentUser();

        if (!type.trim() || isNaN(qty) || qty < 1 || !reason.trim()) {
            Store.showToast("Please fill in all fields correctly before submitting.", "error");
            return;
        }

        // Spec file is required
        if (!this._dhProcSpecFile) {
            Store.showToast("⚠️ Please attach a Resource Specification / Intent File before submitting.", "warning");
            document.getElementById('dh-proc-file-zone').style.borderColor = '#f59e0b';
            return;
        }

        const procPayload = {
            id: `PROC-${Math.floor(100 + Math.random() * 900)}`,
            item: type,
            resourceType: type,
            quantity: qty,
            department: user.department,
            requester: user.name,
            requestedBy: user.name,
            requestedById: user.id,
            requesterRole: user.role,
            status: "Pending",
            date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year:'numeric'}),
            justification: reason,
            specFileName: this._dhProcSpecFile.name,
            specFileType: this._dhProcSpecFile.type,
            specFileDataUrl: this._dhProcSpecFile.dataUrl,
            rawFile: this._dhProcSpecFile.rawFile
        };

        try {
            await Store.createProcurement(procPayload);

            Store.showToast("Procurement Request submitted and sent to Registrar for approval.", "success");
            document.getElementById('procurementForm').reset();
            this.removeProcFile();
            this.renderProcurements();
        } catch (err) {
            console.error('Procurement submit error:', err);
            Store.showToast("❌ Failed to submit: " + (err.message || "Unknown error. Please try again."), "error");
        }
    },


    // Stock Monitoring
    renderStockMonitoring: function() {
        const tbody = document.getElementById('stock-monitoring-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let safeCount = 0;
        let nearCount = 0;
        let lowCount = 0;

        const backendThresholds = (Store.getData().stockThresholds || []).filter(item => item.department === Store.getCurrentUser().department);
        this.stockData = backendThresholds.map(item => {
            const qty = Store.getData().resources.filter(r => r.department === item.department && r.status === 'Available' && (r.type === item.resourceType || r.name === item.resourceType)).length;
            return { id: item.id, resourceType: item.resourceType, currentQuantity: qty, thresholdLevel: item.thresholdLevel };
        });
        this.stockData.forEach(item => {
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
                    <button class="btn-ghost btn-ghost-primary" onclick="deptApp.openStockModal('${item.id}')">
                        <span class="material-symbols-outlined">edit</span> Edit Threshold
                    </button>
                    ${showSendReq ? `
                    <button class="btn-ghost btn-ghost-danger" onclick="deptApp.sendStockRequest('${item.resourceType}')">
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

        if(safeEl) safeEl.textContent = safeCount;
        if(nearEl) nearEl.textContent = nearCount;
        if(lowEl) lowEl.textContent = lowCount;
    },

    openStockModal: function(id) {
        const item = this.stockData.find(i => i.id === id);
        if(!item) return;
        this.editStockId = id;
        document.getElementById('stock-modal-resource').textContent = `Resource: ${item.resourceType}`;
        document.getElementById('stock-current-qty').value = item.currentQuantity;
        document.getElementById('stock-threshold-input').value = item.thresholdLevel;
        document.getElementById('stock-edit-modal').classList.add('active');
    },

    closeStockModal: function() {
        this.editStockId = null;
        document.getElementById('stock-edit-modal').classList.remove('active');
        document.getElementById('stock-threshold-input').value = '';
    },

    saveStockThreshold: async function() {
        if (!this.editStockId) return;
        const val = parseInt(document.getElementById('stock-threshold-input').value);
        if (isNaN(val) || val < 0) {
            Store.showToast("Threshold must be a non-negative integer.", "error");
            return;
        }

        const itemIndex = this.stockData.findIndex(i => i.id === this.editStockId);
        if(itemIndex > -1) {
            await Store.updateStockThreshold(this.editStockId, val);
            this.stockData[itemIndex].thresholdLevel = val;
            Store.showToast("Threshold updated successfully.", "success");
            this.renderStockMonitoring();
            this.closeStockModal();
        }
    },

    sendStockRequest: function(resourceType) {
        this.switchView('procurement-view');
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector('.nav-item[data-target="procurement-view"]');
        if(navItem) navItem.classList.add('active');
        
        const procTypeInput = document.getElementById('proc-type');
        if (procTypeInput) {
            procTypeInput.value = resourceType;
            procTypeInput.focus();
        }
    },

    renderAnalytics: function() {
        if (typeof Chart === 'undefined') return;
        
        const user = Store.getCurrentUser();
        const data = Store.getData();
        const deptResources = data.resources.filter(r => r.department === user.department);
        
        // 1. Resource Distribution
        let available = 0, allocated = 0, maintenance = 0, scrap = 0;
        deptResources.forEach(r => {
            if (r.status === 'Available') available++;
            else if (r.status === 'Allocated') allocated++;
            else if (r.status === 'Scrapped') scrap++;
            else maintenance++;
        });

        const ctxDist = document.getElementById('chart-distribution');
        if (ctxDist) {
            if (this.chartInstances.dist) this.chartInstances.dist.destroy();
            this.chartInstances.dist = new Chart(ctxDist, {
                type: 'doughnut',
                data: {
                    labels: ['Available', 'Allocated', 'Maintenance', 'Scrap'],
                    datasets: [{
                        data: [available, allocated, maintenance, scrap],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: { usePointStyle: true, padding: 20 }
                        } 
                    }
                }
            });
        }

        // 2. Monthly Request Trends (Mock Data Generation mirroring the image Jan-Jun)
        const ctxTrends = document.getElementById('chart-trends');
        if (ctxTrends) {
            if (this.chartInstances.trends) this.chartInstances.trends.destroy();
            this.chartInstances.trends = new Chart(ctxTrends, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Requests',
                        data: [45, 52, 48, 61, 55, 68],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#3b82f6',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        x: { grid: { display: false } },
                        y: { 
                            beginAtZero: true, 
                            max: 80,
                            grid: { color: '#f1f5f9', borderDash: [5, 5] },
                            border: { display: false }
                        } 
                    },
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 10 }
                        } 
                    }
                }
            });
        }

        // 3. Most Used Resources (Horizontal Bar logic)
        const ctxUsed = document.getElementById('chart-most-used');
        if (ctxUsed) {
            if (this.chartInstances.used) this.chartInstances.used.destroy();
            this.chartInstances.used = new Chart(ctxUsed, {
                type: 'bar',
                data: {
                    labels: ['Laptops', 'Projectors', 'Tablets', 'Monitors', 'Routers', 'Printers'],
                    datasets: [{
                        label: 'Usage %',
                        data: [85, 72, 65, 58, 45, 38],
                        backgroundColor: '#3b82f6',
                        borderRadius: 6,
                        maxBarThickness: 32
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        x: { 
                            beginAtZero: true, 
                            max: 100,
                            grid: { color: '#f1f5f9', borderDash: [5, 5] },
                            border: { display: false }
                        },
                        y: { grid: { display: false } }
                    },
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 10 }
                        } 
                    }
                }
            });
        }

        // 4. Update KPI Text
        // Calculate Utilization Rate = Allocated / Total Active Output
        let total = available + allocated + maintenance + scrap;
        let utilRate = total > 0 ? Math.round((allocated / total) * 100) : 0;
        
        const kpiAvg = document.getElementById('kpi-avg-req');
        const kpiUtil = document.getElementById('kpi-utilization');
        const kpiAppr = document.getElementById('kpi-approval-time');
        
        if (kpiAvg) kpiAvg.textContent = "54.7"; 
        if (kpiUtil) kpiUtil.textContent = utilRate + "%";
        if (kpiAppr) kpiAppr.textContent = "2.3 days";
    },
    
    logout: function() {
        Store.logout();
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await deptApp.init();
});
