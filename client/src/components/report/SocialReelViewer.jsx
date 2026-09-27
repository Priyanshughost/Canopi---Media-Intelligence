import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Tag,
  ShieldCheck,
  Eye,
  Flame,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  AlertCircle,
  Smartphone,
  Tv,
} from 'lucide-react';
import { API_URL } from '../../config.js';

export const SocialReelViewer = ({ reportId, projectId }) => {
  const [platform, setPlatform] = useState('reels'); // 'reels' | 'twitter'
  const [reelData, setReelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRawCaption, setShowRawCaption] = useState(false);

  const fetchReel = async (targetPlatform = platform) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/reports/${reportId}/reel?platform=${targetPlatform}`
      );
      if (res.ok) {
        const data = await res.json();
        setReelData(data);
      } else if (res.status === 404) {
        setReelData(null);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load social reel');
      }
    } catch (err) {
      // Graceful if not created yet
      setReelData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReel(platform);
    }
  }, [reportId, platform]);

  const handleGenerate = async (targetPlatform = platform) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/reports/${reportId}/reel?platform=${targetPlatform}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: targetPlatform }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate platform reel');
      }

      const data = await res.json();
      setReelData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPost = () => {
    if (!reelData) return;
    const caption = reelData.polishedCaption || reelData.rawGroundedCaption || '';
    const tags = (reelData.hashtags || []).map((h) => h.tag).join(' ');
    const postText = `${caption}\n\n${tags}`;

    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
      {/* Top Header & Platform Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Social Reels & Video Clips</h3>
              <span className="px-2.5 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Cloudinary AI Native
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Directly postable short clips ranked by Cloudinary AI Vision with grounded captions.
            </p>
          </div>
        </div>

        {/* Platform Switcher & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setPlatform('reels');
                fetchReel('reels');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                platform === 'reels'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} />
              <span>Reels / Shorts (9:16)</span>
            </button>
            <button
              onClick={() => {
                setPlatform('twitter');
                fetchReel('twitter');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                platform === 'twitter'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv size={13} />
              <span>Twitter / X (16:9)</span>
            </button>
          </div>

          <button
            onClick={() => handleGenerate(platform)}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>{generating ? 'Assembling Reel...' : reelData ? 'Regenerate' : 'Generate Reel'}</span>
          </button>
        </div>
      </div>

      {/* Cloudinary AI Provenance Notice */}
      <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={15} className="text-cyan-400 flex-shrink-0" />
          <span>
            Clips selected and ranked via <strong>Cloudinary AI Vision</strong>; captions grounded in verified footage.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          Target: {platform === 'reels' ? '15–20s Vertical' : '20–30s Landscape'}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-300 flex items-start space-x-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">
              Ensure the project has uploaded verified video footage (minimum 10 seconds total).
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
          <RefreshCw size={24} className="animate-spin text-pink-400" />
          <span>Loading {platform === 'reels' ? 'Reels' : 'Twitter'} format...</span>
        </div>
      ) : reelData?.videoUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center: Video Player */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className={`relative rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl w-full ${
                platform === 'reels'
                  ? 'max-w-[280px] aspect-[9/16]'
                  : 'max-w-[460px] aspect-[16/9]'
              } flex items-center justify-center`}
            >
              <video
                src={reelData.videoUrl}
                controls
                autoPlay={false}
                playsInline
                className="w-full h-full object-cover bg-black"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
          </div>

          {/* Right: Post Copy, Grounded Auditing & Merged Hashtags */}
          <div className="lg:col-span-7 space-y-5">
            {/* Polished vs Raw Caption Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles size={13} className="text-pink-400" />
                  <span>Ready-to-Post Caption</span>
                </span>
                <button
                  onClick={() => setShowRawCaption((prev) => !prev)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 transition-colors"
                >
                  <Eye size={12} />
                  <span>{showRawCaption ? 'Show Polished' : 'Inspect Grounded Raw'}</span>
                </button>
              </div>

              <p className="text-sm text-slate-100 leading-relaxed font-sans bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
                {showRawCaption
                  ? reelData.rawGroundedCaption
                  : reelData.polishedCaption || reelData.rawGroundedCaption}
              </p>

              {showRawCaption && (
                <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 flex items-center space-x-1.5">
                  <ShieldCheck size={13} className="text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Audit Trail:</strong> Raw caption extracted 100% directly from Cloudinary AI Vision without editorial rewriting.
                  </span>
                </div>
              )}
            </div>

            {/* Merged Hashtags Section */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag size={13} className="text-indigo-400" />
                  <span>Merged Hashtags ({reelData.hashtags?.length || 0})</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Content Grounded + Curated Trending
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(reelData.hashtags || []).map((h, i) => {
                  const isContent = h.source === 'content';
                  const isLive = h.source === 'live_trending';

                  return (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
                        isContent
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : isLive
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                          : 'bg-purple-950/60 text-purple-300 border-purple-800/80'
                      }`}
                      title={`Source: ${
                        isContent
                          ? 'Grounded in verified project metadata'
                          : isLive
                          ? 'Live Trending Sector Topic'
                          : 'Curated Sector Library'
                      }`}
                    >
                      <span>{h.tag}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                          isContent
                            ? 'bg-emerald-800/60 text-emerald-200'
                            : isLive
                            ? 'bg-amber-800/60 text-amber-200'
                            : 'bg-purple-800/60 text-purple-200'
                        }`}
                      >
                        {isContent ? 'Grounded' : isLive ? 'Live' : 'Curated'}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Source Segment Selection Audit */}
            {reelData.sourceSegments && reelData.sourceSegments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Cloudinary AI Vision Ranked Segments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reelData.sourceSegments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-pink-400">Clip #{idx + 1}</span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-cyan-300">
                          Score: {seg.relevanceScore}/10
                        </span>
                      </div>
                      <p className="text-slate-300 line-clamp-1 italic">
                        "{seg.justification || seg.caption}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopyPost}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all shadow-md active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Post Copied to Clipboard!' : 'Copy Post & Hashtags'}</span>
              </button>

              <a
                href={reelData.videoUrl}
                download={`canopi_${platform}_reel.mp4`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <Download size={14} />
                <span>Download MP4</span>
              </a>

              <a
                href={reelData.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                title="Open Direct Video URL"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-pink-400 flex items-center justify-center mx-auto">
            <Film size={24} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              No {platform === 'reels' ? 'Reels / Shorts' : 'Twitter / X'} Clip Generated Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Click the button above to let Cloudinary AI Vision rank your verified video segments and build a platform-optimized social clip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
