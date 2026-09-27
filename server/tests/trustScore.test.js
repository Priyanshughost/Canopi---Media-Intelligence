import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTrustScore, TRUST_SCORE_WEIGHTS } from '../src/services/trustScore.js';

describe('Evidence Trust Score Calculation Tests', () => {
  test('calculateTrustScore - returns baseline score for minimal asset', () => {
    const asset = {
      originalFilename: 'sample.jpg',
    };
    const result = calculateTrustScore(asset);

    assert.equal(result.score, TRUST_SCORE_WEIGHTS.BASE_SCORE);
    assert.ok(Array.isArray(result.breakdown), 'Breakdown should be array');
    assert.ok(result.breakdown.length >= 2, 'Should list baseline and neutral factors');
  });

  test('calculateTrustScore - applies penalty for identical duplicate pHash match', () => {
    const asset = {
      originalFilename: 'copy.jpg',
      possibleDuplicates: [
        { assetId: '123', distance: 1 },
      ],
    };
    const result = calculateTrustScore(asset);

    assert.equal(
      result.score,
      TRUST_SCORE_WEIGHTS.BASE_SCORE + TRUST_SCORE_WEIGHTS.DUPLICATE_IDENTICAL_PENALTY
    );
    const dupFactor = result.breakdown.find((f) => f.factor.includes('Duplicate'));
    assert.ok(dupFactor, 'Breakdown must detail duplicate penalty');
    assert.equal(dupFactor.impact, TRUST_SCORE_WEIGHTS.DUPLICATE_IDENTICAL_PENALTY);
  });

  test('calculateTrustScore - applies penalty for content moderation flag', () => {
    const asset = {
      originalFilename: 'flagged.jpg',
      flaggedForReview: true,
    };
    const result = calculateTrustScore(asset);

    assert.equal(
      result.score,
      TRUST_SCORE_WEIGHTS.BASE_SCORE + TRUST_SCORE_WEIGHTS.MODERATION_FLAG_PENALTY
    );
    const modFactor = result.breakdown.find((f) => f.factor.includes('Moderation'));
    assert.ok(modFactor, 'Breakdown must detail moderation review flag');
  });

  test('calculateTrustScore - awards bonus for EXIF GPS and camera timestamp', () => {
    const asset = {
      originalFilename: 'camera_photo.jpg',
      location: {
        lat: 23.3441,
        lng: 85.3096,
        source: 'exif',
      },
      capturedAt: new Date('2026-03-01T10:00:00Z'),
    };
    const result = calculateTrustScore(asset);

    const expectedScore =
      TRUST_SCORE_WEIGHTS.BASE_SCORE +
      TRUST_SCORE_WEIGHTS.EXIF_GPS_BONUS +
      TRUST_SCORE_WEIGHTS.EXIF_DATE_BONUS;

    assert.equal(result.score, expectedScore);
    const gpsFactor = result.breakdown.find((f) => f.factor.includes('GPS'));
    const dateFactor = result.breakdown.find((f) => f.factor.includes('Timestamp'));
    assert.ok(gpsFactor, 'GPS factor should be present in breakdown');
    assert.ok(dateFactor, 'Date factor should be present in breakdown');
  });

  test('calculateTrustScore - factors in high optical quality and human verification', () => {
    const asset = {
      originalFilename: 'verified_hd.jpg',
      qualityAnalysis: { quality_score: 0.92 },
      verified: true,
      location: { lat: 12.34, lng: 56.78, source: 'exif' },
    };
    const result = calculateTrustScore(asset);

    const expectedScore = Math.min(
      100,
      TRUST_SCORE_WEIGHTS.BASE_SCORE +
        TRUST_SCORE_WEIGHTS.EXIF_GPS_BONUS +
        TRUST_SCORE_WEIGHTS.HIGH_QUALITY_BONUS +
        TRUST_SCORE_WEIGHTS.HUMAN_VERIFIED_BONUS
    );

    assert.equal(result.score, expectedScore);
    assert.ok(result.score <= 100 && result.score >= 0, 'Score must be clamped [0, 100]');
  });

  test('calculateTrustScore - handles missing data gracefully without negative bias', () => {
    const result = calculateTrustScore(null);
    assert.equal(result.score, TRUST_SCORE_WEIGHTS.BASE_SCORE);
    assert.ok(result.breakdown[0].factor.includes('Insufficient'));
  });
});
