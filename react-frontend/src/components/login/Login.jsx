import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSelector from './RoleSelector';
import OrgSelector from './OrgSelector';
import CredentialsForm from './CredentialsForm';
import { loginUser } from '../../services/auth';
import './Login.css';

/**
 * Modular Login Component for ResourceX
 * Supports 3-step authentication flow:
 *   1. Role Selection (Platform vs Tenant roles)
 *   2. Organization Discovery (for Tenant roles)
 *   3. Credential Submission & Quick Login Auto-fill
 *
 * Props:
 *   - onLoginSuccess(user): Callback invoked when authentication succeeds
 *   - onNavigateHome(): Callback or link to return to landing/home page
 */
export default function Login({ onLoginSuccess, onNavigateHome }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('role'); // 'role' | 'org' | 'credentials'
  const [selectedRole, setSelectedRole] = useState(null);
  const [isPlatformRole, setIsPlatformRole] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Step 1 -> Step 2 or 3
  const handleSelectRole = (role, isPlatform) => {
    setSelectedRole(role);
    setIsPlatformRole(isPlatform);
    setAuthError(null);

    if (isPlatform) {
      setSelectedOrg({ id: 'PLATFORM', name: 'Platform Workspace' });
      setStep('credentials');
    } else {
      setStep('org');
    }
  };

  // Step 2 -> Step 3
  const handleSelectOrg = (orgId, orgName) => {
    setSelectedOrg({ id: orgId, name: orgName });
    setAuthError(null);
    setStep('credentials');
  };

  // Step 3: Handle credentials submission
  const handleSubmitCredentials = async ({ email, password }) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const user = await loginUser(email, password, selectedOrg?.id);
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

  const handleBackFromCredentials = () => {
    setAuthError(null);
    if (isPlatformRole) {
      setStep('role');
    } else {
      setStep('org');
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

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <RoleSelector
            onSelectRole={handleSelectRole}
            onRegisterOrg={() => {
              window.location.href = '../pages/register.html';
            }}
          />
        )}

        {/* Step 2: Organization Selection */}
        {step === 'org' && (
          <OrgSelector
            selectedRole={selectedRole}
            onSelectOrg={handleSelectOrg}
            onBack={handleBackToRoles}
          />
        )}

        {/* Step 3: Credentials Input & Quick Login */}
        {step === 'credentials' && (
          <CredentialsForm
            selectedRole={selectedRole}
            selectedOrg={selectedOrg}
            isPlatformRole={isPlatformRole}
            onSubmit={handleSubmitCredentials}
            isSubmitting={isSubmitting}
            authError={authError}
            onBack={handleBackFromCredentials}
          />
        )}
      </div>
    </div>
  );
}
