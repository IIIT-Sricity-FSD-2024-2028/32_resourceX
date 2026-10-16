const adminApp = {
    viewAllUsers: false,
    init: async function () {
        const user = Store.getCurrentUser();
        if (!user || user.role !== 'System Admin') {
            window.location.href = 'login.html';
            return;
        }
        await Store.sync();

        try {
            this.myOrg = await Store.fetchMyOrganization();
            this.plans = await Store.fetchSubscriptionPlans();
        } catch (e) {
            console.error('Failed to load subscription data:', e);
        }

        // Init Bootstrap modals
        this.newTicketModal = new bootstrap.Modal(document.getElementById('newTicketModal'));
        this.replyAnnModal = new bootstrap.Modal(document.getElementById('replyAnnModal'));

        // Update UI
        document.querySelector('.user-name').textContent = user.name;
        document.querySelector('.user-role').textContent = 'Administrator';

        this.bindNav();
        this.renderUsers();
        this.renderDepartments();
        this.renderSubscription();
        await this.renderSupportTickets();
        await this.renderAdminAnnouncements();
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

    // 1. User Management
    renderUsers: function () {
        const tbody = document.querySelector('#dash-users-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const db = Store.getData();
        const users = db.users;
        const depts = db.departments;

        // Calculate Stats
        const roles = new Set(users.map(u => u.role));

        const elUsers = document.getElementById('dash-admin-users');
        const elDepts = document.getElementById('dash-admin-depts');
        const elRoles = document.getElementById('dash-admin-roles');

        if (elUsers) elUsers.textContent = users.length;
        if (elDepts) elDepts.textContent = depts.length;
        if (elRoles) elRoles.textContent = roles.size;

        let displayUsers = [...users].reverse(); // newest first

        // Exclude System Admin users — they should not be shown in user management
        const managableUsers = displayUsers.filter(u => u.role !== 'System Admin');

        // Render Dashboard Table (Slice top 5, no System Admins)
        if (tbody) {
            managableUsers.slice(0, 5).forEach(u => {
                tbody.appendChild(this.buildUserRow(u));
            });
        }

        // Render User Management Table (All, no System Admins)
        const allBody = document.querySelector('#all-users-tbody');
        if (allBody) {
            allBody.innerHTML = '';
            managableUsers.forEach(u => {
                allBody.appendChild(this.buildUserRow(u));
            });
        }
    },

    buildUserRow: function (u) {
        let roleBadge = `<span class="badge" style="background:#cbd5e1; color:#0f172a">${u.role}</span>`;
        if (u.role === 'Dept Head') roleBadge = `<span class="badge pending" style="background:#dbeafe; color:#1d4ed8">${u.role}</span>`;
        else if (u.role === 'Staff') roleBadge = `<span class="badge pending">${u.role}</span>`;
        else if (u.role === 'System Admin') roleBadge = `<span class="badge" style="background:#fecaca; color:#b91c1c">${u.role}</span>`;
        else if (u.role === 'Registrar') roleBadge = `<span class="badge allocated" style="background:#fef08a; color:#854d0e">${u.role}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600">${u.name} <div style="font-size:0.75rem; color:#64748b; font-weight:normal">${u.email}</div></td>
            <td>${roleBadge}</td>
            <td>${u.department}</td>
            <td><span class="badge allocated">${u.status}</span></td>
            <td style="text-align:right">
                <button class="btn-secondary" style="font-size:0.75rem" onclick="adminApp.editUser('${u.id}')">Edit Access</button>
                ${u.role !== 'System Admin' ? `<button class="btn-danger" style="font-size:0.75rem" onclick="adminApp.deleteUser('${u.id}')">Delete</button>` : ''}
            </td>
        `;
        return tr;
    },

    triggerViewAll: function () {
        this.switchView('user-manage-view');
        // Update Sidebar active state manually since this isn't a direct sidebar click
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const targetNav = document.querySelector('.nav-item[data-target="user-manage-view"]');
        if (targetNav) targetNav.classList.add('active');
    },

    openModal: function (title, html, onConfirm) {
        document.getElementById('modal-header').textContent = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('admin-modal').style.display = 'flex';

        const btn = document.getElementById('modal-confirm-btn');
        btn.onclick = () => {
            if (onConfirm) onConfirm();
        };
    },

    closeModal: function () {
        document.getElementById('admin-modal').style.display = 'none';
    },

    addUser: function () {
        const db = Store.getData();
        const depts = db.departments;
        let deptOptions = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');

        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Full Name</label>
                <input type="text" id="modal-user-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. John Doe">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Email Address</label>
                <input type="email" id="modal-user-email" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="user@resourcex.com">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">System Role</label>
                <select id="modal-user-role" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Requestor">Requestor</option>
                    <option value="Dept Head">Dept Head</option>
                    <option value="Registrar">Registrar</option>
                    <option value="Staff">Staff</option>
                    <option value="System Admin">System Admin</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department</label>
                <select id="modal-user-dept" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    ${deptOptions}
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Password</label>
                <input type="password" id="modal-user-password" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="Enter temporary password">
            </div>
        `;
        this.openModal("Add New User", html, async () => {
            const name = document.getElementById('modal-user-name').value.trim();
            const email = document.getElementById('modal-user-email').value.trim();
            const role = document.getElementById('modal-user-role').value;
            const dept = document.getElementById('modal-user-dept').value;
            const password = document.getElementById('modal-user-password').value.trim();

            const nameRegex = /^[a-zA-Z0-9\s.-]+$/;

            if (!name || !email || !password) {
                Store.showToast("Please fill out all fields including password.", "error");
                return;
            }

            if (!nameRegex.test(name)) {
                Store.showToast("Name can only contain characters and numbers.", "error");
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                Store.showToast("Please enter a valid email address.", "error");
                document.getElementById('modal-user-email').focus();
                return;
            }

            if (password.length < 6) {
                Store.showToast("Password must be at least 6 characters long.", "error");
                return;
            }

            await Store.createUser({
                id: `U-9${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                email: email,
                password: password,
                role: role,
                department: dept,
                status: "Active"
            });
            this.renderUsers();
            Store.showToast("New user successfully added.", "success");
            this.closeModal();
        });
    },

    editUser: function (id) {
        const user = Store.getData().users.find(u => u.id === id);
        if (!user) return;
        const depts = Store.getData().departments || [];
        const deptOptions = depts.map(d => `<option value="${d.name}" ${user.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('');

        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Name</label>
                <input type="text" id="modal-edit-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${user.name}">
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Role</label>
                <select id="modal-role-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Requestor" ${user.role === 'Requestor' ? 'selected' : ''}>Requestor</option>
                    <option value="Dept Head" ${user.role === 'Dept Head' ? 'selected' : ''}>Dept Head</option>
                    <option value="Registrar" ${user.role === 'Registrar' ? 'selected' : ''}>Registrar</option>
                    <option value="Staff" ${user.role === 'Staff' ? 'selected' : ''}>Staff</option>
                    <option value="System Admin" ${user.role === 'System Admin' ? 'selected' : ''}>System Admin</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department</label>
                <select id="modal-dept-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    ${deptOptions}
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Account Status</label>
                <select id="modal-status-select" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
                    <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Suspended" ${user.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">New Password <span style="font-size:0.75rem; color:#64748b; font-weight:normal">(Leave blank to keep current)</span></label>
                <input type="password" id="modal-edit-password" placeholder="Enter new password" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px">
            </div>
        `;
        this.openModal("Edit User", html, async () => {
            const newName = document.getElementById('modal-edit-name').value.trim();
            const newRole = document.getElementById('modal-role-select').value;
            const newDept = document.getElementById('modal-dept-select').value;
            const newStatus = document.getElementById('modal-status-select').value;
            const newPassword = document.getElementById('modal-edit-password').value.trim();

            const nameRegex = /^[a-zA-Z0-9\s.-]+$/;

            if (!newName) {
                Store.showToast("Name cannot be empty.", "error");
                return;
            }

            if (!nameRegex.test(newName)) {
                Store.showToast("Name can only contain characters and numbers.", "error");
                return;
            }

            if (newPassword.length > 0 && newPassword.length < 6) {
                Store.showToast("Password must be at least 6 characters long.", "error");
                return;
            }

            const updates = {
                name: newName,
                role: newRole,
                department: newDept,
                status: newStatus
            };

            if (newPassword) {
                updates.password = newPassword;
            }

            await Store.updateUser(id, updates);

            const currentUser = Store.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                Store.setCurrentUser({
                    ...currentUser,
                    ...updates
                });
                // Update nav/header directly if on page
                const uiName = document.querySelector('.user-name');
                if (uiName) uiName.textContent = newName;
            }

            this.renderUsers();
            Store.showToast("User details updated permanently.", "success");
            this.closeModal();
        });
    },

    deleteUser: function (id) {
        const html = `<p style="color:#64748b; margin:0">Are you absolutely sure you want to deactivate this user? They will lose access immediately.</p>`;
        this.openModal("Deactivate User", html, async () => {
            await Store.updateUser(id, { status: "Inactive" });
            this.renderUsers();
            Store.showToast("User deactivated.", "success");
            this.closeModal();
        });
    },

    // 2. Department Config
    renderDepartments: function () {
        const container = document.querySelector('#dept-manage-view > div');
        if (!container) return;

        // Keep the "+ Add New Department" button
        container.innerHTML = '';

        const depts = Store.getData().departments;

        depts.forEach(d => {
            const div = document.createElement('div');
            div.style.cssText = "display:flex; justify-content:space-between; padding-bottom:1rem; border-bottom:1px solid #e2e8f0; margin-bottom:1rem;";
            div.innerHTML = `
                <div><strong style="font-size:1.1rem; color:var(--primary-color)">${d.name}</strong><div style="color:#64748b; font-size:0.875rem">Head: ${d.head} | Members: ${d.memberCount}</div></div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <button class="btn-primary" style="font-size:0.75rem; background:#3b82f6; border-color:#3b82f6;" onclick="adminApp.manageCatalog('${d.name}')">Catalog</button>
                    <button class="btn-secondary" style="font-size:0.75rem" onclick="adminApp.editDept('${d.id}')">Edit</button>
                    <button class="btn-danger" style="font-size:0.75rem" onclick="adminApp.deleteDept('${d.id}')">Delete</button>
                </div>
            `;
            container.appendChild(div);
        });

        const btnDiv = document.createElement('div');
        btnDiv.style.marginTop = '1rem';
        btnDiv.innerHTML = `<button class="btn-primary" onclick="adminApp.addDept()">+ Add New Department</button>`;
        container.appendChild(btnDiv);
    },

    addDept: function () {
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department Name</label>
                <input type="text" id="modal-dept-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. IT Services">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Letters, spaces, hyphens and dots only.</div>
            </div>
            <div>
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Head Name</label>
                <input type="text" id="modal-dept-head" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. pradhyum">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Alphabets and spaces only.</div>
            </div>
        `;
        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        const headRegex = /^[a-zA-Z\s\.]+$/;

        this.openModal("Add New Department", html, async () => {
            const name = document.getElementById('modal-dept-name').value.trim();
            const head = document.getElementById('modal-dept-head').value.trim();

            if (!name || !head) {
                Store.showToast("Please fill in all fields.", "error");
                return;
            }
            if (!nameRegex.test(name)) {
                Store.showToast("Department name can only contain letters, spaces, hyphens and dots.", "error");
                return;
            }
            if (!headRegex.test(head)) {
                Store.showToast("Head name can only contain letters and spaces.", "error");
                return;
            }

            const db = Store.getData();
            const exists = db.departments.some(d => d.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                Store.showToast("A department with this name already exists.", "error");
                return;
            }

            await Store.createDepartment({
                id: `D${Math.floor(100 + Math.random() * 900)}`,
                name: name,
                head: head,
                memberCount: 0
            });
            this.renderDepartments();
            Store.showToast("Department added successfully.", "success");
            this.closeModal();
        });
    },

    editDept: function (id) {
        const dept = Store.getData().departments.find(d => d.id === id);
        if (!dept) return;

        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Department Name</label>
                <input type="text" id="modal-edit-dept-name" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.name}">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Letters, spaces, hyphens and dots only.</div>
            </div>
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Head Name</label>
                <input type="text" id="modal-edit-dept-head" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.head}">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Alphabets and spaces only.</div>
            </div>
            <div>
                <label style="display:block; margin-bottom:0.5rem; font-weight:500">Member Count</label>
                <input type="number" id="modal-edit-dept-members" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${dept.memberCount}" min="0">
            </div>
        `;

        const nameRegex = /^[a-zA-Z\s\-\.]+$/;
        const headRegex = /^[a-zA-Z\s\.]+$/;

        this.openModal("Edit Department", html, async () => {
            const newName = document.getElementById('modal-edit-dept-name').value.trim();
            const newHead = document.getElementById('modal-edit-dept-head').value.trim();
            const newMembers = parseInt(document.getElementById('modal-edit-dept-members').value);

            if (!newName || !newHead) {
                Store.showToast("Please fill in all fields.", "error");
                return;
            }
            if (!nameRegex.test(newName)) {
                Store.showToast("Department name can only contain letters, spaces, hyphens and dots.", "error");
                return;
            }
            if (!headRegex.test(newHead)) {
                Store.showToast("Head name can only contain letters and spaces.", "error");
                return;
            }
            if (isNaN(newMembers) || newMembers < 0) {
                Store.showToast("Member count must be a non-negative number.", "error");
                return;
            }

            // Check duplicate name (ignore the current dept)
            const db = Store.getData();
            const duplicate = db.departments.some(d => d.id !== id && d.name.toLowerCase() === newName.toLowerCase());
            if (duplicate) {
                Store.showToast("Another department with this name already exists.", "error");
                return;
            }

            await Store.updateDepartment(id, { name: newName, head: newHead, memberCount: newMembers });
            this.renderDepartments();
            Store.showToast("Department updated successfully.", "success");
            this.closeModal();
        });
    },

    deleteDept: function (id) {
        const html = `<p style="color:#b91c1c; margin:0">Warning: Deleting this department affects all linked associated users and active resources. Proceed at your own risk.</p>`;
        this.openModal("Delete Department", html, async () => {
            await Store.deleteDepartment(id);
            this.renderDepartments();
            Store.showToast("Department securely removed.", "warning");
            this.closeModal();
        });
    },

    activeCatalogDept: null,

    manageCatalog: function (deptName) {
        this.activeCatalogDept = deptName;

        const container = document.querySelector('#dept-manage-view > div');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-bottom:1rem; text-align:left;">
                <button class="btn-secondary" onclick="adminApp.showDeptTopologyView(event)" style="display:inline-flex; align-items:center; gap:0.5rem; margin-bottom:1.5rem;">
                    <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle;">arrow_back</span> Back to Departments
                </button>
                
                <h3 style="margin:0 0 0.5rem 0; font-size:1.25rem; color:#0f172a;">${deptName} - Resource Catalog</h3>
                <p style="color:#64748b; font-size:0.875rem; margin-bottom:1.5rem;">Configure and manage allowed resource types for this department with full CRUD operations.</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:1rem; flex-wrap:wrap;">
                    <div class="search-bar" style="width:250px; margin:0; display:flex; align-items:center; border:1px solid #cbd5e1; padding:0.25rem 0.5rem; border-radius:6px; background:#fff;">
                        <span class="material-symbols-outlined" style="color:#94a3b8; font-size:1.25rem;">search</span>
                        <input type="text" id="catalog-types-search" placeholder="Search types..." style="border:none; outline:none; font-size:0.875rem; width:100%; margin-left:0.25rem;" onkeyup="adminApp.filterCatalogTable(this)">
                    </div>
                    <button class="btn-primary" onclick="adminApp.addCatalogType()">+ Add Resource Type</button>
                </div>
                
                <div class="table-responsive" style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.5rem;">
                    <table class="table" style="margin:0;">
                        <thead>
                            <tr>
                                <th style="border-bottom:2px solid #e2e8f0;">Resource Type Name</th>
                                <th style="text-align:right; width:180px; border-bottom:2px solid #e2e8f0;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="catalog-types-tbody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderCatalogRows();
    },

    showDeptTopologyView: function (event) {
        if (event) event.preventDefault();
        this.renderDepartments();
    },

    renderCatalogRows: function () {
        const tbody = document.getElementById('catalog-types-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const allowedTypes = Store.getDepartmentResourceTypes(this.activeCatalogDept);

        if (allowedTypes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#64748b; font-style:italic; padding:2rem;">No resource types configured. Click "+ Add Resource Type" to begin.</td></tr>`;
            return;
        }

        allowedTypes.forEach(type => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:#1e293b; font-size:0.95rem;">${type}</strong></td>
                <td style="text-align:right">
                    <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" onclick="adminApp.editCatalogType('${type.replace(/'/g, "\\'")}')">Rename</button>
                    <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="adminApp.deleteCatalogType('${type.replace(/'/g, "\\'")}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    filterCatalogTable: function (input) {
        const query = input.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#catalog-types-tbody tr');

        rows.forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (!nameCell) return;
            const name = nameCell.textContent.toLowerCase();
            if (name.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    addCatalogType: function () {
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:600">Resource Type Name</label>
                <input type="text" id="modal-catalog-new-type" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" placeholder="e.g. Developer Laptops">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Enter the category/type of resources for this department.</div>
            </div>
        `;

        this.openModal("Add Resource Type to Catalog", html, async () => {
            const val = document.getElementById('modal-catalog-new-type').value.trim();
            if (!val) {
                Store.showToast("Resource type name cannot be empty.", "error");
                return;
            }

            const current = Store.getDepartmentResourceTypes(this.activeCatalogDept);
            if (current.some(t => t.toLowerCase() === val.toLowerCase())) {
                Store.showToast("This resource type is already in the catalog.", "error");
                return;
            }

            try {
                const updated = [...current, val];
                await Store.updateResourceCatalog(this.activeCatalogDept, updated);
                Store.showToast("Resource type added successfully.", "success");
                this.renderCatalogRows();
                this.closeModal();
            } catch (err) {
                Store.showToast(err.message || "Failed to add resource type.", "error");
            }
        });
    },

    editCatalogType: function (oldType) {
        const html = `
            <div style="margin-bottom:1rem">
                <label style="display:block; margin-bottom:0.5rem; font-weight:600">Rename Resource Type</label>
                <input type="text" id="modal-catalog-edit-type" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px" value="${oldType}">
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.25rem;">Existing requests, procurements, and resources of this type will be updated automatically.</div>
            </div>
        `;

        this.openModal("Rename Resource Type", html, async () => {
            const val = document.getElementById('modal-catalog-edit-type').value.trim();
            if (!val) {
                Store.showToast("Resource type name cannot be empty.", "error");
                return;
            }
            if (val.toLowerCase() === oldType.toLowerCase()) {
                this.closeModal();
                return;
            }

            const current = Store.getDepartmentResourceTypes(this.activeCatalogDept);
            if (current.some(t => t.toLowerCase() === val.toLowerCase() && t.toLowerCase() !== oldType.toLowerCase())) {
                Store.showToast("Another resource type with this name already exists.", "error");
                return;
            }

            try {
                await Store.renameResourceCatalogType(this.activeCatalogDept, oldType, val);
                Store.showToast("Resource type renamed and records propagated successfully.", "success");
                this.renderCatalogRows();
                this.closeModal();
            } catch (err) {
                Store.showToast(err.message || "Failed to rename resource type.", "error");
            }
        });
    },

    deleteCatalogType: function (type) {
        const html = `
            <p style="color:#b91c1c; margin:0">
                Warning: Are you sure you want to delete <strong>"${type}"</strong> from the catalog?
                This will prevent users from submitting any new requests or procurements for this resource type.
            </p>
        `;
        this.openModal("Delete Resource Type", html, async () => {
            try {
                await Store.removeResourceCatalogType(this.activeCatalogDept, type);
                Store.showToast("Resource type removed from catalog.", "warning");
                this.renderCatalogRows();
                this.closeModal();
            } catch (err) {
                Store.showToast(err.message || "Failed to remove resource type.", "error");
            }
        });
    },

    renderSubscription: function () {
        if (!this.myOrg || !this.plans) return;

        const activePlanId = this.myOrg.subscriptionPlanId;
        const activePlan = this.plans.find(p => p.id === activePlanId);

        const currentDetailsEl = document.getElementById('current-plan-details');
        if (activePlan) {
            currentDetailsEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>Plan Name:</strong> ${activePlan.name} <br/>
                        <strong>Max Users:</strong> ${activePlan.maxUsers} <br/>
                        <strong>Price:</strong> $${activePlan.pricePerYear} / year
                    </div>
                    <div style="text-align:right;">
                        <span class="status-badge status-active">Active</span>
                        <div style="margin-top:0.5rem; font-size:0.9rem; color:#64748b;">
                            No expiry (In-Memory)
                        </div>
                    </div>
                </div>
            `;
        }

        const grid = document.getElementById('subscription-plans-grid');
        grid.innerHTML = '';

        this.plans.forEach(plan => {
            const isActive = plan.id === activePlanId;
            const btnHtml = isActive
                ? `<button class="btn-secondary" style="width:100%;" disabled>Current Plan</button>`
                : `<button class="btn-primary" style="width:100%;" onclick="adminApp.changeSubscription('${plan.id}')">Select Plan</button>`;

            const card = document.createElement('div');
            card.style.cssText = `
                background: white; 
                border: 2px solid ${isActive ? 'var(--primary-color)' : '#e2e8f0'}; 
                border-radius: 12px; 
                padding: 2rem; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between;
                position: relative;
            `;

            if (isActive) {
                card.innerHTML += `<div style="position:absolute; top:-12px; right:20px; background:var(--primary-color); color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:bold;">ACTIVE</div>`;
            }

            card.innerHTML += `
                <div>
                    <h3 style="margin-top:0; font-size:1.25rem;">${plan.name}</h3>
                    <div style="font-size:2rem; font-weight:bold; margin: 1rem 0;">$${plan.pricePerYear} <span style="font-size:1rem; color:#64748b; font-weight:normal;">/yr</span></div>
                    <p style="color:#64748b; margin-bottom:1.5rem;">For up to ${plan.maxUsers} users.</p>
                </div>
                <div>
                    ${btnHtml}
                </div>
            `;
            grid.appendChild(card);
        });
    },

    changeSubscription: async function (planId) {
        try {
            await Store.updateSubscription(planId);
            Store.showToast("Subscription plan updated successfully", "success");
            this.myOrg = await Store.fetchMyOrganization();
            this.renderSubscription();
        } catch (e) {
            console.error('Failed to update subscription:', e);
            alert(e.message || "Failed to update subscription.");
        }
    },

    logout: function () {
        Store.logout();
        window.location.href = 'login.html';
    },

    // ─── SUPPORT QUERIES ────────────────────────────────────────────────────────
    renderSupportTickets: async function () {
        const tbody = document.getElementById('supportTicketsBody');
        if (!tbody) return;
        try {
            const tickets = await Store.api('/support');
            const myOrgId = Store.getCurrentUser().organizationId;
            // Show only tickets from this org
            const mine = (tickets || []).filter(t => t.organizationId === myOrgId);

            // Sidebar badge
            const open = mine.filter(t => t.status === 'Open').length;
            const badge = document.getElementById('adminOpenTicketsBadge');
            if (badge) { badge.textContent = open; badge.style.display = open > 0 ? 'inline' : 'none'; }

            tbody.innerHTML = '';
            if (mine.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No queries raised yet. Click "Raise New Query" to get help.</td></tr>';
                return;
            }
            mine.slice().reverse().forEach(t => {
                const statusMap = { Open: 'badge-pending', Resolved: 'badge-success', 'In Progress': 'badge-secondary' };
                const badge = `<span class="badge ${statusMap[t.status] || 'badge-secondary'}">${t.status}</span>`;
                const reply = t.reply
                    ? `<span style="font-size:0.8rem;color:#166534">${t.reply}</span>`
                    : '<span style="color:#94a3b8;font-size:0.8rem">Awaiting reply…</span>';
                tbody.innerHTML += `
                    <tr>
                        <td>${t.id}</td>
                        <td><strong>${t.title}</strong></td>
                        <td style="font-size:0.8rem;color:var(--text-muted)">${t.description}</td>
                        <td>${badge}</td>
                        <td>${t.date || '—'}</td>
                        <td>${reply}</td>
                    </tr>`;
            });
        } catch (e) {
            console.error('Failed to load support tickets:', e);
        }
    },

    openNewTicketModal: function () {
        document.getElementById('newTicketForm').reset();
        this.newTicketModal.show();
    },

    handleSubmitTicket: async function (e) {
        e.preventDefault();
        const title = document.getElementById('ticketTitle').value.trim();
        const description = document.getElementById('ticketDesc').value.trim();
        const user = Store.getCurrentUser();
        try {
            await Store.api('/support', {
                method: 'POST',
                body: { title, description, organizationId: user.organizationId }
            });
            this.newTicketModal.hide();
            Store.showToast('Support query raised! Your assigned employee will respond shortly.', 'success');
            await this.renderSupportTickets();
        } catch (err) {
            Store.showToast('Failed to raise query: ' + err.message, 'error');
        }
    },

    // ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
    renderAdminAnnouncements: async function () {
        const tbody = document.getElementById('adminAnnouncementsBody');
        if (!tbody) return;
        try {
            const all = await Store.api('/announcements');
            const myOrgId = Store.getCurrentUser().organizationId;
            // Show announcements targeted to this org or broadcast (ALL)
            const mine = (all || []).filter(a =>
                a.targetOrgId === myOrgId || a.targetOrgId === 'ALL'
            );

            // Sidebar badge
            const badge = document.getElementById('adminAnnBadge');
            if (badge) { badge.textContent = mine.length; badge.style.display = mine.length > 0 ? 'inline' : 'none'; }

            tbody.innerHTML = '';
            if (mine.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No announcements from your Platform Employee yet.</td></tr>';
                return;
            }
            mine.slice().reverse().forEach(a => {
                const typeColors = {
                    'Maintenance': '#92400e', 'New Feature': '#1d4ed8',
                    'Policy': '#7c3aed', 'Subscription': '#166534', 'General': '#334155'
                };
                const color = typeColors[a.type] || '#334155';
                const typeBadge = `<span class="badge" style="background:#f1f5f9;color:${color};font-weight:600">${a.type}</span>`;
                const replyBtn = `<button class="btn-secondary" style="font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.3rem"
                    onclick='adminApp.openReplyAnnModal(${JSON.stringify(a)})'>Reply</button>`;
                tbody.innerHTML += `
                    <tr>
                        <td>${a.id}</td>
                        <td>${typeBadge}</td>
                        <td><strong>${a.title}</strong>${a.adminReply ? '<br><span style="font-size:0.75rem;color:#166534">✓ Replied</span>' : ''}</td>
                        <td style="font-size:0.85rem;color:var(--text-muted);max-width:240px">${a.message || '—'}</td>
                        <td>${a.date || '—'}<br>${replyBtn}</td>
                    </tr>`;
            });
        } catch (e) {
            console.error('Failed to load announcements:', e);
        }
    },

    openReplyAnnModal: function (ann) {
        document.getElementById('replyAnnId').value = ann.id;
        document.getElementById('replyAnnDetails').innerHTML = `
            <strong>${ann.type}:</strong> ${ann.title}<br>
            <span style="color:#64748b">${ann.message || ''}</span>`;
        document.getElementById('replyAnnText').value = '';
        this.replyAnnModal.show();
    },

    handleReplyAnn: async function (e) {
        e.preventDefault();
        const annId = document.getElementById('replyAnnId').value;
        const reply = document.getElementById('replyAnnText').value.trim();
        try {
            await Store.api(`/announcements/${annId}/reply`, {
                method: 'PATCH',
                body: { reply }
            });
            this.replyAnnModal.hide();
            Store.showToast('Reply sent successfully.', 'success');
            await this.renderAdminAnnouncements();
        } catch (err) {
            Store.showToast('Failed to send reply: ' + err.message, 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await adminApp.init();
});
