import { getCuratedHashtagsForSector } from '../config/hashtagLibrary.js';

// In-memory cache for trending hashtags (3 hour TTL)
const trendingCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

/**
 * Normalizes a word into a clean camelCase hashtag
 * @param {string} text
 */
export const formatHashtag = (text = '') => {
  if (!text) return '';
  const clean = text
    .replace(/^#+/, '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  return clean ? `#${clean}` : '';
};

/**
 * Fetches real trending hashtags if API key is provided, or curated sector tags as fallback
 * @param {string} sector - Project sector / theme
 * @param {string} region - Optional geographic region
 * @returns {Promise<{ tags: string[], source: 'live_trending' | 'curated' }>}
 */
export const fetchTrendingHashtags = async (sector = 'sustainability', region = 'global') => {
  const cacheKey = `${sector.toLowerCase()}:${region.toLowerCase()}`;
  const cached = trendingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const rapidApiKey = process.env.RAPIDAPI_HASHTAGS_KEY || process.env.TRENDS_API_KEY;

  // 1. Primary: Live Trending API (if key configured)
  if (rapidApiKey) {
    try {
      console.log(`[Hashtags] Fetching live trending hashtags for sector: ${sector}`);
      const res = await fetch(
        `https://hashtags-and-trends.p.rapidapi.com/trending?query=${encodeURIComponent(sector)}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'hashtags-and-trends.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(3000),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawTags = Array.isArray(json.hashtags) ? json.hashtags : json.trends || [];
        const liveTags = rawTags
          .map(formatHashtag)
          .filter(Boolean)
          .slice(0, 6);

        if (liveTags.length > 0) {
          const result = { tags: liveTags, source: 'live_trending' };
          trendingCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.warn(`[Hashtags] Live trending fetch failed (${err.message}). Using curated library.`);
    }
  }

  // 2. Transparent Fallback: Curated sector library
  const curatedTags = getCuratedHashtagsForSector(sector);
  const result = {
    tags: curatedTags,
    source: 'curated',
  };

  trendingCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};

/**
 * Merges content-grounded hashtags with live/curated trending tags
 * Prioritizes grounded project tags first, filling remaining slots with trending tags
 * @param {object} project - Project object { name, sector, tags, locations }
 * @param {object} options - { maxTags }
 * @returns {Promise<Array<{ tag: string, source: 'content' | 'live_trending' | 'curated' }>>}
 */
export const getMergedHashtags = async (project = {}, options = {}) => {
  const maxTags = options.maxTags || 10;
  const result = [];
  const seen = new Set();

  const addTag = (tagStr, source) => {
    const formatted = formatHashtag(tagStr);
    if (!formatted) return;
    const lower = formatted.toLowerCase();
    if (!seen.has(lower) && result.length < maxTags) {
      seen.add(lower);
      result.push({ tag: formatted, source });
    }
  };

  // 1. Content-Grounded Tags (Derived directly from verified project data)
  if (project.sector) addTag(project.sector, 'content');
  if (project.name) {
    const nameKeywords = project.name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['project', 'initiative', 'phase', 'stage'].includes(w.toLowerCase()))
      .slice(0, 2);
    nameKeywords.forEach((w) => addTag(w, 'content'));
  }

  if (Array.isArray(project.tags)) {
    project.tags.slice(0, 4).forEach((t) => addTag(t, 'content'));
  }

  if (Array.isArray(project.locations) && project.locations.length > 0) {
    const loc = project.locations[0].split(',')[0].trim();
    if (loc) addTag(loc, 'content');
  }

  // Add standard grounded impact tags
  addTag('VerifiedImpact', 'content');
  addTag('FieldEvidence', 'content');

  // 2. Trending / Curated Sector Tags
  const sector = project.sector || project.tags?.[0] || 'sustainability';
  const trendingResult = await fetchTrendingHashtags(sector);

  trendingResult.tags.forEach((t) => {
    addTag(t, trendingResult.source);
  });

  return result;
};
