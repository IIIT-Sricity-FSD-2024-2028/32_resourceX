import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import AppHeader from '../AppHeader';
import AvatarHeader from './AvatarHeader';
import AccountInfo from './AccountInfo';
import Preferences from './Preferences';
import SecuritySettings from './SecuritySettings';
import { fetchProfile, updateProfile, updatePassword } from '../../services/profile';
import { useAuth } from '../../context/AuthContext';

/**
 * Self-contained Profile Component
 * Manages user settings, profile editing, and password updates via services/profile.js
 */
export default function Profile({ onLogout, onNavigate }) {
  const navigate = useNavigate();
  const { updateUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;
    fetchProfile()
      .then((profileData) => {
        if (isMounted) {
          setUser(profileData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsLoading(false);
          if (err.message === 'UNAUTHORIZED') {
            if (onLogout) {
              onLogout();
            } else {
              logout();
              navigate('/login');
            }
            return;
          }
          setError(err.message || "Failed to load profile from backend server.");
          addToast(err.message || "Backend unreachable.", "error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onLogout, navigate]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchProfile()
      .then((profileData) => {
        setUser(profileData);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        setError(err.message || "Failed to load profile from backend server.");
        addToast(err.message || "Backend unreachable.", "error");
      });
  };

  // Update name in local state
  const handleNameChange = (newName) => {
    setUser((prev) => ({ ...prev, name: newName }));
  };

  // Toggle notifications in local state
  const handleToggleNotifications = (checked) => {
    setUser((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, notifications: checked }
    }));
  };

  // Save profile changes to backend via profile service
  const handleSaveChanges = async () => {
    try {
      const updatedUser = await updateProfile(user);
      setUser(updatedUser);
      updateUser(updatedUser);
      addToast("Profile changes saved successfully! ✅", "success");
    } catch (e) {
      addToast(`Save failed: ${e.message} ❌`, "error");
    }
  };

  // Update password via profile service
  const handleUpdatePassword = async (currentPassword, newPassword, onSuccess) => {
    try {
      await updatePassword(currentPassword, newPassword);
      addToast("Password updated successfully! ✅", "success");
      if (onSuccess) onSuccess();
    } catch (e) {
      addToast(`Password update failed: ${e.message} ❌`, "error");
    }
  };

  if (error && !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)', fontFamily: 'sans-serif', padding: '1rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '1rem' }}>cloud_off</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.5rem' }}>Backend Connection Failed</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  logout();
                  navigate('/login');
                }
              }}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Go to Login
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleRetry}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading profile...</div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Navigation matching profile.html */}
      <aside
        className="sidebar"
        style={{
          width: '260px',
          background: 'white',
          borderRight: '1px solid var(--border-color, #e2e8f0)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 2rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-color, #0F386E)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            RX
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color, #0F386E)' }}>
            ResourceX
          </div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
          <li
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '6px'
            }}
            onClick={() => {
              if (onNavigate) {
                onNavigate('dashboard');
              } else {
                navigate(-1);
              }
            }}
          >
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '1.25rem' }}>
              arrow_back
            </span>
            Return to App
          </li>
        </ul>
      </aside>

      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <AppHeader />

        <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            
            {/* Avatar Header */}
            <AvatarHeader name={user.name} role={user.role} />

            {/* Account Information Form */}
            <AccountInfo 
              id={user.id} 
              department={user.department} 
              email={user.email} 
              name={user.name} 
              onNameChange={handleNameChange}
            />

            {/* Notification Preferences */}
            <Preferences 
              notificationsEnabled={user.preferences ? user.preferences.notifications : true} 
              onToggleNotifications={handleToggleNotifications}
            />

            {/* Security & Password Settings */}
            <SecuritySettings onUpdatePassword={handleUpdatePassword} />

            {/* Footer Form Actions */}
            <div style={{ padding: '0 2rem 2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('dashboard');
                  } else {
                    navigate('/dashboard');
                  }
                }}
              >
                Back To Dashboard
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* Toast Notification Container */}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="material-symbols-outlined">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'warning'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
