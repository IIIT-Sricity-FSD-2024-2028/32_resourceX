class AppHeader extends HTMLElement {
    connectedCallback() {
        let user = { name: 'User', role: 'Role' };
        if (typeof Store !== 'undefined') {
            user = Store.getCurrentUser() || user;
        } else {
            // Attempt to read directly from localStorage since Store isn't loaded yet
            try {
                const storedData = JSON.parse(localStorage.getItem('rx_data'));
                if (storedData && storedData.currentUser) {
                    user = storedData.currentUser;
                }
            } catch (e) { }
        }

        this.innerHTML = `
            <style>
                /* Dropdown Container */
                .dropdown-container {
                    position: relative;
                    display: inline-block;
                }
                
                /* Icon button override if needed */
                .notification-btn {
                    position: relative;
                }
                
                .notification-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background: #ef4444;
                    color: white;
                    font-size: 0.65rem;
                    font-weight: bold;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                }

                .profile-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                
                .profile-btn:hover {
                    transform: scale(1.05);
                }

                .user-avatar-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid var(--border-color);
                }
                
                .user-avatar-small img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                /* Dropdown Menu */
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-color);
                    min-width: 220px;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.2s ease;
                    z-index: 100;
                }

                .dropdown-menu.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .dropdown-header {
                    padding: 1rem;
                    font-weight: 600;
                    color: var(--text-main);
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    color: var(--text-main);
                    text-decoration: none;
                    font-size: 0.875rem;
                    transition: background 0.2s;
                    cursor: pointer;
                }

                .dropdown-item:hover {
                    background: #f1f5f9;
                }

                .dropdown-icon {
                    font-size: 20px;
                    color: var(--text-muted);
                }

                .dropdown-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 0.5rem 0;
                }

                .text-danger {
                    color: #ef4444;
                }
                
                .text-danger .dropdown-icon {
                    color: #ef4444;
                }

                /* Notifications specific */
                .notifications-dropdown {
                    width: 300px;
                }

                .notification-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--border-color);
                    cursor: pointer;
                }

                .notification-item:hover {
                    background: #f8fafc;
                }

                .notification-item:last-child {
                    border-bottom: none;
                }

                .notif-title {
                    font-weight: 600;
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                }

                .notif-desc {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                }

                .notif-time {
                    font-size: 0.7rem;
                    color: #94a3b8;
                }
                
                .notif-unread {
                    background-color: #eff6ff;
                }

                .dropdown-footer {
                    padding: 0.75rem;
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--primary-color);
                    font-weight: 600;
                    cursor: pointer;
                    border-top: 1px solid var(--border-color);
                    background: #f8fafc;
                    border-radius: 0 0 8px 8px;
                }
                
                .dropdown-footer:hover {
                    background: #f1f5f9;
                }
            </style>
            
            <header class="top-header">
                <div class="search-bar">
                    <span class="search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </span>
                    <input type="text" placeholder="Search..." onkeyup="Store.globalSearch(this.value)" oninput="this.nextElementSibling.style.display = this.value ? 'flex' : 'none'">
                    <span class="clear-btn" onclick="this.previousElementSibling.value=''; this.style.display='none'; Store.globalSearch(''); this.previousElementSibling.focus()">✕</span>
                </div>
                <div class="header-actions">
                    <!-- Notification Button -->
                    <div class="dropdown-container">
                        <button class="icon-btn notification-btn" title="Notifications" onclick="HeaderActions.toggleNotifications(event)" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 50%; transition: background 0.2s;">
                            <span class="material-symbols-outlined" style="font-size: 24px; color: var(--text-main);">notifications</span>
                            <span class="notification-badge" id="notifBadge">0</span>
                        </button>
                        <!-- Notifications Dropdown -->
                        <div class="dropdown-menu notifications-dropdown" id="notificationsMenu">
                            <div class="dropdown-header">Notifications</div>
                            <div class="notification-list" id="notificationList">
                                <!-- Populated by JS -->
                            </div>
                            <div class="dropdown-footer" onclick="HeaderActions.markAllRead()">Mark all as read</div>
                        </div>
                    </div>

                    <!-- Profile Button -->
                    <div class="dropdown-container">
                        <button class="profile-btn" title="Profile" onclick="HeaderActions.toggleProfileMenu(event)">
                            <div class="user-avatar-small">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f38ae&color=fff" alt="${user.name}" id="headerProfileAvatar">
                            </div>
                        </button>
                        <!-- Profile Dropdown -->
                        <div class="dropdown-menu profile-dropdown" id="profileMenu">
                            <div class="dropdown-header" style="border-bottom: 1px solid #e2e8f0; margin-bottom: 0.5rem; text-align: left;">
                                <strong id="headerProfileName">${user.name}</strong>
                                <div style="font-size: 0.75rem; color: #64748b;" id="headerProfileRole">${user.role}</div>
                            </div>
                            <a href="profile.html" class="dropdown-item"><span class="material-symbols-outlined dropdown-icon">person</span> My Profile</a>
                            <a href="profile.html" class="dropdown-item"><span class="material-symbols-outlined dropdown-icon">settings</span> Settings</a>
                            <div class="dropdown-divider"></div>
                            <a href="login.html" class="dropdown-item text-danger" onclick="Store.logout()"><span class="material-symbols-outlined dropdown-icon">logout</span> Logout</a>
                        </div>
                    </div>
                </div>
            </header>
        `;

        // Initialize header actions
        setTimeout(() => {
            if (typeof HeaderActions !== 'undefined') {
                HeaderActions.initNotifications();
            }
        }, 100);
    }
}

// Ensure global scope for header actions
window.HeaderActions = {
    toggleProfileMenu: function (event) {
        event.stopPropagation();
        const menu = document.getElementById('profileMenu');
        const notifMenu = document.getElementById('notificationsMenu');

        // close others
        if (notifMenu) notifMenu.classList.remove('show');

        if (menu) {
            menu.classList.toggle('show');
        }
    },

    toggleNotifications: function (event) {
        event.stopPropagation();
        const menu = document.getElementById('notificationsMenu');
        const profMenu = document.getElementById('profileMenu');

        // close others
        if (profMenu) profMenu.classList.remove('show');

        if (menu) {
            menu.classList.toggle('show');
        }
    },

    initNotifications: function () {
        const notifMenuElement = document.getElementById('notificationList');
        const badge = document.getElementById('notifBadge');
        if (!notifMenuElement) return;

        let notifications = [];
        if (typeof Store !== 'undefined' && Store.getData) {
            const data = Store.getData();
            const user = Store.getCurrentUser();
            if (data.notifications && user) {
                // simple filtering logic if we have roles, otherwise show all
                notifications = data.notifications.filter(n => n.recipientRole === 'All' || n.recipientRole === user.role);
            }
        }

        // Provide demo data if empty
        if (notifications.length === 0) {
            notifications = [
                { id: "Dem1", title: "New Feature available", description: "Try out the new analytics dashboard.", time: "10 mins ago", read: false },
                { id: "Dem2", title: "System Update", description: "System maintenance window scheduled for tonight.", time: "2 hours ago", read: false },
                { id: "Dem3", title: "Welcome!", description: "Welcome to ResourceX.", time: "1 day ago", read: true }
            ];
        }

        const unreadCount = notifications.filter(n => !n.read).length;
        if (badge) {
            badge.innerText = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        notifMenuElement.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.read ? '' : 'notif-unread'}" onclick="alert('Viewing notification: ${n.title}')">
                <div class="notif-title">${n.title}</div>
                <div class="notif-desc">${n.description}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        `).join('');
    },

    markAllRead: function () {
        alert("Marking all notifications as read.");
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';

        const items = document.querySelectorAll('.notification-item.notif-unread');
        items.forEach(item => item.classList.remove('notif-unread'));
    }
};

// Close dropdowns when clicking outside
document.addEventListener('click', function (event) {
    const pMenu = document.getElementById('profileMenu');
    const nMenu = document.getElementById('notificationsMenu');

    if (pMenu && pMenu.classList.contains('show') && !event.target.closest('.dropdown-container')) {
        pMenu.classList.remove('show');
    }
    if (nMenu && nMenu.classList.contains('show') && !event.target.closest('.dropdown-container')) {
        nMenu.classList.remove('show');
    }
});

customElements.define('app-header', AppHeader);
