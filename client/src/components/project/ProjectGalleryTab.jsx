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
import { TrustScoreBadge } from '../common/TrustScoreBadge';

export const ProjectGalleryTab = ({
  assets,
  onSelectAsset,
  onAssetDelete,
  onOpenUploadModal,
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
      <div className="bw-card-white p-12 text-center text-gray-500 flex flex-col items-center justify-center rounded-3xl border border-gray-100 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
          <Upload size={28} />
        </div>
        <div>
          <p className="font-bold text-gray-800 text-base">No media uploaded yet.</p>
          <p className="text-xs text-gray-500 mt-1">Upload multiple photos or videos to start Cloudinary AI analysis.</p>
        </div>
        {onOpenUploadModal && (
          <button
            onClick={onOpenUploadModal}
            className="bw-btn-black px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2"
          >
            <Upload size={14} className="text-cyan-400" />
            <span>Upload Media Files</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => {
        const thumbUrl =
          asset.thumbnailUrl ||
          asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
          (asset.mediaType === 'video'
            ? `https://res.cloudinary.com/djlbyyev9/video/upload/c_thumb,w_600,h_400,so_0,f_jpg/${asset.cloudinary?.publicId}.jpg`
            : asset.cloudinary?.secureUrl);
        const hasExif = asset.location?.source === 'exif';
        const hasEnhanced = Boolean(asset.enhancedVersion);

        return (
          <div
            key={asset._id}
            onClick={() => onSelectAsset(asset)}
            className="bw-card-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all rounded-2xl border border-gray-100"
          >
            <div className="aspect-video bg-gray-900 relative overflow-hidden">
              <img
                src={thumbUrl}
                alt={asset.originalFilename}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {asset.mediaType === 'video' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Video size={18} className="ml-0.5" />
                  </div>
                  {asset.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono font-bold rounded">
                      {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
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
                <div className="pt-0.5">
                  <TrustScoreBadge
                    score={asset.trustScore ?? 70}
                    breakdown={asset.trustScoreBreakdown || []}
                    size="sm"
                  />
                </div>
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
