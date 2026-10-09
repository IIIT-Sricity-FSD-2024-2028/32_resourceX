import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import Login from './components/login';
import Profile from './components/profile';

// Role Dashboards (Each dashboard self-contains its views and subroutes)
import AdminDashboard from './components/dashboards/admin/AdminDashboard';

// Role Skeleton Dashboards
import DeptHeadDashboard from './components/dashboards/dept-head/DeptHeadDashboard';
import RequestorDashboard from './components/dashboards/requestor/RequestorDashboard';
import StaffDashboard from './components/dashboards/staff/StaffDashboard';
import RegistrarDashboard from './components/dashboards/registrar/RegistrarDashboard';
import OwnerDashboard from './components/dashboards/owner/OwnerDashboard';
import EmployeeDashboard from './components/dashboards/employee/EmployeeDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * Maps a user's system role to their designated dashboard route.
 */
const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'System Admin':
      return '/dashboard/admin';
    case 'Dept Head':
      return '/dashboard/dept-head';
    case 'Requestor':
      return '/dashboard/requestor';
    case 'Staff':
      return '/dashboard/staff';
    case 'Registrar':
      return '/dashboard/registrar';
    case 'Owner':
      return '/dashboard/owner';
    case 'Employee':
      return '/dashboard/employee';
    default:
      return '/dashboard/admin';
  }
};

/**
 * Route Guard: Redirects authenticated users directly to their dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }
  return children;
}

/**
 * Route Guard: Protects private dashboard routes, ensuring session exists.
 */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Smart Dashboard Dispatcher
 * Automatically routes the logged-in user to their respective role dashboard.
 */
function DashboardDispatcher() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleDashboardPath(user.role)} replace />;
}

/**
 * Login Page wrapper with programmatic router navigation
 */
function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    const targetPath = getRoleDashboardPath(user?.role);
    navigate(targetPath);
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onNavigateHome={handleNavigateHome}
    />
  );
}

/**
 * Profile Page wrapper with programmatic router navigation
 */
function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (_dest) => {
    navigate('/dashboard');
  };

  return (
    <Profile
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    />
  );
}

/**
 * Main Application Shell with React Router
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-root" style={{ minHeight: '100vh', width: '100%' }}>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

          {/* Public Login Route (Guard: if logged in -> role dashboard) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* User Profile Route (Protected) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Smart Dashboard Route (Redirects by role) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardDispatcher />
              </ProtectedRoute>
            }
          />

          {/* System Admin Dashboard */}
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Alias for system-admin path */}
          <Route path="/dashboard/system-admin/*" element={<Navigate to="/dashboard/admin" replace />} />

          {/* Department Head Dashboard */}
          <Route
            path="/dashboard/dept-head/*"
            element={
              <ProtectedRoute>
                <DeptHeadDashboard />
              </ProtectedRoute>
            }
          />

          {/* Requestor Dashboard */}
          <Route
            path="/dashboard/requestor/*"
            element={
              <ProtectedRoute>
                <RequestorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Warehouse & Staff Dashboard */}
          <Route
            path="/dashboard/staff/*"
            element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Registrar Dashboard */}
          <Route
            path="/dashboard/registrar/*"
            element={
              <ProtectedRoute>
                <RegistrarDashboard />
              </ProtectedRoute>
            }
          />

          {/* Platform Owner Dashboard */}
          <Route
            path="/dashboard/owner/*"
            element={
              <ProtectedRoute>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Platform Employee Dashboard */}
          <Route
            path="/dashboard/employee/*"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  </AuthProvider>
);
}
