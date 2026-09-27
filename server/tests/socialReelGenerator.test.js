import test from 'node:test';
import assert from 'node:assert';
import {
  scoreSegmentRelevance,
  filterSegmentDiversity,
  polishCaption,
} from '../src/services/socialReelGenerator.js';
import {
  fetchTrendingHashtags,
  getMergedHashtags,
  formatHashtag,
} from '../src/services/trendingHashtags.js';
import { getCuratedHashtagsForSector } from '../src/config/hashtagLibrary.js';

test('Social Reel & Trending Hashtags Service Tests', async (t) => {
  await t.test('formatHashtag - cleans and formats PascalCase hashtags', () => {
    assert.strictEqual(formatHashtag('#climate-action'), '#Climateaction');
    assert.strictEqual(formatHashtag('ocean plastic cleanup'), '#OceanPlasticCleanup');
    assert.strictEqual(formatHashtag(''), '');
  });

  await t.test('getCuratedHashtagsForSector - returns curated sector tags with transparent fallback', () => {
    const forestryTags = getCuratedHashtagsForSector('reforestation');
    assert.ok(Array.isArray(forestryTags));
    assert.ok(forestryTags.includes('#TreePlanting') || forestryTags.includes('#Reforestation'));

    const oceanTags = getCuratedHashtagsForSector('ocean_cleanup');
    assert.ok(Array.isArray(oceanTags));
    assert.ok(oceanTags.includes('#OceanCleanup'));
  });

  await t.test('fetchTrendingHashtags - labels tags as curated when live API not configured', async () => {
    const result = await fetchTrendingHashtags('sustainability');
    assert.ok(result);
    assert.ok(Array.isArray(result.tags));
    assert.ok(result.tags.length > 0);
    assert.strictEqual(result.source, 'curated');
  });

  await t.test('getMergedHashtags - prioritizes content-grounded tags and labels sources accurately', async () => {
    const mockProject = {
      name: 'Amazon Canopy Reforestation',
      sector: 'reforestation',
      tags: ['trees', 'biodiversity', 'saplings'],
      locations: ['Madre de Dios, Peru'],
    };

    const merged = await getMergedHashtags(mockProject, { maxTags: 10 });
    assert.ok(Array.isArray(merged));
    assert.ok(merged.length > 0);

    // Verify first items are content-grounded
    const contentTags = merged.filter((m) => m.source === 'content');
    assert.ok(contentTags.length >= 2);
    assert.ok(contentTags.some((c) => c.tag === '#Reforestation' || c.tag.includes('Amazon')));

    // Verify curated tags are included for remaining slots
    const curatedTags = merged.filter((m) => m.source === 'curated' || m.source === 'live_trending');
    assert.ok(curatedTags.length >= 1);
  });

  await t.test('filterSegmentDiversity - removes temporally close redundant clips', () => {
    const segments = [
      { assetId: 'video_1', startTime: 0, endTime: 5, phash: '0000000000000000' },
      { assetId: 'video_1', startTime: 2, endTime: 7, phash: '0000000000000001' }, // Redundant temporal
      { assetId: 'video_1', startTime: 15, endTime: 20, phash: 'ffffffffffffffff' }, // Distinct
    ];

    const filtered = filterSegmentDiversity(segments);
    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].startTime, 0);
    assert.strictEqual(filtered[1].startTime, 15);
  });

  await t.test('polishCaption - safeguards against newly fabricated numbers', async () => {
    const rawCaption = 'Team monitored saplings and verified soil moisture levels on site.';
    const polished = await polishCaption(rawCaption, 'engaging');

    assert.ok(polished);
    assert.strictEqual(typeof polished, 'string');
    // Ensure no ungrounded numbers were introduced
    const rawNumbers = rawCaption.match(/\b\d+\b/g) || [];
    const polishedNumbers = polished.match(/\b\d+\b/g) || [];
    const hasFabricated = polishedNumbers.some((num) => !rawNumbers.includes(num));
    assert.strictEqual(hasFabricated, false);
  });

  await t.test('scoreSegmentRelevance - scores segment relevance via Cloudinary AI Vision', async () => {
    const mockSegment = { startTime: 5, endTime: 10, description: 'Field planting crew at work.' };
    const mockProject = { sector: 'reforestation', name: 'Canopy Project' };

    const result = await scoreSegmentRelevance('canopi/sample_verified_asset', mockSegment, mockProject);
    assert.ok(result);
    assert.strictEqual(typeof result.score, 'number');
    assert.ok(result.score >= 1 && result.score <= 10);
    assert.ok(result.justification);
  });
});
