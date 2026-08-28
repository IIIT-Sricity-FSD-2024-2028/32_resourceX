// Entry point called from requestor.js once the page's own data/user are ready.
let setSidebarActiveTarget = null;

RX.mountSidebar = function mountSidebar({ items, initialActive, user, onNavigate }) {
    const container = document.getElementById('react-sidebar-root');
    if (!container) return;

    const root = ReactDOM.createRoot(container);
    root.render(
        <RX.Sidebar
            items={items}
            initialActive={initialActive}
            user={user}
            onNavigate={onNavigate}
            registerActiveSetter={(setter) => { setSidebarActiveTarget = setter; }}
        />
    );
};

// Imperative escape hatch for plain-JS code outside this React tree (requestor.js) to
// move the active highlight when a view switch happens via something other than a
// sidebar click, e.g. the dashboard's "+ New Request" button or "I RECEIVED" action.
RX.setSidebarActive = function setSidebarActive(target) {
    if (setSidebarActiveTarget) setSidebarActiveTarget(target);
};
