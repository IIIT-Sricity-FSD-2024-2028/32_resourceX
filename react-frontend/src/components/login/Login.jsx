import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSelector from './RoleSelector';
import CredentialsForm from './CredentialsForm';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

/**
 * Modular Login Component for ResourceX
 * Supports clean 2-step authentication flow:
 *   1. Role Selection
 *   2. Credential Submission & Quick Login Auto-fill
 *   (Organization selection removed - user organization is resolved by account credentials)
 *
 * Props:
 *   - onLoginSuccess(user): Callback invoked when authentication succeeds
 *   - onNavigateHome(): Callback or link to return to landing/home page
 */
export default function Login({ onLoginSuccess, onNavigateHome }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('role'); // 'role' | 'credentials'
  const [selectedRole, setSelectedRole] = useState(null);
  const [isPlatformRole, setIsPlatformRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Step 1: Role Selection -> Step 2: Credentials Form (skips organization selection)
  const handleSelectRole = (role, isPlatform) => {
    setSelectedRole(role);
    setIsPlatformRole(isPlatform);
    setAuthError(null);
    setStep('credentials');
  };

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

  const handleBackToRoles = () => {
    setAuthError(null);
    setStep('role');
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

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <RoleSelector
            onSelectRole={handleSelectRole}
            onRegisterOrg={() => navigate('/register')}
          />
        )}

        {/* Step 2: Credentials Input & Quick Login */}
        {step === 'credentials' && (
          <CredentialsForm
            selectedRole={selectedRole}
            isPlatformRole={isPlatformRole}
            onSubmit={handleSubmitCredentials}
            isSubmitting={isSubmitting}
            authError={authError}
            onBack={handleBackToRoles}
          />
        )}
      </div>
    </div>
  );
}
