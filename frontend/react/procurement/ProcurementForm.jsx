// Child of ProcurementView. Owns its own field state (this is form-local UI state that
// nothing else needs), but reports a finished submission upward via the onSubmit
// callback prop — the parent is the one that actually talks to the Store/API and owns
// the procurements list, since that list is shared with ProcurementHistoryTable too.
RX.ProcurementForm = function ProcurementForm({ departments, getDeptResources, onSubmit, submitting }) {
    const [dept, setDept] = React.useState('');
    const [type, setType] = React.useState('');
    const [qty, setQty] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [file, setFile] = React.useState(null);
    const [fileWarning, setFileWarning] = React.useState(false);

    const typeOptions = dept ? getDeptResources(dept) : [];

    const resetForm = () => {
        setDept('');
        setType('');
        setQty('');
        setReason('');
        setFile(null);
        setFileWarning(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!dept || !type.trim() || !qty || Number(qty) < 1 || !reason.trim()) {
            Store.showToast('Please fill in all fields correctly before submitting.', 'error');
            return;
        }
        if (!file) {
            Store.showToast('⚠️ Please attach a Resource Specification / Intent File before submitting.', 'warning');
            setFileWarning(true);
            return;
        }

        const ok = await onSubmit({ dept, type, qty: Number(qty), reason, file });
        if (ok) resetForm();
    };

    return (
        <form className="form-card" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label className="form-label">Requesting Department</label>
                <select
                    className="form-control"
                    value={dept}
                    required
                    onChange={(e) => {
                        setDept(e.target.value);
                        setType('');
                    }}
                >
                    <option value="" disabled>Select Department</option>
                    {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Resource Type / Name</label>
                <select className="form-control" value={type} required onChange={(e) => setType(e.target.value)}>
                    <option value="" disabled>
                        {typeOptions.length === 0 ? 'No Catalog Configured for Department' : 'Select Resource Type'}
                    </option>
                    {typeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                    type="number"
                    className="form-control"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                    className="form-control"
                    rows="4"
                    required
                    placeholder="Explain why this procurement is needed based on business requirements..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">
                    Resource Specification / Intent File
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                        {' '}(Optional — PDF, DOC, DOCX, PNG, JPG · max 5 MB)
                    </span>
                </label>
                <RX.FileUploadZone
                    file={file}
                    error={fileWarning}
                    onFileSelected={(f) => {
                        setFile(f);
                        setFileWarning(false);
                    }}
                    onFileRemoved={() => setFile(null)}
                />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Procurement Request'}
            </button>
        </form>
    );
};
