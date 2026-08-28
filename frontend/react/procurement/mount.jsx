// Entry point called from requestor.js once the page's own data/user are ready.
RX.mountProcurementView = function mountProcurementView({ getDepartments, getDeptResources, onAfterSubmit }) {
    const container = document.getElementById('react-procurement-root');
    if (!container) return;

    const root = ReactDOM.createRoot(container);
    root.render(
        <RX.ProcurementView
            getDepartments={getDepartments}
            getDeptResources={getDeptResources}
            onAfterSubmit={onAfterSubmit}
        />
    );
};
