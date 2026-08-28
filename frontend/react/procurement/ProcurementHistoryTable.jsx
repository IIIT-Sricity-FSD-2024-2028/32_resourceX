// Sibling of ProcurementForm under ProcurementView. Purely presentational: renders the
// procurements list it's given as props, and reports "preview this file" clicks upward
// via the onPreviewFile callback rather than reaching into Store itself.
function procStatusStyle(status) {
    if (status === 'Approved' || status === 'Completed') return { background: '#dcfce7', color: '#166534' };
    if (status === 'Rejected') return { background: '#fee2e2', color: '#b91c1c' };
    return { background: '#cbd5e1', color: '#0f172a' };
}

RX.ProcurementHistoryTable = function ProcurementHistoryTable({ procurements, onPreviewFile }) {
    return (
        <table className="table">
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Spec File</th>
                    <th>Invoice</th>
                </tr>
            </thead>
            <tbody>
                {procurements.map((proc) => (
                    <tr key={proc.id}>
                        <td className="td-id">{proc.id}</td>
                        <td>{proc.item}</td>
                        <td>{String(proc.quantity).padStart(2, '0')}</td>
                        <td>{proc.date}</td>
                        <td>
                            {proc.status === 'Pending Approval' ? (
                                <span className="badge pending">{proc.status}</span>
                            ) : (
                                <span className="badge" style={procStatusStyle(proc.status)}>{proc.status}</span>
                            )}
                        </td>
                        <td>
                            {proc.specFileName ? (
                                <a
                                    href="javascript:void(0)"
                                    className="spec-file-link"
                                    onClick={() => onPreviewFile(proc.id, 'spec')}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                                    {proc.specFileName}
                                </a>
                            ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                            )}
                        </td>
                        <td>
                            {proc.invoiceFileName ? (
                                <a
                                    href="javascript:void(0)"
                                    className="spec-file-link"
                                    onClick={() => onPreviewFile(proc.id, 'invoice')}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                                    {proc.invoiceFileName}
                                </a>
                            ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
