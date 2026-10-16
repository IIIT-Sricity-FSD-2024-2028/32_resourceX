document.addEventListener('DOMContentLoaded', async () => {
    try {
        const plans = await fetch('http://localhost:3000/api/subscriptions/plans').then(res => res.json());
        renderPlans(plans);
    } catch (e) {
        console.error(e);
        document.getElementById('plansContainer').innerHTML = '<div class="alert alert-danger">Failed to load subscription plans.</div>';
    }
});

function renderPlans(plans) {
    const container = document.getElementById('plansContainer');
    container.innerHTML = '';
    
    plans.forEach(plan => {
        container.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card h-100 plan-card" onclick="selectPlan('${plan.id}', this)">
                    <div class="card-body text-center">
                        <h5 class="card-title text-primary">${plan.name}</h5>
                        <h3 class="my-3">$${plan.pricePerYear}<small class="text-muted fs-6">/yr</small></h3>
                        <p class="text-muted small">Up to ${plan.maxUsers} users</p>
                        <p class="small text-muted mb-0">${plan.features.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

function selectPlan(planId, element) {
    document.getElementById('selectedPlan').value = planId;
    
    document.querySelectorAll('.plan-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

// Mirrors backend/src/common/password.ts's PASSWORD_PATTERN — kept in sync by hand
// since the frontend has no build step to share it from the backend source.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const PASSWORD_RULE_MESSAGE =
    'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one symbol.';

function showPasswordError(message) {
    const wrap = document.getElementById('passwordErrorWrap');
    const box = document.getElementById('passwordError');
    if (!message) {
        wrap.style.display = 'none';
        box.textContent = '';
        return;
    }
    box.textContent = message;
    wrap.style.display = 'block';
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('orgName').value;
    const adminName = document.getElementById('adminName').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const subscriptionPlanId = document.getElementById('selectedPlan').value;

    showPasswordError('');

    if (!subscriptionPlanId) {
        alert('Please select a subscription plan.');
        return;
    }

    if (password !== confirmPassword) {
        showPasswordError('Passwords do not match.');
        return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
        showPasswordError(PASSWORD_RULE_MESSAGE);
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/organizations/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, adminName, adminEmail, password, subscriptionPlanId })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Registration failed');
        }

        alert('Registration successful! Please wait for approval by the Platform Owner. Once approved, sign in as System Admin using the email and password you just created.');
        window.location.href = 'login.html';
    } catch (err) {
        alert(err.message);
    }
}
