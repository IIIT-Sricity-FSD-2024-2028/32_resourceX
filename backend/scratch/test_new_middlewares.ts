import http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  name: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number[];
}

function makeRequest(options: RequestOptions): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${options.path}`;
    const payload = options.body ? JSON.stringify(options.body) : '';
    
    const reqOptions: http.RequestOptions = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (payload) {
      reqOptions.headers!['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // ignore
        }
        resolve({
          status: res.statusCode || 500,
          body: parsed,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runMiddlewareTests() {
  console.log('=== STARTING SCOPED MIDDLEWARE VERIFICATION TESTS (SUPPORT, COMMUNICATONS, USERS) ===\n');

  // 1. Get Authentication Tokens
  console.log('[LOG] Fetching authentication tokens...');
  
  const adminLogin = await makeRequest({
    name: 'Admin Login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'yashwathsaacmecorp@gmail.com', password: '12345678' }
  });
  const adminToken = adminLogin.body.access_token;

  const employeeLogin = await makeRequest({
    name: 'Employee Login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'employee1@resourcex.com', password: 'password' }
  });
  const employeeToken = employeeLogin.body.access_token;

  const ownerLogin = await makeRequest({
    name: 'Owner Login',
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'owner@resourcex.com', password: 'password' }
  });
  const ownerToken = ownerLogin.body.access_token;

  if (!adminToken || !employeeToken || !ownerToken) {
    console.error('[ERROR] Authentication tokens could not be retrieved. Ensure server is running.');
    process.exit(1);
  }
  console.log('[PASS] Tokens retrieved successfully.\n');

  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };
  const employeeHeaders = { 'Authorization': `Bearer ${employeeToken}` };
  const ownerHeaders = { 'Authorization': `Bearer ${ownerToken}` };

  let passed = 0;
  let failed = 0;

  // ==========================================
  // --- 1. SUPPORT MODULE TESTS ---
  // ==========================================
  
  // Create Valid Ticket
  try {
    const res = await makeRequest({
      name: 'Create Valid Support Ticket',
      method: 'POST',
      path: '/api/support',
      headers: adminHeaders,
      body: { title: 'Printer Offline', description: 'Office printer on floor 2 is showing offline status.' }
    });
    if (res.status === 201) {
      console.log('[PASS] Support - Create Valid Ticket: Status 201');
      passed++;
    } else {
      console.error('[FAIL] Support - Create Valid Ticket:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Create Ticket failed:', e.message);
    failed++;
  }

  // Create Invalid Ticket (Validation Intercept)
  try {
    const res = await makeRequest({
      name: 'Create Invalid Support Ticket (Missing Title)',
      method: 'POST',
      path: '/api/support',
      headers: adminHeaders,
      body: { description: 'Missing title' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Title is required')) {
      console.log('[PASS] Support - Validation Middleware correctly blocked empty title: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Support - Validation Middleware did not block empty title correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Ticket validation failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 2. ANNOUNCEMENTS MODULE TESTS ---
  // ==========================================
  
  // Create Valid Announcement
  let announcementId = '';
  try {
    const res = await makeRequest({
      name: 'Create Valid Announcement',
      method: 'POST',
      path: '/api/announcements',
      headers: employeeHeaders,
      body: { title: 'Holiday Notice', message: 'The office will be closed on Friday.', type: 'General', targetOrgId: 'ALL' }
    });
    if (res.status === 201) {
      announcementId = res.body.id;
      console.log('[PASS] Announcements - Create Valid Announcement: Status 201');
      passed++;
    } else {
      console.error('[FAIL] Announcements - Create Valid Announcement:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Create Announcement failed:', e.message);
    failed++;
  }

  // Create Announcement with Invalid Type
  try {
    const res = await makeRequest({
      name: 'Create Announcement with Invalid Type',
      method: 'POST',
      path: '/api/announcements',
      headers: employeeHeaders,
      body: { title: 'System Downtime', message: 'Downtime scheduled.', type: 'Subscription', targetOrgId: 'ALL' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Invalid announcement type')) {
      console.log('[PASS] Announcements - Validation Middleware correctly blocked invalid type: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Announcements - Validation Middleware did not block invalid type correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Invalid Announcement Type test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 3. USERS MODULE TESTS (New) ---
  // ==========================================
  
  // Create Invalid User (Validation Intercept - password too short)
  try {
    const res = await makeRequest({
      name: 'Create User with Short Password',
      method: 'POST',
      path: '/api/users',
      headers: adminHeaders,
      body: { id: 'U-SHORT-PASS', name: 'Short pass test', email: 'test@resourcex.com', password: '123', role: 'Requestor' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Password must be')) {
      console.log('[PASS] Users - Validation Middleware correctly blocked short password: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Users - Validation Middleware did not block short password correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users validation test failed:', e.message);
    failed++;
  }

  // Create User with Invalid Email
  try {
    const res = await makeRequest({
      name: 'Create User with Invalid Email',
      method: 'POST',
      path: '/api/users',
      headers: adminHeaders,
      body: { id: 'U-BAD-EMAIL', name: 'Bad email test', email: 'bademail.com', password: 'validpassword123', role: 'Requestor' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('valid email address is required')) {
      console.log('[PASS] Users - Validation Middleware correctly blocked invalid email: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Users - Validation Middleware did not block invalid email correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users email validation test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 4. PROFILE MODULE TESTS (New) ---
  // ==========================================
  
  // Profile Update - Invalid Email
  try {
    const res = await makeRequest({
      name: 'Update Profile with Invalid Email',
      method: 'PATCH',
      path: '/api/profile/me',
      headers: employeeHeaders,
      body: { email: 'invalid-email-address' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('valid email address is required')) {
      console.log('[PASS] Profile - Validation Middleware correctly blocked invalid email: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Profile - Validation Middleware did not block invalid email correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile email validation test failed:', e.message);
    failed++;
  }

  // Profile Password Update - Short New Password
  try {
    const res = await makeRequest({
      name: 'Update Profile Password with Short Password',
      method: 'POST',
      path: '/api/profile/me/password',
      headers: employeeHeaders,
      body: { currentPassword: 'password', newPassword: '123' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('New password must be')) {
      console.log('[PASS] Profile - Validation Middleware correctly blocked short new password: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Profile - Validation Middleware did not block short new password correctly:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile password validation test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 5. NEWLY MERGED MODULES TESTS ---
  // ==========================================

  // Organizations Validation - missing employeeId
  try {
    const res = await makeRequest({
      name: 'Approve Org Missing Employee ID',
      method: 'PATCH',
      path: '/api/organizations/ORG-001/approve',
      headers: ownerHeaders,
      body: {}
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('employeeId is required')) {
      console.log('[PASS] Organizations - Validation Middleware correctly blocked missing employeeId: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Organizations - Validation Middleware did not block missing employeeId:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Organizations validation test failed:', e.message);
    failed++;
  }

  // Notifications Validation - missing ID
  try {
    const res = await makeRequest({
      name: 'Notifications PATCH Missing ID',
      method: 'PATCH',
      path: '/api/notifications/null',
      headers: employeeHeaders,
      body: { read: true }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Notification ID parameter is required')) {
      console.log('[PASS] Notifications - Validation Middleware correctly blocked missing ID: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Notifications - Validation Middleware did not block missing ID:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Notifications validation test failed:', e.message);
    failed++;
  }

  // Analytics Validation - missing stock ID
  try {
    const res = await makeRequest({
      name: 'Analytics Stock Threshold PATCH Missing ID',
      method: 'PATCH',
      path: '/api/analytics/stock-thresholds/null/5',
      headers: employeeHeaders,
      body: {}
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Stock threshold ID parameter is required')) {
      console.log('[PASS] Analytics - Validation Middleware correctly blocked missing ID: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Analytics - Validation Middleware did not block missing ID:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Analytics validation test failed:', e.message);
    failed++;
  }

  // Procurements Validation - multer rejects an unsupported multipart file type.
  // The file-upload middleware now parses real multipart/form-data uploads via multer
  // instead of validating base64 data-URL strings in a JSON body, so this exercises the
  // new transport with a disallowed MIME type using the platform's global fetch/FormData.
  try {
    const form = new FormData();
    form.set('resourceType', 'Server Blades v2');
    form.set('quantity', '1');
    form.set('department', 'IT Services');
    form.set('justification', 'Multer file-type validation test');
    form.set('specFile', new Blob(['not a real spec doc'], { type: 'text/plain' }), 'notes.txt');

    const res = await fetch(`${BASE_URL}/api/procurements`, {
      method: 'POST',
      headers: employeeHeaders,
      body: form,
    });
    const body: any = await res.json().catch(() => ({}));
    if (res.status === 400 && body.message && body.message.includes('unsupported file type')) {
      console.log('[PASS] Procurements - Multer Validation correctly blocked unsupported file type: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Procurements - Multer Validation did not block unsupported file type:', res.status, body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Procurements multer validation test failed:', e.message);
    failed++;
  }

  // Procurements Validation - multer rejects a file over the 5MB limit
  try {
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1024);
    const form = new FormData();
    form.set('resourceType', 'Server Blades v2');
    form.set('quantity', '1');
    form.set('department', 'IT Services');
    form.set('justification', 'Multer file-size validation test');
    form.set('specFile', new Blob([oversized], { type: 'application/pdf' }), 'huge-spec.pdf');

    const res = await fetch(`${BASE_URL}/api/procurements`, {
      method: 'POST',
      headers: employeeHeaders,
      body: form,
    });
    const body: any = await res.json().catch(() => ({}));
    if (res.status === 400 && body.message && body.message.includes('exceeds the maximum allowed size')) {
      console.log('[PASS] Procurements - Multer Validation correctly blocked oversized file: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Procurements - Multer Validation did not block oversized file:', res.status, body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Procurements multer size validation test failed:', e.message);
    failed++;
  }

  // Maintenance Validation - invalid resource ID format
  try {
    const res = await makeRequest({
      name: 'Maintenance Request Invalid ID Format',
      method: 'POST',
      path: '/api/maintenance/RES-INVALID-ID$/accept',
      headers: employeeHeaders
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Expected letters, digits, dashes')) {
      console.log('[PASS] Maintenance - Validation Middleware correctly blocked invalid ID format: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Maintenance - Validation Middleware did not block invalid ID format:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Maintenance validation test failed:', e.message);
    failed++;
  }

  // Departments Validation - invalid ID format
  try {
    const res = await makeRequest({
      name: 'Departments PATCH Invalid ID Format',
      method: 'PATCH',
      path: '/api/departments/D-INVALID-ID$',
      headers: adminHeaders,
      body: { name: 'IT Division' }
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Invalid Department ID')) {
      console.log('[PASS] Departments - Validation Middleware correctly blocked invalid ID format: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Departments - Validation Middleware did not block invalid ID format:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Departments validation test failed:', e.message);
    failed++;
  }

  // Departments Validation - empty body update
  try {
    const res = await makeRequest({
      name: 'Departments PATCH Empty Body',
      method: 'PATCH',
      path: '/api/departments/D-TEST-TEMP',
      headers: adminHeaders,
      body: {}
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('must be provided for update')) {
      console.log('[PASS] Departments - Validation Middleware correctly blocked empty body update: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Departments - Validation Middleware did not block empty body update:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Departments empty body test failed:', e.message);
    failed++;
  }

  // Resources Validation - invalid ID format
  try {
    const res = await makeRequest({
      name: 'Resources PATCH Invalid ID Format',
      method: 'PATCH',
      path: '/api/resources/RES-INVALID-ID$',
      headers: adminHeaders,
      body: {}
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Invalid Resource ID')) {
      console.log('[PASS] Resources - Validation Middleware correctly blocked invalid ID format: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Resources - Validation Middleware did not block invalid ID format:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Resources validation test failed:', e.message);
    failed++;
  }

  // Requests Validation - invalid ID format
  try {
    const res = await makeRequest({
      name: 'Requests POST Invalid ID Format',
      method: 'POST',
      path: '/api/requests/REQ-INVALID-ID$/approve',
      headers: employeeHeaders
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Expected letters, digits, dashes')) {
      console.log('[PASS] Requests - Validation Middleware correctly blocked invalid ID format: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Requests - Validation Middleware did not block invalid ID format:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Requests validation test failed:', e.message);
    failed++;
  }

  // Returns Validation - invalid ID format
  try {
    const res = await makeRequest({
      name: 'Returns POST Invalid ID Format',
      method: 'POST',
      path: '/api/returns/RES-INVALID-ID$/process',
      headers: employeeHeaders
    });
    if (res.status === 400 && res.body.message && res.body.message.includes('Expected letters, digits, dashes')) {
      console.log('[PASS] Returns - Validation Middleware correctly blocked invalid ID format: Status 400');
      passed++;
    } else {
      console.error('[FAIL] Returns - Validation Middleware did not block invalid ID format:', res.status, res.body);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Returns validation test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 6. RATE LIMITER VERIFICATION ---
  // ==========================================
  console.log('[LOG] Testing Users Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedUsers = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Users Request ${i}`,
        method: 'GET',
        path: '/api/users',
        headers: adminHeaders
      });
      if (res.status === 429) {
        rateLimitedUsers = true;
        break;
      }
    }
    if (rateLimitedUsers) {
      console.log('[PASS] Users - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Users - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Users Rate Limiter test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Profile Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedProfile = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Profile Request ${i}`,
        method: 'GET',
        path: '/api/profile/me',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedProfile = true;
        break;
      }
    }
    if (rateLimitedProfile) {
      console.log('[PASS] Profile - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Profile - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Profile Rate Limiter test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Organizations Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedOrganizations = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Organizations Request ${i}`,
        method: 'GET',
        path: '/api/organizations/public',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedOrganizations = true;
        break;
      }
    }
    if (rateLimitedOrganizations) {
      console.log('[PASS] Organizations - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Organizations - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Organizations Rate Limiter test failed:', e.message);
    failed++;
  }

  // --- Departments Security Headers & Rate Limiting Check ---
  console.log('[LOG] Testing Departments Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Departments Security Headers',
      method: 'GET',
      path: '/api/departments',
      headers: adminHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Departments - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Departments - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Departments Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Departments Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedDepartments = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Departments Request ${i}`,
        method: 'GET',
        path: '/api/departments',
        headers: adminHeaders
      });
      if (res.status === 429) {
        rateLimitedDepartments = true;
        break;
      }
    }
    if (rateLimitedDepartments) {
      console.log('[PASS] Departments - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Departments - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Departments Rate Limiter test failed:', e.message);
    failed++;
  }

  // --- Resources Security Headers & Rate Limiting Check ---
  console.log('[LOG] Testing Resources Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Resources Security Headers',
      method: 'GET',
      path: '/api/resources',
      headers: adminHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Resources - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Resources - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Resources Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Resources Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedResources = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Resources Request ${i}`,
        method: 'GET',
        path: '/api/resources',
        headers: adminHeaders
      });
      if (res.status === 429) {
        rateLimitedResources = true;
        break;
      }
    }
    if (rateLimitedResources) {
      console.log('[PASS] Resources - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Resources - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Resources Rate Limiter test failed:', e.message);
    failed++;
  }

  // --- Requests Security Headers & Rate Limiting Check ---
  console.log('[LOG] Testing Requests Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Requests Security Headers',
      method: 'GET',
      path: '/api/requests',
      headers: employeeHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Requests - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Requests - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Requests Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Requests Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedRequests = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Requests Request ${i}`,
        method: 'GET',
        path: '/api/requests',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedRequests = true;
        break;
      }
    }
    if (rateLimitedRequests) {
      console.log('[PASS] Requests - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Requests - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Requests Rate Limiter test failed:', e.message);
    failed++;
  }

  // --- Returns Security Headers & Rate Limiting Check ---
  console.log('[LOG] Testing Returns Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Returns Security Headers',
      method: 'GET',
      path: '/api/returns/history',
      headers: employeeHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Returns - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Returns - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Returns Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Returns Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedReturns = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Returns Request ${i}`,
        method: 'GET',
        path: '/api/returns/history',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedReturns = true;
        break;
      }
    }
    if (rateLimitedReturns) {
      console.log('[PASS] Returns - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Returns - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Returns Rate Limiter test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 6A. INVOICES MODULE TESTS ---
  // ==========================================
  console.log('[LOG] Testing Invoices Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Invoices Security Headers',
      method: 'GET',
      path: '/api/invoices',
      headers: adminHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Invoices - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Invoices - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Invoices Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Invoices Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedInvoices = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Invoices Request ${i}`,
        method: 'GET',
        path: '/api/invoices',
        headers: adminHeaders
      });
      if (res.status === 429) {
        rateLimitedInvoices = true;
        break;
      }
    }
    if (rateLimitedInvoices) {
      console.log('[PASS] Invoices - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Invoices - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Invoices Rate Limiter test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 6B. SUBSCRIPTIONS MODULE TESTS ---
  // ==========================================
  console.log('[LOG] Testing Subscriptions Security Headers middleware...');
  try {
    const res = await makeRequest({
      name: 'Get Subscriptions Security Headers',
      method: 'GET',
      path: '/api/subscriptions/plans',
      headers: employeeHeaders
    });
    const xFrame = res.headers['x-frame-options'];
    const xContent = res.headers['x-content-type-options'];
    if (xFrame === 'DENY' && xContent === 'nosniff') {
      console.log('[PASS] Subscriptions - Security Headers injected correctly (DENY & nosniff)');
      passed++;
    } else {
      console.error('[FAIL] Subscriptions - Security Headers missing/invalid:', res.headers);
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Subscriptions Security Headers test failed:', e.message);
    failed++;
  }

  console.log('[LOG] Testing Subscriptions Rate Limiter middleware (firing 65 requests fast)...');
  let rateLimitedSubscriptions = false;
  try {
    for (let i = 0; i < 65; i++) {
      const res = await makeRequest({
        name: `Rate Limit Subscriptions Request ${i}`,
        method: 'GET',
        path: '/api/subscriptions/plans',
        headers: employeeHeaders
      });
      if (res.status === 429) {
        rateLimitedSubscriptions = true;
        break;
      }
    }
    if (rateLimitedSubscriptions) {
      console.log('[PASS] Subscriptions - Security Rate Limiter triggered: Status 429');
      passed++;
    } else {
      console.error('[FAIL] Subscriptions - Security Rate Limiter did not trigger after 60+ requests.');
      failed++;
    }
  } catch (e: any) {
    console.error('[ERROR] Subscriptions Rate Limiter test failed:', e.message);
    failed++;
  }

  // ==========================================
  // --- 7. LOG FILE CREATION AND ERROR TRIGGERS ---
  // ==========================================
  console.log('[LOG] Triggering errors to verify module-scoped exception filters...');
  try {
    // Trigger Support error (resolve non-existent ticket)
    await makeRequest({
      name: 'Trigger Support Exception',
      method: 'PATCH',
      path: '/api/support/TKT-INVALID/resolve',
      headers: employeeHeaders,
      body: { reply: 'Testing error logger' }
    });
    // Trigger Announcements error (reply to non-existent announcement)
    await makeRequest({
      name: 'Trigger Announcements Exception',
      method: 'PATCH',
      path: '/api/announcements/ANN-INVALID/reply',
      headers: adminHeaders,
      body: { reply: 'Testing error logger' }
    });
    // Trigger Users error (update non-existent user)
    await makeRequest({
      name: 'Trigger Users Exception',
      method: 'PATCH',
      path: '/api/users/U-INVALID',
      headers: adminHeaders,
      body: { name: 'New Name' }
    });
    // Trigger Profile error (password update with missing fields)
    await makeRequest({
      name: 'Trigger Profile Exception',
      method: 'POST',
      path: '/api/profile/me/password',
      headers: employeeHeaders,
      body: { currentPassword: '' }
    });
    // Trigger Organizations error
    await makeRequest({
      name: 'Trigger Organizations Exception',
      method: 'PATCH',
      path: '/api/organizations/ORG-INVALID/approve',
      headers: adminHeaders,
      body: { employeeId: 'E1' }
    });
    // Trigger Notifications error
    await makeRequest({
      name: 'Trigger Notifications Exception',
      method: 'PATCH',
      path: '/api/notifications/NOT-FOUND',
      headers: employeeHeaders,
      body: { read: true }
    });
    // Trigger Analytics error
    await makeRequest({
      name: 'Trigger Analytics Exception',
      method: 'PATCH',
      path: '/api/analytics/stock-thresholds/NOT-FOUND/5',
      headers: employeeHeaders,
      body: {}
    });
    // Trigger Platform Analytics access entry
    await makeRequest({
      name: 'Trigger Platform Analytics Access Entry',
      method: 'GET',
      path: '/api/platform-analytics',
      headers: adminHeaders
    });
    // Trigger Departments validation error & access log entries
    await makeRequest({
      name: 'Trigger Departments Access Log Entry',
      method: 'GET',
      path: '/api/departments',
      headers: adminHeaders
    });
    await makeRequest({
      name: 'Trigger Departments Validation Error',
      method: 'PATCH',
      path: '/api/departments/D-INVALID-ID-FORMAT',
      headers: adminHeaders,
      body: { name: '' } // triggers requireText check
    });
    // Trigger Resources validation error & access log entries
    await makeRequest({
      name: 'Trigger Resources Access Log Entry',
      method: 'GET',
      path: '/api/resources',
      headers: adminHeaders
    });
    await makeRequest({
      name: 'Trigger Resources Validation Error',
      method: 'PATCH',
      path: '/api/resources/RES-INVALID-ID-FORMAT',
      headers: adminHeaders,
      body: { type: '' } // triggers invalid id format
    });
    // Trigger Requests validation error & access log entries
    await makeRequest({
      name: 'Trigger Requests Access Log Entry',
      method: 'GET',
      path: '/api/requests',
      headers: employeeHeaders
    });
    await makeRequest({
      name: 'Trigger Requests Validation Error',
      method: 'POST',
      path: '/api/requests/REQ-INVALID-ID%/approve',
      headers: employeeHeaders
    });
    // Trigger Returns validation error & access log entries
    await makeRequest({
      name: 'Trigger Returns Access Log Entry',
      method: 'GET',
      path: '/api/returns/history',
      headers: employeeHeaders
    });
    await makeRequest({
      name: 'Trigger Returns Validation Error',
      method: 'POST',
      path: '/api/returns/RES-INVALID-ID%/process',
      headers: employeeHeaders
    });
    // Trigger Invoices error (request invoices with unauthorized user role 'Staff')
    await makeRequest({
      name: 'Trigger Invoices Exception',
      method: 'GET',
      path: '/api/invoices',
      headers: employeeHeaders
    });
    // Trigger Subscriptions error (request plans with invalid method POST)
    await makeRequest({
      name: 'Trigger Subscriptions Exception',
      method: 'POST',
      path: '/api/subscriptions/plans',
      headers: employeeHeaders
    });
  } catch (e) {
    // ignore
  }

  // Wait a small moment for file writes to finish
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('[LOG] Verifying module-scoped log files in logs/ directory...');
  const logsDir = path.join(process.cwd(), 'logs');
  const filesToCheck = [
    'support-access.log',
    'support-error.log',
    'communications-access.log',
    'communications-error.log',
    'users-access.log',
    'users-error.log',
    'profile-access.log',
    'profile-error.log',
    'analytics-access.log',
    'analytics-error.log',
    'platform-analytics-access.log',
    'platform-analytics-error.log',
    'organizations-access.log',
    'organizations-error.log',
    'notifications-access.log',
    'notifications-error.log',
    'departments-access.log',
    'departments-error.log',
    'resources-access.log',
    'resources-error.log',
    'requests-access.log',
    'requests-error.log',
    'returns-access.log',
    'returns-error.log',
    'invoices-access.log',
    'invoices-error.log',
    'subscriptions-access.log',
    'subscriptions-error.log'
  ];

  let logsPassed = true;
  for (const file of filesToCheck) {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        console.log(`[PASS] Log File - logs/${file} exists and contains data (${stats.size} bytes).`);
      } else {
        console.warn(`[WARN] Log File - logs/${file} exists but is empty.`);
      }
    } else {
      console.error(`[FAIL] Log File - logs/${file} does not exist.`);
      logsPassed = false;
    }
  }
  if (logsPassed) {
    passed++;
  } else {
    failed++;
  }

  console.log('\n=== MIDDLEWARE VERIFICATION SUMMARY ===');
  console.log(`Passed: ${passed} / 34`);
  console.log(`Failed: ${failed} / 34`);

  if (failed === 0) {
    console.log('\n[SUCCESS] All module middlewares (including new ones) are correctly modularized and functional!');
  } else {
    console.error('\n[FAILURE] Some middleware tests failed. Check log outputs above.');
    process.exit(1);
  }
}

runMiddlewareTests().catch((e) => {
  console.error('[FATAL ERROR] Test suite aborted:', e);
  process.exit(1);
});
