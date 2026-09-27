import test from 'node:test';
import assert from 'node:assert';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

test('Cloudinary AI Impact Platform API Tests', async (t) => {
  let isServerRunning = false;
  try {
    const health = await fetch(`${API_URL}/webhooks/health`, { signal: AbortSignal.timeout(1500) });
    if (health.ok) isServerRunning = true;
  } catch (err) {
    isServerRunning = false;
  }

  if (!isServerRunning) {
    console.log('[API Tests] Skipping live HTTP integration tests: server is not actively listening on port 5000');
    return;
  }
  
  let projectId;

  await t.test('GET /api/projects - should return a list of active projects (Scenario A)', async () => {
    const res = await fetch(`${API_URL}/projects`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    if (body.length > 0) {
      assert.ok(body[0]._id);
      projectId = body[0]._id;
    }
  });

  await t.test('GET /api/assets?projectId=<id> - should fetch assets (Scenario B)', async () => {
    if (!projectId) return; // Skip if no projects
    const res = await fetch(`${API_URL}/assets?projectId=${projectId}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
  });

  await t.test('POST /api/search/semantic - should fail cleanly on missing query', async () => {
    const res = await fetch(`${API_URL}/search/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5 })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'Search query is required');
  });

  await t.test('POST /api/reports/generate - should reject missing evidenceIds (Scenario D)', async () => {
    const res = await fetch(`${API_URL}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: '64f7b6b1234567890abcdef1', evidenceIds: [] })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, 'projectId and evidenceIds are required');
  });

  await t.test('GET /api/webhooks/health - should return webhook handler health status', async () => {
    const res = await fetch(`${API_URL}/webhooks/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'active');
    assert.strictEqual(body.service, 'cloudinary-webhook-handler');
  });

  await t.test('POST /api/webhooks/cloudinary - safely accepts and acknowledges Cloudinary webhook payload', async () => {
    const res = await fetch(`${API_URL}/webhooks/cloudinary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_id: 'canopi/sample_webhook_test',
        notification_type: 'upload',
        status: 'success',
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.received, true);
  });

  await t.test('GET /api/projects/:id/timeline - should return chronologically grouped timeline', async () => {
    if (!projectId) return;
    const res = await fetch(`${API_URL}/projects/${projectId}/timeline?groupBy=day`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.projectId, projectId);
    assert.ok(Array.isArray(body.timeline));
  });

  await t.test('GET /api/projects/:id/locations - should return location clusters for map/list use', async () => {
    if (!projectId) return;
    const res = await fetch(`${API_URL}/projects/${projectId}/locations`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.projectId, projectId);
    assert.ok(Array.isArray(body.clusters));
  });
});


