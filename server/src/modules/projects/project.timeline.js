import { Project } from './project.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Evidence } from '../evidence/evidence.model.js';

/**
 * Parses EXIF or ISO date strings into valid Date objects
 */
export const parseEffectiveDate = (asset) => {
  const exifDateStr =
    asset.metadata?.DateTimeOriginal ||
    asset.metadata?.CreateDate ||
    asset.metadata?.ModifyDate;

  if (exifDateStr && typeof exifDateStr === 'string') {
    // Convert "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    const match = exifDateStr.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) {
      const isoFormatted = `${match[1]}-${match[2]}-${match[3]}T${match[4]}Z`;
      const d = new Date(isoFormatted);
      if (!isNaN(d.getTime())) return d;
    }
    const directDate = new Date(exifDateStr);
    if (!isNaN(directDate.getTime())) return directDate;
  }

  if (asset.capturedAt) {
    const d = new Date(asset.capturedAt);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date(asset.createdAt || Date.now());
};

/**
 * Calculates Haversine distance in kilometers between two geo coordinates
 */
export const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formats a Date object to a grouping key
 */
export const formatDateGroupKey = (date, groupBy = 'day') => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');

  if (groupBy === 'month') {
    return `${y}-${m}`;
  }

  if (groupBy === 'week') {
    const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
    return `${y}-W${String(weekNo).padStart(2, '0')}`;
  }

  // Default: 'day'
  return `${y}-${m}-${d}`;
};

/**
 * Aggregates all media assets and evidence items grouped chronologically
 */
export const getProjectTimelineHandler = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const {
      groupBy = 'day',
      verifiedOnly = 'false',
      startDate,
      endDate,
      location: locationQuery,
      order = 'desc',
    } = req.query;

    console.log('[Project Controller] Aggregating timeline for project', {
      projectId,
      groupBy,
      verifiedOnly,
      locationQuery,
    });

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assetQuery = { projectId };
    if (verifiedOnly === 'true') {
      assetQuery.verified = true;
    }

    const evidenceQuery = { projectId };
    if (verifiedOnly === 'true') {
      evidenceQuery.verified = true;
    }

    const [assets, evidenceList] = await Promise.all([
      MediaAsset.find(assetQuery).lean(),
      Evidence.find(evidenceQuery).lean(),
    ]);

    let geoFilter = null;
    if (locationQuery) {
      const parts = locationQuery.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        geoFilter = {
          lat: parts[0],
          lng: parts[1],
          radiusKm: parts[2] && !isNaN(parts[2]) ? parts[2] : 25,
        };
      }
    }

    const startFilterDate = startDate ? new Date(startDate) : null;
    const endFilterDate = endDate ? new Date(endDate) : null;

    const validAssets = assets.filter((asset) => {
      const effDate = parseEffectiveDate(asset);
      if (startFilterDate && effDate < startFilterDate) return false;
      if (endFilterDate && effDate > endFilterDate) return false;

      if (geoFilter) {
        const assetLat = asset.location?.lat ?? asset.location?.latitude;
        const assetLng = asset.location?.lng ?? asset.location?.longitude;
        if (assetLat === undefined || assetLng === undefined) return false;
        const dist = calculateHaversineKm(geoFilter.lat, geoFilter.lng, assetLat, assetLng);
        if (dist > geoFilter.radiusKm) return false;
      }

      return true;
    });

    const validEvidence = evidenceList.filter((ev) => {
      const evDate = new Date(ev.createdAt || Date.now());
      if (startFilterDate && evDate < startFilterDate) return false;
      if (endFilterDate && evDate > endFilterDate) return false;
      return true;
    });

    const groupsMap = new Map();

    for (const asset of validAssets) {
      const effDate = parseEffectiveDate(asset);
      const groupKey = formatDateGroupKey(effDate, groupBy);

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          date: groupKey,
          period: groupKey,
          displayDate: effDate.toISOString().split('T')[0],
          timestamp: effDate.getTime(),
          assets: [],
          evidenceItems: [],
          locations: [],
          assetCount: 0,
          evidenceCount: 0,
          verifiedCount: 0,
        });
      }

      const group = groupsMap.get(groupKey);
      group.assets.push({
        _id: asset._id,
        originalFilename: asset.originalFilename,
        mediaType: asset.mediaType,
        secureUrl: asset.cloudinary?.secureUrl,
        thumbnailUrl:
          asset.thumbnailUrl ||
          asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
          asset.cloudinary?.secureUrl,
        duration: asset.duration,
        enhancedVersion: asset.enhancedVersion,
        verified: asset.verified,
        location: asset.location,
        phash: asset.phash,
        createdAt: asset.createdAt,
        effectiveDate: effDate,
        aiTags: asset.aiAnalysis?.tags || [],
      });

      group.assetCount++;
      if (asset.verified) group.verifiedCount++;

      if (asset.location?.lat !== undefined || asset.location?.name) {
        const lat = asset.location?.lat ?? asset.location?.latitude;
        const lng = asset.location?.lng ?? asset.location?.longitude;
        const locName = asset.location?.name || (lat ? `${lat.toFixed(3)}, ${lng?.toFixed(3)}` : 'Unknown');
        const exists = group.locations.some((l) => l.name === locName || (l.lat === lat && l.lng === lng));
        if (!exists) {
          group.locations.push({
            name: locName,
            lat,
            lng,
            source: asset.location?.source || 'manual',
          });
        }
      }
    }

    for (const ev of validEvidence) {
      const evDate = new Date(ev.createdAt || Date.now());
      const groupKey = formatDateGroupKey(evDate, groupBy);

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          date: groupKey,
          period: groupKey,
          displayDate: evDate.toISOString().split('T')[0],
          timestamp: evDate.getTime(),
          assets: [],
          evidenceItems: [],
          locations: [],
          assetCount: 0,
          evidenceCount: 0,
          verifiedCount: 0,
        });
      }

      const group = groupsMap.get(groupKey);
      group.evidenceItems.push({
        _id: ev._id,
        title: ev.title,
        type: ev.type,
        verified: ev.verified,
        observationsCount: ev.observations?.length || 0,
        sourceAssetsCount: ev.sourceAssets?.length || 0,
        createdAt: ev.createdAt,
      });

      group.evidenceCount++;
      if (ev.verified) group.verifiedCount++;
    }

    const timeline = Array.from(groupsMap.values());
    timeline.sort((a, b) => (order === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp));

    res.json({
      projectId,
      totalEntries: timeline.length,
      totalAssets: validAssets.length,
      totalEvidence: validEvidence.length,
      groupBy,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};
