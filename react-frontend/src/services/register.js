// Organization Registration Service for React Frontend
// Public endpoints (no JWT required), so this uses fetch directly like services/auth.js

const API_BASE = '/api';

export const fetchSubscriptionPlans = async () => {
  const res = await fetch(`${API_BASE}/subscriptions/plans`);
  if (!res.ok) {
    throw new Error(`Failed to load subscription plans (status ${res.status}).`);
  }
  return await res.json();
};

export const registerOrganization = async (payload) => {
  const res = await fetch(`${API_BASE}/organizations/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Nest validation errors come back as an array of messages
    const message = Array.isArray(err.message) ? err.message.join(' ') : err.message;
    throw new Error(message || 'Registration failed');
  }
  return await res.json();
};
