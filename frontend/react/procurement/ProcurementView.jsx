// Parent component for the whole Procurement Request feature. This is the common
// ancestor of ProcurementForm and ProcurementHistoryTable, so the procurements list is
// lifted up and owned here: the form doesn't need the list, but it needs to trigger a
// refresh of it on submit, and the table needs to display it — the parent is the only
// place both of those needs meet.
RX.ProcurementView = function ProcurementView({ getDepartments, getDeptResources, onAfterSubmit }) {
    const [procurements, setProcurements] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);

    const loadProcurements = React.useCallback(async () => {
        setLoading(true);
        try {
            const all = await Store.fetchProcurements();
            const user = Store.getCurrentUser();
            const mine = (all || []).filter((p) => p.requester === user.name || p.requestedById === user.id);
            setProcurements(mine);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadProcurements();
    }, [loadProcurements]);

    const handleSubmit = async ({ dept, type, qty, reason, file }) => {
        const user = Store.getCurrentUser();

        // Procurement is only meaningful when inventory can't already cover the request.
        const availability = await Store.fetchResourceAvailability(dept, type);
        const availableCount = Number((availability && availability.availableCount) || 0);

        if (qty <= availableCount) {
            Store.showToast(
                `❌ Procurement not needed — ${availableCount} unit(s) of "${type}" already available in inventory. Use "Request Resource" instead.`,
                'error'
            );
            return false;
        }

        const newId = `PRC-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const payload = {
            id: newId,
            item: type,
            resourceType: type,
            department: dept,
            requester: user.name,
            requestedById: user.id,
            requesterRole: user.role,
            quantity: qty,
            status: 'Pending Approval',
            priority: 'Normal',
            date: dateStr,
            justification: reason,
            specFileName: file.name,
            specFileType: file.type,
            specFileDataUrl: file.dataUrl,
        };

        setSubmitting(true);
        try {
            await Store.createProcurement(payload);
            Store.showToast('Procurement Request Submitted Successfully! ID: ' + newId, 'success');
            await loadProcurements();
            if (onAfterSubmit) await onAfterSubmit();
            return true;
        } catch (err) {
            console.error('Procurement submit error:', err);
            Store.showToast('❌ Failed to submit: ' + (err.message || 'Unknown error. Please try again.'), 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handlePreviewFile = (procId, kind) => {
        Store.previewProcurementFile(procId, kind);
    };

    return (
        <div>
            <h1 className="page-title">Procurement Request</h1>
            <p className="page-subtitle">
                Submit a request to procure new resources not currently available in the inventory.
            </p>

            <RX.ProcurementForm
                departments={getDepartments()}
                getDeptResources={getDeptResources}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            <div className="data-section" style={{ marginTop: '2rem' }}>
                <div className="data-section-header">
                    <div className="data-section-title">My Procurement History</div>
                    <button
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={loadProcurements}
                    >
                        Refresh
                    </button>
                </div>
                {loading ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem' }}>Loading…</p>
                ) : (
                    <RX.ProcurementHistoryTable procurements={procurements} onPreviewFile={handlePreviewFile} />
                )}
            </div>
        </div>
    );
};
