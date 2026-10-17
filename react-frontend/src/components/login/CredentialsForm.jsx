import React, { useState } from 'react';
export default function CredentialsForm({
  onSubmit,
  isSubmitting,
  authError,
  onRegisterOrg
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (val) => {
    if (!val.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    if (!password.trim()) {
      alert('Please enter your password.');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <div className="credentials-step">
      <h2 className="login-title">Welcome Back</h2>
      <p className="login-subtitle">Sign in with your email and password. Your dashboard opens automatically.</p>

      {authError && (
        <div className="login-error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="login-form-group">
          <label className="login-form-label" htmlFor="email-input">Email Address</label>
          <input
            id="email-input"
            type="email"
            className={`login-form-control ${emailError ? 'error' : ''}`}
            placeholder="Enter your registered email"
            value={email}
            onChange={handleEmailChange}
            autoFocus
          />
          {emailError && (
            <div className="login-error-msg">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
              {emailError}
            </div>
          )}
        </div>

        <div className="login-form-group" style={{ position: 'relative' }}>
          <label className="login-form-label" htmlFor="password-input">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              className="login-form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="login-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Authenticating...
            </>
          ) : (
            <>
              Sign In &rarr;
            </>
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
        <button
          type="button"
          onClick={onRegisterOrg}
          style={{ background: 'none', border: 'none', color: 'var(--primary-color, #0F386E)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          New here? Register your Organization &rarr;
        </button>
      </div>
    </div>
  );
}
