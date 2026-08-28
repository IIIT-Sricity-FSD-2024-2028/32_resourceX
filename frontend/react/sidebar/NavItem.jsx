// Leaf component: purely presentational, owns no state of its own.
// Receives everything as props and reports clicks upward via the onSelect callback.
RX.NavItem = function NavItem({ icon, label, target, isActive, onSelect }) {
    return (
        <li
            className={'nav-item' + (isActive ? ' active' : '')}
            data-target={target}
            onClick={() => onSelect(target)}
        >
            <span className="material-symbols-outlined">{icon}</span> {label}
        </li>
    );
};
