class AppSidebar extends HTMLElement {
    connectedCallback() {
        const userName = this.getAttribute('user-name') || 'User';
        const userRole = this.getAttribute('user-role') || 'Role';
        const userImg = this.getAttribute('user-img');
        const userInitial = this.getAttribute('user-initial') || userName.charAt(0);
        
        // Extract the nested HTML (<ul class="nav-menu">) to preserve page-specific navigation
        const navContent = this.innerHTML;

        const avatarContent = userImg 
            ? `<img src="${userImg}" alt="${userName}">`
            : `<div style="background:#1e293b; color:white; width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1rem">${userInitial}</div>`;

        // Use display:contents so the <aside> becomes the direct flex child of .app-container
        // This ensures the sidebar fills the full vertical height of the viewport
        this.style.display = 'contents';

        this.innerHTML = `
            <aside class="sidebar">
                <div class="logo-container">
                    <div class="logo-icon">R</div>
                    <div class="logo-text">ResourceX</div>
                </div>

                ${navContent}

                <div class="user-profile-widget">
                    <div class="user-avatar" style="overflow:hidden">
                        ${avatarContent}
                    </div>
                    <div class="user-info">
                        <span class="user-name">${userName}</span>
                        <span class="user-role">${userRole}</span>
                    </div>
                </div>
            </aside>
        `;
    }
}
customElements.define('app-sidebar', AppSidebar);

