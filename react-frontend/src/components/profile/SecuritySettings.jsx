import React, { useState } from 'react';

export default function SecuritySettings({ onUpdatePassword }) {
  const [showFields, setShowFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleForm = () => {
    setShowFields(!showFields);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  };

  const calculateStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '#e2e8f0', activeBars: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;

    const colors = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#16a34a' };
    const labels = { 1: 'Very Weak', 2: 'Weak', 3: 'Fair', 4: 'Strong', 5: 'Very Strong' };
    return {
      score,
      label: labels[score] || '',
      color: colors[score] || '#e2e8f0',
      activeBars: Math.min(Math.ceil(score / 5 * 4), 4)
    };
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('❌ Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMsg('❌ Password must include at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setErrorMsg('❌ Password must include at least one lowercase letter (a-z).');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorMsg('❌ Password must include at least one number (0-9).');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setErrorMsg('❌ Password must include at least one special character (!@#$%^&*).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('❌ Passwords do not match.');
      return;
    }

    onUpdatePassword(currentPassword, newPassword, () => {
      toggleForm();
    });
  };

  return (
    <div style={{ padding: '0 2rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600 }}>Security Settings</h2>
        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={toggleForm} type="button">
          {showFields ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {showFields && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {errorMsg && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {errorMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••" 
            />

            {newPassword && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.25rem' }}>
                  {[1, 2, 3, 4].map((bar) => (
                    <div 
                      key={bar} 
                      style={{ 
                        flex: 1, 
                        backgroundColor: bar <= strength.activeBars ? strength.color : '#e2e8f0', 
                        borderRadius: '2px', 
                        transition: 'background-color 0.2s' 
                      }} 
                    />
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 500 }}>
                  Strength: {strength.label}
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Confirm New Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn-secondary" type="button" onClick={toggleForm}>
              Cancel
            </button>
            <button className="btn-primary" type="submit">
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
