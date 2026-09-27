import React from 'react';
import { Compass, Loader2, MapPin, Eye } from 'lucide-react';

export const ProjectLocationsTab = ({
  locationsData = [],
  locationsLoading = false,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <Compass size={18} className="text-emerald-600" />
            <span>Geographic Location Clusters</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Physical project activity points identified via Cloudinary EXIF extraction and geo-tagging.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100">
          {locationsData.length} Distinct {locationsData.length === 1 ? 'Location' : 'Locations'}
        </span>
      </div>

      {locationsLoading ? (
        <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center space-x-2">
          <Loader2 size={18} className="animate-spin text-emerald-600" />
          <span>Clustering project locations...</span>
        </div>
      ) : locationsData.length === 0 ? (
        <div className="bw-card-white p-12 text-center text-gray-500 rounded-3xl border border-gray-100">
          <MapPin size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="font-semibold text-gray-700">No geo-tagged assets found in this project.</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload photos with camera GPS enabled to view automated EXIF location clusters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {locationsData.map((cluster) => {
            const lat = cluster.center.lat;
            const lng = cluster.center.lng;
            const hasCoords = lat !== null && lng !== null;
            const mapsUrl = hasCoords
              ? `https://www.google.com/maps?q=${lat},${lng}`
              : null;

            return (
              <div
                key={cluster.id}
                className="bw-card-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{cluster.name}</h4>
                      {hasCoords && (
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                          {lat.toFixed(4)}°, {lng.toFixed(4)}°
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                      cluster.source === 'exif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cluster.source === 'exif' ? 'EXIF Verified' : 'Manual'}
                  </span>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-3 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Assets</span>
                    <span className="text-sm font-bold text-gray-800">{cluster.assetCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Verified</span>
                    <span className="text-sm font-bold text-emerald-600">{cluster.verifiedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Activity</span>
                    <span className="text-[11px] font-semibold text-gray-700 truncate block mt-0.5">
                      {new Date(cluster.latestActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Sample Thumbnails Preview Gallery */}
                {cluster.sampleThumbnails?.length > 0 && (
                  <div>
                    <span className="text-[11px] text-gray-500 font-semibold block mb-2">
                      Cluster Evidence Previews:
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {cluster.sampleThumbnails.map((thumb, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200"
                        >
                          <img
                            src={thumb}
                            alt="Cluster asset"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map Link */}
                {mapsUrl && (
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center space-x-1"
                    >
                      <span>Open in Google Maps</span>
                      <Eye size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
