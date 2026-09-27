import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCarouselCopy } from '../src/services/carouselGenerator.js';

describe('Carousel Post Generator Service Tests', () => {
  it('generateCarouselCopy - produces structured SEO copy and sector hashtags', async () => {
    const mockSelectedAssets = [
      {
        sourceAssetId: '65b111111111111111111111',
        publicId: 'canopi/tree_planting_phase1',
        source: 'comparison',
        imageUrl: 'https://res.cloudinary.com/test/image/upload/tree_planting_phase1.jpg',
        description: 'Volunteers planting native saplings in degraded wetland zone.',
        tags: ['saplings', 'wetland', 'restoration'],
        semanticScore: 92,
      },
      {
        sourceAssetId: '65b222222222222222222222',
        publicId: 'canopi/tree_growth_inspection',
        source: 'media_library',
        imageUrl: 'https://res.cloudinary.com/test/image/upload/tree_growth_inspection.jpg',
        description: 'Healthy saplings established with dense root growth.',
        tags: ['growth', 'monitoring', 'canopy'],
        semanticScore: 88,
      },
      {
        sourceAssetId: '65b333333333333333333333',
        publicId: 'canopi/community_monitoring',
        source: 'media_library',
        imageUrl: 'https://res.cloudinary.com/test/image/upload/community_monitoring.jpg',
        description: 'Community environmental rangers measuring biodiversity index.',
        tags: ['community', 'biodiversity'],
        semanticScore: 84,
      },
    ];

    const mockProject = {
      _id: '65b999999999999999999999',
      name: 'Sundarbans Mangrove Alliance',
      sector: 'Reforestation',
    };

    const copyResult = await generateCarouselCopy(mockSelectedAssets, mockProject);

    assert.ok(copyResult.carouselCaption.includes('Sundarbans Mangrove Alliance'));
    assert.ok(copyResult.carouselCaption.includes('3 visual milestones'));
    assert.ok(copyResult.carouselCaption.includes('1 before-and-after'));
    assert.ok(copyResult.carouselCaption.includes('2 field inspection'));
    assert.ok(copyResult.hashtags.includes('#Reforestation'));
    assert.ok(copyResult.hashtags.includes('#ImpactVerified'));
    assert.strictEqual(copyResult.images.length, 3);
    assert.strictEqual(copyResult.images[0].source, 'comparison');
    assert.strictEqual(copyResult.images[1].source, 'media_library');
    assert.ok(copyResult.images[0].altText.length > 5);
    assert.ok(copyResult.images[0].individualCaption.length > 5);
  });
});
