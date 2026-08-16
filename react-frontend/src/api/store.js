const apiBase = 'http://localhost:3000/api';

class DataStore {
  constructor() {
    this.fallbackData = {
      users: [], departments: [], requests: [], resources: [],
      procurements: [], notifications: [], maintenanceHistory: [],
      returnHistory: [], permissionsMatrix: {}, stockThresholds: [],
      resourceCatalog: [], currentUser: null
    };
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
    localStorage.setItem('rx_data', JSON.stringify(data));
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
    if (user && user.role) headers['x-user-role'] = user.role;
    if (user && user.id) headers['x-user-id'] = user.id;
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
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${apiBase}${path}`, config);
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const error = await res.json();
        message = error.message || error.error || message;
      } catch (e) {}
      throw new Error(message);
    }
    if (res.status === 204) return null;
    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('application/json') ? res.json() : null;
  }

  async sync() {
    const collections = {
      users: '/users', departments: '/departments', requests: '/requests',
      resources: '/resources', procurements: '/procurements',
      notifications: '/notifications', maintenanceHistory: '/maintenance/history',
      returnHistory: '/returns/history', permissionsMatrix: '/permissionsMatrix',
      stockThresholds: '/analytics/stock', resourceCatalog: '/resources/catalog'
    };
    const currentUser = this.getCurrentUser();
    const next = { ...this.getData() };
    for (const [col, path] of Object.entries(collections)) {
      try { next[col] = await this.api(path); } catch (e) { console.error(`Failed to sync ${col}:`, e); }
    }
    next.currentUser = currentUser;
    this.saveData(next);
    return next;
  }

  async login(email, password) {
    const users = await this.api('/users', { headers: { 'x-user-role': 'System Admin' } });
    const user = (users || []).find(u => String(u.email).toLowerCase() === email.toLowerCase().trim());
    if (user && user.password === password) {
      this.setCurrentUser(user);
      await this.sync();
      return user;
    }
    return null;
  }

  logout() { this.setCurrentUser(null); }

  async fetchUsers() { return this.api('/users'); }
  async createUser(payload) { const r = await this.api('/users', { method: 'POST', body: payload }); await this.sync(); return r; }
  async updateUser(id, payload) { const r = await this.api(`/users/${id}`, { method: 'PATCH', body: payload }); await this.sync(); return r; }
  async deactivateUser(id) { const r = await this.api(`/users/${id}`, { method: 'DELETE' }); await this.sync(); return r; }

  async fetchDepartments() { return this.api('/departments'); }
  async createDepartment(payload) { const r = await this.api('/departments', { method: 'POST', body: payload }); await this.sync(); return r; }
  async updateDepartment(id, payload) { const r = await this.api(`/departments/${id}`, { method: 'PATCH', body: payload }); await this.sync(); return r; }
  async deleteDepartment(id) { const r = await this.api(`/departments/${id}`, { method: 'DELETE' }); await this.sync(); return r; }

  async fetchRequests(params = {}) { return this.api(`/requests${this.buildQuery(params)}`); }
  async createRequest(payload) { const r = await this.api('/requests', { method: 'POST', body: payload }); await this.sync(); return r; }

  async fetchResources(params = {}) { return this.api(`/resources${this.buildQuery(params)}`); }
  async fetchResourceAvailability(department, type) { return this.api(`/resources/availability${this.buildQuery({ department, type })}`); }
  async fetchResourceCatalog(params = {}) {
    try { return await this.api(`/resources/catalog${this.buildQuery(params)}`); }
    catch (e) { console.warn('Failed to fetch resource catalog:', e); return []; }
  }
  getDepartmentResourceTypes(department) {
    const catalog = this.getData().resourceCatalog || [];
    const entry = catalog.find(item => item.department === department);
    return entry ? [...entry.resourceTypes] : [];
  }
  async createResource(payload) { const r = await this.api('/resources', { method: 'POST', body: payload }); await this.sync(); return r; }
  async updateResource(id, payload) { const r = await this.api(`/resources/${id}`, { method: 'PATCH', body: payload }); await this.sync(); return r; }
  async scrapResource(id) { const r = await this.api(`/resources/${id}/scrap`, { method: 'POST' }); await this.sync(); return r; }

  async fetchProcurements(params = {}) { return this.api(`/procurements${this.buildQuery(params)}`); }
  async createProcurement(payload) { const r = await this.api('/procurements', { method: 'POST', body: payload }); await this.sync(); return r; }

  async fetchNotifications() { return this.api('/notifications'); }
  async fetchPermissionsMatrix() { return this.api('/permissionsMatrix'); }

  async fetchRequestorSummary() { return this.api('/analytics/requestor-summary'); }
  async fetchStock() { return this.api('/analytics/stock'); }
  async fetchMaintenanceHistory() { return this.api('/maintenance/history'); }
  async fetchReturnHistory() { return this.api('/returns/history'); }

  async approveRequest(id) { const r = await this.api(`/requests/${id}/approve`, { method: 'POST' }); await this.sync(); return r; }
  async rejectRequest(id) { const r = await this.api(`/requests/${id}/reject`, { method: 'POST' }); await this.sync(); return r; }
  async allocateRequest(id, resourceIds) { const r = await this.api(`/requests/${id}/allocate`, { method: 'POST', body: { resourceIds } }); await this.sync(); return r; }
  async confirmReceipt(id) { const r = await this.api(`/requests/${id}/receipt`, { method: 'POST' }); await this.sync(); return r; }
  async requestMaintenance(id) { const r = await this.api(`/resources/${id}/maintenance-request`, { method: 'POST' }); await this.sync(); return r; }
  async initiateReturn(id) { const r = await this.api(`/resources/${id}/initiate-return`, { method: 'POST' }); await this.sync(); return r; }
  async confirmRepairedAllocation(id) { const r = await this.api(`/resources/${id}/confirm-repaired`, { method: 'POST' }); await this.sync(); return r; }

  async approveDeptProcurement(id) { const r = await this.api(`/procurements/${id}/department-approve`, { method: 'POST' }); await this.sync(); return r; }
  async rejectDeptProcurement(id) { const r = await this.api(`/procurements/${id}/department-reject`, { method: 'POST' }); await this.sync(); return r; }
  async approveRegistrarProcurement(id) { const r = await this.api(`/procurements/${id}/registrar-approve`, { method: 'POST' }); await this.sync(); return r; }
  async rejectRegistrarProcurement(id) { const r = await this.api(`/procurements/${id}/registrar-reject`, { method: 'POST' }); await this.sync(); return r; }
  async logPurchase(id, vendor, invoice) { const r = await this.api(`/procurements/${id}/log-purchase`, { method: 'POST', body: { vendor, invoice } }); await this.sync(); return r; }
  async registerProcurement(id, resources) { const r = await this.api(`/procurements/${id}/register`, { method: 'POST', body: { resources } }); await this.sync(); return r; }

  async acceptMaintenance(id) { const r = await this.api(`/maintenance/${id}/accept`, { method: 'POST' }); await this.sync(); return r; }
  async repairMaintenance(id) { const r = await this.api(`/maintenance/${id}/repair`, { method: 'POST' }); await this.sync(); return r; }
  async scrapMaintenance(id) { const r = await this.api(`/maintenance/${id}/scrap`, { method: 'POST' }); await this.sync(); return r; }
  async processReturn(id, condition) { const r = await this.api(`/returns/${id}/process`, { method: 'POST', body: { condition } }); await this.sync(); return r; }
  async updateStockThreshold(id, level) { const r = await this.api(`/analytics/stock-thresholds/${id}/${level}`, { method: 'PATCH' }); await this.sync(); return r; }

  async getProfile() { return this.api('/profile/me'); }
  async updateProfile(payload) {
    const result = await this.api('/profile/me', { method: 'PATCH', body: payload });
    const current = this.getCurrentUser();
    this.setCurrentUser({ ...current, ...result });
    await this.sync();
    return result;
  }
  async updatePassword(payload) { return this.api('/profile/me/password', { method: 'POST', body: payload }); }

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
    setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 3000);
  }

  filterTable(inputEl, tbodyId) {
    const term = inputEl.value.toLowerCase();
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
  }
}

const Store = new DataStore();
export default Store;
