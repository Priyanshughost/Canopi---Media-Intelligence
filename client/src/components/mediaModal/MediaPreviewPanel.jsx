import React, { useRef } from 'react';
import { Sparkles, MapPin, Sliders, CheckCircle, AlertTriangle, ShieldCheck, Play, Clock } from 'lucide-react';
import { TrustScoreBadge } from '../common/TrustScoreBadge';

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
  const videoRef = useRef(null);

  const handleSeek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="lg:col-span-5 space-y-4">
      {/* Visual Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square flex items-center justify-center border border-gray-200 shadow-inner">
        {asset.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={asset.streamingUrl || asset.cloudinary?.secureUrl}
            poster={asset.thumbnailUrl}
            controls
            className="max-h-full max-w-full rounded-xl"
          />
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

      {/* Perceptual Hash (pHash) Duplicate Check Card */}
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

      {/* Trust Score & Verification Signals Card */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700">
            <ShieldCheck size={14} className="text-cyan-600" />
            <span>Unified Trust Score</span>
          </div>
          <TrustScoreBadge
            score={asset.trustScore ?? 70}
            breakdown={asset.trustScoreBreakdown || []}
            size="md"
          />
        </div>

        {asset.trustScoreBreakdown && asset.trustScoreBreakdown.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-200/60">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
              Confidence Factor Breakdown
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {asset.trustScoreBreakdown.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-gray-600 truncate mr-2" title={f.detail}>
                    {f.factor}
                  </span>
                  <span
                    className={`font-mono font-semibold text-[10px] px-1.5 py-0.2 rounded flex-shrink-0 ${
                      f.impact > 0
                        ? 'text-emerald-700 bg-emerald-50'
                        : f.impact < 0
                        ? 'text-red-700 bg-red-50'
                        : 'text-gray-600 bg-gray-100'
                    }`}
                  >
                    {f.impact > 0 ? `+${f.impact}` : f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Temporal Transcript Segments (Cloudinary AI Video Analysis) */}
      {asset.mediaType === 'video' && (
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 flex items-center space-x-1.5">
              <Clock size={13} className="text-purple-600" />
              <span>AI Temporal Video Transcript</span>
            </span>
            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
              {asset.videoTranscript?.length || 0} Scene(s)
            </span>
          </div>

          {Array.isArray(asset.videoTranscript) && asset.videoTranscript.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {asset.videoTranscript.map((seg, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSeek(seg.startTime)}
                  className="p-2 bg-white rounded-lg border border-gray-150 hover:border-purple-300 transition-all cursor-pointer group flex items-start space-x-2"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(seg.startTime);
                    }}
                    className="px-1.5 py-0.5 bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-800 text-[10px] font-mono font-bold rounded flex-shrink-0 flex items-center space-x-0.5 transition-colors"
                    title={`Jump to ${seg.startTime}s`}
                  >
                    <Play size={8} />
                    <span>
                      {Math.floor(seg.startTime / 60)}:{(seg.startTime % 60).toString().padStart(2, '0')}
                    </span>
                  </button>
                  <p className="text-[11px] text-gray-700 leading-tight flex-1">
                    {seg.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic">
              Video transcript generated via Cloudinary AI Video Analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
