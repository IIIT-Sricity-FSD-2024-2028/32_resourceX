import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CredentialsForm from './CredentialsForm';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

/**
 * Modular Login Component for ResourceX
 * Single-step sign-in: the dashboard is detected from the account's email and password
 * (no role or organization selection). Includes demo quick login for every actor.
 *
 * Props:
 *   - onLoginSuccess(user): Callback invoked when authentication succeeds
 *   - onNavigateHome(): Callback or link to return to landing/home page
 */
export default function Login({ onLoginSuccess, onNavigateHome }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Step 2: Handle credentials submission
  const handleSubmitCredentials = async ({ email, password }) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const user = await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Return to Home / Landing */}
        <button
          type="button"
          className="login-home-link"
          onClick={handleHomeClick}
          title="Return to home page"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Home
        </button>

        {/* Brand Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">R</div>
          <div className="login-logo-text">ResourceX</div>
        </div>

        <CredentialsForm
          onSubmit={handleSubmitCredentials}
          isSubmitting={isSubmitting}
          authError={authError}
          onRegisterOrg={() => navigate('/register')}
        />
      </div>
    </div>
  );
}
