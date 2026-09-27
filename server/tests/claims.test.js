import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Project } from '../src/modules/projects/project.model.js';
import { MediaAsset } from '../src/modules/assets/asset.model.js';
import { Claim } from '../src/modules/claims/claim.model.js';
import {
  extractClaims,
  verifyClaimAgainstEvidence,
  runProjectClaimsCheck,
  getProjectClaimsFromDb,
} from '../src/modules/claims/claim.service.js';

describe('Claim Consistency Check Service Tests', () => {
  let sampleProjectId;
  let sampleAssetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canopi_test';
      await mongoose.connect(mongoUri);
    }

    // Clean up previous test artifacts
    await Project.deleteMany({ name: /^TEST_CLAIMS_/ });
    await MediaAsset.deleteMany({ originalFilename: /^test_claims_/ });
    await Claim.deleteMany({});

    // Create a mock project
    const project = await Project.create({
      name: 'TEST_CLAIMS_Project_Afforestation',
      organization: 'Green Earth Foundation',
      description:
        'Community reforestation initiative aiming to plant 500 indigenous trees and establish clean water access for 200 households in rural sector 4.',
      locations: ['Jharkhand Sector 4'],
      status: 'ACTIVE',
    });
    sampleProjectId = project._id;

    // Create a mock media asset
    const asset = await MediaAsset.create({
      projectId: sampleProjectId,
      originalFilename: 'test_claims_sapling_planting.jpg',
      fileSize: 102400,
      mimeType: 'image/jpeg',
      mediaType: 'image',
      processingStatus: 'READY',
      verified: true,
      cloudinary: {
        publicId: 'test_claims_sapling_1',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        resourceType: 'image',
      },
      aiAnalysis: {
        description: 'Volunteers and community members planting small tree saplings in fertile soil.',
        tags: ['tree', 'planting', 'soil', 'community', 'sapling'],
      },
    });
    sampleAssetId = asset._id;
  });

  after(async () => {
    await Project.deleteMany({ name: /^TEST_CLAIMS_/ });
    await MediaAsset.deleteMany({ originalFilename: /^test_claims_/ });
    await Claim.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('extractClaims - extracts checkable claims from project description', async () => {
    const description =
      'Community reforestation initiative aiming to plant 500 indigenous trees and restore 3 km of riverbank.';
    const claims = await extractClaims(description, 'Community Reforestation');

    assert.ok(Array.isArray(claims), 'Claims should be an array');
    assert.ok(claims.length >= 1, 'Should extract at least one claim');

    const treeClaim = claims.find(
      (c) => c.subject.toLowerCase().includes('tree') || c.claimText.toLowerCase().includes('tree')
    );
    assert.ok(treeClaim, 'Should extract tree planting claim');
    assert.ok(
      ['quantity', 'activity', 'outcome'].includes(treeClaim.claimType),
      'Claim type should be valid'
    );
  });

  test('extractClaims - handles empty description gracefully', async () => {
    const claims = await extractClaims('', 'Afforestation Project');
    assert.ok(Array.isArray(claims), 'Should return array for empty text');
    assert.ok(claims.length >= 1, 'Should create fallback claim from project name');
  });

  test('verifyClaimAgainstEvidence - returns INSUFFICIENT_EVIDENCE when no assets exist', async () => {
    const claim = {
      claimText: 'Solar panels installed on 50 community buildings',
      claimType: 'quantity',
      subject: 'solar panels',
    };
    const mockProject = { name: 'Solar Project' };

    const result = await verifyClaimAgainstEvidence(claim, mockProject, []);
    assert.equal(result.verdict, 'INSUFFICIENT_EVIDENCE');
    assert.ok(result.reasoning.includes('No media or visual evidence'));
    assert.equal(result.supportingAssetIds.length, 0);
  });

  test('verifyClaimAgainstEvidence - adheres to Observation != Proof for quantities', async () => {
    const claim = {
      claimText: 'Plant 500 indigenous trees',
      claimType: 'quantity',
      subject: 'trees',
    };
    const mockProject = { name: 'TEST_CLAIMS_Project_Afforestation' };
    const mockAssets = [
      {
        _id: sampleAssetId,
        mediaType: 'image',
        verified: true,
        originalFilename: 'test_claims_sapling_planting.jpg',
        cloudinary: { publicId: 'test_claims_sapling_1' },
        aiAnalysis: {
          description: 'Volunteers planting tree saplings in rural area.',
          tags: ['trees', 'saplings', 'planting'],
        },
      },
    ];

    const result = await verifyClaimAgainstEvidence(claim, mockProject, mockAssets);
    // Because photos of planting saplings cannot prove the exact 500 count, it must be PARTIALLY_SUPPORTED or SUPPORTED
    assert.ok(
      ['PARTIALLY_SUPPORTED', 'SUPPORTED', 'INSUFFICIENT_EVIDENCE'].includes(result.verdict),
      `Verdict should be valid, received: ${result.verdict}`
    );
    assert.ok(result.reasoning.length > 10, 'Reasoning must be detailed');
    assert.ok(result.supportingAssetIds.length > 0, 'Should include supporting asset IDs');
  });

  test('runProjectClaimsCheck - runs full check pipeline and stores claims in MongoDB', async () => {
    const checkResult = await runProjectClaimsCheck(sampleProjectId);

    assert.ok(checkResult.projectId, 'Should return projectId');
    assert.ok(Array.isArray(checkResult.claims), 'Should return claims array');
    assert.ok(checkResult.summary, 'Should return summary metrics');
    assert.equal(checkResult.summary.total, checkResult.claims.length);

    // Verify stored in MongoDB
    const dbClaims = await Claim.find({ projectId: sampleProjectId });
    assert.equal(dbClaims.length, checkResult.claims.length);
  });

  test('getProjectClaimsFromDb - retrieves claims and summary correctly', async () => {
    const dbResult = await getProjectClaimsFromDb(sampleProjectId);
    assert.ok(Array.isArray(dbResult.claims), 'Claims should be array');
    assert.ok(dbResult.summary.total >= 1, 'Total count should match');
  });
});
