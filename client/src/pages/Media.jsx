import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video,
  Loader2,
  MapPin,
  Sparkles,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { MediaDetailModal } from '../components/MediaDetailModal';

export const Media = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${API_URL}/api/assets`);
        if (!response.ok) throw new Error('Failed to fetch media assets');
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Real-time polling for processing assets
  useEffect(() => {
    const isProcessing = assets.some((a) => !['READY', 'FAILED'].includes(a.processingStatus));
    if (isProcessing) {
      const interval = setInterval(() => {
        fetch(`${API_URL}/api/assets`)
          .then((res) => res.json())
          .then((data) => setAssets(data))
          .catch(console.error);
      }, 2000); // Poll every 2 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [assets]);

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
        return 'bg-yellow-500'; // UPLOADING / UPLOADED
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-700 mb-2">Media Explorer</h1>
          <p className="text-gray-600">
            Browse all visual evidence across all projects with native Cloudinary AI intelligence.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 py-20 text-center">Loading media...</div>
      ) : error ? (
        <div className="text-red-500 py-20 text-center">{error}</div>
      ) : assets.length === 0 ? (
        <div className="bw-card-white p-20 text-center text-gray-500 flex flex-col items-center">
          <ImageIcon size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-700">No media found.</p>
          <p className="text-sm">Upload media inside a project to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => {
            const thumbUrl =
              asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
              asset.cloudinary?.secureUrl;
            const hasExif = asset.location?.source === 'exif';
            const hasEnhanced = Boolean(asset.enhancedVersion);

            return (
              <div
                key={asset._id}
                onClick={() => setSelectedAsset(asset)}
                className="bw-card-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all rounded-2xl border border-gray-100"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {asset.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video size={32} className="text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={thumbUrl}
                      alt={asset.originalFilename}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}

                  {/* Top Left Intelligence Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {hasExif && (
                      <span
                        className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-emerald-400 rounded-md text-[9px] font-semibold flex items-center space-x-0.5 shadow"
                        title="EXIF GPS Verified Location"
                      >
                        <MapPin size={10} />
                        <span>GPS</span>
                      </span>
                    )}
                    {hasEnhanced && (
                      <span
                        className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-purple-300 rounded-md text-[9px] font-semibold flex items-center space-x-0.5 shadow"
                        title="Cloudinary AI Generative Restore applied"
                      >
                        <Sparkles size={10} />
                        <span>Enhanced</span>
                      </span>
                    )}
                    {asset.flaggedForReview && (
                      <span
                        className="px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[9px] font-bold flex items-center space-x-0.5 shadow"
                        title="Content moderation review flagged"
                      >
                        <ShieldAlert size={10} />
                        <span>Review</span>
                      </span>
                    )}
                    {asset.verified && (
                      <span
                        className="px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-bold flex items-center space-x-0.5 shadow"
                        title="Verified Impact Evidence"
                      >
                        <CheckCircle size={10} />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right Processing Status Badge */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-1 ${getStatusColor(
                      asset.processingStatus
                    )} text-white rounded-md text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center space-x-1 z-10`}
                  >
                    {!['READY', 'FAILED'].includes(asset.processingStatus) && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    <span>{asset.processingStatus}</span>
                  </div>

                  {/* Overlay info on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                    <p className="text-white text-xs font-medium line-clamp-2 mb-2">
                      {asset.aiAnalysis?.description || 'Click to view full AI intelligence'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(asset.aiAnalysis?.tags || []).slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Inspector */}
      {selectedAsset && (
        <MediaDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onAssetUpdated={(updated) => {
            setSelectedAsset(updated);
            setAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
          }}
        />
      )}
    </div>
  );
};
