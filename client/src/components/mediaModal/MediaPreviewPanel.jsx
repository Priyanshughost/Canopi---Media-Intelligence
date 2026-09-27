import React from 'react';
import { Sparkles, MapPin, Sliders, CheckCircle, AlertTriangle } from 'lucide-react';

export const MediaPreviewPanel = ({
  asset,
  currentDisplayUrl,
  viewEnhanced,
  setViewEnhanced,
  hasEnhanced,
  hasGps,
  isExifLocation,
  lat,
  lng,
  duplicates,
  loadingDuplicates,
  onCheckDuplicates,
}) => {
  return (
    <div className="lg:col-span-5 space-y-4">
      {/* Visual Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square flex items-center justify-center border border-gray-200 shadow-inner">
        {asset.mediaType === 'video' ? (
          <video src={asset.cloudinary?.secureUrl} controls className="max-h-full max-w-full" />
        ) : (
          <img
            src={currentDisplayUrl}
            alt={asset.originalFilename}
            className="w-full h-full object-contain"
          />
        )}

        {/* View Enhanced Toggle */}
        {hasEnhanced && asset.mediaType === 'image' && (
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md rounded-xl p-1 flex items-center space-x-1 shadow-lg border border-white/10">
            <button
              onClick={() => setViewEnhanced(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                !viewEnhanced
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewEnhanced(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center space-x-1 ${
                viewEnhanced ? 'bg-emerald-500 text-white shadow' : 'text-white/70 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>AI Restored</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Metadata Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* GPS Metadata Badge */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <div className="flex items-center space-x-1 text-gray-500 font-medium">
            <MapPin size={14} className={isExifLocation ? 'text-emerald-500' : 'text-gray-400'} />
            <span>GPS Location</span>
          </div>
          {hasGps ? (
            <div>
              <p className="font-semibold text-gray-800">
                {lat?.toFixed(4)}, {lng?.toFixed(4)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">
                {isExifLocation ? 'EXIF Verified' : 'Manual Entry'}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 italic">No GPS data in EXIF</p>
          )}
        </div>

        {/* Quality Score Badge */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
          <div className="flex items-center space-x-1 text-gray-500 font-medium">
            <Sliders size={14} className="text-purple-500" />
            <span>Quality Score</span>
          </div>
          <p className="font-semibold text-gray-800">
            {asset.qualityAnalysis?.quality_score !== undefined
              ? `${(asset.qualityAnalysis.quality_score * 100).toFixed(0)}%`
              : asset.qualityAnalysis?.focus !== undefined
              ? `${(asset.qualityAnalysis.focus * 100).toFixed(0)}%`
              : 'Standard'}
          </p>
          {hasEnhanced && (
            <span className="text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.2 rounded">
              Gen Restore Applied
            </span>
          )}
        </div>
      </div>

      {/* pHash Duplicate Check Card */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Perceptual Hash (pHash)</span>
          <button
            onClick={onCheckDuplicates}
            disabled={loadingDuplicates}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {loadingDuplicates ? 'Checking...' : 'Check Duplicates'}
          </button>
        </div>
        <p className="text-[11px] font-mono text-gray-500 bg-white p-1.5 rounded border border-gray-100 truncate">
          {asset.phash || 'No pHash generated'}
        </p>
        {duplicates && (
          <div className="mt-2 space-y-1 text-xs">
            {duplicates.length === 0 ? (
              <p className="text-emerald-600 text-[11px] flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>Unique visual evidence (0 duplicates)</span>
              </p>
            ) : (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                <p className="font-semibold flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{duplicates.length} Near-Duplicate(s) Found!</span>
                </p>
                <p className="text-[10px] mt-0.5">Reused photos might duplicate impact baseline.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
