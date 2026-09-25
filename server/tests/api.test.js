import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:5000/api';

test('Cloudinary AI Impact Platform API Tests', async (t) => {
  
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

});
