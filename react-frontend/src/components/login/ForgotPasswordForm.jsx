import React, { useEffect, useState } from 'react';
import { requestPasswordReset, verifyPasswordResetOtp, resetPassword } from '../../services/auth';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const RESEND_SECONDS = 60;

/**
 * Forgot password flow in three steps:
 *   1. enter email -> a 6-digit code is emailed
 *   2. enter the code -> the email is verified
 *   3. set a new password
 *
 * Props:
 *   - onBackToLogin(message?): return to the sign-in form, optionally with a success message
 */
export default function ForgotPasswordForm({ onBackToLogin }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const run = async (action) => {
    setIsSubmitting(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendCode = () => run(async () => {
    const result = await requestPasswordReset(email);
    setInfo(result.message);
    setOtp('');
    setResendIn(RESEND_SECONDS);
    setStep('otp');
  });

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    sendCode();
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(otp)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    run(async () => {
      const result = await verifyPasswordResetOtp(email, otp);
      setResetToken(result.resetToken);
      setInfo(result.message);
      setStep('password');
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError('Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    run(async () => {
      const result = await resetPassword(resetToken, newPassword);
      onBackToLogin(result.message);
    });
  };

  const subtitles = {
    email: 'Enter your registered email. We will send you a 6-digit verification code.',
    otp: `Enter the 6-digit code sent to ${email.trim().toLowerCase()}.`,
    password: 'Your email is verified. Choose a new password.',
  };

  return (
    <div className="credentials-step">
      <button type="button" className="login-back-btn" onClick={() => onBackToLogin()}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Back to Sign In
      </button>

      <h2 className="login-title">Reset Password</h2>
      <p className="login-subtitle">{subtitles[step]}</p>

      {error && (
        <div className="login-error-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          <span>{error}</span>
        </div>
      )}
      {info && !error && step !== 'email' && (
        <div className="login-info-banner">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mark_email_read</span>
          <span>{info}</span>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} noValidate>
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="reset-email-input">Email Address</label>
            <input
              id="reset-email-input"
              type="email"
              className="login-form-control"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending code...' : 'Send Verification Code →'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} noValidate>
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="otp-input">Verification Code</label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="login-form-control login-otp-input"
              placeholder="000000"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
              autoFocus
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify Code →'}
          </button>
          <div className="login-link-row">
            <button type="button" className="login-link-btn" onClick={() => { setStep('email'); setError(''); }}>
              Change email
            </button>
            <button type="button" className="login-link-btn" onClick={sendCode} disabled={isSubmitting || resendIn > 0}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="new-password-input">New Password</label>
            <input
              id="new-password-input"
              type={showPassword ? 'text' : 'password'}
              className="login-form-control"
              placeholder="At least 8 characters, 1 uppercase, 1 number, 1 symbol"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          <div className="login-form-group">
            <label className="login-form-label" htmlFor="confirm-password-input">Confirm New Password</label>
            <input
              id="confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              className="login-form-control"
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            />
          </div>
          <label className="login-show-password">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show passwords
          </label>
          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password →'}
          </button>
        </form>
      )}
    </div>
  );
}
