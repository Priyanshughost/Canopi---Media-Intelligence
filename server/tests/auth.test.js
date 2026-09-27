import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../src/middleware/auth.middleware.js';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

test('Authentication & Organization Scoping Service Tests', async (t) => {
  let isServerRunning = false;
  try {
    const health = await fetch(`${API_URL}/webhooks/health`, { signal: AbortSignal.timeout(1500) });
    if (health.ok) isServerRunning = true;
  } catch (err) {
    isServerRunning = false;
  }

  if (!isServerRunning) {
    console.log('[Auth Tests] Skipping live HTTP auth tests: server is not actively listening on port 5000');
    return;
  }

  const testEmail = `org_test_${Date.now()}@canopi.test`;
  let authToken = null;
  let userOrg = null;
  let createdProjectId = null;

  await t.test('POST /api/auth/demo-credentials - should return public demo credentials', async () => {
    const res = await fetch(`${API_URL}/auth/demo-credentials`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.email, 'demo@canopi.test');
    assert.strictEqual(body.password, 'Demo@1234');
    assert.strictEqual(body.organizationName, 'Demo NGO');
  });

  await t.test('POST /api/auth/signup - should create new Org and User and return JWT', async () => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'EcoGuardians Global',
        organizationType: 'NGO',
        name: 'Jane Forest Officer',
        email: testEmail,
        password: 'Password@123',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.token);
    assert.strictEqual(body.user.email, testEmail);
    assert.strictEqual(body.user.passwordHash, undefined); // Sensitive hash must not leak
    assert.strictEqual(body.organization.name, 'EcoGuardians Global');
    authToken = body.token;
    userOrg = body.organization;
  });

  await t.test('POST /api/auth/login - should authenticate user and return valid JWT', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.strictEqual(body.user.email, testEmail);
    assert.strictEqual(body.user.passwordHash, undefined);

    const decoded = jwt.verify(body.token, JWT_SECRET);
    assert.strictEqual(decoded.email, testEmail);
    assert.strictEqual(decoded.organizationId, userOrg._id);
  });

  await t.test('GET /api/auth/me - should return profile with Bearer token', async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.user.email, testEmail);
    assert.strictEqual(body.organization.name, 'EcoGuardians Global');
  });

  await t.test('POST /api/auth/invite-teammate - should add teammate to same organization', async () => {
    const teammateEmail = `teammate_${Date.now()}@canopi.test`;
    const res = await fetch(`${API_URL}/auth/invite-teammate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Alex Field Ranger',
        email: teammateEmail,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.user.email, teammateEmail);
    assert.strictEqual(body.user.organizationId, userOrg._id);
  });

  await t.test('Organization Isolation: unauthenticated or cross-org access is blocked', async () => {
    // 1. Unauthenticated request to /api/projects fails with 401
    const unauthRes = await fetch(`${API_URL}/projects`);
    assert.strictEqual(unauthRes.status, 401);

    // 2. Authenticated request creates a project under userOrg
    const createRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Rainforest Canopy Restoration Phase 1',
        organization: 'EcoGuardians Global',
        description: 'Planting native canopy trees in protected forest reserves',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createdProject = await createRes.json();
    createdProjectId = createdProject._id;
    assert.strictEqual(createdProject.organizationId, userOrg._id);

    // 3. Another user from a different organization cannot access this project
    const otherOrgSignup = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Rival Mining CSR',
        organizationType: 'CSR',
        name: 'Other Org Officer',
        email: `rival_${Date.now()}@canopi.test`,
        password: 'Password@123',
      }),
    });
    const otherOrgData = await otherOrgSignup.json();
    const rivalToken = otherOrgData.token;

    // Rival user trying to fetch createdProjectId gets 404 (does not leak project existence)
    const crossOrgRes = await fetch(`${API_URL}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${rivalToken}` },
    });
    assert.strictEqual(crossOrgRes.status, 404);
  });
});
