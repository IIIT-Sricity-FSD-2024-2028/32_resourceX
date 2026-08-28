// Leaf component: owns only the drag-over hover state (purely local UI state that
// nothing else needs). The actual selected file is lifted up to ProcurementForm via
// the onFileSelected/onFileRemoved callbacks, since the form needs it to build the
// submission payload.
RX.FILE_UPLOAD_ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
];
RX.FILE_UPLOAD_MAX_MB = 5;

function formatFileSize(bytes) {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

RX.FileUploadZone = function FileUploadZone({ file, error, onFileSelected, onFileRemoved }) {
    const inputRef = React.useRef(null);
    const [dragOver, setDragOver] = React.useState(false);

    const readFile = (rawFile) => {
        if (!RX.FILE_UPLOAD_ALLOWED_TYPES.includes(rawFile.type)) {
            Store.showToast('❌ Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
            return;
        }
        if (rawFile.size > RX.FILE_UPLOAD_MAX_MB * 1024 * 1024) {
            Store.showToast(`❌ File too large. Maximum size is ${RX.FILE_UPLOAD_MAX_MB} MB.`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            onFileSelected({
                name: rawFile.name,
                size: rawFile.size,
                type: rawFile.type,
                dataUrl: e.target.result,
            });
        };
        reader.readAsDataURL(rawFile);
    };

    if (file) {
        return (
            <div className="file-preview-box">
                <span className="material-symbols-outlined file-icon">description</span>
                <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
                <button type="button" className="file-remove-btn" title="Remove file" onClick={onFileRemoved}>
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div
            className={'file-upload-zone' + (dragOver ? ' dragover' : '')}
            style={error ? { borderColor: '#f59e0b' } : undefined}
            onClick={() => inputRef.current && inputRef.current.click()}
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer && e.dataTransfer.files[0];
                if (dropped) readFile(dropped);
            }}
        >
            <span className="material-symbols-outlined">upload_file</span>
            <p>
                Drag &amp; drop your file here or <strong style={{ color: '#3b82f6' }}>browse</strong>
            </p>
            <p style={{ fontSize: '0.72rem', marginTop: '0.3rem' }}>Supports: PDF, DOC, DOCX, PNG, JPG</p>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const picked = e.target.files[0];
                    if (picked) readFile(picked);
                    e.target.value = '';
                }}
            />
        </div>
    );
};
