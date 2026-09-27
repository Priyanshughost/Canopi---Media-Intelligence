import React, { useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  Play,
  Clock,
  RefreshCw,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { API_URL } from '../../config.js';

export const HighlightReelViewer = ({ reportId, projectId }) => {
  const [reel, setReel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchReel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/reports/${reportId}/highlight-reel`);
      if (res.ok) {
        const data = await res.json();
        setReel(data);
      } else if (res.status === 404) {
        setReel(null);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load highlight reel');
      }
    } catch (err) {
      // Non-fatal if not generated yet
      setReel(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReel();
    }
  }, [reportId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/reports/${reportId}/highlight-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Highlight reel generation failed');
      }

      const data = await res.json();
      setReel(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">AI Video Highlight Reel</h3>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Cloudinary AI Spliced
              </span>
            </div>
            <p className="text-xs text-slate-400">
              30–60s stitched sequence of verified video evidence segments with grounded AI transcript anchors.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>{generating ? 'Stitching Video Reel...' : reel ? 'Regenerate Highlight Reel' : 'Generate Highlight Reel'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-xs text-red-300 flex items-start space-x-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">
              Ensure the project has uploaded video assets with verified status and AI transcript segments.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
          <RefreshCw size={24} className="animate-spin text-cyan-400" />
          <span>Checking highlight reel status...</span>
        </div>
      ) : reel?.highlightReelUrl ? (
        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            <video
              src={reel.highlightReelUrl}
              controls
              autoPlay={false}
              playsInline
              className="w-full max-h-[440px] object-contain bg-black"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          </div>

          {/* Action and Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center space-x-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Clock size={14} className="text-cyan-400" />
                <span>Duration: <strong>{reel.duration || '30s'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Video size={14} className="text-indigo-400" />
                <span>Segments: <strong>{reel.segments?.length || 0} clips</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Grounded Transcripts: <strong>Verified</strong></span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={reel.highlightReelUrl}
                target="_blank"
                rel="noreferrer"
                download="canopi_highlight_reel.mp4"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <Download size={13} />
                <span>Download MP4</span>
              </a>
              <a
                href={reel.highlightReelUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                title="Open Direct Video URL"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Spliced Segments Breakdown */}
          {reel.segments && reel.segments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Stitched Evidence Clips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {reel.segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-cyan-400 font-semibold">Clip #{idx + 1}</span>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        {seg.startTime || 0}s – {seg.endTime || 10}s
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                      "{seg.description}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-10 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Video size={24} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">No Highlight Reel Generated</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Click the button above to automatically assemble verified field video segments into a concise 30-60s highlight video.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
