import React from 'react';
import {
  Upload,
  Video,
  MapPin,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

export const ProjectGalleryTab = ({
  assets,
  onSelectAsset,
  onAssetDelete,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'READY':
        return 'bg-green-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'ANALYZING':
        return 'bg-purple-500';
      case 'EMBEDDING':
      case 'INDEXING':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  if (assets.length === 0) {
    return (
      <div className="bw-card-white p-12 text-center text-gray-500 flex flex-col items-center justify-center rounded-3xl border border-gray-100">
        <Upload size={32} className="mb-4 opacity-50" />
        <p className="mb-2 font-medium">No media uploaded yet.</p>
        <p className="text-sm opacity-75">Upload evidence above to start AI analysis.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => {
        const thumbUrl =
          asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
          asset.cloudinary?.secureUrl;
        const hasExif = asset.location?.source === 'exif';
        const hasEnhanced = Boolean(asset.enhancedVersion);

        return (
          <div
            key={asset._id}
            onClick={() => onSelectAsset(asset)}
            className="bw-card-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all rounded-2xl border border-gray-100"
          >
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {asset.mediaType === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Video size={32} className="text-gray-400" />
                </div>
              ) : (
                <img
                  src={thumbUrl}
                  alt={asset.originalFilename}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}

              {/* Top Left Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                {hasExif && (
                  <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-emerald-400 rounded-md text-[9px] font-semibold flex items-center space-x-0.5 shadow">
                    <MapPin size={10} />
                    <span>GPS</span>
                  </span>
                )}
                {hasEnhanced && (
                  <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-purple-300 rounded-md text-[9px] font-semibold flex items-center space-x-0.5 shadow">
                    <Sparkles size={10} />
                    <span>Enhanced</span>
                  </span>
                )}
                {asset.flaggedForReview && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[9px] font-bold flex items-center space-x-0.5 shadow">
                    <ShieldAlert size={10} />
                    <span>Review</span>
                  </span>
                )}
                {asset.verified && (
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-bold flex items-center space-x-0.5 shadow">
                    <CheckCircle size={10} />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Status and Action controls */}
              <div className="absolute top-2 right-2 flex flex-col space-y-2 z-10">
                <div
                  className={`px-2 py-1 ${getStatusColor(
                    asset.processingStatus
                  )} text-white rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-lg flex items-center space-x-1`}
                >
                  {!['READY', 'FAILED'].includes(asset.processingStatus) && (
                    <Loader2 size={10} className="animate-spin mr-1" />
                  )}
                  <span>{asset.processingStatus}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssetDelete(asset._id);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 self-end"
                  title="Delete Asset"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2 truncate" title={asset.originalFilename}>
                {asset.originalFilename}
              </div>

              {asset.aiAnalysis?.description ? (
                <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                  {asset.aiAnalysis.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">Analysis pending or click to inspect</p>
              )}

              {asset.aiAnalysis?.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {asset.aiAnalysis.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded uppercase font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.aiAnalysis.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded uppercase font-semibold">
                      +{asset.aiAnalysis.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
