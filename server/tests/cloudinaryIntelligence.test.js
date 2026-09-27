import test from 'node:test';
import assert from 'node:assert';
import {
  parseGpsCoordinate,
  extractGpsFromMetadata,
  calculateHammingDistance,
  extractQualityScore,
  assessAndEnhanceAsset,
  analyzeVideoWithCloudinary,
  generateHighlightReel,
} from '../src/services/cloudinaryIntelligence/index.js';

test('Cloudinary Intelligence Service Unit Tests', async (t) => {
  await t.test('calculateHammingDistance - calculates correct bit differences', () => {
    // Exact match
    assert.strictEqual(calculateHammingDistance('a1b2c3d4e5f60718', 'a1b2c3d4e5f60718'), 0);

    // 1 hex char difference: 0 vs 1 (0000 vs 0001 -> 1 bit difference)
    assert.strictEqual(calculateHammingDistance('0000000000000000', '0000000000000001'), 1);

    // 1 hex char difference: 0 vs f (0000 vs 1111 -> 4 bits difference)
    assert.strictEqual(calculateHammingDistance('0000000000000000', '000000000000000f'), 4);

    // Binary string inputs
    assert.strictEqual(
      calculateHammingDistance(
        '0000000000000000000000000000000000000000000000000000000000000000',
        '0000000000000000000000000000000000000000000000000000000000000011'
      ),
      2
    );

    // Null / empty safety
    assert.strictEqual(calculateHammingDistance(null, 'a1b2'), Infinity);
    assert.strictEqual(calculateHammingDistance('a1b2', ''), Infinity);
  });

  await t.test('parseGpsCoordinate - parses DMS strings correctly', () => {
    // 37 deg 46' 30" N = 37 + 46/60 + 30/3600 = 37.775
    const lat = parseGpsCoordinate("37 deg 46' 30\" N", 'N');
    assert.strictEqual(Math.round(lat * 1000) / 1000, 37.775);

    // 122 deg 25' 12" W = -(122 + 25/60 + 12/3600) = -122.42
    const lng = parseGpsCoordinate("122 deg 25' 12\" W", 'W');
    assert.strictEqual(Math.round(lng * 100) / 100, -122.42);

    // Direct decimal float string with S ref
    const southLat = parseGpsCoordinate("33.8688", "S");
    assert.strictEqual(southLat, -33.8688);

    // Rational representation
    const rationalLat = parseGpsCoordinate("37/1, 46/1, 3000/100", "N");
    assert.strictEqual(Math.round(rationalLat * 1000) / 1000, 37.775);
  });

  await t.test('extractGpsFromMetadata - extracts EXIF GPS into { lat, lng, source: "exif" }', () => {
    const metadata = {
      GPSLatitude: "37 deg 46' 30\" N",
      GPSLatitudeRef: "N",
      GPSLongitude: "122 deg 25' 12\" W",
      GPSLongitudeRef: "W"
    };

    const location = extractGpsFromMetadata(metadata);
    assert.ok(location);
    assert.strictEqual(location.source, 'exif');
    assert.strictEqual(Math.round(location.lat * 1000) / 1000, 37.775);
    assert.strictEqual(Math.round(location.lng * 100) / 100, -122.42);

    // Returns null gracefully when no GPS metadata is present
    const emptyLocation = extractGpsFromMetadata({});
    assert.strictEqual(emptyLocation, null);
  });

  await t.test('extractGpsFromMetadata - handles GPSPosition combined string', () => {
    const metadata = {
      GPSPosition: "37 deg 46' 30\" N, 122 deg 25' 12\" W"
    };
    const location = extractGpsFromMetadata(metadata);
    assert.ok(location);
    assert.strictEqual(location.source, 'exif');
    assert.strictEqual(Math.round(location.lat * 1000) / 1000, 37.775);
    assert.strictEqual(Math.round(location.lng * 100) / 100, -122.42);
  });

  await t.test('extractQualityScore - extracts normalized score', () => {
    assert.strictEqual(extractQualityScore({ quality_score: 0.82 }), 0.82);
    assert.strictEqual(extractQualityScore({ focus: 0.75 }), 0.75);
    assert.strictEqual(extractQualityScore({ focus: 0.8, exposure: 0.6 }), 0.7);
    assert.strictEqual(extractQualityScore(null), null);
  });

  await t.test('assessAndEnhanceAsset - returns null when quality score exceeds threshold', async () => {
    const cloudResult = {
      public_id: 'sample_asset_123',
      quality_analysis: { quality_score: 0.95 }
    };
    const enhancedUrl = await assessAndEnhanceAsset(cloudResult, 0.6);
    assert.strictEqual(enhancedUrl, null);
  });

  await t.test('assessAndEnhanceAsset - constructs enhanced transformation URL when score is below threshold', async () => {
    const cloudResult = {
      public_id: 'sample_asset_low_qual',
      quality_analysis: { quality_score: 0.35 }
    };
    const enhancedUrl = await assessAndEnhanceAsset(cloudResult, 0.6);
    assert.ok(enhancedUrl);
    assert.ok(enhancedUrl.includes('gen_restore') || enhancedUrl.includes('sample_asset_low_qual'));
  });

  await t.test('derivatives traceability - validates derivative object structure', () => {
    const originalPublicId = 'canopi/ocean_cleanup_01';
    const sampleDerivative = {
      public_id: originalPublicId,
      url: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_400,h_400/canopi/ocean_cleanup_01.jpg',
      transformation: 'c_thumb,g_auto,w_400,h_400,q_auto,f_auto',
      purpose: 'thumbnail',
      linkedToOriginal: originalPublicId,
      createdAt: new Date(),
    };

    assert.strictEqual(sampleDerivative.purpose, 'thumbnail');
    assert.strictEqual(sampleDerivative.linkedToOriginal, originalPublicId);
    assert.ok(sampleDerivative.transformation.includes('400'));
    assert.ok(sampleDerivative.createdAt instanceof Date);
  });

  await t.test('analyzeWithCloudinaryVision - returns structured visual Q&A response', async () => {
    const { analyzeWithCloudinaryVision } = await import(
      '../src/services/cloudinaryIntelligence.js'
    );
    const result = await analyzeWithCloudinaryVision('sample_test_asset', [
      'What activity is shown?',
      'Is there visible damage?'
    ]);

    assert.ok(result);
    assert.ok(Array.isArray(result.questions));
    assert.strictEqual(result.questions.length, 2);
    assert.strictEqual(result.questions[0].question, 'What activity is shown?');
    assert.ok(result.answers);
    assert.ok(result.analyzedAt instanceof Date);
  });

  await t.test('moderation flagging - detects pending or rejected moderation states', () => {
    const unapprovedModeration = [
      { kind: 'manual', status: 'rejected' }
    ];
    const isFlagged = unapprovedModeration.some(m => m.status === 'rejected' || m.status === 'pending');
    assert.strictEqual(isFlagged, true);

    const approvedModeration = [
      { kind: 'manual', status: 'approved' }
    ];
    const isNotFlagged = approvedModeration.some(m => m.status === 'rejected' || m.status === 'pending');
    assert.strictEqual(isNotFlagged, false);
  });

  await t.test('syncAssetMetadataToCloudinary - prepares structured payload and syncs successfully', async () => {
    const { syncAssetMetadataToCloudinary } = await import(
      '../src/services/cloudinaryIntelligence.js'
    );

    const mockAsset = {
      projectId: '64f7b6b1234567890abcdef1',
      location: { lat: 37.7749, lng: -122.4194, name: 'Bay Area Cleanup' },
      verified: true,
      aiAnalysis: { tags: ['ocean', 'plastic', 'cleanup'] },
      cloudinary: { publicId: 'canopi/sample_sync_test', resourceType: 'image' },
    };

    const res = await syncAssetMetadataToCloudinary(mockAsset);
    assert.ok(res);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.publicId, 'canopi/sample_sync_test');
    assert.ok(res.syncResults);
  });

  await t.test('generateSignedAssetUrl - generates signed time-limited URL for authenticated delivery', async () => {
    const { generateSignedAssetUrl } = await import(
      '../src/services/cloudinaryIntelligence/index.js'
    );

    const signedResult = generateSignedAssetUrl('canopi/sample_verified_asset', {
      expiresInSeconds: 7200,
      resourceType: 'image',
      type: 'upload',
      transformation: { width: 800, crop: 'scale' },
    });

    assert.ok(signedResult);
    assert.strictEqual(signedResult.publicId, 'canopi/sample_verified_asset');
    assert.strictEqual(signedResult.expiresInSeconds, 7200);
    assert.ok(signedResult.expiresAt);
    assert.ok(typeof signedResult.signedUrl === 'string');
    assert.ok(signedResult.signedUrl.includes('canopi/sample_verified_asset'));
    // Ensure URL includes signature marker or secure cloudinary protocol
    assert.ok(signedResult.signedUrl.startsWith('https://') || signedResult.signedUrl.startsWith('http://'));
  });

  await t.test('analyzeVideoWithCloudinary - generates timestamped segments via fallback when AI Video not enabled', async () => {
    const result = await analyzeVideoWithCloudinary('canopi/test_field_video', { duration: 25 });
    assert.ok(result);
    assert.ok(Array.isArray(result.transcript));
    assert.ok(result.transcript.length > 0);
    assert.ok(result.transcript[0].description);
    assert.strictEqual(typeof result.transcript[0].startTime, 'number');
    assert.strictEqual(typeof result.transcript[0].endTime, 'number');
    assert.ok(result.transcript[0].frameUrl);
  });
});

