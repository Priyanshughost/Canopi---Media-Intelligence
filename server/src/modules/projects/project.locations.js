import { Project } from './project.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { parseEffectiveDate, calculateHaversineKm } from './project.timeline.js';

/**
 * Returns distinct location clusters with asset counts for map and cluster inspection
 */
export const getProjectLocationsHandler = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    console.log('[Project Controller] Fetching location clusters for project', { projectId });

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assets = await MediaAsset.find({ projectId }).lean();

    const clusters = [];
    const clusterProximityKm = 2.0; // 2km clustering radius

    for (const asset of assets) {
      const lat = asset.location?.lat ?? asset.location?.latitude;
      const lng = asset.location?.lng ?? asset.location?.longitude;
      const locName = asset.location?.name;

      if (lat === undefined && lng === undefined && !locName) {
        continue;
      }

      let matchedCluster = null;

      for (const cluster of clusters) {
        if (lat !== undefined && lng !== undefined && cluster.center.lat !== null) {
          const dist = calculateHaversineKm(cluster.center.lat, cluster.center.lng, lat, lng);
          if (dist <= clusterProximityKm) {
            matchedCluster = cluster;
            break;
          }
        } else if (locName && cluster.name && cluster.name.toLowerCase() === locName.toLowerCase()) {
          matchedCluster = cluster;
          break;
        }
      }

      const thumbUrl =
        asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
        asset.cloudinary?.secureUrl;

      if (matchedCluster) {
        matchedCluster.assetCount++;
        if (asset.verified) matchedCluster.verifiedCount++;
        if (thumbUrl && matchedCluster.sampleThumbnails.length < 4) {
          matchedCluster.sampleThumbnails.push(thumbUrl);
        }
        matchedCluster.assetIds.push(asset._id);
        const effDate = parseEffectiveDate(asset);
        if (effDate > new Date(matchedCluster.latestActivity)) {
          matchedCluster.latestActivity = effDate.toISOString();
        }
      } else {
        const effDate = parseEffectiveDate(asset);
        clusters.push({
          id: `cluster_${clusters.length + 1}`,
          name: locName || (lat !== undefined ? `${lat.toFixed(4)}°, ${lng?.toFixed(4)}°` : 'Location Area'),
          center: {
            lat: lat ?? null,
            lng: lng ?? null,
          },
          source: asset.location?.source || 'manual',
          assetCount: 1,
          verifiedCount: asset.verified ? 1 : 0,
          sampleThumbnails: thumbUrl ? [thumbUrl] : [],
          assetIds: [asset._id],
          latestActivity: effDate.toISOString(),
        });
      }
    }

    clusters.sort((a, b) => b.assetCount - a.assetCount);

    res.json({
      projectId,
      totalLocations: clusters.length,
      clusters,
    });
  } catch (error) {
    next(error);
  }
};
