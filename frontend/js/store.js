const apiBase = 'http://localhost:3000/api';

class DataStore {
    constructor() {
        this.fallbackData = {
            users: [],
            departments: [],
            requests: [],
            resources: [],
            procurements: [],
            notifications: [],
            maintenanceHistory: [],
            returnHistory: [],
            stockThresholds: [],
            resourceCatalog: [],
            currentUser: null
        };
        // In-memory only (never persisted to localStorage) cache of file blobs keyed by
        // procurement id. localStorage has a tight per-origin quota (Safari especially, ~5MB)
        // which multi-MB base64 file data-URLs blow through easily; keeping them here instead
        // means every page always sees fresh, complete file data regardless of quota pressure.
        this._procurementFileCache = new Map();
        this.init();
    }

    init() {
        if (!localStorage.getItem('rx_data')) {
            this.saveData(this.fallbackData);
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem('rx_data')) || { ...this.fallbackData };
    }

    saveData(data) {
        this._cacheProcurementFiles(data.procurements);
        try {
            localStorage.setItem('rx_data', JSON.stringify(this._stripFileBlobs(data)));
        } catch (err) {
            console.error('Unable to persist app data to localStorage:', err);
        }
    }

    // Merges into the cache rather than overwriting — callers sometimes pass procurement
    // records sourced from the (blob-stripped) localStorage snapshot, and those must never
    // clobber a real file already captured from a fresh API response.
    _cacheProcurementFiles(procurements) {
        (procurements || []).forEach(p => {
            if (!p || !p.id) return;
            if (p.specFileDataUrl) {
                this._procurementFileCache.set(p.id, {
                    ...this._procurementFileCache.get(p.id),
                    specFileName: p.specFileName,
                    specFileType: p.specFileType,
                    specFileDataUrl: p.specFileDataUrl,
                });
            }
            if (p.invoiceFileDataUrl) {
                this._procurementFileCache.set(p.id, {
                    ...this._procurementFileCache.get(p.id),
                    invoiceFileName: p.invoiceFileName,
                    invoiceFileType: p.invoiceFileType,
                    invoiceFileDataUrl: p.invoiceFileDataUrl,
                });
            }
        });
    }

    _stripFileBlobs(data) {
        const strip = (arr, fields) => Array.isArray(arr)
            ? arr.map(item => {
                const copy = { ...item };
                fields.forEach(f => { if (copy[f]) copy[f] = null; });
                return copy;
            })
            : arr;
        return {
            ...data,
            procurements: strip(data.procurements, ['specFileDataUrl', 'invoiceFileDataUrl']),
        };
    }

    // Looks up a procurement's spec/invoice file, preferring the fresh in-memory cache
    // (populated from API responses) over the localStorage snapshot, which never holds
    // the actual file bytes. kind is 'spec' or 'invoice'.
    getProcurementFile(procId, kind) {
        const cached = this._procurementFileCache.get(procId);
        const source = cached || (this.getData().procurements || []).find(p => p.id === procId) || {};
        const nameKey = kind === 'spec' ? 'specFileName' : 'invoiceFileName';
        const typeKey = kind === 'spec' ? 'specFileType' : 'invoiceFileType';
        const urlKey = kind === 'spec' ? 'specFileDataUrl' : 'invoiceFileDataUrl';
        if (!source[urlKey]) return null;
        return { name: source[nameKey], type: source[typeKey], dataUrl: source[urlKey] };
    }

    previewProcurementFile(procId, kind) {
        const file = this.getProcurementFile(procId, kind);
        if (!file) return;
        this.openFilePreview(file.dataUrl, file.name, file.type);
    }

    getCurrentUser() {
        return this.getData().currentUser;
    }

    setCurrentUser(user) {
        const data = this.getData();
        data.currentUser = user || null;
        this.saveData(data);
    }

    getHeaders(extra = {}) {
        const user = this.getCurrentUser();
        const headers = {};
        if (user && user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
        return { ...headers, ...extra };
    }

    buildQuery(params = {}) {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'All') {
                search.append(key, value);
            }
        });
        const query = search.toString();
        return query ? `?${query}` : '';
    }

    async api(path, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: this.getHeaders(options.headers || {}),
        };

        if (options.body !== undefined) {
            if (options.body instanceof FormData) {
                config.body = options.body;
            } else {
                config.headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(options.body);
            }
        }

        const res = await fetch(`${apiBase}${path}`, config);
        if (!res.ok) {
            let message = `Request failed (${res.status})`;
            try {
                const error = await res.json();
                message = error.message || error.error || message;
            } catch (e) { }
            throw new Error(message);
        }

        if (res.status === 204) return null;
        const contentType = res.headers.get('content-type') || '';
        return contentType.includes('application/json') ? res.json() : null;
    }

    async sync() {
        const collections = {
            users: '/users',
            departments: '/departments',
            requests: '/requests',
            resources: '/resources',
            procurements: '/procurements',
            notifications: '/notifications',
            maintenanceHistory: '/maintenance/history',
            returnHistory: '/returns/history',
            stockThresholds: '/analytics/stock',
            resourceCatalog: '/resources/catalog'
        };
        const currentUser = this.getCurrentUser();
        const next = { ...this.getData() };

        for (const [col, path] of Object.entries(collections)) {
            try {
                next[col] = await this.api(path);
            } catch (error) {
                console.error(`Failed to sync ${col}:`, error);
            }
        }

        next.currentUser = currentUser;
        this.saveData(next);
        return next;
    }

    async login(email, password) {
        try {
            // First, make raw fetch without auth headers since it's a public endpoint
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                return null;
            }

            const data = await res.json();
            if (data && data.access_token) {
                const userObj = {
                    ...data.user,
                    token: data.access_token
                };
                this.setCurrentUser(userObj);
                await this.sync();
                return userObj;
            }
            return null;
        } catch (err) {
            console.error('Login Error:', err);
            return null;
        }
    }

    logout() {
        this.setCurrentUser(null);
    }

    async fetchMyOrganization() {
        return this.api('/organizations/my-org/details');
    }

    async fetchSubscriptionPlans() {
        return this.api('/subscriptions/plans');
    }

    async updateSubscription(planId) {
        return this.api('/organizations/my-org/subscription', {
            method: 'PATCH',
            body: { planId }
        });
    }

    async fetchUsers() {
        return this.api('/users');
    }

    async createUser(payload) {
        const result = await this.api('/users', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateUser(id, payload) {
        const result = await this.api(`/users/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async deactivateUser(id) {
        const result = await this.api(`/users/${id}`, { method: 'DELETE' });
        await this.sync();
        return result;
    }

    async fetchDepartments() {
        return this.api('/departments');
    }

    async createDepartment(payload) {
        const result = await this.api('/departments', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateDepartment(id, payload) {
        const result = await this.api(`/departments/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async deleteDepartment(id) {
        const result = await this.api(`/departments/${id}`, { method: 'DELETE' });
        await this.sync();
        return result;
    }

    async fetchRequests(params = {}) {
        return this.api(`/requests${this.buildQuery(params)}`);
    }

    async createRequest(payload) {
        const result = await this.api('/requests', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async fetchResources(params = {}) {
        return this.api(`/resources${this.buildQuery(params)}`);
    }

    async fetchResourceAvailability(department, type) {
        return this.api(`/resources/availability${this.buildQuery({ department, type })}`);
    }

    async fetchResourceCatalog(params = {}) {
        try {
            return await this.api(`/resources/catalog${this.buildQuery(params)}`);
        } catch (error) {
            console.warn('Failed to fetch resource catalog:', error);
            return [];
        }
    }

    async updateResourceCatalog(department, resourceTypes) {
        const result = await this.api('/resources/catalog', {
            method: 'POST',
            body: { department, resourceTypes }
        });
        await this.sync();
        return result;
    }

    getDepartmentResourceTypes(department) {
        const catalog = this.getData().resourceCatalog || [];
        const entry = catalog.find(item => item.department === department);
        return entry ? [...entry.resourceTypes] : [];
    }

    async renameResourceCatalogType(department, oldType, newType) {
        const currentTypes = this.getDepartmentResourceTypes(department);
        const updatedTypes = currentTypes.map(t => t === oldType ? newType : t);
        return this.updateResourceCatalog(department, updatedTypes);
    }

    async removeResourceCatalogType(department, type) {
        const currentTypes = this.getDepartmentResourceTypes(department);
        const updatedTypes = currentTypes.filter(t => t !== type);
        return this.updateResourceCatalog(department, updatedTypes);
    }

    async createResource(payload) {
        const result = await this.api('/resources', { method: 'POST', body: payload });
        await this.sync();
        return result;
    }

    async updateResource(id, payload) {
        const result = await this.api(`/resources/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async scrapResource(id) {
        const result = await this.api(`/resources/${id}/scrap`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async fetchProcurements(params = {}) {
        const result = await this.api(`/procurements${this.buildQuery(params)}`);
        this._cacheProcurementFiles(result);
        return result;
    }

    async createProcurement(payload) {
        let body = payload;
        if (payload && payload.rawFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (key !== 'rawFile' && key !== 'specFileDataUrl') {
                    formData.append(key, value);
                }
            });
            formData.append('specFile', payload.rawFile);
            body = formData;
        }
        const result = await this.api('/procurements', { method: 'POST', body });
        await this.sync();
        return result;
    }

    async fetchNotifications() {
        return this.api('/notifications');
    }

    async updateNotification(id, payload) {
        const result = await this.api(`/notifications/${id}`, { method: 'PATCH', body: payload });
        await this.sync();
        return result;
    }

    async fetchRequestorSummary() {
        return this.api('/analytics/requestor-summary');
    }

    async fetchDepartmentSummary() {
        return this.api('/analytics/department-summary');
    }

    async fetchRegistrarSummary() {
        return this.api('/analytics/registrar-summary');
    }

    async fetchStock() {
        return this.api('/analytics/stock');
    }

    async fetchMaintenanceHistory() {
        return this.api('/maintenance/history');
    }

    async fetchReturnHistory() {
        return this.api('/returns/history');
    }

    addItem(collection, item) {
        const data = this.getData();
        if (!Array.isArray(data[collection])) data[collection] = [];
        data[collection].unshift(item);
        this.saveData(data);

        this.api(`/${collection}`, { method: 'POST', body: item })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));

        return item;
    }

    updateItem(collection, id, updates) {
        const data = this.getData();
        const items = Array.isArray(data[collection]) ? data[collection] : [];
        const index = items.findIndex(i => (i.id || i.code) === id);
        if (index > -1) {
            items[index] = { ...items[index], ...updates };
            this.saveData(data);
        }

        this.api(`/${collection}/${id}`, { method: 'PATCH', body: updates })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));

        return index > -1 ? items[index] : null;
    }

    deleteItem(collection, id) {
        const data = this.getData();
        data[collection] = (data[collection] || []).filter(i => (i.id || i.code) !== id);
        this.saveData(data);

        this.api(`/${collection}/${id}`, { method: 'DELETE' })
            .then(() => this.sync())
            .catch(err => console.error('API Error:', err));
    }

    async approveRequest(id) {
        const result = await this.api(`/requests/${id}/approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectRequest(id) {
        const result = await this.api(`/requests/${id}/reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async allocateRequest(id, resourceIds) {
        const result = await this.api(`/requests/${id}/allocate`, {
            method: 'POST',
            body: { resourceIds }
        });
        await this.sync();
        return result;
    }

    async confirmReceipt(id) {
        const result = await this.api(`/requests/${id}/receipt`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async requestMaintenance(id) {
        const result = await this.api(`/resources/${id}/maintenance-request`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async initiateReturn(id) {
        const result = await this.api(`/resources/${id}/initiate-return`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async confirmRepairedAllocation(id) {
        const result = await this.api(`/resources/${id}/confirm-repaired`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async approveDeptProcurement(id) {
        const result = await this.api(`/procurements/${id}/department-approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectDeptProcurement(id) {
        const result = await this.api(`/procurements/${id}/department-reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async approveRegistrarProcurement(id) {
        const result = await this.api(`/procurements/${id}/registrar-approve`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async rejectRegistrarProcurement(id) {
        const result = await this.api(`/procurements/${id}/registrar-reject`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async logPurchase(id, vendor, invoice, invoiceFile) {
        let body;
        if (invoiceFile && invoiceFile.rawFile) {
            const formData = new FormData();
            formData.append('vendor', vendor);
            formData.append('invoice', invoice);
            formData.append('invoiceFile', invoiceFile.rawFile);
            body = formData;
        } else {
            body = { vendor, invoice };
            if (invoiceFile) {
                body.invoiceFileName = invoiceFile.name;
                body.invoiceFileType = invoiceFile.type;
                body.invoiceFileDataUrl = invoiceFile.dataUrl;
            }
        }
        const result = await this.api(`/procurements/${id}/log-purchase`, {
            method: 'POST',
            body
        });
        await this.sync();
        return result;
    }

    async registerProcurement(id, resources) {
        const result = await this.api(`/procurements/${id}/register`, {
            method: 'POST',
            body: { resources }
        });
        await this.sync();
        return result;
    }

    async acceptMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/accept`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async repairMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/repair`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async scrapMaintenance(id) {
        const result = await this.api(`/maintenance/${id}/scrap`, { method: 'POST' });
        await this.sync();
        return result;
    }

    async processReturn(id, condition) {
        const result = await this.api(`/returns/${id}/process`, {
            method: 'POST',
            body: { condition }
        });
        await this.sync();
        return result;
    }

    async updateStockThreshold(id, level) {
        const result = await this.api(`/analytics/stock-thresholds/${id}/${level}`, {
            method: 'PATCH'
        });
        await this.sync();
        return result;
    }

    async getProfile() {
        return this.api('/profile/me');
    }

    async updateProfile(payload) {
        const result = await this.api('/profile/me', { method: 'PATCH', body: payload });
        const current = this.getCurrentUser();
        this.setCurrentUser({ ...current, ...result });
        await this.sync();
        return result;
    }

    async updatePassword(payload) {
        return this.api('/profile/me/password', { method: 'POST', body: payload });
    }

    showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 3000);
    }

    openFilePreview(dataUrl, fileName, fileType) {
        if (!dataUrl) return;
        const modal = this._getFilePreviewModal();
        const title = modal.querySelector('.rx-fp-title');
        const body = modal.querySelector('.rx-fp-body');
        const downloadBtn = modal.querySelector('.rx-fp-download');

        title.textContent = fileName || 'Attached File';
        downloadBtn.href = dataUrl;
        downloadBtn.download = fileName || 'download';

        const type = (fileType || '').toLowerCase();
        body.innerHTML = '';
        if (type.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'rx-fp-image';
            img.src = dataUrl;
            img.alt = fileName || 'Preview';
            body.appendChild(img);
        } else if (type === 'application/pdf') {
            const iframe = document.createElement('iframe');
            iframe.className = 'rx-fp-iframe';
            iframe.src = dataUrl;
            iframe.title = fileName || 'Preview';
            body.appendChild(iframe);
        } else {
            body.innerHTML = `
                <div class="rx-fp-unsupported">
                    <span class="material-symbols-outlined">description</span>
                    <p>Preview isn't available for this file type.</p>
                    <p class="rx-fp-hint">Use the Download button below to save and open it.</p>
                </div>`;
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    closeFilePreview() {
        const modal = document.getElementById('rx-file-preview-modal');
        if (modal) modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    _getFilePreviewModal() {
        let modal = document.getElementById('rx-file-preview-modal');
        if (modal) return modal;

        this._injectFilePreviewStyles();

        modal = document.createElement('div');
        modal.id = 'rx-file-preview-modal';
        modal.className = 'rx-fp-overlay';
        modal.innerHTML = `
            <div class="rx-fp-dialog">
                <div class="rx-fp-header">
                    <span class="rx-fp-title"></span>
                    <div class="rx-fp-actions">
                        <a class="rx-fp-download" download title="Download file">
                            <span class="material-symbols-outlined">download</span> Download
                        </a>
                        <button type="button" class="rx-fp-close" title="Close" onclick="Store.closeFilePreview()">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                <div class="rx-fp-body"></div>
            </div>`;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeFilePreview();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeFilePreview();
        });
        document.body.appendChild(modal);
        return modal;
    }

    _injectFilePreviewStyles() {
        if (document.getElementById('rx-fp-styles')) return;
        const style = document.createElement('style');
        style.id = 'rx-fp-styles';
        style.textContent = `
            .rx-fp-overlay { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 10000; align-items: center; justify-content: center; padding: 1.5rem; }
            .rx-fp-overlay.open { display: flex; }
            .rx-fp-dialog { background: #fff; border-radius: 12px; width: min(900px, 100%); height: min(85vh, 900px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            .rx-fp-header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-bottom: 1px solid #e2e8f0; }
            .rx-fp-title { font-weight: 600; font-size: 0.95rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .rx-fp-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
            .rx-fp-download { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: #fff; background: #2563eb; border-radius: 6px; padding: 0.4rem 0.75rem; text-decoration: none; }
            .rx-fp-download:hover { background: #1d4ed8; }
            .rx-fp-download .material-symbols-outlined { font-size: 1.1rem; }
            .rx-fp-close { background: none; border: none; cursor: pointer; color: #64748b; display: flex; align-items: center; padding: 0.3rem; border-radius: 6px; }
            .rx-fp-close:hover { background: #f1f5f9; color: #0f172a; }
            .rx-fp-body { flex: 1; overflow: auto; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
            .rx-fp-iframe { width: 100%; height: 100%; border: none; }
            .rx-fp-image { max-width: 100%; max-height: 100%; object-fit: contain; }
            .rx-fp-unsupported { text-align: center; color: #64748b; padding: 2rem; }
            .rx-fp-unsupported .material-symbols-outlined { font-size: 3rem; color: #94a3b8; }
            .rx-fp-unsupported .rx-fp-hint { font-size: 0.82rem; color: #94a3b8; }
        `;
        document.head.appendChild(style);
    }

    filterTable(inputEl, tbodyId) {
        const term = inputEl.value.toLowerCase();
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    }

    globalSearch(term) {
        const activeView = document.querySelector('.view-section.active');
        if (!activeView) return;
        const normalizedTerm = term.toLowerCase();
        activeView.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(normalizedTerm) ? '' : 'none';
        });
    }
}

const Store = new DataStore();
