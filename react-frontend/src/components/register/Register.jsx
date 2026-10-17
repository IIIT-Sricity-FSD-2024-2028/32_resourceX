import React, { useState, useEffect } from 'react';
import { fetchSubscriptionPlans, registerOrganization } from '../../services/register';
import './Register.css';

// Mirrors backend/src/common/password.ts's PASSWORD_PATTERN — keep in sync by hand.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.';

function FileField({ file, onChange, onClear }) {
  return (
    <div className="file-field">
      <input type="file" className="form-control" accept=".pdf,.png,.jpg,.jpeg" onChange={onChange} />
      {file && (
        <div className="file-chosen">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attach_file</span>
          <span className="file-chosen-name">{file.name}</span>
          <button type="button" onClick={onClear} title="Remove file">✕</button>
        </div>
      )}
    </div>
  );
}

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
  const [adminProof, setAdminProof] = useState(null); // { name, type, dataUrl }
  const [orgProof, setOrgProof] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
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

  const handleProofChange = (setter) => async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setFormError('Proof documents must be a PDF, PNG or JPG file.');
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      setFormError('Proof documents must be 5 MB or smaller.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormError('');
      setter({ name: file.name, type: file.type, dataUrl });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const chosenPlan = plans.find((p) => p.id === selectedPlan);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const orgSlug = form.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const adminEmailLower = form.adminEmail.trim().toLowerCase();
    const emailSuffix = `sa${orgSlug}@gmail.com`;
    if (!adminEmailLower.endsWith(emailSuffix) || !/^[a-z0-9]+$/.test(adminEmailLower.slice(0, -emailSuffix.length))) {
      setFormError(`Admin email must be in the format {name}${emailSuffix} (e.g. jordan${emailSuffix}).`);
      return;
    }
    if (!adminProof) {
      setFormError('Please upload the proof for the System Admin.');
      return;
    }
    if (!orgProof) {
      setFormError("Please upload a document proving the organization's details.");
      return;
    }
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
        subscriptionPlanId: selectedPlan,
        adminProofFileName: adminProof.name,
        adminProofFileType: adminProof.type,
        adminProofFileDataUrl: adminProof.dataUrl,
        orgProofFileName: orgProof.name,
        orgProofFileType: orgProof.type,
        orgProofFileDataUrl: orgProof.dataUrl
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
          <h3 className="register-section-title">Organization Details</h3>
          <div className="form-group">
            <label className="form-label">Organization Name</label>
            <input type="text" className="form-control" required placeholder="Acme Corp" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Organization Details Proof</label>
            <FileField file={orgProof} onChange={handleProofChange(setOrgProof)} onClear={() => setOrgProof(null)} />
            <div className="register-hint">Registration certificate or similar document. PDF, PNG or JPG, up to 5 MB.</div>
          </div>

          <h3 className="register-section-title">System Admin Details</h3>
          <div className="form-group">
            <label className="form-label">Your Name (System Admin)</label>
            <input type="text" className="form-control" required placeholder="Jordan Smith" value={form.adminName} onChange={set('adminName')} />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input type="email" className="form-control" required placeholder={`e.g. jordansa${form.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'acmecorp'}@gmail.com`} value={form.adminEmail} onChange={set('adminEmail')} />
            <div className="register-hint">Format: {'{name}'}sa{form.name.toLowerCase().replace(/[^a-z0-9]/g, '') || '{organizationname}'}@gmail.com</div>
          </div>
          <div className="form-group">
            <label className="form-label">System Admin Proof</label>
            <FileField file={adminProof} onChange={handleProofChange(setAdminProof)} onClear={() => setAdminProof(null)} />
            <div className="register-hint">Government or company ID of the System Admin. PDF, PNG or JPG, up to 5 MB.</div>
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

          <h3 className="register-section-title">Subscription Plan</h3>
          <div className="form-group">
            {chosenPlan && (
              <div className="plan-card selected plan-summary">
                <div className="plan-name">{chosenPlan.name}</div>
                <div className="plan-price">
                  ${chosenPlan.pricePerYear.toLocaleString()}
                  <span>/yr</span>
                </div>
                <div className="plan-users">Up to {chosenPlan.maxUsers} users</div>
                <div className="plan-features">{(chosenPlan.features || []).join(', ')}</div>
              </div>
            )}
            <button
              type="button"
              className="btn-secondary"
              disabled={plansLoading}
              onClick={() => setShowPlans(true)}
            >
              {chosenPlan ? 'Change Plan' : 'Select Plan'}
            </button>
            {plansError && <div className="register-error" style={{ marginTop: '0.75rem' }}>{plansError}</div>}
          </div>

          {showPlans && (
            <div className="plan-overlay" onClick={() => setShowPlans(false)}>
              <div className="plan-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="register-section-title" style={{ marginTop: 0 }}>Choose a Plan</h3>
                <div className="plan-grid">
                  {plans.map((plan) => (
                    <button
                      type="button"
                      key={plan.id}
                      className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setShowPlans(false);
                      }}
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
                <button type="button" className="btn-secondary" onClick={() => setShowPlans(false)}>
                  Cancel
                </button>
              </div>
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
