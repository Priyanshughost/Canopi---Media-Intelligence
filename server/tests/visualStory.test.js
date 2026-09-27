import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeCaption,
  buildVisualStoryCloudinaryUrl,
} from '../src/services/visualStoryGenerator.js';

describe('Visual Story Generator Service Tests', () => {
  it('sanitizeCaption - cleans VQA prefixes, quotes, and limits length', () => {
    const raw = 'Headline: "The local community successfully replanted trees in the degraded field area."';
    const cleaned = sanitizeCaption(raw);
    assert.strictEqual(cleaned, 'The local community successfully replanted trees in the degraded field area.');
  });

  it('sanitizeCaption - neutralizes ungrounded suspicious large numeric claims', () => {
    const raw = 'Observation: Volunteers planted 9500 native saplings along the riverbank.';
    const cleaned = sanitizeCaption(raw);
    assert.ok(cleaned.includes('multiple') || !cleaned.includes('9500'));
  });

  it('buildVisualStoryCloudinaryUrl - generates story aspect ratio (1080x1920) with text overlay', () => {
    const url = buildVisualStoryCloudinaryUrl('canopi/sample_proof_asset', 'Soil restored and vegetation thriving', 'story');
    assert.ok(url.includes('h_1920'));
    assert.ok(url.includes('w_1080'));
    assert.ok(url.includes('l_text'));
    assert.ok(url.includes('canopi/sample_proof_asset'));
  });

  it('buildVisualStoryCloudinaryUrl - generates feed aspect ratio (1080x1350) with text overlay', () => {
    const url = buildVisualStoryCloudinaryUrl('canopi/sample_proof_asset', 'Mangrove saplings established', 'feed');
    assert.ok(url.includes('h_1350'));
    assert.ok(url.includes('w_1080'));
    assert.ok(url.includes('l_text'));
  });
});
