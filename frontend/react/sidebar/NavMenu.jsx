// Mid-level component: receives the nav item list and the currently active target as
// props from Sidebar, and passes the onSelect callback straight through to each NavItem.
// A click on any NavItem bubbles back up through this same callback (child-to-parent
// communication, two levels deep).
RX.NavMenu = function NavMenu({ items, activeTarget, onSelect }) {
    return (
        <ul className="nav-menu">
            {items.map((item) => (
                <RX.NavItem
                    key={item.target}
                    icon={item.icon}
                    label={item.label}
                    target={item.target}
                    isActive={item.target === activeTarget}
                    onSelect={onSelect}
                />
            ))}
        </ul>
    );
};
