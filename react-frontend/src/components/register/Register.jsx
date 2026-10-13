import React, { useState, useEffect } from 'react';
import { fetchSubscriptionPlans, registerOrganization } from '../../services/register';
import './Register.css';

// Mirrors backend/src/common/password.ts's PASSWORD_PATTERN — keep in sync by hand.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.';

/**
 * Public "Register your Organization" page (React port of register.html).
 *
 * Props:
 *   - onNavigateLogin(): go to the sign-in page
 *   - onNavigateHome(): go back to the landing page
 */
export default function Register({ onNavigateLogin, onNavigateHome }) {
  const [form, setForm] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSubscriptionPlans()
      .then((data) => !cancelled && setPlans(data || []))
      .catch(() => !cancelled && setPlansError('Failed to load subscription plans.'))
      .finally(() => !cancelled && setPlansLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPlan) {
      setFormError('Please select a subscription plan.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      setFormError(PASSWORD_RULE_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerOrganization({
        name: form.name.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        password: form.password,
        subscriptionPlanId: selectedPlan
      });
      setIsDone(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="register-wrapper">
        <div className="register-card register-success">
          <span className="material-symbols-outlined register-success-icon">check_circle</span>
          <h2>Registration submitted!</h2>
          <p>
            Please wait for approval by the Platform Owner. Once approved, sign in as System Admin using
            the email and password you just created.
          </p>
          <button type="button" className="btn-primary" onClick={onNavigateLogin}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <button type="button" className="register-home-link" onClick={onNavigateHome} title="Return to home page">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Home
        </button>

        <div className="register-brand">
          <div className="register-logo-icon">R</div>
          <div className="register-logo-text">ResourceX</div>
        </div>
        <p className="register-subtitle">Register your Organization</p>

        <form onSubmit={handleSubmit}>
          <div className="register-grid">
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input type="text" className="form-control" required placeholder="Acme Corp" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Your Name (System Admin)</label>
              <input type="text" className="form-control" required placeholder="Jordan Smith" value={form.adminName} onChange={set('adminName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input type="email" className="form-control" required placeholder="admin@acme.com" value={form.adminEmail} onChange={set('adminEmail')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required minLength={8} placeholder="Create a password" value={form.password} onChange={set('password')} />
              <div className="register-hint">At least 8 characters, with an uppercase letter, a number, and a symbol.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" required placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          </div>

          <h3 className="register-section-title">Select a Subscription Plan</h3>
          {plansLoading ? (
            <div className="register-muted">Loading plans...</div>
          ) : plansError ? (
            <div className="register-error">{plansError}</div>
          ) : (
            <div className="plan-grid">
              {plans.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    ${plan.pricePerYear.toLocaleString()}
                    <span>/yr</span>
                  </div>
                  <div className="plan-users">Up to {plan.maxUsers} users</div>
                  <div className="plan-features">{(plan.features || []).join(', ')}</div>
                </button>
              ))}
            </div>
          )}

          {formError && <div className="register-error">{formError}</div>}

          <button type="submit" className="btn-primary register-submit" disabled={isSubmitting || plansLoading}>
            {isSubmitting ? 'Registering...' : 'Register Organization'}
          </button>

          <div className="register-footer">
            <button type="button" onClick={onNavigateLogin}>
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
