import { MediaAsset } from '../../modules/assets/asset.model.js';
import { config } from '../../config/env.js';

/**
 * Calculates Hamming distance (bit differences) between two pHash values
 */
export const calculateHammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2) return Infinity;

  const clean1 = String(hash1).trim();
  const clean2 = String(hash2).trim();

  // If binary string format (e.g., 64 binary digits)
  if (/^[01]+$/.test(clean1) && /^[01]+$/.test(clean2) && clean1.length > 16) {
    let diff = 0;
    const len = Math.max(clean1.length, clean2.length);
    for (let i = 0; i < len; i++) {
      if ((clean1[i] || '0') !== (clean2[i] || '0')) diff++;
    }
    return diff;
  }

  // Hexadecimal pHash comparison character by character (4 bits per hex character)
  let distance = 0;
  const maxLen = Math.max(clean1.length, clean2.length);

  for (let i = 0; i < maxLen; i++) {
    const val1 = parseInt(clean1[i] || '0', 16);
    const val2 = parseInt(clean2[i] || '0', 16);
    if (isNaN(val1) || isNaN(val2)) continue;

    let xor = val1 ^ val2;
    // Popcount set bits
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
};

/**
 * Searches existing assets in MongoDB for near-duplicates matching the given phash
 */
export const findDuplicatesByPhash = async (phash, threshold = null, options = {}) => {
  if (!phash) return [];

  const effectiveThreshold =
    threshold !== null && threshold !== undefined
      ? threshold
      : config.cloudinary.phashThreshold || 8;

  const { excludeAssetId, projectId } = options;

  const query = {
    phash: { $exists: true, $ne: null },
  };

  if (excludeAssetId) {
    query._id = { $ne: excludeAssetId };
  }
  if (projectId) {
    query.projectId = projectId;
  }

  const candidateAssets = await MediaAsset.find(query).lean();
  const duplicates = [];
  const maxBits = (phash.length || 16) * 4;

  for (const asset of candidateAssets) {
    if (!asset.phash) continue;

    const distance = calculateHammingDistance(phash, asset.phash);
    if (distance <= effectiveThreshold) {
      const similarityPercentage = Math.max(
        0,
        Math.min(100, Math.round(((maxBits - distance) / maxBits) * 100))
      );

      duplicates.push({
        assetId: asset._id,
        projectId: asset.projectId,
        originalFilename: asset.originalFilename,
        secureUrl: asset.cloudinary?.secureUrl,
        phash: asset.phash,
        hammingDistance: distance,
        similarityPercentage,
        isExactMatch: distance === 0,
      });
    }
  }

  // Sort by closest match (smallest distance first)
  duplicates.sort((a, b) => a.hammingDistance - b.hammingDistance);
  return duplicates;
};
