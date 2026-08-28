// Parent component: this is the common ancestor of NavMenu and UserProfileWidget, so
// it is where the "which nav item is active" state is lifted to and owned. NavMenu and
// NavItem are both stateless — they only receive activeTarget as a prop and report
// selection changes back up via the onSelect/onNavigate callback chain.
RX.Sidebar = function Sidebar({ items, initialActive, user, onNavigate, registerActiveSetter }) {
    const [activeTarget, setActiveTarget] = React.useState(initialActive);

    // Lets code outside this React tree (plain requestor.js, e.g. after submitting a
    // request via a non-sidebar button) move the highlighted nav item without reaching
    // into the DOM directly — React still owns the state and re-render.
    React.useEffect(() => {
        if (registerActiveSetter) registerActiveSetter(setActiveTarget);
    }, [registerActiveSetter]);

    const handleSelect = (target) => {
        setActiveTarget(target); // lifted state, updated here in the common parent
        onNavigate(target); // callback out to the surrounding vanilla-JS page
    };

    return (
        <aside className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">R</div>
                <div className="logo-text">ResourceX</div>
            </div>

            <RX.NavMenu items={items} activeTarget={activeTarget} onSelect={handleSelect} />

            <RX.UserProfileWidget
                name={user.name}
                role={user.role}
                initial={user.initial}
                imgUrl={user.imgUrl}
            />
        </aside>
    );
};
